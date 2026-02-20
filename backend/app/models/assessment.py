from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, func
from app.database import Base


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    assessment_type = Column(String, nullable=False)  # quiz, code, assignment
    time_limit_minutes = Column(Integer, default=60)
    max_score = Column(Integer, default=100)
    passing_score = Column(Integer, default=60)
    max_attempts = Column(Integer, default=3)
    instructions = Column(Text, nullable=True)
    module_id = Column(Integer, nullable=True)
    weight = Column(Float, default=1.0)
    rubric = Column(Text, nullable=True)  # JSON string
    starter_code = Column(Text, nullable=True)
    test_cases = Column(Text, nullable=True)  # JSON string
    questions = Column(Text, nullable=True)  # JSON string
    skills_assessed = Column(Text, nullable=True)  # JSON string
    language = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_published = Column(Boolean, default=True)
    available_from = Column(String, nullable=True)
    available_until = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    submission_type = Column(String, nullable=False)  # quiz, code
    code = Column(Text, nullable=True)
    language = Column(String, nullable=True)
    answers = Column(Text, nullable=True)  # JSON string
    score = Column(Float, nullable=True)
    max_score = Column(Integer, default=100)
    passing_score = Column(Integer, default=60)
    pass_status = Column(String, nullable=True)  # pass, fail
    status = Column(String, default="pending")  # pending, grading, graded, completed, failed
    feedback = Column(Text, nullable=True)  # JSON string
    test_results = Column(Text, nullable=True)  # JSON string
    trace_id = Column(String, nullable=True, index=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    graded_at = Column(DateTime(timezone=True), nullable=True)
