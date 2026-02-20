"""LLM-powered personalized feedback generation for assessments."""
import json
from app.core.llm_client import llm_client


class PersonalizedFeedbackGenerator:
    """Generate AI-powered personalized feedback for assessments."""
    
    @staticmethod
    def generate_submission_feedback(submission_data):
        """Generate personalized feedback for a submission using LLM."""
        assessment_type = submission_data.get('assessment_type', 'quiz')
        score = submission_data.get('score', 0)
        max_score = submission_data.get('max_score', 100)
        title = submission_data.get('title', 'Assessment')
        fresher_name = submission_data.get('fresher_name', 'Fresher')
        
        is_passing = score >= submission_data.get('passing_score', 60)
        percentage = (score / max_score) * 100 if max_score > 0 else 0
        
        prompt = f"""You are an AI mentor for MaverickAI. Generate personalized, encouraging feedback for a fresher's assessment.

Assessment Details:
- Title: {title}
- Type: {assessment_type}
- Fresher: {fresher_name}
- Score: {score}/{max_score} ({percentage:.1f}%)
- Status: {'PASSED' if is_passing else 'NEEDS IMPROVEMENT'}
- Questions/Topics: {submission_data.get('topics', 'General assessment')}

Generate JSON with:
1. overall_comment (2-3 sentences, encouraging but honest)
2. strengths (2-3 key strengths demonstrated, array)
3. weaknesses (2-3 areas for improvement, array)
4. actionable_suggestions (3-4 specific next steps, array)
5. practice_recommendations (2-3 concrete practice suggestions, array)
6. motivation_message (1 sentence to boost confidence)
7. next_milestone (what should they aim for next)
8. risk_level ('low', 'medium', or 'high' based on performance)
9. learning_style_hint (recommended learning approach)
10. estimated_improvement_weeks (weeks to reach 90% with consistent effort)

Make it personalized, specific to their score, and motivational. Use supportive tone."""

        try:
            llm_response = llm_client.generate(prompt=prompt, max_tokens=800)
            feedback = json.loads(llm_response)
            return feedback
        except Exception as e:
            # Fallback structured feedback
            return {
                "overall_comment": f"You scored {percentage:.1f}%. {('Great effort!' if percentage >= 70 else 'Keep practicing!')}",
                "strengths": ["Showed engagement with material", "Completed assessment"],
                "weaknesses": ["Several areas need reinforcement"],
                "actionable_suggestions": ["Review core concepts", "Practice similar problems", "Seek mentorship"],
                "practice_recommendations": ["Solve practice tests", "Study peer solutions", "Attend study sessions"],
                "motivation_message": "Every attempt is a step toward mastery!",
                "next_milestone": f"Target: 80% on next attempt",
                "risk_level": "medium" if percentage < 60 else "low",
                "learning_style_hint": "Combine reading with hands-on practice",
                "estimated_improvement_weeks": 2 if percentage < 60 else 1,
            }
    
    @staticmethod
    def generate_performance_insights(fresher_analytics):
        """Generate AI-powered performance insights and recommendations."""
        analytics = fresher_analytics
        
        prompt = f"""You are an AI performance analyst for MaverickAI. Generate strategic insights and recommendations.

Fresher Performance Data:
- Overall Score: {analytics.get('overall_score', 0):.1f}/100
- Quiz Average: {analytics.get('quiz_average', 0):.1f}%
- Pass Rate: {analytics.get('pass_rate', 0):.1f}%
- Assessments: {analytics.get('assessment_count', 0)} completed
- Risk Level: {analytics.get('risk_level', 'unknown')}
- Risk Score: {analytics.get('risk_score', 0):.1f}
- Improvement Rate: {analytics.get('improvement_rate', 0):.1f}%
- Cohort Percentile: {analytics.get('cohort_percentile', 0):.1f}%
- Skills: {json.dumps(analytics.get('skills_breakdown', {}))}
- Trend: {json.dumps(analytics.get('score_trend', {}))}

Generate JSON with:
1. executive_summary (2-3 sentences overall assessment)
2. key_strengths (2-3 strong areas, array)
3. critical_gaps (2-3 areas needing urgent attention, array)
4. improvement_opportunities (2-3 high-impact improvements, array)
5. personalized_roadmap (3-4 specific, time-bound action items, array)
6. learning_recommendations (2-3 resource/method recommendations, array)
7. mentor_feedback (advice for assigned mentor/manager)
8. cohort_position_insight (how they compare: 'Leading', 'Average', 'Lagging')
9. predicted_trajectory (expected performance in 4 weeks)
10. intervention_priority ('High', 'Medium', 'Low' - whether immediate action needed)

Be data-driven, specific, and actionable. Provide professional recommendations."""

        try:
            llm_response = llm_client.generate(prompt=prompt, max_tokens=1000)
            insights = json.loads(llm_response)
            return insights
        except Exception as e:
            # Fallback insights
            return {
                "executive_summary": f"Overall performance at {analytics.get('overall_score', 0):.1f}%. Consistent engagement with assessments.",
                "key_strengths": ["Completing assessments", "Show commitment"],
                "critical_gaps": ["Need to improve quiz scores", "Focus on weak areas"],
                "improvement_opportunities": ["Practice more", "Study harder topics"],
                "personalized_roadmap": ["Week 1: Review fundamentals", "Week 2: Practice problems", "Week 3: Take mock test", "Week 4: Final assessment"],
                "learning_recommendations": ["Join study groups", "Watch tutorials", "Practice daily"],
                "mentor_feedback": "Fresher shows commitment but needs focused help in weak areas.",
                "cohort_position_insight": "Average" if analytics.get('cohort_percentile', 50) <60 else "Good",
                "predicted_trajectory": f"Expected improvement to {min(100, analytics.get('overall_score', 0) + 10):.1f}% in 4 weeks",
                "intervention_priority": "High" if analytics.get('risk_level') == 'critical' else "Medium" if analytics.get('risk_level') == 'high' else "Low",
            }
    
    @staticmethod
    def generate_skill_deep_dive(skill_name, skill_data, submissions):
        """Generate detailed analysis for a specific skill."""
        
        avg_score = skill_data.get('level', 0)
        trend = skill_data.get('trend', 'stable')
        assessment_count = skill_data.get('assessments_count', 0)
        
        prompt = f"""You are an expert skill development coach. Provide detailed guidance for skill mastery.

Skill Analysis:
- Skill: {skill_name}
- Current Level: {avg_score:.1f}/100
- Trend: {trend}
- Assessments Taken: {assessment_count}

Generate JSON with:
1. skill_overview (2-3 sentences about this skill)
2. proficiency_level ('Beginner', 'Intermediate', 'Advanced', 'Expert')
3. current_strengths (2-3 areas of strength in this skill)
4. areas_to_develop (2-3 specific areas for development)
5. mastery_path (4-5 step progression to reach 90%+)
6. resources (2-3 specific resources: books, courses, tools)
7. practice_exercises (3-4 concrete exercises to improve)
8. real_world_applications (2-3 how to apply in real projects)
9. timeline_to_mastery (estimated weeks to reach 85%+)
10. expert_tips (3-4 insider tips from experts)

Make it inspiring and practical."""

        try:
            llm_response = llm_client.generate(prompt=prompt, max_tokens=900)
            deep_dive = json.loads(llm_response)
            return deep_dive
        except Exception:
            return {
                "skill_overview": f"{skill_name} is essential. Current performance at {avg_score:.1f}%.",
                "proficiency_level": "Intermediate",
                "current_strengths": ["Engaged with material", "Showing progress"],
                "areas_to_develop": ["Core concepts", "Advanced patterns"],
                "mastery_path": ["Learn foundations", "Build projects", "Study patterns", "Teach others", "Contribute"],
                "resources": ["Official documentation", "Online courses", "Practice platforms"],
                "practice_exercises": ["Daily practice", "Build a project", "Code reviews", "Peer learning"],
                "real_world_applications": ["Production code", "Team projects", "Mentoring others"],
                "timeline_to_mastery": 6,
                "expert_tips": ["Practice daily", "Build real projects", "Learn from mistakes", "Share knowledge"],
            }


feedback_generator = PersonalizedFeedbackGenerator()
