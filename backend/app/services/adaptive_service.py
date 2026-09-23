from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.models.schema import Concept, StudentConceptProgress, Note, Topic
from backend.app.schemas.api_models import RecommendationItem


class AdaptiveService:
    """
    Deterministic rule engine for adaptive learning.
    Translates student performance evidence into next learning actions.
    No LLM or complex black-box logic is used for pedagogical routing.
    """

    @classmethod
    def evaluate_score_status(cls, score_percentage: float) -> str:
        """
        Determines the mastery classification based on score percentage.
        Thresholds are configurable in backend settings.
        """
        # score_percentage is between 0.0 and 1.0 or 0 and 100
        normalized_score = score_percentage / 100.0 if score_percentage > 1.0 else score_percentage

        if normalized_score < settings.WEAK_THRESHOLD:
            return "weak"
        elif normalized_score < settings.STRONG_THRESHOLD:
            return "needs_practice"
        else:
            return "strong"

    @classmethod
    def generate_recommendation(
        cls,
        db: Session,
        student_id: str,
        concept_id: str,
        current_score_pct: Optional[float] = None
    ) -> RecommendationItem:
        """
        Computes the adaptive recommendation for a student on a specific concept.
        Considers prerequisite knowledge dependencies and current mastery status.
        """
        concept = db.query(Concept).filter(Concept.id == concept_id).first()
        if not concept:
            raise ValueError(f"Concept '{concept_id}' not found.")

        # Determine status from current score if provided, else from stored progress
        if current_score_pct is not None:
            status = cls.evaluate_score_status(current_score_pct)
        else:
            progress = (
                db.query(StudentConceptProgress)
                .filter(
                    StudentConceptProgress.student_id == student_id,
                    StudentConceptProgress.concept_id == concept_id
                )
                .first()
            )
            status = progress.status if progress else "not_started"

        # Check for study note
        note = db.query(Note).filter(Note.concept_id == concept_id).first()
        note_id = note.id if note else None

        # Scenario 1: Weak Performance (< 50%)
        if status in ("weak", "not_started"):
            # Check if concept has a prerequisite
            if concept.prerequisite_concept_id:
                prereq = db.query(Concept).filter(Concept.id == concept.prerequisite_concept_id).first()
                prereq_progress = (
                    db.query(StudentConceptProgress)
                    .filter(
                        StudentConceptProgress.student_id == student_id,
                        StudentConceptProgress.concept_id == concept.prerequisite_concept_id
                    )
                    .first()
                )

                prereq_weak = (
                    prereq_progress is None or
                    prereq_progress.status == "weak" or
                    prereq_progress.mastery_score < settings.WEAK_THRESHOLD
                )

                if prereq and prereq_weak:
                    prereq_note = db.query(Note).filter(Note.concept_id == prereq.id).first()
                    return RecommendationItem(
                        student_id=student_id,
                        concept_id=concept.id,
                        concept_name=concept.name,
                        status="weak",
                        action_type="review_prerequisite",
                        title=f"Review Foundation: {prereq.name}",
                        recommendation=(
                            f"Your performance indicates foundational gaps in the prerequisite concept '{prereq.name}'. "
                            f"We strongly recommend reviewing '{prereq.name}' before continuing with '{concept.name}'."
                        ),
                        reason=f"Prerequisite '{prereq.name}' has not reached target mastery threshold ({int(settings.WEAK_THRESHOLD*100)}%).",
                        recommended_note_id=prereq_note.id if prereq_note else None,
                        prerequisite_concept_id=prereq.id,
                        prerequisite_concept_name=prereq.name
                    )

            # Prerequisite is strong or absent: review current concept
            return RecommendationItem(
                student_id=student_id,
                concept_id=concept.id,
                concept_name=concept.name,
                status="weak",
                action_type="review_concept",
                title=f"Focus Review: {concept.name}",
                recommendation=(
                    f"You scored below {int(settings.WEAK_THRESHOLD*100)}% on '{concept.name}'. "
                    f"Take 5 minutes to read the personalized learning note and practice again to solidify core intuition."
                ),
                reason="Current concept accuracy is in the weak mastery zone.",
                recommended_note_id=note_id
            )

        # Scenario 2: Needs Practice (50% - 79%)
        elif status == "needs_practice":
            return RecommendationItem(
                student_id=student_id,
                concept_id=concept.id,
                concept_name=concept.name,
                status="needs_practice",
                action_type="practice_more",
                title=f"Strengthen Skills: {concept.name}",
                recommendation=(
                    f"Good effort! You're making progress on '{concept.name}' ({int(current_score_pct or 60)}%). "
                    f"Complete another quick practice set to reach the {int(settings.STRONG_THRESHOLD*100)}% mastery threshold."
                ),
                reason="Performance is developing but requires reinforcement to reach high mastery.",
                recommended_note_id=note_id
            )

        # Scenario 3: Strong (80% - 100%)
        else:
            # Find next concept in sequence
            next_concept = (
                db.query(Concept)
                .filter(
                    Concept.topic_id == concept.topic_id,
                    Concept.order_index > concept.order_index
                )
                .order_index_by(Concept.order_index.asc()) if hasattr(Concept, "order_index_by") else
                db.query(Concept)
                .filter(
                    Concept.topic_id == concept.topic_id,
                    Concept.order_index > concept.order_index
                )
                .order_by(Concept.order_index.asc())
            ).first()

            if next_concept:
                next_note = db.query(Note).filter(Note.concept_id == next_concept.id).first()
                return RecommendationItem(
                    student_id=student_id,
                    concept_id=concept.id,
                    concept_name=concept.name,
                    status="strong",
                    action_type="advance_next",
                    title=f"Mastery Achieved! Advance to {next_concept.name}",
                    recommendation=(
                        f"Outstanding mastery on '{concept.name}'! "
                        f"You are ready to advance to the next concept: '{next_concept.name}'."
                    ),
                    reason="Mastery threshold reached (>= 80%). Ready for higher-order concepts.",
                    recommended_note_id=next_note.id if next_note else None
                )
            else:
                return RecommendationItem(
                    student_id=student_id,
                    concept_id=concept.id,
                    concept_name=concept.name,
                    status="strong",
                    action_type="advance_next",
                    title="Topic Complete!",
                    recommendation=(
                        f"Congratulations! You have demonstrated high mastery across all concepts in this topic. "
                        f"Explore more advanced topics in the curriculum!"
                    ),
                    reason="Completed all sequential concepts in the current topic module.",
                    recommended_note_id=note_id
                )

    @classmethod
    def get_overall_student_recommendation(
        cls,
        db: Session,
        student_id: str
    ) -> Optional[RecommendationItem]:
        """
        Finds the highest priority concept requiring attention for a student.
        Weak concepts are prioritized first, followed by in-progress ones.
        """
        # Look for weakest concept progress first
        weakest = (
            db.query(StudentConceptProgress)
            .filter(
                StudentConceptProgress.student_id == student_id,
                StudentConceptProgress.status == "weak"
            )
            .order_by(StudentConceptProgress.mastery_score.asc(), StudentConceptProgress.last_updated.desc())
            .first()
        )

        if weakest:
            return cls.generate_recommendation(
                db,
                student_id=student_id,
                concept_id=weakest.concept_id,
                current_score_pct=weakest.mastery_score * 100.0
            )

        # Next look for concepts needing practice
        needs_practice = (
            db.query(StudentConceptProgress)
            .filter(
                StudentConceptProgress.student_id == student_id,
                StudentConceptProgress.status == "needs_practice"
            )
            .order_by(StudentConceptProgress.mastery_score.asc())
            .first()
        )

        if needs_practice:
            return cls.generate_recommendation(
                db,
                student_id=student_id,
                concept_id=needs_practice.concept_id,
                current_score_pct=needs_practice.mastery_score * 100.0
            )

        # Fallback to first available concept in database
        first_concept = db.query(Concept).order_by(Concept.order_index.asc()).first()
        if first_concept:
            return cls.generate_recommendation(
                db,
                student_id=student_id,
                concept_id=first_concept.id
            )

        return None
