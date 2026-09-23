import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    JSON
)
from sqlalchemy.orm import relationship
from database.db import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(String(128), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    email = Column(String(128), unique=True, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    attempts = relationship("Attempt", back_populates="student", cascade="all, delete-orphan")
    progress_records = relationship("StudentConceptProgress", back_populates="student", cascade="all, delete-orphan")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String(128), primary_key=True, index=True)
    name = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(64), nullable=True, default="BookOpen")

    topics = relationship("Topic", back_populates="subject", cascade="all, delete-orphan")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(String(256), primary_key=True, index=True)
    subject_id = Column(String(128), ForeignKey("subjects.id"), nullable=False, index=True)
    name = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)

    subject = relationship("Subject", back_populates="topics")
    concepts = relationship("Concept", back_populates="topic", cascade="all, delete-orphan")


class Concept(Base):
    __tablename__ = "concepts"

    # Stable ID format e.g. "ml.optimization.gradient_descent"
    id = Column(String(256), primary_key=True, index=True)
    topic_id = Column(String(256), ForeignKey("topics.id"), nullable=False, index=True)
    name = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)
    prerequisite_concept_id = Column(String(256), ForeignKey("concepts.id"), nullable=True)

    topic = relationship("Topic", back_populates="concepts")
    prerequisite = relationship("Concept", remote_side=[id], backref="dependents")
    questions = relationship("Question", back_populates="concept", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="concept", cascade="all, delete-orphan")
    progress_records = relationship("StudentConceptProgress", back_populates="concept", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(String(128), primary_key=True, index=True)
    concept_id = Column(String(256), ForeignKey("concepts.id"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    # Options stored as JSON array: [{"id": "A", "text": "foo"}, ...]
    options = Column(JSON, nullable=False)
    correct_option = Column(String(16), nullable=False)
    explanation = Column(Text, nullable=False)
    difficulty = Column(String(32), default="medium")  # easy, medium, hard
    is_ai_generated = Column(Boolean, default=False)
    is_validated = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    concept = relationship("Concept", back_populates="questions")
    attempts = relationship("Attempt", back_populates="question", cascade="all, delete-orphan")


class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(String(128), primary_key=True, index=True)
    student_id = Column(String(128), ForeignKey("students.id"), nullable=False, index=True)
    question_id = Column(String(128), ForeignKey("questions.id"), nullable=False, index=True)
    concept_id = Column(String(256), ForeignKey("concepts.id"), nullable=False, index=True)
    selected_option = Column(String(16), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("Student", back_populates="attempts")
    question = relationship("Question", back_populates="attempts")


class StudentConceptProgress(Base):
    __tablename__ = "student_concept_progress"

    id = Column(String(512), primary_key=True, index=True)
    student_id = Column(String(128), ForeignKey("students.id"), nullable=False, index=True)
    concept_id = Column(String(256), ForeignKey("concepts.id"), nullable=False, index=True)
    attempts_count = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    mastery_score = Column(Float, default=0.0)  # 0.0 - 1.0
    status = Column(String(32), default="not_started")  # weak, needs_practice, strong, not_started
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    student = relationship("Student", back_populates="progress_records")
    concept = relationship("Concept", back_populates="progress_records")


class Note(Base):
    __tablename__ = "notes"

    id = Column(String(512), primary_key=True, index=True)
    concept_id = Column(String(256), ForeignKey("concepts.id"), nullable=False, index=True)
    title = Column(String(256), nullable=False)
    markdown_content = Column(Text, nullable=False)
    is_ai_generated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    concept = relationship("Concept", back_populates="notes")

