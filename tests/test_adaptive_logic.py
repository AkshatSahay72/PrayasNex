import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database.db import Base
from backend.app.models.schema import Student, Subject, Topic, Concept, StudentConceptProgress, Note
from backend.app.services.adaptive_service import AdaptiveService


@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()

    # Seed minimal topology
    student = Student(id="s1", name="Test Student", email="s1@test.com")
    subj = Subject(id="s.ml", name="Machine Learning")
    top = Topic(id="t.opt", subject_id="s.ml", name="Optimization", order_index=1)
    c1 = Concept(id="c.grad", topic_id="t.opt", name="Gradient", order_index=1, prerequisite_concept_id=None)
    c2 = Concept(id="c.lr", topic_id="t.opt", name="Learning Rate", order_index=2, prerequisite_concept_id="c.grad")
    c3 = Concept(id="c.gd", topic_id="t.opt", name="Gradient Descent", order_index=3, prerequisite_concept_id="c.lr")

    n1 = Note(id="n1", concept_id="c.grad", title="Gradient Note", markdown_content="# Gradient")
    n2 = Note(id="n2", concept_id="c.lr", title="Learning Rate Note", markdown_content="# LR")
    n3 = Note(id="n3", concept_id="c.gd", title="GD Note", markdown_content="# GD")

    db.add_all([student, subj, top, c1, c2, c3, n1, n2, n3])
    db.commit()

    yield db
    db.close()


def test_score_status_classification():
    assert AdaptiveService.evaluate_score_status(0.20) == "weak"
    assert AdaptiveService.evaluate_score_status(0.49) == "weak"
    assert AdaptiveService.evaluate_score_status(0.50) == "needs_practice"
    assert AdaptiveService.evaluate_score_status(0.79) == "needs_practice"
    assert AdaptiveService.evaluate_score_status(0.80) == "strong"
    assert AdaptiveService.evaluate_score_status(1.00) == "strong"


def test_weak_concept_with_weak_prerequisite_recommends_prerequisite(test_db):
    """If student fails on Concept 2 (Learning Rate) and hasn't mastered Concept 1 (Gradient), recommend Gradient first!"""
    # Student has weak progress on prerequisite
    p_prereq = StudentConceptProgress(
        id="p1",
        student_id="s1",
        concept_id="c.grad",
        attempts_count=5,
        correct_count=1,
        mastery_score=0.20,
        status="weak"
    )
    test_db.add(p_prereq)
    test_db.commit()

    # Now evaluate recommendation for concept 2 with weak score (30%)
    rec = AdaptiveService.generate_recommendation(
        db=test_db,
        student_id="s1",
        concept_id="c.lr",
        current_score_pct=30.0
    )

    assert rec.action_type == "review_prerequisite"
    assert rec.prerequisite_concept_id == "c.grad"
    assert "Gradient" in rec.title


def test_weak_concept_with_strong_prerequisite_recommends_concept_note(test_db):
    """If student fails on Concept 2, but has strong mastery on Concept 1, recommend Concept 2 note."""
    p_prereq = StudentConceptProgress(
        id="p1",
        student_id="s1",
        concept_id="c.grad",
        attempts_count=5,
        correct_count=5,
        mastery_score=1.0,
        status="strong"
    )
    test_db.add(p_prereq)
    test_db.commit()

    rec = AdaptiveService.generate_recommendation(
        db=test_db,
        student_id="s1",
        concept_id="c.lr",
        current_score_pct=40.0
    )

    assert rec.action_type == "review_concept"
    assert rec.concept_id == "c.lr"
    assert "Learning Rate" in rec.title


def test_strong_concept_recommends_next_concept(test_db):
    """If student achieves 100% on Concept 1, recommend advancing to Concept 2."""
    rec = AdaptiveService.generate_recommendation(
        db=test_db,
        student_id="s1",
        concept_id="c.grad",
        current_score_pct=100.0
    )

    assert rec.action_type == "advance_next"
    assert "Advance to Learning Rate" in rec.title
