from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db
from backend.app.schemas.api_models import RecommendationItem
from backend.app.services.adaptive_service import AdaptiveService

router = APIRouter(prefix="/api/recommendations", tags=["Adaptive Recommendations"])


@router.get("/{student_id}", response_model=RecommendationItem)
def get_student_recommendation(student_id: str, db: Session = Depends(get_db)):
    """
    Returns the primary deterministic recommendation for a student based on overall performance.
    """
    rec = AdaptiveService.get_overall_student_recommendation(db, student_id)
    if not rec:
        raise HTTPException(status_code=404, detail="No recommendation available.")
    return rec


@router.get("/{student_id}/concepts/{concept_id}", response_model=RecommendationItem)
def get_concept_recommendation(
    student_id: str,
    concept_id: str,
    db: Session = Depends(get_db)
):
    """
    Returns the deterministic recommendation for a specific concept.
    """
    try:
        return AdaptiveService.generate_recommendation(db, student_id, concept_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
