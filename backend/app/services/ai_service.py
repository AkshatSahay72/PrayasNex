from typing import Tuple, Optional, List, Any
from sqlalchemy.orm import Session
from backend.app.schemas.api_models import QuestionDetail, NoteResponse, SubjectDetail, ConceptSummary
from backend.app.services.ai.question_generator import QuestionGenerator
from backend.app.services.ai.note_generator import NoteGenerator
from backend.app.services.ai.curriculum_generator import CurriculumGenerator


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

    @classmethod
    def generate_curriculum(
        cls,
        db: Session,
        subject_name: str,
        description: Optional[str] = None,
        num_topics: int = 3,
        concepts_per_topic: int = 2
    ) -> SubjectDetail:
        return CurriculumGenerator.generate_subject_curriculum(
            db=db,
            subject_name=subject_name,
            description=description,
            num_topics=num_topics,
            concepts_per_topic=concepts_per_topic
        )

    @classmethod
    def generate_concept(
        cls,
        db: Session,
        topic_id: str,
        concept_name_hint: str
    ) -> ConceptSummary:
        return CurriculumGenerator.generate_single_concept(
            db=db,
            topic_id=topic_id,
            concept_name_hint=concept_name_hint
        )

