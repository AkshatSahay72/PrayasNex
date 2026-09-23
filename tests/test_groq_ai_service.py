import pytest
from unittest.mock import patch
from backend.app.services.ai.groq_service import GroqService
from backend.app.services.ai.question_generator import QuestionGenerator
from backend.app.services.ai.note_generator import NoteGenerator


def test_groq_service_unconfigured_fallback():
    """When GROQ_API_KEY is unset, GroqService gracefully returns None without error."""
    with patch("backend.app.services.ai.groq_service.settings.GROQ_API_KEY", ""):
        assert GroqService.is_configured() is False
        res = GroqService.generate_chat_completion("System prompt", "User prompt")
        assert res is None


def test_question_generator_serves_fallback_on_empty_groq():
    """Ensures question generator returns a valid pre-tested question when Groq is not configured."""
    with patch("backend.app.services.ai.groq_service.settings.GROQ_API_KEY", ""):
        q, is_ai, msg = QuestionGenerator.generate(
            concept_id="ml.optimization.gradient_descent",
            concept_name="Gradient Descent"
        )
        assert q is not None
        assert is_ai is False
        assert len(q.options) == 4
        assert q.concept_id == "ml.optimization.gradient_descent"
        assert q.is_validated is True


def test_question_generator_validates_and_accepts_valid_groq_output():
    """Ensures valid JSON from Groq is parsed and passes ExamBuddy validation."""
    mock_json = """{
      "question": "What is the primary role of learning rate in gradient descent?",
      "options": [
        {"id": "A", "text": "Scales the step size taken along the negative gradient vector"},
        {"id": "B", "text": "Determines the total number of layers in neural networks"},
        {"id": "C", "text": "Calculates the curvature of the level curve at minimum"},
        {"id": "D", "text": "Replaces backpropagation with analytical matrix inversion"}
      ],
      "correct_option": "A",
      "explanation": "Alpha scales the gradient magnitude to dictate parameter update jump sizes.",
      "concept_id": "ml.optimization.learning_rate",
      "difficulty": "medium"
    }"""

    with patch.object(GroqService, "generate_chat_completion", return_value=mock_json):
        q, is_ai, msg = QuestionGenerator.generate(
            concept_id="ml.optimization.learning_rate",
            concept_name="Learning Rate"
        )
        assert q is not None
        assert is_ai is True
        assert q.correct_option == "A"
        assert q.is_validated is True


def test_question_generator_rejects_exambuddy_failure_from_groq_and_falls_back():
    """Ensures malformed or flawed output from Groq (e.g. length anomaly) is rejected and fallback is served."""
    flawed_groq_output = """{
      "question": "What is gradient descent?",
      "options": [
        {"id": "A", "text": "An optimization algorithm that iteratively updates model parameter weights by calculating the partial derivatives of the objective loss function and subtracting the scaled gradient to descend toward the global loss minimum"},
        {"id": "B", "text": "A dataset format"},
        {"id": "C", "text": "A metric"},
        {"id": "D", "text": "A label"}
      ],
      "correct_option": "A",
      "explanation": "Iterative optimization.",
      "concept_id": "ml.optimization.gradient_descent",
      "difficulty": "easy"
    }"""

    with patch.object(GroqService, "generate_chat_completion", return_value=flawed_groq_output):
        q, is_ai, msg = QuestionGenerator.generate(
            concept_id="ml.optimization.gradient_descent",
            concept_name="Gradient Descent"
        )
        # Should reject the flawed Groq response and serve high quality fallback
        assert is_ai is False
        assert q is not None
        assert q.is_validated is True


def test_note_generator_fallback_and_groq_flow():
    """Ensures NoteGenerator returns structured markdown both via Groq and fallback."""
    # 1. Fallback mode
    with patch("backend.app.services.ai.groq_service.settings.GROQ_API_KEY", ""):
        note = NoteGenerator.generate_personalized_note(
            concept_id="ml.optimization.learning_rate",
            concept_name="Learning Rate",
            student_name="Alex"
        )
        assert note is not None
        assert "Personalized Review" in note.title or "Learning Rate" in note.title
        assert len(note.markdown_content) > 100

    # 2. Mock Groq mode
    mock_md = "# Learning Rate Guide\n\nLearning rate controls step size $\\alpha$."
    with patch.object(GroqService, "generate_chat_completion", return_value=mock_md * 5):
        note = NoteGenerator.generate_personalized_note(
            concept_id="ml.optimization.learning_rate",
            concept_name="Learning Rate",
            student_name="Alex"
        )
        assert note.is_ai_generated is True
        assert "Learning Rate" in note.markdown_content
