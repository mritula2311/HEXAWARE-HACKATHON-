from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Certification(Base):
    """Track fresher certification progress and details."""
    __tablename__ = "certifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    fresher_id = Column(Integer, ForeignKey("freshers.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)  # e.g., "AWS Cloud Practitioner"
    provider = Column(String(100))  # e.g., "AWS", "Google", "Microsoft"
    status = Column(String(50), default="not_started")  # not_started, in_progress, completed, expired
    progress = Column(Float, default=0.0)  # 0-100%
    target_completion_date = Column(DateTime, nullable=True)
    completion_date = Column(DateTime, nullable=True)
    certification_url = Column(String(500), nullable=True)  # Learning resource URL
    certificate_url = Column(String(500), nullable=True)  # Certificate file/URL after completion
    notes = Column(Text, nullable=True)
    is_mandatory = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    fresher = relationship("Fresher", backref="certifications")


class AssignmentHistory(Base):
    """Track assignment submission history and iterations."""
    __tablename__ = "assignment_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False, index=True)
    fresher_id = Column(Integer, ForeignKey("freshers.id"), nullable=False, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False, index=True)
    version = Column(Integer, default=1)  # Track multiple submissions/revisions
    content = Column(Text)  # The assignment content
    status = Column(String(50))  # submitted, graded, revision_requested
    score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)  # JSON feedback
    submitted_at = Column(DateTime, default=datetime.utcnow)
    graded_at = Column(DateTime, nullable=True)

    # Relationships
    submission = relationship("Submission", backref="history")
    fresher = relationship("Fresher", backref="assignment_history")
    assessment = relationship("Assessment")
