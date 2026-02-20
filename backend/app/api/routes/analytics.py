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
        "recent_activity": [
            {"id": "1", "type": "assessment", "fresher_name": "Riya Sharma", "action": "Submitted Python Basics Quiz", "details": "Score: 85/100", "timestamp": "2026-02-14T09:30:00Z"},
            {"id": "2", "type": "schedule", "fresher_name": "Arjun Patel", "action": "Completed Daily Schedule", "details": "5/5 tasks done", "timestamp": "2026-02-14T08:00:00Z"},
            {"id": "3", "type": "alert", "fresher_name": "Priya Reddy", "action": "At-Risk Alert Generated", "details": "Risk score increased to 65", "timestamp": "2026-02-14T07:00:00Z"},
        ],
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
    return {
        "cohort_type": cohort_type,
        "cohort_value": cohort_value,
        "total": 25,
        "average_progress": 68.5,
        "at_risk_count": 3,
        "top_skills": ["Python", "SQL", "Git"],
        "weak_areas": ["Data Structures", "System Design"],
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
