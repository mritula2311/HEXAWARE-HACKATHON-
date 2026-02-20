from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.fresher import Fresher
from app.models.certification import Certification, AssignmentHistory
from app.models.assessment import Submission, Assessment
from datetime import datetime
import json

router = APIRouter()


def _parse_datetime(value):
    if value in [None, "", "null"]:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except Exception:
            return None
    return None


def _normalize_progress(progress_val):
    try:
        progress = float(progress_val)
    except Exception:
        progress = 0.0
    return min(max(progress, 0.0), 100.0)


@router.get("/fresher/{fresher_id}")
def get_fresher_certifications(
    fresher_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all certifications for a fresher."""
    certifications = db.query(Certification).filter(
        Certification.fresher_id == int(fresher_id)
    ).all()
    
    return {
        "certifications": [
            {
                "id": str(cert.id),
                "name": cert.name,
                "provider": cert.provider,
                "status": cert.status,
                "progress": cert.progress,
                "target_completion_date": str(cert.target_completion_date) if cert.target_completion_date else None,
                "completion_date": str(cert.completion_date) if cert.completion_date else None,
                "certification_url": cert.certification_url,
                "certificate_url": cert.certificate_url,
                "notes": cert.notes,
                "is_mandatory": cert.is_mandatory,
                "created_at": str(cert.created_at) if cert.created_at else "",
                "updated_at": str(cert.updated_at) if cert.updated_at else "",
            }
            for cert in certifications
        ]
    }


@router.post("/fresher/{fresher_id}")
def create_certification(
    fresher_id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new certification for a fresher."""
    fresher = db.query(Fresher).filter(Fresher.id == int(fresher_id)).first()
    if not fresher:
        raise HTTPException(status_code=404, detail="Fresher not found")
    
    progress_val = _normalize_progress(data.get("progress", 0.0))
    status_val = data.get("status")
    if not status_val:
        status_val = "completed" if progress_val >= 100 else ("in_progress" if progress_val > 0 else "not_started")

    certificate_link = data.get("certificate_url") or data.get("linkedin_url") or data.get("certification_url")

    certification = Certification(
        fresher_id=int(fresher_id),
        name=data.get("name", "AWS Cloud Practitioner"),
        provider=data.get("provider", "AWS"),
        status=status_val,
        progress=progress_val,
        target_completion_date=_parse_datetime(data.get("target_completion_date")),
        certification_url=data.get("certification_url"),
        certificate_url=certificate_link,
        notes=data.get("notes"),
        is_mandatory=data.get("is_mandatory", False),
    )
    db.add(certification)
    db.commit()
    db.refresh(certification)
    
    return {
        "id": str(certification.id),
        "name": certification.name,
        "status": certification.status,
        "progress": certification.progress,
    }


@router.put("/{certification_id}")
def update_certification(
    certification_id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update certification progress and details."""
    certification = db.query(Certification).filter(
        Certification.id == int(certification_id)
    ).first()
    
    if not certification:
        raise HTTPException(status_code=404, detail="Certification not found")
    
    # Update allowed fields
    if "progress" in data:
        certification.progress = _normalize_progress(data["progress"])
    if "status" in data:
        certification.status = data["status"]
    if "notes" in data:
        certification.notes = data["notes"]
    if "target_completion_date" in data:
        certification.target_completion_date = _parse_datetime(data["target_completion_date"])
    if "completion_date" in data:
        certification.completion_date = _parse_datetime(data["completion_date"])
    if "certificate_url" in data:
        certification.certificate_url = data["certificate_url"]
    if "linkedin_url" in data:
        certification.certificate_url = data["linkedin_url"]
    if "certification_url" in data:
        certification.certification_url = data["certification_url"]
    
    # Auto-complete if progress hits 100%
    if certification.progress >= 100 and certification.status != "completed":
        certification.status = "completed"
        if not certification.completion_date:
            certification.completion_date = datetime.utcnow()
    elif certification.progress < 100 and certification.status == "completed":
        certification.status = "in_progress" if certification.progress > 0 else "not_started"
    
    certification.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(certification)
    
    return {
        "id": str(certification.id),
        "name": certification.name,
        "status": certification.status,
        "progress": certification.progress,
        "updated_at": str(certification.updated_at),
    }


@router.delete("/{certification_id}")
def delete_certification(
    certification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a certification."""
    certification = db.query(Certification).filter(
        Certification.id == int(certification_id)
    ).first()
    
    if not certification:
        raise HTTPException(status_code=404, detail="Certification not found")
    
    db.delete(certification)
    db.commit()
    
    return {"status": "deleted", "id": certification_id}


@router.get("/assignment-history/fresher/{fresher_id}")
def get_assignment_history(
    fresher_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get assignment submission history for a fresher."""
    history = db.query(AssignmentHistory).filter(
        AssignmentHistory.fresher_id == int(fresher_id)
    ).order_by(AssignmentHistory.submitted_at.desc()).all()
    
    return {
        "history": [
            {
                "id": str(h.id),
                "submission_id": str(h.submission_id),
                "assessment_id": str(h.assessment_id),
                "version": h.version,
                "status": h.status,
                "score": h.score,
                "feedback": json.loads(h.feedback) if h.feedback else None,
                "submitted_at": str(h.submitted_at) if h.submitted_at else "",
                "graded_at": str(h.graded_at) if h.graded_at else "",
            }
            for h in history
        ]
    }


@router.get("/assignment-history/submission/{submission_id}")
def get_submission_history(
    submission_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get version history for a specific submission."""
    history = db.query(AssignmentHistory).filter(
        AssignmentHistory.submission_id == int(submission_id)
    ).order_by(AssignmentHistory.version.asc()).all()
    
    return {
        "history": [
            {
                "id": str(h.id),
                "version": h.version,
                "status": h.status,
                "score": h.score,
                "feedback": json.loads(h.feedback) if h.feedback else None,
                "submitted_at": str(h.submitted_at) if h.submitted_at else "",
                "graded_at": str(h.graded_at) if h.graded_at else "",
            }
            for h in history
        ]
    }


@router.post("/assignment-history")
def create_assignment_history(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a new assignment submission version."""
    submission_id = data.get("submission_id")
    fresher_id = data.get("fresher_id")
    assessment_id = data.get("assessment_id")
    
    # Get the latest version for this submission
    latest = db.query(AssignmentHistory).filter(
        AssignmentHistory.submission_id == int(submission_id)
    ).order_by(AssignmentHistory.version.desc()).first()
    
    next_version = (latest.version + 1) if latest else 1
    
    history = AssignmentHistory(
        submission_id=int(submission_id),
        fresher_id=int(fresher_id),
        assessment_id=int(assessment_id),
        version=next_version,
        content=data.get("content"),
        status=data.get("status", "submitted"),
        score=data.get("score"),
        feedback=json.dumps(data.get("feedback")) if data.get("feedback") else None,
        submitted_at=datetime.utcnow(),
        graded_at=_parse_datetime(data.get("graded_at")),
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    
    return {
        "id": str(history.id),
        "version": history.version,
        "status": history.status,
    }
