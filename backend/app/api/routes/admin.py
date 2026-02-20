from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.core.security import get_password_hash

router = APIRouter(tags=["Admin"])


@router.get("/users")
def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    users = db.query(User).all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "role": u.role,
            "department": u.department,
            "is_active": u.is_active,
            "created_at": str(u.created_at) if u.created_at else "",
            "updated_at": str(u.updated_at) if u.updated_at else "",
        }
        for u in users
    ]


@router.post("/users")
def create_user(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(User).filter(User.email == data.get("email")).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=data.get("email"),
        first_name=data.get("first_name", ""),
        last_name=data.get("last_name", ""),
        hashed_password=get_password_hash(data.get("password", "password123")),
        role=data.get("role", "fresher"),
        department=data.get("department"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {
        "id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role,
    }


@router.post("/bulk/assign-mentor")
def bulk_assign(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.fresher import Fresher
    fresher_ids = data.get("fresher_ids", [])
    mentor_id = data.get("mentor_id")
    count = 0
    for fid in fresher_ids:
        fresher = db.query(Fresher).filter(Fresher.id == int(fid)).first()
        if fresher:
            fresher.mentor_id = int(mentor_id)
            count += 1
    db.commit()
    return {"updated": count}


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.fresher import Fresher
    from app.models.assessment import Assessment, Submission
    return {
        "total_users": db.query(User).count(),
        "total_freshers": db.query(Fresher).count(),
        "total_assessments": db.query(Assessment).count(),
        "total_submissions": db.query(Submission).count(),
        "system_status": "healthy",
    }


@router.post("/seed-data")
def seed_data(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.seed import seed_database
    seed_database(db)
    return {"status": "success", "message": "Test data seeded successfully"}
