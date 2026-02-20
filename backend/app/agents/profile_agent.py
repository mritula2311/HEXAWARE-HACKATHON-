import json
from app.agents.base import BaseAgent
from app.models.fresher import Fresher, Skill
from app.models.assessment import Submission, Assessment


class ProfileAgent(BaseAgent):
    """The Librarian — maintains fresher skill profiles and tracks progress."""

    def __init__(self):
        super().__init__()

    def execute(self, db, fresher: Fresher, **kwargs):
        return self.get_profile_summary(db, fresher)

    def update_after_assessment(self, db, fresher: Fresher, submission: Submission):
        """Update skills after an assessment is graded."""
        assessment = db.query(Assessment).filter(Assessment.id == submission.assessment_id).first()
        if not assessment:
            return

        # Get skills assessed
        skills_assessed = []
        if assessment.skills_assessed:
            try:
                skills_assessed = json.loads(assessment.skills_assessed)
            except Exception:
                pass

        if not skills_assessed:
            skills_assessed = [assessment.title.split()[0] if assessment.title else "General"]

        # Update or create skill records
        for skill_name in skills_assessed:
            skill = db.query(Skill).filter(
                Skill.fresher_id == fresher.id,
                Skill.name == skill_name,
            ).first()

            if skill:
                # Weighted average with new score
                old_level = skill.level
                new_score = submission.score or 0
                skill.level = round((old_level * skill.assessments_count + new_score) / (skill.assessments_count + 1), 1)
                skill.assessments_count += 1
                skill.trend = "up" if skill.level > old_level else ("down" if skill.level < old_level else "stable")
            else:
                skill = Skill(
                    fresher_id=fresher.id,
                    name=skill_name,
                    category="Technical",
                    level=submission.score or 0,
                    trend="stable",
                    assessments_count=1,
                )
                db.add(skill)

        # Award achievement for excellence
        if submission.score and submission.score >= 90:
            from app.models.fresher import Achievement
            # skill_name is defined in the loop above, but we only award once per graded event
            achievement_title = f"High Scorer: {assessment.title}"
            existing_ach = db.query(Achievement).filter(
                Achievement.fresher_id == fresher.id,
                Achievement.title == achievement_title
            ).first()
            if not existing_ach:
                new_ach = Achievement(
                    fresher_id=fresher.id,
                    title=achievement_title,
                    icon="⭐",
                    description=f"Scored {submission.score}% on {assessment.title}"
                )
                db.add(new_ach)

        # Update overall progress
        all_subs = db.query(Submission).filter(
            Submission.user_id == fresher.user_id,
            Submission.status == "completed",
        ).all()
        if all_subs:
            avg_score = sum(s.score or 0 for s in all_subs) / len(all_subs)
            fresher.overall_progress = min(round(avg_score, 1), 100)

        db.commit()

    def update_profile(self, db, fresher: Fresher, data: dict):
        """Manual profile update via agent."""
        for key, val in data.items():
            if key != "fresher_id" and hasattr(fresher, key):
                setattr(fresher, key, val)
        db.commit()
        return {"status": "updated", "agent": "ProfileAgent"}

    def get_profile_summary(self, db, fresher: Fresher):
        skills = db.query(Skill).filter(Skill.fresher_id == fresher.id).all()
        
        # Add a generative summary if enough data exists
        ai_summary = fresher.summary
        if not ai_summary and len(skills) >= 2:
            ai_summary = self.generate_fresher_summary(fresher, skills)
            fresher.summary = ai_summary
            db.commit()

        return {
            "fresher_id": str(fresher.id),
            "overall_progress": fresher.overall_progress,
            "risk_level": fresher.risk_level,
            "skills": [
                {"name": s.name, "level": s.level, "trend": s.trend}
                for s in skills
            ],
            "ai_summary": ai_summary or "Initializing skill analysis...",
            "agent": "ProfileAgent",
        }

    def generate_fresher_summary(self, fresher: Fresher, skills: list):
        """Use LLM to generate a personalized skill portrait."""
        skill_data = [{"name": s.name, "level": s.level} for s in skills]
        prompt = f"""
        Analyze this fresher's technical profile and write a professional 2-sentence 'Skill Portrait'.
        Progress: {fresher.overall_progress}%
        Skills: {json.dumps(skill_data)}
        
        Focus on their strongest area and potential career trajectory within the company.
        """
        response = self.call_llm(prompt, system="You are an expert technical career coach.")
        return response.strip()
