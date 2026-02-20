"""Run database seeding"""
from app.database import SessionLocal
from app.seed import seed_database

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()