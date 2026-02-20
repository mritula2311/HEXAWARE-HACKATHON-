from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Badge(Base):
    """Skill badges earned by freshers based on assessment performance."""
    __tablename__ = "badge"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)  # e.g., "Python Master", "SQL Expert"
    description = Column(String(500))
    icon_url = Column(String(500))
    skill_name = Column(String(100))  # Associated skill
    min_score = Column(Float, default=80)  # Minimum score to earn badge
    color = Column(String(50), default="blue")  # Badge color for UI

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    fresher_badges = relationship("FresherBadge", back_populates="badge", cascade="all, delete-orphan")


class FresherBadge(Base):
    """Junction table: Tracks badges earned by freshers."""
    __tablename__ = "fresher_badge"

    id = Column(Integer, primary_key=True, index=True)
    fresher_id = Column(Integer, ForeignKey("freshers.id"), index=True)
    badge_id = Column(Integer, ForeignKey("badge.id"), index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=True)
    score_achieved = Column(Float)
    earned_at = Column(DateTime, default=datetime.utcnow)

    fresher = relationship("Fresher", back_populates="badges")
    badge = relationship("Badge", back_populates="fresher_badges")
    assessment = relationship("Assessment")
