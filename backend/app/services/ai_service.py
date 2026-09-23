import json
import logging
import uuid
from typing import Dict, Any, Optional, List, Tuple
import httpx
from backend.app.config import settings
from backend.app.validators.question_validator import QuestionValidator, QuestionValidationError
from backend.app.schemas.api_models import QuestionDetail, OptionItem, NoteResponse

logger = logging.getLogger("ai_service")


# High quality pre-validated fallback questions for each concept
FALLBACK_QUESTIONS: Dict[str, List[Dict[str, Any]]] = {
    "ml.optimization.gradient": [
        {
            "question": "What does the gradient vector of a multivariable function geometrically represent?",
            "options": [
                {"id": "A", "text": "The direction of steepest ascent of the function"},
                {"id": "B", "text": "The minimum curvature of the contour lines"},
                {"id": "C", "text": "The orthogonal tangent plane at the local minimum"},
                {"id": "D", "text": "The average value of the function over its domain"}
            ],
            "correct_option": "A",
            "explanation": "The gradient vector contains partial derivatives and points in the direction of the greatest rate of increase (steepest ascent) of the function.",
            "concept_id": "ml.optimization.gradient",
            "difficulty": "medium"
        }
    ],
    "ml.optimization.learning_rate": [
        {
            "question": "What typically occurs during gradient descent optimization if the learning rate is configured to be excessively large?",
            "options": [
                {"id": "A", "text": "The loss function oscillates violently and may diverge"},
                {"id": "B", "text": "The model instantly gets trapped in a shallow saddle point"},
                {"id": "C", "text": "The gradients become permanently zero after the first step"},
                {"id": "D", "text": "The training loss decreases at a mathematically optimal rate"}
            ],
            "correct_option": "A",
            "explanation": "An excessively large learning rate causes updates to overshoot the minimum, leading to divergence or erratic oscillations in the loss curve.",
            "concept_id": "ml.optimization.learning_rate",
            "difficulty": "medium"
        }
    ],
    "ml.optimization.gradient_descent": [
        {
            "question": "In standard Gradient Descent, how is the parameter weight vector updated at iteration t with learning rate alpha?",
            "options": [
                {"id": "A", "text": "w_{t+1} = w_t - alpha * grad(L(w_t))"},
                {"id": "B", "text": "w_{t+1} = w_t + alpha * grad(L(w_t))"},
                {"id": "C", "text": "w_{t+1} = alpha * (w_t - grad(L(w_t)))"},
                {"id": "D", "text": "w_{t+1} = w_t / (alpha * grad(L(w_t)))"}
            ],
            "correct_option": "A",
            "explanation": "Because we want to minimize the loss, we step in the negative direction of the gradient: w_next = w_curr - alpha * gradient.",
            "concept_id": "ml.optimization.gradient_descent",
            "difficulty": "medium"
        }
    ]
}


