import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.app.models.schema import (
    Student,
    Concept,
    Question,
    Attempt,
    StudentConceptProgress
)
from backend.app.schemas.api_models import (
    SecureQuestionResponse,
    OptionItem,
    AssessmentSubmissionRequest,
    AssessmentSubmissionResult,
    QuestionEvaluationItem,
    RecommendationItem
)
from backend.app.services.adaptive_service import AdaptiveService


class AssessmentService:
    """
    Manages secure assessments, answer evaluation, progress updates,
    and post-assessment feedback without exposing answers beforehand.
    """

    @classmethod
    def get_assessment_questions(
        cls,
        db: Session,
        concept_id: str,
        limit: int = 5
    ) -> List[SecureQuestionResponse]:
        """
        Fetches questions for a concept and sanitizes them:
        STRIPS correct_option and explanation to prevent answer leakage in the browser.
        """
        concept = db.query(Concept).filter(Concept.id == concept_id).first()
        if not concept:
            raise ValueError(f"Concept '{concept_id}' does not exist.")

        questions = (
            db.query(Question)
            .filter(Question.concept_id == concept_id, Question.is_validated == True)
            .limit(limit)
            .all()
        )

        secure_list = []
        for q in questions:
            # Parse options ensuring clean structure
            options_data = q.options if isinstance(q.options, list) else []
            parsed_options = [
                OptionItem(id=opt.get("id", ""), text=opt.get("text", ""))
                for opt in options_data
                if isinstance(opt, dict)
            ]

            secure_list.append(
                SecureQuestionResponse(
                    id=q.id,
                    concept_id=q.concept_id,
                    concept_name=concept.name,
                    question_text=q.question_text,
                    options=parsed_options,
                    difficulty=q.difficulty or "medium"
                )
            )

        return secure_list

    @classmethod
    def submit_and_evaluate_assessment(
        cls,
        db: Session,
        submission: AssessmentSubmissionRequest
    ) -> AssessmentSubmissionResult:
        """
        Securely evaluates submitted student answers on the backend,
        records individual attempts, recalculates concept progress,
        and derives the adaptive recommendation.
        """
        student = db.query(Student).filter(Student.id == submission.student_id).first()
        if not student:
            # Auto-provision student if not existing for smooth prototype demo
            student = Student(id=submission.student_id, name="Demo Student", email="student@example.com")
            db.add(student)
            db.flush()

        concept = db.query(Concept).filter(Concept.id == submission.concept_id).first()
        if not concept:
            raise ValueError(f"Concept '{submission.concept_id}' not found.")

        submission_id = f"sub-{uuid.uuid4().hex[:10]}"
        evaluation_items: List[QuestionEvaluationItem] = []
        total_questions = len(submission.answers)
        correct_count = 0

        # Process each answer
        for ans in submission.answers:
            question = db.query(Question).filter(Question.id == ans.question_id).first()
            if not question:
                continue

            is_correct = (ans.selected_option.strip().upper() == question.correct_option.strip().upper())
            if is_correct:
                correct_count += 1

            # Save attempt record
            attempt = Attempt(
                id=f"att-{uuid.uuid4().hex[:12]}",
                student_id=submission.student_id,
                question_id=question.id,
                concept_id=submission.concept_id,
                selected_option=ans.selected_option.strip().upper(),
                is_correct=is_correct,
                created_at=datetime.now(timezone.utc)
            )
            db.add(attempt)

            # Build evaluation item for result view
            options_data = question.options if isinstance(question.options, list) else []
            parsed_options = [
                OptionItem(id=opt.get("id", ""), text=opt.get("text", ""))
                for opt in options_data
                if isinstance(opt, dict)
            ]

            evaluation_items.append(
                QuestionEvaluationItem(
                    question_id=question.id,
                    question_text=question.question_text,
                    options=parsed_options,
                    selected_option=ans.selected_option.strip().upper(),
                    correct_option=question.correct_option.strip().upper(),
                    is_correct=is_correct,
                    explanation=question.explanation
                )
            )

        # Calculate current test score
        score_percentage = (correct_count / total_questions * 100.0) if total_questions > 0 else 0.0
        status = AdaptiveService.evaluate_score_status(score_percentage)

        # Update or create StudentConceptProgress
        progress = (
            db.query(StudentConceptProgress)
            .filter(
                StudentConceptProgress.student_id == submission.student_id,
                StudentConceptProgress.concept_id == submission.concept_id
            )
            .first()
        )

        if not progress:
            progress = StudentConceptProgress(
                id=f"prog-{uuid.uuid4().hex[:12]}",
                student_id=submission.student_id,
                concept_id=submission.concept_id,
                attempts_count=total_questions,
                correct_count=correct_count,
                mastery_score=score_percentage / 100.0,
                status=status,
                last_updated=datetime.now(timezone.utc)
            )
            db.add(progress)
        else:
            # Update cumulative mastery with weighted recent evidence
            progress.attempts_count += total_questions
            progress.correct_count += correct_count
            progress.mastery_score = score_percentage / 100.0
            progress.status = status
            progress.last_updated = datetime.now(timezone.utc)

        db.commit()

        # Generate targeted adaptive recommendation
        recommendation = AdaptiveService.generate_recommendation(
            db=db,
            student_id=submission.student_id,
            concept_id=submission.concept_id,
            current_score_pct=score_percentage
        )

        return AssessmentSubmissionResult(
            submission_id=submission_id,
            student_id=submission.student_id,
            concept_id=submission.concept_id,
            concept_name=concept.name,
            total_questions=total_questions,
            correct_answers=correct_count,
            score_percentage=round(score_percentage, 1),
            status=status,
            items=evaluation_items,
            recommendation=recommendation
        )
