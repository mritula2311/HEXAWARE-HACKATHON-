from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.fresher import Fresher
from app.models.schedule import Schedule, ScheduleItem

router = APIRouter(tags=["Schedules"])


@router.get("/fresher/{fresher_id}/today")
def get_today_schedule(fresher_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today().isoformat()
    schedule = db.query(Schedule).filter(
        Schedule.fresher_id == int(fresher_id),
        Schedule.schedule_date == today,
    ).first()
    if not schedule:
        return {"id": "0", "fresher_id": fresher_id, "schedule_date": today, "items": [], "status": "pending", "created_at": ""}
    return _schedule_dict(schedule, db)


@router.get("/fresher/{fresher_id}/week")
def get_week_schedule(fresher_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    start = today - timedelta(days=today.weekday())
    dates = [(start + timedelta(days=i)).isoformat() for i in range(7)]
    schedules = db.query(Schedule).filter(
        Schedule.fresher_id == int(fresher_id),
        Schedule.schedule_date.in_(dates),
    ).all()
    return [_schedule_dict(s, db) for s in schedules]


@router.get("/fresher/{fresher_id}/date/{schedule_date}")
def get_by_date(fresher_id: str, schedule_date: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    schedule = db.query(Schedule).filter(
        Schedule.fresher_id == int(fresher_id),
        Schedule.schedule_date == schedule_date,
    ).first()
    if not schedule:
        return {"id": "0", "fresher_id": fresher_id, "schedule_date": schedule_date, "items": [], "status": "pending", "created_at": ""}
    return _schedule_dict(schedule, db)


@router.get("/items/{item_id}")
def get_item(item_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(ScheduleItem).filter(ScheduleItem.id == int(item_id)).first()
    if not item:
        raise HTTPException(status_code=404, detail="Schedule item not found")
    return {
        "id": str(item.id),
        "title": item.title,
        "description": item.description,
        "item_type": item.item_type,
        "duration_minutes": item.duration_minutes,
        "status": item.status,
        "topic": item.topic,
        "start_time": item.start_time,
        "end_time": item.end_time,
        "content": item.content,
        "external_url": item.external_url,
    }


@router.post("/items/{item_id}/start")
def start_item(item_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(ScheduleItem).filter(ScheduleItem.id == int(item_id)).first()
    if not item:
        raise HTTPException(status_code=404, detail="Schedule item not found")
    item.status = "in_progress"
    db.commit()
    return {"status": "in_progress"}


@router.post("/items/{item_id}/complete")
def complete_item(item_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(ScheduleItem).filter(ScheduleItem.id == int(item_id)).first()
    if not item:
        raise HTTPException(status_code=404, detail="Schedule item not found")
    item.status = "completed"
    db.commit()
    return {"status": "completed"}


@router.post("/generate")
def generate_schedule(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.agents.onboarding_agent import OnboardingAgent
    agent = OnboardingAgent()
    fresher_id = data.get("fresher_id")
    target_date = data.get("target_date", date.today().isoformat())

    fresher = db.query(Fresher).filter(Fresher.id == int(fresher_id)).first()
    if not fresher:
        raise HTTPException(status_code=404, detail="Fresher not found")

    result = agent.execute(db, fresher, target_date)
    return result


def _schedule_dict(schedule: Schedule, db: Session) -> dict:
    items = db.query(ScheduleItem).filter(ScheduleItem.schedule_id == schedule.id).all()
    return {
        "id": str(schedule.id),
        "fresher_id": str(schedule.fresher_id),
        "schedule_date": schedule.schedule_date,
        "items": [
            {
                "id": str(si.id),
                "title": si.title,
                "description": si.description,
                "item_type": si.item_type,
                "duration_minutes": si.duration_minutes,
                "status": si.status,
                "topic": si.topic,
                "start_time": si.start_time,
                "end_time": si.end_time,
            }
            for si in items
        ],
        "status": schedule.status,
        "created_at": str(schedule.created_at) if schedule.created_at else "",
    }
