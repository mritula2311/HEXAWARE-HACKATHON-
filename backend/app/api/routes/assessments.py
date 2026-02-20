import json
import random
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.assessment import Assessment, Submission

router = APIRouter(tags=["Assessments"])


@router.get("/")
def list_assessments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    assessments = db.query(Assessment).filter(Assessment.is_active == True).all()
    return [_assessment_detail(a) for a in assessments]


@router.get("/my/pending")
def get_pending(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    submitted_ids = [
        s.assessment_id
        for s in db.query(Submission).filter(Submission.user_id == current_user.id).all()
    ]
    assessments = db.query(Assessment).filter(
        Assessment.is_active == True,
        ~Assessment.id.in_(submitted_ids) if submitted_ids else True,
    ).all()
    return [_assessment_detail(a) for a in assessments]


@router.get("/my/completed")
def get_completed(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    subs = db.query(Submission).filter(
        Submission.user_id == current_user.id,
        Submission.status.in_(["graded", "completed"]),
    ).all()
    result = []
    for s in subs:
        a = db.query(Assessment).filter(Assessment.id == s.assessment_id).first()
        if a:
            result.append({
                "id": str(a.id),
                "title": a.title,
                "description": a.description,
                "assessment_type": a.assessment_type,
                "fresher_id": None,
                "status": "graded",
                "score": s.score,
                "max_score": a.max_score,
                "passing_score": a.passing_score,
                "submitted_at": str(s.submitted_at) if s.submitted_at else None,
                "graded_at": str(s.graded_at) if s.graded_at else None,
                "feedback": s.feedback,
                "created_at": str(a.created_at) if a.created_at else "",
            })
    return result


@router.get("/{assessment_id}")
def get_assessment(assessment_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    a = db.query(Assessment).filter(Assessment.id == int(assessment_id)).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return _assessment_detail(a)


@router.post("/{assessment_id}/start")
def start_assessment(assessment_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    a = db.query(Assessment).filter(Assessment.id == int(assessment_id)).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found")

    sub = Submission(
        assessment_id=a.id,
        user_id=current_user.id,
        submission_type=a.assessment_type,  # Keep original type (quiz, code, or assignment)
        status="in_progress",
        max_score=a.max_score,
        passing_score=a.passing_score,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return {"submission_id": str(sub.id), "status": "in_progress"}


@router.post("/submissions/{submission_id}/answers")
def submit_answers(submission_id: str, data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sub = db.query(Submission).filter(Submission.id == int(submission_id)).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    sub.answers = json.dumps(data.get("answers", {}))
    sub.status = "submitted"
    db.commit()
    return {"status": "submitted", "submission_id": str(sub.id)}


def _sanitize_feedback(raw_feedback: dict) -> dict:
    """Sanitize feedback to ensure all list items are strings (not objects)."""
    def clean_list(l):
        if not isinstance(l, list): return []
        return [str(v) if isinstance(v, (dict, list)) else str(v) for v in l]

    return {
        "overall_comment": str(raw_feedback.get("overall_comment", raw_feedback.get("overall_assessment", raw_feedback.get("overall", raw_feedback.get("feedback", ""))))),
        "strengths": clean_list(raw_feedback.get("strengths", [])),
        "weaknesses": clean_list(raw_feedback.get("weaknesses", raw_feedback.get("areas_for_improvement", []))),
        "suggestions": clean_list(raw_feedback.get("suggestions", raw_feedback.get("developmental_recommendations", []))),
        "missing_points": clean_list(raw_feedback.get("missing_points", [])),
        "errors": clean_list(raw_feedback.get("errors", [])),
        "improvements": clean_list(raw_feedback.get("improvements", [])),
        "risk_level": str(raw_feedback.get("risk_level", "low")),
        "risk_factors": clean_list(raw_feedback.get("risk_factors", [])),
        "accuracy_score": raw_feedback.get("accuracy_score") if raw_feedback.get("accuracy_score") not in [None, ""] else None,
        "test_score": raw_feedback.get("test_score") if raw_feedback.get("test_score") not in [None, ""] else None,
        "style_score": raw_feedback.get("style_score") if raw_feedback.get("style_score") not in [None, ""] else None,
        "rubric_scores": {
            str(k): (v if isinstance(v, (int, float)) else 0)
            for k, v in (raw_feedback.get("rubric_scores", {}) if isinstance(raw_feedback.get("rubric_scores"), dict) else {}).items()
        }
    }


@router.get("/submissions/{submission_id}/results")
def get_results(submission_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sub = db.query(Submission).filter(Submission.id == int(submission_id)).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    feedback = {}
    if sub.feedback:
        try:
            raw = json.loads(sub.feedback)
            feedback = _sanitize_feedback(raw) if isinstance(raw, dict) else {"overall_comment": str(raw)}
        except Exception:
            feedback = {"overall_comment": str(sub.feedback)}
    test_results = []
    if sub.test_results:
        try:
            test_results = json.loads(sub.test_results)
        except Exception:
            pass
    return {
        "submission_id": str(sub.id),
        "assessment_id": str(sub.assessment_id),
        "score": sub.score,
        "max_score": sub.max_score,
        "pass_status": sub.pass_status,
        "status": sub.status,
        "feedback": feedback,
        "test_results": test_results,
        "submitted_at": str(sub.submitted_at) if sub.submitted_at else None,
        "graded_at": str(sub.graded_at) if sub.graded_at else None,
    }


@router.get("/{assessment_id}/latest-result")
def get_latest_result(assessment_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get the latest completed submission result for a specific assessment."""
    sub = db.query(Submission).filter(
        Submission.user_id == current_user.id,
        Submission.assessment_id == int(assessment_id),
        Submission.status.in_(["completed", "graded"])
    ).order_by(Submission.submitted_at.desc()).first()

    if not sub:
        raise HTTPException(status_code=404, detail="No completed submission found for this assessment")

    feedback = {}
    if sub.feedback:
        try:
            raw = json.loads(sub.feedback)
            feedback = _sanitize_feedback(raw) if isinstance(raw, dict) else {"overall_comment": str(raw)}
        except Exception:
            feedback = {"overall_comment": str(sub.feedback)}
            
    test_results = []
    if sub.test_results:
        try:
            test_results = json.loads(sub.test_results)
        except Exception:
            pass

    return {
        "submission_id": str(sub.id),
        "assessment_id": str(sub.assessment_id),
        "score": sub.score,
        "max_score": sub.max_score,
        "pass_status": sub.pass_status,
        "status": sub.status,
        "feedback": feedback,
        "test_results": test_results,
        "submitted_at": str(sub.submitted_at) if sub.submitted_at else None,
        "graded_at": str(sub.graded_at) if sub.graded_at else None,
    }


def _assessment_detail(a: Assessment) -> dict:
    def _parse_json(val):
        if not val:
            return []
        try:
            return json.loads(val)
        except Exception:
            return []

    def _select_daily_questions(questions: list, count: int, assessment_id: int):
        if not questions:
            return []
        if len(questions) <= count:
            return questions
        day_seed = int(date.today().strftime("%Y%m%d")) + int(assessment_id)
        rng = random.Random(day_seed)
        return rng.sample(questions, count)

    questions = _parse_json(a.questions)
    if a.assessment_type == "quiz":
        questions = _select_daily_questions(questions, 5, a.id)

    return {
        "id": a.id,
        "title": a.title,
        "description": a.description or "",
        "assessment_type": a.assessment_type,
        "time_limit_minutes": a.time_limit_minutes,
        "max_score": a.max_score,
        "passing_score": a.passing_score,
        "max_attempts": a.max_attempts,
        "instructions": a.instructions,
        "module_id": a.module_id,
        "weight": a.weight,
        "rubric": _parse_json(a.rubric) if a.rubric else {},
        "starter_code": a.starter_code,
        "test_cases": _parse_json(a.test_cases),
        "questions": questions,
        "skills_assessed": _parse_json(a.skills_assessed),
        "language": a.language,
        "is_active": a.is_active,
        "is_published": a.is_published,
        "available_from": a.available_from,
        "available_until": a.available_until,
        "created_at": str(a.created_at) if a.created_at else "",
    }
