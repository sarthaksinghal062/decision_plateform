from sqlalchemy import Column, String, DateTime, Integer, Float, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base
import uuid

class Decision(Base):
    __tablename__ = "decisions"
    id         = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title      = Column(String, nullable=False)
    status     = Column(String, default="draft")
    created_at = Column(DateTime, server_default=func.now())

class Criterion(Base):
    __tablename__ = "criteria"
    id          = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    decision_id = Column(String, ForeignKey("decisions.id", ondelete="CASCADE"))
    name        = Column(String, nullable=False)
    weight      = Column(Float, nullable=True)
    position    = Column(Integer, default=0)

class Comparison(Base):
    __tablename__ = "comparisons"
    id          = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    decision_id = Column(String, ForeignKey("decisions.id", ondelete="CASCADE"))
    criterion_a = Column(String, ForeignKey("criteria.id"))
    criterion_b = Column(String, ForeignKey("criteria.id"))
    winner      = Column(String)
    value       = Column(Float, nullable=False, default=1.0)

class Option(Base):
    __tablename__ = "options"
    id          = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    decision_id = Column(String, ForeignKey("decisions.id", ondelete="CASCADE"))
    name        = Column(String, nullable=False)
    final_score = Column(Float, nullable=True)

class Rating(Base):
    __tablename__ = "ratings"
    id           = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    option_id    = Column(String, ForeignKey("options.id", ondelete="CASCADE"))
    criterion_id = Column(String, ForeignKey("criteria.id", ondelete="CASCADE"))
    score        = Column(Integer)
    __table_args__ = (UniqueConstraint("option_id", "criterion_id"),)