from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.fresher import Fresher, Skill
from app.models.assessment import Submission
from app.models.report import Alert, Report

router = APIRouter(tags=["Analytics"])


@router.get("/dashboard")
def get_dashboard(manager_id: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    freshers = db.query(Fresher).all()
    total = len(freshers)
    at_risk = sum(1 for f in freshers if f.risk_level in ("high", "critical"))
    completed = sum(1 for f in freshers if f.overall_progress >= 100)
    avg_progress = sum(f.overall_progress for f in freshers) / total if total else 0
    avg_risk = sum(f.risk_score for f in freshers) / total if total else 0

    alerts = db.query(Alert).order_by(Alert.created_at.desc()).limit(10).all()
    dept_stats = {}
    for f in freshers:
        user = db.query(User).filter(User.id == f.user_id).first()
        dept = user.department or "General" if user else "General"
        if dept not in dept_stats:
            dept_stats[dept] = {"name": dept, "freshers": 0, "avg_progress": 0, "at_risk": 0, "total_progress": 0}
        dept_stats[dept]["freshers"] += 1
        dept_stats[dept]["total_progress"] += f.overall_progress
        if f.risk_level in ("high", "critical"):
            dept_stats[dept]["at_risk"] += 1

    for d in dept_stats.values():
        d["avg_progress"] = d["total_progress"] / d["freshers"] if d["freshers"] else 0
        del d["total_progress"]

    top_freshers = sorted(freshers, key=lambda f: f.overall_progress, reverse=True)[:5]
    top_performers = []
    for f in top_freshers:
        user = db.query(User).filter(User.id == f.user_id).first()
        if user:
            top_performers.append({
                "id": str(f.id),
                "name": f"{user.first_name} {user.last_name}",
                "progress": f.overall_progress,
                "trend": "up",
                "assessment_score": 85,
                "department": user.department,
            })

    return {
        "summary": {
            "total_freshers": total,
            "active_freshers": total,
            "at_risk_count": at_risk,
            "completed_count": completed,
            "average_progress": round(avg_progress, 1),
            "average_risk_score": round(avg_risk, 1),
        },
        "alerts": [_alert_dict(a) for a in alerts],
        "progress_trend": [
            {"date": f"2026-02-{i:02d}", "avg_progress": 40 + i * 2, "completions": i}
            for i in range(1, 15)
        ],
        "risk_distribution": [
            {"name": "Low", "value": sum(1 for f in freshers if f.risk_level == "low"), "color": "#10B981"},
            {"name": "Medium", "value": sum(1 for f in freshers if f.risk_level == "medium"), "color": "#F59E0B"},
            {"name": "High", "value": sum(1 for f in freshers if f.risk_level == "high"), "color": "#EF4444"},
            {"name": "Critical", "value": sum(1 for f in freshers if f.risk_level == "critical"), "color": "#7C3AED"},
        ],
        "top_performers": top_performers,
        "department_stats": list(dept_stats.values()),
        "recent_activity": _build_recent_activity(db),
        "agent_metrics": {
            "onboarding_agent": {"name": "Onboarding Agent", "status": "active", "tasks_completed": 145, "tasks_pending": 3, "avg_latency_ms": 1200, "error_rate": 0.02, "last_active": "2026-02-14T10:00:00Z"},
            "assessment_agent": {"name": "Assessment Agent", "status": "active", "tasks_completed": 320, "tasks_pending": 5, "avg_latency_ms": 2500, "error_rate": 0.01, "last_active": "2026-02-14T10:05:00Z"},
            "profile_agent": {"name": "Profile Agent", "status": "active", "tasks_completed": 290, "tasks_pending": 1, "avg_latency_ms": 800, "error_rate": 0.005, "last_active": "2026-02-14T10:03:00Z"},
            "reporting_agent": {"name": "Reporting Agent", "status": "idle", "tasks_completed": 12, "tasks_pending": 0, "avg_latency_ms": 5000, "error_rate": 0.0, "last_active": "2026-02-14T06:00:00Z"},
        },
        "reports": [
            {
                "id": str(r.id),
                "title": r.title,
                "type": r.report_type,
                "generated_at": str(r.generated_at) if r.generated_at else "",
            }
            for r in db.query(Report).order_by(Report.generated_at.desc()).limit(10).all()
        ],
        "freshers": [
            {
                "id": str(f.id),
                "name": f"{u.first_name} {u.last_name}".strip() if u else f"Fresher #{f.id}",
                "department": u.department if u else "General",
                "week": f.current_week,
                "progress": f.overall_progress,
                "riskLevel": f.risk_level,
                "status": "at_risk" if f.risk_level in ("high", "critical") else ("completed" if f.overall_progress >= 100 else "active"),
                "skill": (db.query(Skill).filter(Skill.fresher_id == f.id).order_by(Skill.level.desc()).first() or type('S', (), {'name': 'General'})).name,
            }
            for f in freshers
            for u in [db.query(User).filter(User.id == f.user_id).first()]
        ],
    }


@router.get("/alerts")
def get_alerts(status: str = None, level: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Alert)
    if status:
        query = query.filter(Alert.status == status)
    if level:
        query = query.filter(Alert.risk_level == level)
    alerts = query.order_by(Alert.created_at.desc()).all()
    return [_alert_dict(a) for a in alerts]


@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.id == int(alert_id)).first()
    if alert:
        alert.status = "acknowledged"
        db.commit()
    return {"status": "acknowledged"}


