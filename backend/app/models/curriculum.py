from sqlalchemy import Column, Integer, String, Text, DateTime, func
from app.database import Base


class Curriculum(Base):
    __tablename__ = "curricula"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    duration_weeks = Column(Integer, default=12)
    modules = Column(Text, nullable=True)  # JSON string of CurriculumModule[]
    created_at = Column(DateTime(timezone=True), server_default=func.now())
