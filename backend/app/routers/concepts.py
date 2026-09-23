from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db
from backend.app.models.schema import Concept, StudentConceptProgress, Student, Question, Topic
from backend.app.schemas.api_models import (
    ConceptSummary,
    ConceptProgressItem,
    StudentDashboardResponse
)
from backend.app.services.adaptive_service import AdaptiveService

router = APIRouter(prefix="/api", tags=["Concepts & Student Progress"])


@router.get("/concepts/{concept_id}", response_model=ConceptSummary)
def get_concept(concept_id: str, student_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Retrieves concept metadata, prerequisite details, and student mastery."""
    concept = db.query(Concept).filter(Concept.id == concept_id).first()
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found")

    q_count = db.query(Question).filter(Question.concept_id == concept_id).count()
    student_status = "not_started"
    student_mastery = 0.0

    if student_id:
        prog = (
            db.query(StudentConceptProgress)
            .filter(
                StudentConceptProgress.student_id == student_id,
                StudentConceptProgress.concept_id == concept_id
            )
            .first()
        )
        if prog:
            student_status = prog.status
            student_mastery = prog.mastery_score

    prereq_name = concept.prerequisite.name if concept.prerequisite else None

    return ConceptSummary(
        id=concept.id,
        topic_id=concept.topic_id,
        name=concept.name,
        description=concept.description,
        order_index=concept.order_index,
        prerequisite_concept_id=concept.prerequisite_concept_id,
        prerequisite_concept_name=prereq_name,
        questions_count=q_count,
        student_status=student_status,
        student_mastery=student_mastery
    )


@router.get("/students/{student_id}/progress", response_model=List[ConceptProgressItem])
def get_student_progress(student_id: str, db: Session = Depends(get_db)):
    """Returns granular concept performance for a student."""
    progress_records = (
        db.query(StudentConceptProgress)
        .filter(StudentConceptProgress.student_id == student_id)
        .all()
    )

    items = []
    for p in progress_records:
        concept = db.query(Concept).filter(Concept.id == p.concept_id).first()
        concept_name = concept.name if concept else p.concept_id
        topic_name = concept.topic.name if concept and concept.topic else ""
        topic_id = concept.topic_id if concept else ""

        items.append(
            ConceptProgressItem(
                concept_id=p.concept_id,
                concept_name=concept_name,
                topic_id=topic_id,
                topic_name=topic_name,
                attempts_count=p.attempts_count,
                correct_count=p.correct_count,
                mastery_score=p.mastery_score,
                status=p.status,
                last_updated=p.last_updated
            )
        )

    return items


@router.get("/students/{student_id}/dashboard", response_model=StudentDashboardResponse)
def get_student_dashboard(student_id: str, db: Session = Depends(get_db)):
    """Aggregates student metrics, weak concepts, and real-time adaptive next action."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        student = Student(id=student_id, name="Alex Rivera", email="alex@example.edu")
        db.add(student)
        db.commit()

    all_progress = (
        db.query(StudentConceptProgress)
        .filter(StudentConceptProgress.student_id == student_id)
        .all()
    )

    total_attempts = sum(p.attempts_count for p in all_progress)
    scores = [p.mastery_score for p in all_progress if p.attempts_count > 0]
    overall_mastery = (sum(scores) / len(scores)) if scores else 0.0

    weak_items = []
    all_progress_items = []

    for p in all_progress:
        concept = db.query(Concept).filter(Concept.id == p.concept_id).first()
        concept_name = concept.name if concept else p.concept_id
        topic_name = concept.topic.name if concept and concept.topic else ""
        topic_id = concept.topic_id if concept else ""

        item = ConceptProgressItem(
            concept_id=p.concept_id,
            concept_name=concept_name,
            topic_id=topic_id,
            topic_name=topic_name,
            attempts_count=p.attempts_count,
            correct_count=p.correct_count,
            mastery_score=p.mastery_score,
            status=p.status,
            last_updated=p.last_updated
        )
        all_progress_items.append(item)
        if p.status == "weak":
            weak_items.append(item)

    recommendation = AdaptiveService.get_overall_student_recommendation(db, student_id)

    return StudentDashboardResponse(
        student_id=student.id,
        student_name=student.name,
        total_attempts=total_attempts,
        overall_mastery=round(overall_mastery, 2),
        weak_concepts=weak_items,
        all_progress=all_progress_items,
        active_recommendation=recommendation
    )
