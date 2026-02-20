from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from app.database import Base


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    fresher_id = Column(Integer, ForeignKey("freshers.id"), nullable=False, index=True)
    schedule_date = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, in_progress, completed
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ScheduleItem(Base):
    __tablename__ = "schedule_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    item_type = Column(String, nullable=False)  # reading, video, coding, assessment, project, quiz
    duration_minutes = Column(Integer, default=30)
    status = Column(String, default="pending")  # pending, in_progress, completed, skipped
    topic = Column(String, nullable=True)
    start_time = Column(String, nullable=True)
    end_time = Column(String, nullable=True)
    content = Column(String, nullable=True)  # Markdown or text content
    external_url = Column(String, nullable=True)  # For videos (YouTube/Loom) or external docs
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=True, index=True)
