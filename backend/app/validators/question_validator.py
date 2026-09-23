import re
from typing import Dict, Any, List, Tuple, Optional


class QuestionValidationError(Exception):
    """Exception raised when a question fails quality or schema validation."""
    def __init__(self, errors: List[str]):
        self.errors = errors
        super().__init__(f"Question validation failed: {', '.join(errors)}")


class QuestionValidator:
    """
    Validates AI-generated and authored MCQs against standard pedagogical schemas
    and specifically protects against known ExamBuddy question quality failures.
    """

    DISALLOWED_LAZY_DISTRACTORS = [
        "all of the above",
        "none of the above",
        "both a and b",
        "both b and c",
        "all of these",
        "none of these",
        "neither a nor b",
        "i don't know",
        "n/a"
    ]

    @classmethod
    def validate(
        cls,
        data: Dict[str, Any],
        expected_concept_id: Optional[str] = None,
        expected_difficulty: Optional[str] = None
    ) -> Tuple[bool, List[str]]:
        """
        Validates a question dictionary. Returns (is_valid, list_of_error_messages).
        """
        errors: List[str] = []

        if not isinstance(data, dict):
            return False, ["Question data must be a JSON dictionary."]

        # 1. Basic Field Existence
        required_fields = ["question", "options", "correct_option", "explanation"]
        for field in required_fields:
            if field not in data or not data[field]:
                errors.append(f"Missing or empty required field: '{field}'")

        if errors:
            return False, errors

        question_text = str(data.get("question", "")).strip()
        options = data.get("options", [])
        correct_option = str(data.get("correct_option", "")).strip().upper()
        explanation = str(data.get("explanation", "")).strip()
        concept_id = str(data.get("concept_id", "")).strip()
        difficulty = str(data.get("difficulty", "medium")).lower().strip()

        # 2. Question Text Quality
        if len(question_text) < 10:
            errors.append("Question text is too short (must be at least 10 characters).")

        # 3. Option Count & Structure
        if not isinstance(options, list):
            errors.append("Options must be a list.")
            return False, errors

        if len(options) != 4:
            errors.append(f"Question must have exactly 4 options, found {len(options)}.")

        option_ids = []
        option_texts = []
        option_dict: Dict[str, str] = {}

        for idx, opt in enumerate(options):
            if isinstance(opt, dict):
                opt_id = str(opt.get("id", "")).strip().upper()
                opt_text = str(opt.get("text", "")).strip()
            elif isinstance(opt, str):
                opt_id = chr(65 + idx)  # A, B, C, D
                opt_text = opt.strip()
            else:
                errors.append(f"Option {idx + 1} has invalid format.")
                continue

            if not opt_id or not opt_text:
                errors.append(f"Option {idx + 1} has empty id or text.")
                continue

            option_ids.append(opt_id)
            option_texts.append(opt_text)
            option_dict[opt_id] = opt_text

        # Unique option IDs
        if len(set(option_ids)) != len(option_ids):
            errors.append(f"Duplicate option IDs found: {option_ids}")

        # Unique option texts
        normalized_texts = [re.sub(r"\s+", " ", t.lower()) for t in option_texts]
        if len(set(normalized_texts)) != len(normalized_texts):
            errors.append("Duplicate option texts found among choices.")

        # 4. Correct Option Check
        if correct_option not in option_dict:
            errors.append(
                f"Correct option '{correct_option}' is not among option IDs {list(option_dict.keys())}."
            )

        # 5. ExamBuddy Problem 1: Length Anomaly / Answer Cluing
        # Reject if the correct option is excessively longer than the average distractor length
        if correct_option in option_dict and len(option_dict) >= 3:
            correct_len = len(option_dict[correct_option])
            distractor_lens = [
                len(text) for opt_id, text in option_dict.items() if opt_id != correct_option
            ]
            avg_distractor_len = sum(distractor_lens) / max(len(distractor_lens), 1)

            # If correct option is over 2.5x the average distractor length and longer by > 35 chars
            if avg_distractor_len > 0 and correct_len > (2.5 * avg_distractor_len) and (correct_len - avg_distractor_len) > 35:
                errors.append(
                    f"ExamBuddy length failure: Correct option ({correct_len} chars) is suspiciously longer "
                    f"than average distractors ({avg_distractor_len:.1f} chars)."
                )

        # 6. ExamBuddy Problem 2 & 3: Absurd/Lazy Distractor Checking
        for opt_id, opt_text in option_dict.items():
            cleaned_opt = opt_text.lower().strip()
            for lazy in cls.DISALLOWED_LAZY_DISTRACTORS:
                if cleaned_opt == lazy or cleaned_opt.startswith(lazy):
                    errors.append(
                        f"ExamBuddy distractor failure: Option {opt_id} ('{opt_text}') is a disallowed lazy option."
                    )

            if len(cleaned_opt) < 2:
                errors.append(f"Option {opt_id} ('{opt_text}') is too short or empty.")

        # 7. Concept and Topic Match
        if expected_concept_id and concept_id:
            if concept_id != expected_concept_id:
                errors.append(
                    f"Concept ID mismatch: Expected '{expected_concept_id}', but got '{concept_id}'."
                )

        # 8. Difficulty Check
        valid_difficulties = ["easy", "medium", "hard"]
        if difficulty not in valid_difficulties:
            errors.append(f"Invalid difficulty '{difficulty}'. Expected one of {valid_difficulties}.")
        elif expected_difficulty and difficulty != expected_difficulty.lower():
            errors.append(f"Difficulty mismatch: Expected '{expected_difficulty}', got '{difficulty}'.")

        # 9. Explanation Quality Check
        if len(explanation) < 10:
            errors.append("Explanation is too short or missing.")

        return (len(errors) == 0), errors
