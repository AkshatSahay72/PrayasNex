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


# --- Dynamic Authoring Endpoints ---

import re
from datetime import datetime, timezone
from backend.app.models.schema import Note, Student
from backend.app.schemas.api_models import (
    CreateSubjectRequest,
    CreateTopicRequest,
    CreateConceptRequest
)


def _to_slug(text: str) -> str:
    cleaned = re.sub(r'[^a-zA-Z0-9]+', '_', text.strip().lower()).strip('_')
    return cleaned or "item"


@router.post("", response_model=SubjectDetail)
def create_subject(req: CreateSubjectRequest, db: Session = Depends(get_db)):
    """Creates a new subject module."""
    slug = _to_slug(req.name)
    subject_id = f"subject.{slug}"

    # Check for collision
    existing = db.query(Subject).filter(Subject.id == subject_id).first()
    if existing:
        subject_id = f"subject.{slug}_{int(datetime.now().timestamp()) % 10000}"

    new_subj = Subject(
        id=subject_id,
        name=req.name.strip(),
        description=req.description.strip() if req.description else None,
        icon=req.icon or "BookOpen"
    )
    db.add(new_subj)
    db.commit()
    db.refresh(new_subj)

    return SubjectDetail(
        id=new_subj.id,
        name=new_subj.name,
        description=new_subj.description,
        icon=new_subj.icon,
        topics=[]
    )


@router.post("/{subject_id}/topics", response_model=TopicWithConcepts)
def create_topic(subject_id: str, req: CreateTopicRequest, db: Session = Depends(get_db)):
    """Creates a new topic under a subject."""
    subj = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Parent subject not found")

    slug = _to_slug(req.name)
    topic_id = f"topic.{_to_slug(subj.name)}.{slug}"

    existing = db.query(Topic).filter(Topic.id == topic_id).first()
    if existing:
        topic_id = f"topic.{_to_slug(subj.name)}.{slug}_{int(datetime.now().timestamp()) % 10000}"

    order_idx = len(subj.topics) + 1
    new_topic = Topic(
        id=topic_id,
        subject_id=subj.id,
        name=req.name.strip(),
        description=req.description.strip() if req.description else None,
        order_index=order_idx
    )
    db.add(new_topic)
    db.commit()
    db.refresh(new_topic)

    return TopicWithConcepts(
        id=new_topic.id,
        subject_id=new_topic.subject_id,
        name=new_topic.name,
        description=new_topic.description,
        order_index=new_topic.order_index,
        concepts=[]
    )


@router.post("/topics/{topic_id}/concepts", response_model=ConceptSummary)
def create_concept(topic_id: str, req: CreateConceptRequest, db: Session = Depends(get_db)):
    """Creates a new concept with structured ID, initial note, and student progress."""
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Parent topic not found")

    slug = _to_slug(req.name)
    subj_slug = _to_slug(topic.subject.name) if topic.subject else "general"
    topic_slug = _to_slug(topic.name)
    concept_id = f"{subj_slug}.{topic_slug}.{slug}"

    existing = db.query(Concept).filter(Concept.id == concept_id).first()
    if existing:
        concept_id = f"{subj_slug}.{topic_slug}.{slug}_{int(datetime.now().timestamp()) % 10000}"

    order_idx = len(topic.concepts) + 1
    new_concept = Concept(
        id=concept_id,
        topic_id=topic.id,
        name=req.name.strip(),
        description=req.description.strip() if req.description else None,
        order_index=order_idx,
        prerequisite_concept_id=req.prerequisite_concept_id or None
    )
    db.add(new_concept)
    db.flush()

    # Create initial Note
    note_content = req.initial_note_markdown or f"""# {new_concept.name}

## 1. Overview
{new_concept.description or 'Core pedagogical concept.'}

## 2. Key Mechanics
Understanding the foundational principles of **{new_concept.name}** is critical for advancing in {topic.name}.

## 3. Practice
Take the concept assessment to verify your understanding.
"""
    note = Note(
        id=f"note.{new_concept.id}",
        concept_id=new_concept.id,
        title=f"Study Guide: {new_concept.name}",
        markdown_content=note_content.strip(),
        is_ai_generated=False
    )
    db.add(note)

    # Initialize progress for demo students
    students = db.query(Student).all()
    for s in students:
        p = StudentConceptProgress(
            id=f"prog-{s.id}-{new_concept.id}",
            student_id=s.id,
            concept_id=new_concept.id,
            attempts_count=0,
            correct_count=0,
            mastery_score=0.0,
            status="not_started"
        )
        db.add(p)

    db.commit()
    db.refresh(new_concept)

    prereq_name = new_concept.prerequisite.name if new_concept.prerequisite else None

    return ConceptSummary(
        id=new_concept.id,
        topic_id=new_concept.topic_id,
        name=new_concept.name,
        description=new_concept.description,
        order_index=new_concept.order_index,
        prerequisite_concept_id=new_concept.prerequisite_concept_id,
        prerequisite_concept_name=prereq_name,
        questions_count=0,
        student_status="not_started",
        student_mastery=0.0
    )


from backend.app.schemas.api_models import GenerateCurriculumRequest, GenerateConceptRequest
from backend.app.services.ai_service import AIService


@router.post("/ai-generate", response_model=SubjectDetail)
def generate_curriculum_with_ai(
    req: GenerateCurriculumRequest,
    db: Session = Depends(get_db)
):
    """
    Asks Groq LLM to automatically design and structure an entire subject curriculum
    (Topics, progressive Concepts, Markdown Study Guides, and ExamBuddy validated MCQs).
    """
    try:
        return AIService.generate_curriculum(
            db=db,
            subject_name=req.subject_name,
            description=req.description,
            num_topics=req.num_topics or 3,
            concepts_per_topic=req.concepts_per_topic or 2
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate curriculum with AI: {str(e)}")


@router.post("/topics/{topic_id}/ai-generate-concept", response_model=ConceptSummary)
def generate_concept_with_ai(
    topic_id: str,
    req: GenerateConceptRequest,
    db: Session = Depends(get_db)
):
    """
    Asks Groq LLM to design a single concept under a topic with its study guide and MCQs.
    """
    try:
        return AIService.generate_concept(
            db=db,
            topic_id=topic_id,
            concept_name_hint=req.concept_hint
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate concept with AI: {str(e)}")


