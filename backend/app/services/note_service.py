from typing import Optional, List
from sqlalchemy.orm import Session
from backend.app.models.schema import Concept, Note, Student
from backend.app.schemas.api_models import NoteResponse
from backend.app.services.ai_service import AIService


class NoteService:
    """
    Handles retrieval and on-demand personalized generation of learning notes.
    """

    @classmethod
    def get_concept_note(
        cls,
        db: Session,
        concept_id: str
    ) -> Optional[NoteResponse]:
        """
        Retrieves the standard learning note for a concept.
        """
        concept = db.query(Concept).filter(Concept.id == concept_id).first()
        if not concept:
            return None

        note = db.query(Note).filter(Note.concept_id == concept_id).first()
        if note:
            return NoteResponse(
                id=note.id,
                concept_id=note.concept_id,
                concept_name=concept.name,
                title=note.title,
                markdown_content=note.markdown_content,
                is_ai_generated=note.is_ai_generated,
                created_at=note.created_at
            )

        # Fallback dynamic note if none seeded
        return NoteResponse(
            id=f"fallback-{concept.id}",
            concept_id=concept.id,
            concept_name=concept.name,
            title=f"Study Guide: {concept.name}",
            markdown_content=f"# {concept.name}\n\n{concept.description or 'Core machine learning optimization concept.'}",
            is_ai_generated=False
        )

    @classmethod
    def get_or_generate_personalized_note(
        cls,
        db: Session,
        concept_id: str,
        student_id: Optional[str] = None,
        focus_areas: Optional[List[str]] = None
    ) -> NoteResponse:
        """
        Generates or customizes a personalized note based on student's weak areas.
        """
        concept = db.query(Concept).filter(Concept.id == concept_id).first()
        if not concept:
            raise ValueError(f"Concept '{concept_id}' not found.")

        student_name = "Student"
        if student_id:
            student = db.query(Student).filter(Student.id == student_id).first()
            if student:
                student_name = student.name

        return AIService.generate_personalized_note(
            concept_id=concept_id,
            concept_name=concept.name,
            student_name=student_name,
            weak_areas=focus_areas
        )
