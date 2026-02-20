from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class AssessmentSchedule(Base):
    """Schedule for assessment availability and deadlines."""
    __tablename__ = "assessment_schedule"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), index=True)
    fresher_id = Column(Integer, ForeignKey("freshers.id"), index=True, nullable=True)  # NULL = for all freshers
    
    scheduled_date = Column(DateTime, index=True)  # When assessment becomes available
    deadline = Column(DateTime, index=True)  # When assessment must be completed
    duration_minutes = Column(Integer)
    
    is_active = Column(Boolean, default=True)
    is_mandatory = Column(Boolean, default=False)
    reminder_sent = Column(Boolean, default=False)
    
    description = Column(Text)
    special_instructions = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    assessment = relationship("Assessment")
    fresher = relationship("Fresher", back_populates="assessment_schedules")
