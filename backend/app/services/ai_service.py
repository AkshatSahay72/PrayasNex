from typing import Tuple, Optional, List
from backend.app.schemas.api_models import QuestionDetail, NoteResponse
from backend.app.services.ai.question_generator import QuestionGenerator
from backend.app.services.ai.note_generator import NoteGenerator


class AIService:
    """
    Unified AI service layer routing to isolated Groq implementations.
    Guarantees validation, error handling, and zero downtime fallback.
    """

    @classmethod
    def generate_question(
        cls,
        concept_id: str,
        concept_name: str,
        subject: str = "Machine Learning",
        topic: str = "Optimization",
        difficulty: str = "medium",
        learning_objective: Optional[str] = None
    ) -> Tuple[QuestionDetail, bool, Optional[str]]:
        return QuestionGenerator.generate(
            concept_id=concept_id,
            concept_name=concept_name,
            subject=subject,
            topic=topic,
            difficulty=difficulty,
            learning_objective=learning_objective
        )

    @classmethod
    def generate_personalized_note(
        cls,
        concept_id: str,
        concept_name: str,
        student_name: str = "Student",
        weak_areas: Optional[List[str]] = None
    ) -> NoteResponse:
        return NoteGenerator.generate_personalized_note(
            concept_id=concept_id,
            concept_name=concept_name,
            student_name=student_name,
            weak_areas=weak_areas
        )
