import json
import logging
import uuid
from typing import Dict, Any, Optional, List, Tuple
from backend.app.schemas.api_models import QuestionDetail, OptionItem
from backend.app.validators.question_validator import QuestionValidator
from backend.app.services.ai.groq_service import GroqService

logger = logging.getLogger("question_generator")

# Validated fallback questions by concept
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


class QuestionGenerator:
    """
    Orchestrates MCQ generation via Groq API with ExamBuddy quality validation and zero-crash fallback.
    """

    @classmethod
    def generate(
        cls,
        concept_id: str,
        concept_name: str,
        subject: str = "Machine Learning",
        topic: str = "Optimization",
        difficulty: str = "medium",
        learning_objective: Optional[str] = None
    ) -> Tuple[QuestionDetail, bool, Optional[str]]:
        """
        1. Builds prompt
        2. Queries Groq API
        3. Parses JSON
        4. Validates question against ExamBuddy quality checks
        5. Returns verified QuestionDetail (or fallback on error/rejection)
        """
        system_prompt = (
            "You are an expert pedagogical MCQ author for machine learning and mathematical optimization. "
            "You write accurate, balanced questions with exactly 4 distinct options (A, B, C, D) and one unambiguous correct answer. "
            "Never use 'All of the above', 'None of the above', or lazy distractors. "
            "Ensure the correct option is not significantly longer or more detailed than the distractors."
        )

        user_prompt = f"""
Generate exactly 1 high-quality multiple choice question for:
- Subject: {subject}
- Topic: {topic}
- Concept: {concept_name} (ID: {concept_id})
- Difficulty: {difficulty}
{f"- Learning Objective: {learning_objective}" if learning_objective else ""}

Respond ONLY with a valid JSON object matching this schema:
{{
  "question": "Clear question text",
  "options": [
    {{"id": "A", "text": "Option A text"}},
    {{"id": "B", "text": "Option B text"}},
    {{"id": "C", "text": "Option C text"}},
    {{"id": "D", "text": "Option D text"}}
  ],
  "correct_option": "A|B|C|D",
  "explanation": "Pedagogical explanation of why the correct option is right and others are wrong",
  "concept_id": "{concept_id}",
  "difficulty": "{difficulty}"
}}
"""

        raw_response = GroqService.generate_chat_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.3,
            json_mode=True
        )

        if raw_response:
            try:
                parsed_json = json.loads(raw_response)
                is_valid, validation_errors = QuestionValidator.validate(
                    data=parsed_json,
                    expected_concept_id=concept_id,
                    expected_difficulty=difficulty
                )

                if is_valid:
                    opts = [
                        OptionItem(id=o["id"], text=o["text"])
                        for o in parsed_json["options"]
                    ]
                    q = QuestionDetail(
                        id=f"groq-{uuid.uuid4().hex[:10]}",
                        concept_id=concept_id,
                        question_text=parsed_json["question"],
                        options=opts,
                        correct_option=parsed_json["correct_option"],
                        explanation=parsed_json["explanation"],
                        difficulty=difficulty,
                        is_ai_generated=True,
                        is_validated=True
                    )
                    return q, True, "Generated via Groq API and passed all ExamBuddy quality checks."
                else:
                    logger.warning(
                        f"Groq-generated question rejected by ExamBuddy validator: {validation_errors}"
                    )
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Groq response as JSON: {e}")
            except Exception as e:
                logger.error(f"Unexpected error processing Groq response: {e}")

        # Fallback to pre-validated content
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
        ), False, "Served pre-validated fallback question (Groq unconfigured or fallback mode)."
