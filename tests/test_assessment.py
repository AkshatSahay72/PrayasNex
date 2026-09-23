import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database.db import Base
from backend.app.models.schema import Student, Concept, Question, StudentConceptProgress
from backend.app.schemas.api_models import AssessmentSubmissionRequest, QuestionAnswer
from backend.app.services.assessment_service import AssessmentService


@pytest.fixture
def assessment_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()

    student = Student(id="demo-user", name="Alex Demo", email="alex@test.com")
    c = Concept(id="ml.optimization.gradient", topic_id="t1", name="Gradient", order_index=1)

    q1 = Question(
        id="q1",
        concept_id=c.id,
        question_text="What is the gradient?",
        options=[{"id": "A", "text": "Steepest ascent"}, {"id": "B", "text": "Steepest descent"}, {"id": "C", "text": "Zero vector"}, {"id": "D", "text": "Hessian"}],
        correct_option="A",
        explanation="Gradient points toward steepest ascent.",
        difficulty="easy",
        is_validated=True
    )

    q2 = Question(
        id="q2",
        concept_id=c.id,
        question_text="In which direction do we step to minimize loss?",
        options=[{"id": "A", "text": "Negative gradient"}, {"id": "B", "text": "Positive gradient"}, {"id": "C", "text": "Perpendicular"}, {"id": "D", "text": "Random"}],
        correct_option="A",
        explanation="We step opposite to the gradient to descend.",
        difficulty="easy",
        is_validated=True
    )

    db.add_all([student, c, q1, q2])
    db.commit()

    yield db
    db.close()


def test_secure_questions_hide_answers(assessment_db):
    """Verifies that active assessment queries do not leak correct_option or explanation."""
    questions = AssessmentService.get_assessment_questions(
        db=assessment_db,
        concept_id="ml.optimization.gradient"
    )

    assert len(questions) == 2
    for q in questions:
        # Check that SecureQuestionResponse model has no correct_option or explanation fields
        q_dict = q.model_dump()
        assert "correct_option" not in q_dict
        assert "explanation" not in q_dict
        assert len(q.options) == 4
        assert q.question_text is not None


def test_assessment_submission_and_evaluation(assessment_db):
    """Submits 1 correct and 1 incorrect answer -> score = 50% -> 'needs_practice'."""
    sub_req = AssessmentSubmissionRequest(
        student_id="demo-user",
        concept_id="ml.optimization.gradient",
        answers=[
            QuestionAnswer(question_id="q1", selected_option="A"),  # Correct
            QuestionAnswer(question_id="q2", selected_option="B")   # Incorrect (Correct is A)
        ]
    )

    result = AssessmentService.submit_and_evaluate_assessment(db=assessment_db, submission=sub_req)

    assert result.total_questions == 2
    assert result.correct_answers == 1
    assert result.score_percentage == 50.0
    assert result.status == "needs_practice"
    assert len(result.items) == 2

    # Post-submission feedback includes explanations
    assert result.items[0].is_correct is True
    assert result.items[0].correct_option == "A"
    assert result.items[1].is_correct is False
    assert result.items[1].correct_option == "A"

    # Progress record is saved in DB
    progress = (
        assessment_db.query(StudentConceptProgress)
        .filter(StudentConceptProgress.student_id == "demo-user")
        .first()
    )
    assert progress is not None
    assert progress.attempts_count == 2
    assert progress.correct_count == 1
    assert progress.mastery_score == 0.50
