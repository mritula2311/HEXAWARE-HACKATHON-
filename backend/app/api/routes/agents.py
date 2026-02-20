from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.fresher import Fresher

router = APIRouter(tags=["Agents"])


@router.post("/generate-schedule")
def generate_schedule(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.agents.onboarding_agent import OnboardingAgent
    from datetime import date
    agent = OnboardingAgent()
    fresher_id = data.get("fresher_id")
    target_date = data.get("target_date", date.today().isoformat())
    fresher = db.query(Fresher).filter(Fresher.id == int(fresher_id)).first()
    if not fresher:
        raise HTTPException(status_code=404, detail="Fresher not found")
    return agent.execute(db, fresher, target_date)


@router.post("/grade")
def grade_submission(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.assessment import Submission, Assessment
    
    submission_id = data.get("submission_id")
    sub = db.query(Submission).filter(Submission.id == int(submission_id)).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Get assessment to determine type
    assessment = db.query(Assessment).filter(Assessment.id == sub.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Use specialized HR-focused evaluator based on assessment type
    # Only quiz and assignment types supported (code challenges removed)
    if assessment.assessment_type == "quiz":
        from app.agents.quiz_evaluator_agent import QuizEvaluatorAgent
        agent = QuizEvaluatorAgent()
    elif assessment.assessment_type == "assignment":
        from app.agents.assignment_evaluator_agent import AssignmentEvaluatorAgent
        agent = AssignmentEvaluatorAgent()
    else:
        # Fallback to generic agent
        from app.agents.assessment_agent import AssessmentAgent
        agent = AssessmentAgent()
    
    return agent.evaluate(db, sub, assessment)


@router.post("/predict-risk")
def predict_risk(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.agents.analytics_agent import AnalyticsAgent
    agent = AnalyticsAgent()
    fresher_id = data.get("fresher_id")
    fresher = db.query(Fresher).filter(Fresher.id == int(fresher_id)).first()
    if not fresher:
        raise HTTPException(status_code=404, detail="Fresher not found")
    return agent.predict_risk(db, fresher)


@router.post("/update-profile")
def update_profile(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.agents.profile_agent import ProfileAgent
    agent = ProfileAgent()
    fresher_id = data.get("fresher_id")
    fresher = db.query(Fresher).filter(Fresher.id == int(fresher_id)).first()
    if not fresher:
        raise HTTPException(status_code=404, detail="Fresher not found")
    return agent.update_profile(db, fresher, data)


@router.get("/metrics")
def get_metrics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {
        "onboarding_agent": {"name": "Onboarding Agent", "status": "active", "tasks_completed": 145, "tasks_pending": 3, "avg_latency_ms": 1200, "error_rate": 0.02, "last_active": "2026-02-14T10:00:00Z"},
        "assessment_agent": {"name": "Assessment Agent", "status": "active", "tasks_completed": 320, "tasks_pending": 5, "avg_latency_ms": 2500, "error_rate": 0.01, "last_active": "2026-02-14T10:05:00Z"},
        "profile_agent": {"name": "Profile Agent", "status": "active", "tasks_completed": 290, "tasks_pending": 1, "avg_latency_ms": 800, "error_rate": 0.005, "last_active": "2026-02-14T10:03:00Z"},
        "reporting_agent": {"name": "Reporting Agent", "status": "idle", "tasks_completed": 12, "tasks_pending": 0, "avg_latency_ms": 5000, "error_rate": 0.0, "last_active": "2026-02-14T06:00:00Z"},
    }


@router.get("/{agent_name}/status")
def get_agent_status(agent_name: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    agent_statuses = {
        "onboarding": {"name": "Onboarding Agent", "status": "active", "tasks_completed": 145, "tasks_pending": 3, "avg_latency_ms": 1200, "error_rate": 0.02, "last_active": "2026-02-14T10:00:00Z"},
        "assessment": {"name": "Assessment Agent", "status": "active", "tasks_completed": 320, "tasks_pending": 5, "avg_latency_ms": 2500, "error_rate": 0.01, "last_active": "2026-02-14T10:05:00Z"},
        "profile": {"name": "Profile Agent", "status": "active", "tasks_completed": 290, "tasks_pending": 1, "avg_latency_ms": 800, "error_rate": 0.005, "last_active": "2026-02-14T10:03:00Z"},
        "analytics": {"name": "Analytics Agent", "status": "active", "tasks_completed": 50, "tasks_pending": 2, "avg_latency_ms": 3000, "error_rate": 0.03, "last_active": "2026-02-14T09:00:00Z"},
        "reporting": {"name": "Reporting Agent", "status": "idle", "tasks_completed": 12, "tasks_pending": 0, "avg_latency_ms": 5000, "error_rate": 0.0, "last_active": "2026-02-14T06:00:00Z"},
    }
    return agent_statuses.get(agent_name, {"name": agent_name, "status": "unknown"})
