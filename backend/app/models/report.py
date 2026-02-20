from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, func
from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String, nullable=False)
    report_type = Column(String, nullable=False)  # individual, department, cohort, overall
    format = Column(String, default="pdf")  # pdf, csv, excel
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    file_path = Column(String, nullable=True)
    content = Column(Text, nullable=True)  # Stores JSON report data
    generated_at = Column(DateTime(timezone=True), server_default=func.now())


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    fresher_id = Column(Integer, ForeignKey("freshers.id"), nullable=False)
    fresher_name = Column(String, nullable=True)
    risk_level = Column(String, default="low")  # low, medium, high, critical
    risk_score = Column(Float, default=0.0)
    reason = Column(Text, nullable=True)
    status = Column(String, default="new")  # new, acknowledged, resolved
    created_at = Column(DateTime(timezone=True), server_default=func.now())
