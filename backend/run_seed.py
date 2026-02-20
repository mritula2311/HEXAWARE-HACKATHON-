"""Run database seeding"""
from app.database import SessionLocal, create_tables
from app.seed import seed_database

if __name__ == "__main__":
    # Create tables first
    create_tables()
    print("[Init] Database tables created")

    # Then seed data
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()