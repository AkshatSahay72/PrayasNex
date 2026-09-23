from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database.db import get_db
from backend.app.schemas.api_models import NoteResponse, GenerateNoteRequest
from backend.app.services.note_service import NoteService

router = APIRouter(prefix="/api/notes", tags=["Learning & Personalized Notes"])


@router.get("/{concept_id}", response_model=NoteResponse)
def get_note(
    concept_id: str,
    student_id: Optional[str] = Query(None),
    personalized: bool = Query(False),
    db: Session = Depends(get_db)
):
    """
    Fetches the concept learning note. If personalized=true, generates/selects
    a note tuned to the student's background.
    """
    if personalized:
        return NoteService.get_or_generate_personalized_note(
            db=db,
            concept_id=concept_id,
            student_id=student_id
        )

    note = NoteService.get_concept_note(db=db, concept_id=concept_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found for concept.")
    return note


@router.post("/generate", response_model=NoteResponse)
def generate_custom_note(
    req: GenerateNoteRequest,
    db: Session = Depends(get_db)
):
    """
    On-demand generation of a targeted personalized study note.
    """
    try:
        return NoteService.get_or_generate_personalized_note(
            db=db,
            concept_id=req.concept_id,
            student_id=req.student_id,
            focus_areas=req.focus_areas
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
