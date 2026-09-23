import pytest
from backend.app.validators.question_validator import QuestionValidator


def test_valid_question_passes():
    valid_q = {
        "question": "What is the primary role of the gradient vector in multivariable optimization?",
        "options": [
            {"id": "A", "text": "Points in the direction of steepest rate of increase"},
            {"id": "B", "text": "Specifies the global maximum curvature of contours"},
            {"id": "C", "text": "Determines the orthogonal normal vector at boundary"},
            {"id": "D", "text": "Calculates the average integral across sample space"}
        ],
        "correct_option": "A",
        "explanation": "The gradient vector contains first-order partial derivatives pointing toward the steepest ascent.",
        "concept_id": "ml.optimization.gradient",
        "difficulty": "medium"
    }
    is_valid, errors = QuestionValidator.validate(valid_q, expected_concept_id="ml.optimization.gradient")
    assert is_valid is True
    assert len(errors) == 0


def test_exambuddy_length_anomaly_fails():
    """Protects against ExamBuddy Problem 1: Correct answer is artificially verbose/revealing."""
    bad_q = {
        "question": "What is learning rate in gradient descent?",
        "options": [
            {"id": "A", "text": "A step size hyperparameter that dictates how large of a jump parameters take in the negative gradient direction during iterative optimization updates to reach minimum loss"},
            {"id": "B", "text": "A dataset feature"},
            {"id": "C", "text": "A loss metric"},
            {"id": "D", "text": "An epoch counter"}
        ],
        "correct_option": "A",
        "explanation": "Learning rate is the step size.",
        "concept_id": "ml.optimization.learning_rate",
        "difficulty": "easy"
    }
    is_valid, errors = QuestionValidator.validate(bad_q)
    assert is_valid is False
    assert any("length failure" in err.lower() for err in errors)


def test_exambuddy_lazy_distractor_fails():
    """Protects against ExamBuddy Problem 2 & 3: Absurd or lazy distractors like 'All of the above'."""
    lazy_q = {
        "question": "Why is gradient descent used in machine learning?",
        "options": [
            {"id": "A", "text": "To minimize the loss function iteratively"},
            {"id": "B", "text": "To format tabular data into csv"},
            {"id": "C", "text": "All of the above"},
            {"id": "D", "text": "None of these"}
        ],
        "correct_option": "A",
        "explanation": "Gradient descent minimizes objective loss functions.",
        "concept_id": "ml.optimization.gradient_descent",
        "difficulty": "medium"
    }
    is_valid, errors = QuestionValidator.validate(lazy_q)
    assert is_valid is False
    assert any("lazy option" in err.lower() for err in errors)


def test_duplicate_options_fail():
    """Protects against duplicate option text."""
    dup_q = {
        "question": "What is the update rule for gradient descent?",
        "options": [
            {"id": "A", "text": "w = w - alpha * grad"},
            {"id": "B", "text": "w = w - alpha * grad"},
            {"id": "C", "text": "w = w + alpha * grad"},
            {"id": "D", "text": "w = w / grad"}
        ],
        "correct_option": "A",
        "explanation": "Update rule subtracts scaled gradient.",
        "concept_id": "ml.optimization.gradient_descent",
        "difficulty": "medium"
    }
    is_valid, errors = QuestionValidator.validate(dup_q)
    assert is_valid is False
    assert any("duplicate option" in err.lower() for err in errors)


def test_concept_mismatch_fails():
    """Protects against ExamBuddy Problem 5: Topic/concept mismatch."""
    mismatched_q = {
        "question": "What is the derivative of x squared?",
        "options": [
            {"id": "A", "text": "2x"},
            {"id": "B", "text": "x"},
            {"id": "C", "text": "3x"},
            {"id": "D", "text": "x^3"}
        ],
        "correct_option": "A",
        "explanation": "d/dx(x^2) = 2x.",
        "concept_id": "ml.optimization.gradient",
        "difficulty": "easy"
    }
    is_valid, errors = QuestionValidator.validate(mismatched_q, expected_concept_id="ml.optimization.gradient_descent")
    assert is_valid is False
    assert any("concept id mismatch" in err.lower() for err in errors)
