import json
from app.agents.base import BaseAgent
from app.models.fresher import Fresher, Skill
from app.models.assessment import Submission
from app.models.report import Alert


class AnalyticsAgent(BaseAgent):
    """The Strategist — performs cohort analysis, risk prediction, and gap identification."""

    def __init__(self):
        super().__init__()

    def execute(self, db, **kwargs):
        return self.cohort_analysis(db)

    def predict_risk(self, db, fresher: Fresher):
        """Predict risk level for a fresher using LLM analysis."""
        # Gather data
        skills = db.query(Skill).filter(Skill.fresher_id == fresher.id).all()
        subs = db.query(Submission).filter(Submission.user_id == fresher.user_id).all()
        avg_score = sum(s.score or 0 for s in subs) / len(subs) if subs else 0
        failed = sum(1 for s in subs if s.pass_status == "fail")

        prompt = f"""
Analyze risk for trainee:
- Overall progress: {fresher.overall_progress}%
- Average score: {avg_score:.1f}
- Failed assessments: {failed}/{len(subs)}
- Skills: {json.dumps([{"name": s.name, "level": s.level} for s in skills])}

Return JSON with risk_level (low/medium/high/critical), risk_score (0-100), factors (list), recommendations (list).
"""
        response = self.call_llm(prompt)

        try:
            result = json.loads(response)
        except Exception:
            # Deterministic fallback
            if avg_score >= 75:
                risk_level, risk_score = "low", 15
            elif avg_score >= 60:
                risk_level, risk_score = "medium", 40
            elif avg_score >= 40:
                risk_level, risk_score = "high", 70
            else:
                risk_level, risk_score = "critical", 90

            result = {
                "risk_level": risk_level,
                "risk_score": risk_score,
                "factors": [
                    f"Average score: {avg_score:.0f}%",
                    f"Failed {failed} assessments",
                ],
                "recommendations": [
                    "Review weak skill areas",
                    "Schedule mentoring session" if risk_score > 50 else "Continue current pace",
                ],
            }

        # Update fresher risk
        fresher.risk_level = result.get("risk_level", "low")
        fresher.risk_score = result.get("risk_score", 0)

        # Create alert if high risk
        if fresher.risk_level in ("high", "critical"):
            from app.models.user import User
            user = db.query(User).filter(User.id == fresher.user_id).first()
            alert = Alert(
                fresher_id=fresher.id,
                fresher_name=f"{user.first_name} {user.last_name}" if user else "Unknown",
                risk_level=fresher.risk_level,
                risk_score=fresher.risk_score,
                reason="; ".join(result.get("factors", ["High risk detected"])),
                status="new",
            )
            db.add(alert)

        db.commit()
        result["agent"] = "AnalyticsAgent"
        return result

    def cohort_analysis(self, db):
        freshers = db.query(Fresher).all()
        if not freshers:
            return {"total": 0, "average_progress": 0, "risk_distribution": {}}

        avg_progress = sum(f.overall_progress for f in freshers) / len(freshers)
        risk_dist = {}
        for f in freshers:
            risk_dist[f.risk_level] = risk_dist.get(f.risk_level, 0) + 1

        return {
            "total": len(freshers),
            "average_progress": round(avg_progress, 1),
            "risk_distribution": risk_dist,
            "agent": "AnalyticsAgent",
        }
