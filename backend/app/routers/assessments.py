from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database.db import get_db
from backend.app.models.schema import Question, Concept
from backend.app.schemas.api_models import (
    SecureQuestionResponse,
    AssessmentSubmissionRequest,
    AssessmentSubmissionResult,
    GenerateQuestionRequest,
    QuestionDetail,
    AIQuestionValidationResult
)
from backend.app.services.assessment_service import AssessmentService
from backend.app.services.ai_service import AIService
from backend.app.validators.question_validator import QuestionValidator

router = APIRouter(prefix="/api/assessments", tags=["Assessments & Questions"])


@router.get("/questions", response_model=List[SecureQuestionResponse])
def get_assessment_questions(
    concept_id: str = Query(..., description="The structured concept ID e.g. 'ml.optimization.gradient_descent'"),
    limit: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db)
):
    """
    Returns questions for active assessment with CORRECT ANSWERS AND EXPLANATIONS STRIPPED.
    Frontend only receives options and question text.
    """
    try:
        return AssessmentService.get_assessment_questions(db=db, concept_id=concept_id, limit=limit)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/submit", response_model=AssessmentSubmissionResult)
def submit_assessment(
    submission: AssessmentSubmissionRequest,
    db: Session = Depends(get_db)
):
    """
    Evaluates submitted student answers, updates concept progress, and returns
    full results with post-submission feedback and adaptive next action.
    """
    try:
        return AssessmentService.submit_and_evaluate_assessment(db=db, submission=submission)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/generate-question", response_model=QuestionDetail)
def generate_ai_question(
    req: GenerateQuestionRequest,
    persist: bool = Query(False, description="Whether to persist the generated question if valid"),
    db: Session = Depends(get_db)
):
    """
    Generates an MCQ using the isolated AI service, runs ExamBuddy validation rules,
    and returns the structured question or verified fallback.
    """
    concept = db.query(Concept).filter(Concept.id == req.concept_id).first()
    concept_name = concept.name if concept else req.concept_id

    question_detail, is_ai, msg = AIService.generate_question(
        concept_id=req.concept_id,
        concept_name=concept_name,
        subject=req.subject or "Machine Learning",
        topic=req.topic or "Optimization",
        difficulty=req.difficulty or "medium"
    )

    if persist:
        options_json = [{"id": o.id, "text": o.text} for o in question_detail.options]
        new_q = Question(
            id=question_detail.id,
            concept_id=question_detail.concept_id,
            question_text=question_detail.question_text,
            options=options_json,
            correct_option=question_detail.correct_option,
            explanation=question_detail.explanation,
            difficulty=question_detail.difficulty,
            is_ai_generated=question_detail.is_ai_generated,
            is_validated=True
        )
        db.add(new_q)
        db.commit()

    return question_detail


@router.post("/validate-question", response_model=AIQuestionValidationResult)
def validate_custom_question(question_payload: dict):
    """
    API endpoint for checking a question against ExamBuddy failure rules.
    """
    is_valid, errors = QuestionValidator.validate(question_payload)
    return AIQuestionValidationResult(
        is_valid=is_valid,
        errors=errors
    )
