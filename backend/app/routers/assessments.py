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


from backend.app.schemas.api_models import CreateQuestionRequest
import uuid
from datetime import datetime, timezone


@router.post("/questions", response_model=QuestionDetail)
def create_question(req: CreateQuestionRequest, db: Session = Depends(get_db)):
    """Creates a validated question for a concept."""
    concept = db.query(Concept).filter(Concept.id == req.concept_id).first()
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found")

    payload_dict = {
        "question": req.question_text,
        "options": [{"id": o.id, "text": o.text} for o in req.options],
        "correct_option": req.correct_option,
        "explanation": req.explanation,
        "concept_id": req.concept_id,
        "difficulty": req.difficulty or "medium"
    }

    is_valid, errors = QuestionValidator.validate(payload_dict, expected_concept_id=req.concept_id)
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"Validation failed: {', '.join(errors)}")

    new_q = Question(
        id=f"q-{uuid.uuid4().hex[:10]}",
        concept_id=req.concept_id,
        question_text=req.question_text.strip(),
        options=[{"id": o.id, "text": o.text} for o in req.options],
        correct_option=req.correct_option.strip().upper(),
        explanation=req.explanation.strip(),
        difficulty=req.difficulty or "medium",
        is_ai_generated=False,
        is_validated=True,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)

    return QuestionDetail(
        id=new_q.id,
        concept_id=new_q.concept_id,
        question_text=new_q.question_text,
        options=req.options,
        correct_option=new_q.correct_option,
        explanation=new_q.explanation,
        difficulty=new_q.difficulty,
        is_ai_generated=False,
        is_validated=True
    )


from backend.app.schemas.api_models import (
    SubmitDiagnosticRequest,
    DiagnosticResult,
    DiagnosticConceptBreakdown,
    SecureQuestionResponse,
    OptionItem
)
from backend.app.models.schema import Subject, Attempt, StudentConceptProgress


@router.get("/diagnostic", response_model=List[SecureQuestionResponse])
def get_subject_diagnostic_questions(
    subject_id: str = Query(..., description="Target Subject ID for diagnostic baseline test"),
    db: Session = Depends(get_db)
):
    """
    Fetches a representative diagnostic baseline assessment spanning all concepts
    under a subject (1-2 questions per concept).
    """
    subj = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")

    diagnostic_questions = []
    for topic in subj.topics:
        for concept in topic.concepts:
            # Grab up to 2 questions for this concept
            qs = (
                db.query(Question)
                .filter(Question.concept_id == concept.id)
                .order_by(Question.created_at.asc())
                .limit(2)
                .all()
            )
            for q in qs:
                diagnostic_questions.append(
                    SecureQuestionResponse(
                        id=q.id,
                        concept_id=q.concept_id,
                        concept_name=f"{concept.name} ({topic.name})",
                        question_text=q.question_text,
                        options=[OptionItem(id=opt["id"], text=opt["text"]) for opt in q.options],
                        difficulty=q.difficulty
                    )
                )

    if not diagnostic_questions:
        raise HTTPException(status_code=400, detail="No questions available for this subject's concepts yet.")

    return diagnostic_questions



