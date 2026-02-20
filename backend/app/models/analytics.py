from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class PerformanceAnalytics(Base):
    """Tracks performance metrics for freshers and cohorts."""
    __tablename__ = "performance_analytics"

    id = Column(Integer, primary_key=True, index=True)
    fresher_id = Column(Integer, ForeignKey("freshers.id"), index=True)
    
    # Aggregated metrics
    overall_score = Column(Float, default=0)  # Average across all assessments
    quiz_average = Column(Float, default=0)
    assessment_count = Column(Integer, default=0)
    passed_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    pass_rate = Column(Float, default=0)  # percentage
    
    # Skill breakdown
    skills_breakdown = Column(JSON, default={})  # {"Python": 85, "SQL": 90, ...}
    
    # Trend analysis
    score_trend = Column(JSON, default={})  # {"week1": 75, "week2": 78, ...}
    improvement_rate = Column(Float, default=0)  # Percentage improvement
    
    # Time metrics
    avg_time_spent = Column(Float, default=0)  # Minutes
    completion_rate = Column(Float, default=0)  # Percentage
    
    # Risk assessment
    risk_level = Column(String(20), default="low")  # low, medium, high
    risk_score = Column(Float, default=0)
    
    # Engagement
    engagement_score = Column(Float, default=0)
    last_assessment_date = Column(DateTime)
    
    # Comparison data
    cohort_rank = Column(Integer, nullable=True)
    cohort_percentile = Column(Float, nullable=True)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    fresher = relationship("Fresher", back_populates="performance_analytics")