class AIService:
    """
    Isolated AI Service for generating questions and personalized learning notes.
    Adheres to:
    1. Schema & ExamBuddy quality validation before returning/storing.
    2. Zero crash fallback: returns pre-validated fallback content if AI is unreachable or fails.
    """

    @classmethod
    def generate_question(
        cls,
        concept_id: str,
        concept_name: str,
        subject: str = "Machine Learning",
        topic: str = "Optimization",
        difficulty: str = "medium"
    ) -> Tuple[QuestionDetail, bool, Optional[str]]:
        """
        Attempts to generate a question using LLM provider, validates it through
        ExamBuddy rules, and returns (QuestionDetail, is_ai_generated, note_or_warning).
        If LLM is disabled, unconfigured, or invalid, returns a verified fallback question.
        """
        provider = settings.AI_PROVIDER.lower().strip()

        # If configured for real LLM and key is present
        if provider == "gemini" and settings.GEMINI_API_KEY:
            try:
                raw_data = cls._call_gemini_for_question(
                    concept_id=concept_id,
                    concept_name=concept_name,
                    subject=subject,
                    topic=topic,
                    difficulty=difficulty
                )
                is_valid, errors = QuestionValidator.validate(
                    data=raw_data,
                    expected_concept_id=concept_id,
                    expected_difficulty=difficulty
                )
                if is_valid:
                    opts = [
                        OptionItem(id=o["id"], text=o["text"])
                        for o in raw_data["options"]
                    ]
                    q = QuestionDetail(
                        id=f"ai-{uuid.uuid4().hex[:10]}",
                        concept_id=concept_id,
                        question_text=raw_data["question"],
                        options=opts,
                        correct_option=raw_data["correct_option"],
                        explanation=raw_data["explanation"],
                        difficulty=difficulty,
                        is_ai_generated=True,
                        is_validated=True
                    )
                    return q, True, None
                else:
                    logger.warning(f"AI generated question rejected due to validation errors: {errors}")
            except Exception as e:
                logger.error(f"Error during AI question generation: {e}")

        # Graceful Fallback
        fallback_pool = FALLBACK_QUESTIONS.get(concept_id, FALLBACK_QUESTIONS["ml.optimization.gradient_descent"])
        fb = fallback_pool[0]
        opts = [OptionItem(id=o["id"], text=o["text"]) for o in fb["options"]]
        return QuestionDetail(
            id=f"fb-{uuid.uuid4().hex[:10]}",
            concept_id=concept_id,
            question_text=fb["question"],
            options=opts,
            correct_option=fb["correct_option"],
            explanation=fb["explanation"],
            difficulty=difficulty,
            is_ai_generated=False,
            is_validated=True
        ), False, "Served high-quality pre-validated question (AI provider mock/fallback mode)."

    @classmethod
    def generate_personalized_note(
        cls,
        concept_id: str,
        concept_name: str,
        student_name: str = "Student",
        weak_areas: Optional[List[str]] = None
    ) -> NoteResponse:
        """
        Generates or selects a targeted personalized learning note.
        """
        provider = settings.AI_PROVIDER.lower().strip()

        if provider == "gemini" and settings.GEMINI_API_KEY:
            try:
                markdown_body = cls._call_gemini_for_note(
                    concept_id=concept_id,
                    concept_name=concept_name,
                    weak_areas=weak_areas
                )
                if markdown_body and len(markdown_body) > 50:
                    return NoteResponse(
                        id=f"ai-note-{uuid.uuid4().hex[:8]}",
                        concept_id=concept_id,
                        concept_name=concept_name,
                        title=f"Personalized Guide: {concept_name}",
                        markdown_content=markdown_body,
                        is_ai_generated=True
                    )
            except Exception as e:
                logger.error(f"Error generating AI personalized note: {e}")

        # Fallback personalized note template
        weak_bullet = f"- **Focus Area**: Emphasize intuitive physical meaning and step-by-step calculus." if not weak_areas else "\n".join([f"- **Focus Area**: {w}" for w in weak_areas])

        fallback_md = f"""# Personalized Review: {concept_name}

Hello **{student_name}**, here is a targeted review to reinforce your understanding of **{concept_name}**.

## Key Concepts
{weak_bullet}

### Why this matters
Mastering **{concept_name}** allows you to navigate loss landscapes effectively and understand how modern deep learning models adjust their weights.

### Quick Mental Model
1. **Direction**: Check the gradient vector to find the slope.
2. **Step Size**: Scale the update with the learning rate $\\alpha$.
3. **Update**: Move opposite to the gradient to descend into lower error states.

> **Pro Tip**: If you struggle with convergence, visualize rolling a marble down a bowl. If it rolls too fast (large $\\alpha$), it flies out of the bowl!
"""

        return NoteResponse(
            id=f"note-{uuid.uuid4().hex[:8]}",
            concept_id=concept_id,
            concept_name=concept_name,
            title=f"Adaptive Note: {concept_name}",
            markdown_content=fallback_md,
            is_ai_generated=False
        )

    @classmethod
    def _call_gemini_for_question(cls, concept_id: str, concept_name: str, subject: str, topic: str, difficulty: str) -> Dict[str, Any]:
        """Calls Gemini REST endpoint for structured MCQ generation."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.AI_MODEL_NAME}:generateContent?key={settings.GEMINI_API_KEY}"
        prompt = f"""
Generate 1 pedagogical multiple-choice question (MCQ) for:
Subject: {subject}
Topic: {topic}
Concept: {concept_name} ({concept_id})
Difficulty: {difficulty}

Requirements:
- Exactly 4 balanced options labeled A, B, C, D.
- The correct option must NOT be noticeably longer or shorter than distractors.
- All distractors must be plausible and relevant to {concept_name}.
- Do NOT use 'All of the above' or 'None of the above'.
- Return ONLY valid JSON with this exact schema:
{{
  "question": "string",
  "options": [
    {{"id": "A", "text": "string"}},
    {{"id": "B", "text": "string"}},
    {{"id": "C", "text": "string"}},
    {{"id": "D", "text": "string"}}
  ],
  "correct_option": "A|B|C|D",
  "explanation": "string",
  "concept_id": "{concept_id}",
  "difficulty": "{difficulty}"
}}
"""
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"}
        }
        response = httpx.post(url, json=payload, timeout=10.0)
        response.raise_for_status()
        res_json = response.json()
        content_text = res_json["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(content_text)

    @classmethod
    def _call_gemini_for_note(cls, concept_id: str, concept_name: str, weak_areas: Optional[List[str]]) -> str:
        """Calls Gemini REST endpoint for personalized markdown note generation."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.AI_MODEL_NAME}:generateContent?key={settings.GEMINI_API_KEY}"
        prompt = f"""
Write a clear, encouraging, structured educational markdown note explaining the concept '{concept_name}' for a student who scored low in a recent practice quiz.
Include:
- Concept definition & intuition
- Core equations / mechanics
- Common misconceptions and pitfalls
- Practical example
Keep it concise, clear, and formatted in clean GitHub-flavored Markdown.
"""
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        response = httpx.post(url, json=payload, timeout=10.0)
        response.raise_for_status()
        res_json = response.json()
        return res_json["candidates"][0]["content"]["parts"][0]["text"]