@router.post("/submit-diagnostic", response_model=DiagnosticResult)
def submit_diagnostic_test(
    req: SubmitDiagnosticRequest,
    db: Session = Depends(get_db)
):
    """
    Evaluates a full subject diagnostic test, evaluates prior knowledge per concept,
    updates each concept's StudentConceptProgress, and diagnoses weak vs strong areas.
    """
    subj = db.query(Subject).filter(Subject.id == req.subject_id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")

    # Map answers by question_id
    answers_map = {a.question_id: a for a in req.answers}
    question_ids = list(answers_map.keys())

    db_questions = db.query(Question).filter(Question.id.in_(question_ids)).all()
    db_questions_by_id = {q.id: q for q in db_questions}

    # Group results by concept_id
    concept_evals = {}
    total_correct = 0
    now = datetime.now(timezone.utc)

    for a in req.answers:
        q = db_questions_by_id.get(a.question_id)
        if not q:
            continue

        is_correct = (a.selected_option.strip().upper() == q.correct_option.strip().upper())
        if is_correct:
            total_correct += 1

        cid = q.concept_id
        if cid not in concept_evals:
            concept_evals[cid] = {"total": 0, "correct": 0}
        concept_evals[cid]["total"] += 1
        if is_correct:
            concept_evals[cid]["correct"] += 1

        # Record attempt
        attempt = Attempt(
            id=f"att-{uuid.uuid4().hex[:10]}",
            student_id=req.student_id,
            question_id=q.id,
            concept_id=q.concept_id,
            selected_option=a.selected_option.strip().upper(),
            is_correct=is_correct,
            created_at=now
        )
        db.add(attempt)

    # Process each concept's mastery and update DB
    breakdowns = []
    weak_count = 0
    strong_count = 0
    recommended_start_cid = None
    recommended_start_name = None

    for topic in subj.topics:
        for concept in topic.concepts:
            eval_data = concept_evals.get(concept.id, {"total": 0, "correct": 0})
            c_total = eval_data["total"]
            c_correct = eval_data["correct"]

            if c_total > 0:
                pct = round((c_correct / c_total) * 100.0, 1)
            else:
                pct = 0.0

            if pct < 50.0:
                status = "weak"
                weak_count += 1
                rec_msg = f"Prior knowledge gap detected in {concept.name}. Review study note before progressing."
                if not recommended_start_cid:
                    recommended_start_cid = concept.id
                    recommended_start_name = concept.name
            elif pct < 80.0:
                status = "needs_practice"
                rec_msg = f"Partial familiarity with {concept.name}. Additional practice recommended."
                if not recommended_start_cid:
                    recommended_start_cid = concept.id
                    recommended_start_name = concept.name
            else:
                status = "strong"
                strong_count += 1
                rec_msg = f"Mastered baseline for {concept.name}. Ready for advanced applications."

            # Update or create StudentConceptProgress (normalized 0.0 to 1.0)
            norm_score = pct / 100.0 if pct > 1.0 else pct
            progress = (
                db.query(StudentConceptProgress)
                .filter(
                    StudentConceptProgress.student_id == req.student_id,
                    StudentConceptProgress.concept_id == concept.id
                )
                .first()
            )
            if not progress:
                progress = StudentConceptProgress(
                    id=f"prog-{req.student_id}-{concept.id}",
                    student_id=req.student_id,
                    concept_id=concept.id,
                    attempts_count=c_total,
                    correct_count=c_correct,
                    mastery_score=norm_score,
                    status=status,
                    last_updated=now
                )
                db.add(progress)
            else:
                progress.attempts_count = (progress.attempts_count or 0) + c_total
                progress.correct_count = (progress.correct_count or 0) + c_correct
                progress.mastery_score = norm_score
                progress.status = status
                progress.last_updated = now

            breakdowns.append(
                DiagnosticConceptBreakdown(
                    concept_id=concept.id,
                    concept_name=concept.name,
                    topic_name=topic.name,
                    total_questions=c_total,
                    correct_count=c_correct,
                    score_percentage=pct,
                    status=status,
                    recommendation=rec_msg
                )
            )

    db.commit()


    total_q_count = len(req.answers)
    overall_pct = round((total_correct / max(total_q_count, 1)) * 100.0, 1)

    summary = (
        f"Diagnostic Baseline: {overall_pct}% overall. "
        f"{weak_count} concepts require foundational review, and {strong_count} concepts demonstrate strong prior familiarity."
    )

    return DiagnosticResult(
        subject_id=subj.id,
        subject_name=subj.name,
        student_id=req.student_id,
        total_questions=total_q_count,
        total_correct=total_correct,
        overall_score=overall_pct,
        weak_concept_count=weak_count,
        strong_concept_count=strong_count,
        concept_breakdown=breakdowns,
        recommended_start_concept_id=recommended_start_cid,
        recommended_start_concept_name=recommended_start_name,
        summary_message=summary
    )


