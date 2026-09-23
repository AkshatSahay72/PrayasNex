import logging
import uuid
from typing import Optional, List
from backend.app.schemas.api_models import NoteResponse
from backend.app.services.ai.groq_service import GroqService

logger = logging.getLogger("note_generator")


class NoteGenerator:
    """
    Generates personalized educational Markdown notes using Groq API with robust fallback.
    """

    @classmethod
    def generate_personalized_note(
        cls,
        concept_id: str,
        concept_name: str,
        student_name: str = "Student",
        weak_areas: Optional[List[str]] = None
    ) -> NoteResponse:
        """
        Queries Groq API to produce a personalized explanation note tailored to student performance.
        Falls back cleanly to pre-structured notes if Groq is unavailable.
        """
        system_prompt = (
            "You are a dedicated machine learning instructor. "
            "Write a concise, structured, encouraging study guide in clean GitHub-Flavored Markdown. "
            "Explain core mathematical intuition, equations, common pitfalls, and practical mental models."
        )

        focus_text = f"The student struggled with: {', '.join(weak_areas)}." if weak_areas else "Focus on core intuition and step-by-step calculus."

        user_prompt = f"""
Write an educational learning note for:
- Concept: {concept_name} (ID: {concept_id})
- Student Name: {student_name}
- Context: {focus_text}

Include:
1. # {concept_name}
2. Core Definition & Geometric Intuition
3. Mathematical Update Rule (LaTeX format)
4. Common Mistakes & Pitfalls
5. Practical Takeaway Summary

Format strictly as Markdown without extra conversational filler.
"""

        raw_content = GroqService.generate_chat_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.3,
            json_mode=False
        )

        if raw_content and len(raw_content.strip()) > 80:
            return NoteResponse(
                id=f"groq-note-{uuid.uuid4().hex[:8]}",
                concept_id=concept_id,
                concept_name=concept_name,
                title=f"Personalized Guide: {concept_name}",
                markdown_content=raw_content.strip(),
                is_ai_generated=True
            )

        # Fallback personalized markdown note
        focus_points = (
            "\n".join([f"- **Focus Area**: {w}" for w in weak_areas])
            if weak_areas
            else "- **Focus Area**: Step-by-step intuition and gradient update mechanics."
        )

        fallback_md = f"""# Personalized Review: {concept_name}

Hello **{student_name}**, here is a targeted review note to reinforce your understanding of **{concept_name}**.

## Key Concepts
{focus_points}

### Mathematical Intuition
1. **Direction**: Check the gradient vector $\\nabla L(\\mathbf{{w}})$ to find the slope.
2. **Step Size**: Scale the update with the learning rate $\\alpha$.
3. **Descent**: Move opposite to the gradient: $\\mathbf{{w}}_{{t+1}} = \\mathbf{{w}}_t - \\alpha \\nabla L(\\mathbf{{w}}_t)$.

### Common Mistakes to Avoid
- **Overshooting**: Setting $\\alpha$ too large causes erratic oscillations or loss divergence.
- **Plateaus**: Setting $\\alpha$ too small requires impractical training iterations.
- **Ill-Conditioning**: Failing to scale features causes gradient zig-zagging in elongated ravines.
"""

        return NoteResponse(
            id=f"fb-note-{uuid.uuid4().hex[:8]}",
            concept_id=concept_id,
            concept_name=concept_name,
            title=f"Adaptive Note: {concept_name}",
            markdown_content=fallback_md,
            is_ai_generated=False
        )