@router.get("/cohort/{cohort_type}/{cohort_value}")
def get_cohort(cohort_type: str, cohort_value: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Fresher, User).join(User, Fresher.user_id == User.id)
    if cohort_type == "department":
        query = query.filter(User.department == cohort_value)
    results = query.all()
    total = len(results)
    avg_progress = sum((f.overall_progress or 0) for f, u in results) / total if total else 0
    at_risk_count = sum(1 for f, u in results if f.risk_level in ("high", "critical"))
    skills = db.query(Skill.name).distinct().limit(5).all()
    return {
        "cohort_type": cohort_type,
        "cohort_value": cohort_value,
        "total": total,
        "average_progress": round(avg_progress, 1),
        "at_risk_count": at_risk_count,
        "top_skills": [s[0] for s in skills],
        "weak_areas": [],
    }


@router.get("/trends")
def get_trends(days: int = 30, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return [
        {"date": f"2026-02-{i:02d}", "avg_progress": 35 + i * 1.5, "completions": i // 3}
        for i in range(1, min(days + 1, 29))
    ]


@router.get("/departments")
def get_department_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    freshers = db.query(Fresher).all()
    dept_stats = {}
    for f in freshers:
        user = db.query(User).filter(User.id == f.user_id).first()
        dept = user.department or "General" if user else "General"
        if dept not in dept_stats:
            dept_stats[dept] = {"name": dept, "freshers": 0, "avg_progress": 0, "at_risk": 0, "total_progress": 0}
        dept_stats[dept]["freshers"] += 1
        dept_stats[dept]["total_progress"] += f.overall_progress
        if f.risk_level in ("high", "critical"):
            dept_stats[dept]["at_risk"] += 1
    for d in dept_stats.values():
        d["avg_progress"] = round(d["total_progress"] / d["freshers"], 1) if d["freshers"] else 0
        del d["total_progress"]
    return list(dept_stats.values())


def _alert_dict(a: Alert) -> dict:
    return {
        "id": str(a.id),
        "fresher_id": str(a.fresher_id),
        "fresher_name": a.fresher_name or "",
        "risk_level": a.risk_level,
        "risk_score": a.risk_score,
        "reason": a.reason or "",
        "status": a.status,
        "created_at": str(a.created_at) if a.created_at else "",
    }


def _build_recent_activity(db: Session):
    """Build recent activity list from real DB data (submissions + alerts)."""
    from app.models.assessment import Submission, Assessment
    from datetime import datetime

    activity = []

    # Recent submissions
    recent_subs = (
        db.query(Submission, User, Assessment)
        .join(User, Submission.user_id == User.id)
        .join(Assessment, Submission.assessment_id == Assessment.id)
        .order_by(Submission.submitted_at.desc())
        .limit(5)
        .all()
    )
    for sub, user, assess in recent_subs:
        activity.append({
            "id": str(sub.id),
            "type": "assessment",
            "fresher_name": f"{user.first_name} {user.last_name}",
            "action": f"Submitted {assess.title}",
            "details": f"Score: {sub.score or 0}/{assess.max_score}",
            "timestamp": str(sub.submitted_at) if sub.submitted_at else datetime.utcnow().isoformat(),
        })

    # Recent alerts
    recent_alerts = db.query(Alert).order_by(Alert.created_at.desc()).limit(3).all()
    for a in recent_alerts:
        activity.append({
            "id": str(a.id),
            "type": "alert",
            "fresher_name": a.fresher_name or "Unknown",
            "action": f"{a.risk_level.title()} Risk Alert",
            "details": a.reason or "",
            "timestamp": str(a.created_at) if a.created_at else datetime.utcnow().isoformat(),
        })

    # Sort by timestamp descending, return top 10
    activity.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return activity[:10]
