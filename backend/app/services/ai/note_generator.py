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
            "You are a world-class university professor and curriculum author. "
            "Write an in-depth, structured, pedagogical study guide in clean GitHub-Flavored Markdown. "
            "Explain core intuition, mental models, concrete examples, formulas/diagrams (if applicable), common pitfalls, and self-check questions."
        )

        focus_text = f"The student struggled with: {', '.join(weak_areas)}." if weak_areas else "Provide a comprehensive, crystal-clear conceptual foundation."

        user_prompt = f"""
Write an academic study guide for:
- Concept Name: {concept_name} (ID: {concept_id})
- Student Name: {student_name}
- Context/Weakness: {focus_text}

Structure the Markdown with:
# {concept_name}

## 1. Executive Summary & Intuitive Mental Model
(Explain what this concept is in plain English with a vivid real-world analogy.)

## 2. Core Mechanics & Technical Architecture
(Detailed breakdown of operational steps, rules, algorithms, or formulas.)

## 3. Concrete Example / Walkthrough
(A step-by-step example illustrating how this works in practice.)

## 4. Common Misconceptions & Traps
(List specific mistakes learners frequently make and why they occur.)

## 5. Summary & Self-Check Review
(Key takeaways to remember before taking an assessment.)

Format strictly in clean Markdown without chatbot pleasantries or conversational filler.
"""

        raw_content = GroqService.generate_chat_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.3,
            json_mode=False,
            timeout_seconds=20.0
        )

        if raw_content and len(raw_content.strip()) > 80:
            return NoteResponse(
                id=f"groq-note-{uuid.uuid4().hex[:8]}",
                concept_id=concept_id,
                concept_name=concept_name,
                title=f"Study Guide: {concept_name}",
                markdown_content=raw_content.strip(),
                is_ai_generated=True
            )

        # Fallback personalized markdown note
        focus_points = (
            "\n".join([f"- **Focus Area**: {w}" for w in weak_areas])
            if weak_areas
            else f"- **Core Pillar**: Foundational theory and practical application of {concept_name}."
        )

        fallback_md = f"""# {concept_name}

Hello **{student_name}**, here is a structured study guide to master **{concept_name}**.

## 1. Executive Summary & Intuition
**{concept_name}** provides the underlying rules and invariants necessary for deterministic and reliable operation. Think of it as a contract: inputs must adhere to strict preconditions so outputs remain valid and predictable.

## 2. Key Pillars
{focus_points}

### Core Operational Mechanics
1. **Initialization**: Establish baseline state and invariant boundaries.
2. **Execution & Transition**: Process incoming events through verified state machines.
3. **Verification**: Confirm state integrity against target constraints.

## 3. Common Pitfalls & Mistakes
- **Neglecting Edge Cases**: Overlooking boundary limits or empty input states.
- **Unchecked Assumptions**: Relying on unspoken invariants rather than explicit checks.
- **Premature Optimization**: Sacrificing correctness for unmeasured throughput gains.

## 4. Key Takeaways
Take the concept assessment to verify your mastery.
"""

        return NoteResponse(
            id=f"fb-note-{uuid.uuid4().hex[:8]}",
            concept_id=concept_id,
            concept_name=concept_name,
            title=f"Study Guide: {concept_name}",
            markdown_content=fallback_md,
            is_ai_generated=False
        )

