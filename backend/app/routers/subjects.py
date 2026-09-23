from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db
from backend.app.models.schema import Subject, Topic, Concept, StudentConceptProgress, Question
from backend.app.schemas.api_models import (
    SubjectDetail,
    TopicWithConcepts,
    ConceptSummary
)

router = APIRouter(prefix="/api/subjects", tags=["Subjects & Topics"])


@router.get("", response_model=List[SubjectDetail])
def list_subjects(student_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Returns all curriculum subjects, topics, and concepts,
    annotated with the student's mastery status if student_id is provided.
    """
    subjects = db.query(Subject).all()
    result = []

    for subj in subjects:
        topics_list = []
        for top in sorted(subj.topics, key=lambda t: t.order_index):
            concepts_list = []
            for c in sorted(top.concepts, key=lambda cp: cp.order_index):
                # Count questions
                q_count = db.query(Question).filter(Question.concept_id == c.id).count()

                # Get student progress
                student_status = "not_started"
                student_mastery = 0.0
                if student_id:
                    prog = (
                        db.query(StudentConceptProgress)
                        .filter(
                            StudentConceptProgress.student_id == student_id,
                            StudentConceptProgress.concept_id == c.id
                        )
                        .first()
                    )
                    if prog:
                        student_status = prog.status
                        student_mastery = prog.mastery_score

                # Prereq name
                prereq_name = c.prerequisite.name if c.prerequisite else None

                concepts_list.append(
                    ConceptSummary(
                        id=c.id,
                        topic_id=c.topic_id,
                        name=c.name,
                        description=c.description,
                        order_index=c.order_index,
                        prerequisite_concept_id=c.prerequisite_concept_id,
                        prerequisite_concept_name=prereq_name,
                        questions_count=q_count,
                        student_status=student_status,
                        student_mastery=student_mastery
                    )
                )

            topics_list.append(
                TopicWithConcepts(
                    id=top.id,
                    subject_id=top.subject_id,
                    name=top.name,
                    description=top.description,
                    order_index=top.order_index,
                    concepts=concepts_list
                )
            )

        result.append(
            SubjectDetail(
                id=subj.id,
                name=subj.name,
                description=subj.description,
                icon=subj.icon or "BookOpen",
                topics=topics_list
            )
        )

    return result


@router.get("/{subject_id}", response_model=SubjectDetail)
def get_subject(subject_id: str, student_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Fetches full subject hierarchy."""
    subj = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")

    topics_list = []
    for top in sorted(subj.topics, key=lambda t: t.order_index):
        concepts_list = []
        for c in sorted(top.concepts, key=lambda cp: cp.order_index):
            q_count = db.query(Question).filter(Question.concept_id == c.id).count()
            student_status = "not_started"
            student_mastery = 0.0
            if student_id:
                prog = (
                    db.query(StudentConceptProgress)
                    .filter(
                        StudentConceptProgress.student_id == student_id,
                        StudentConceptProgress.concept_id == c.id
                    )
                    .first()
                )
                if prog:
                    student_status = prog.status
                    student_mastery = prog.mastery_score

            prereq_name = c.prerequisite.name if c.prerequisite else None
            concepts_list.append(
                ConceptSummary(
                    id=c.id,
                    topic_id=c.topic_id,
                    name=c.name,
                    description=c.description,
                    order_index=c.order_index,
                    prerequisite_concept_id=c.prerequisite_concept_id,
                    prerequisite_concept_name=prereq_name,
                    questions_count=q_count,
                    student_status=student_status,
                    student_mastery=student_mastery
                )
            )

        topics_list.append(
            TopicWithConcepts(
                id=top.id,
                subject_id=top.subject_id,
                name=top.name,
                description=top.description,
                order_index=top.order_index,
                concepts=concepts_list
            )
        )

    return SubjectDetail(
        id=subj.id,
        name=subj.name,
        description=subj.description,
        icon=subj.icon or "BookOpen",
        topics=topics_list
    )
