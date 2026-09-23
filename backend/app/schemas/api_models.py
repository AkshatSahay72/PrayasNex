from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


# --- Option & Question Schemas ---

class OptionItem(BaseModel):
    id: str = Field(..., description="Option key, typically 'A', 'B', 'C', or 'D'")
    text: str = Field(..., description="The option answer text")


class SecureQuestionResponse(BaseModel):
    """Secure question representation for active test taking: NO correct answers or explanations leaked."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    concept_id: str
    concept_name: Optional[str] = None
    question_text: str
    options: List[OptionItem]
    difficulty: str


class QuestionDetail(BaseModel):
    """Full question schema with correct answer and explanation for after-test review or validation."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    concept_id: str
    question_text: str
    options: List[OptionItem]
    correct_option: str
    explanation: str
    difficulty: str
    is_ai_generated: bool = False
    is_validated: bool = True


# --- Assessment Submission Schemas ---

class QuestionAnswer(BaseModel):
    question_id: str
    selected_option: str


class AssessmentSubmissionRequest(BaseModel):
    student_id: str
    concept_id: str
    answers: List[QuestionAnswer]


class QuestionEvaluationItem(BaseModel):
    question_id: str
    question_text: str
    options: List[OptionItem]
    selected_option: str
    correct_option: str
    is_correct: bool
    explanation: str


class RecommendationItem(BaseModel):
    student_id: str
    concept_id: str
    concept_name: str
    status: str  # weak, needs_practice, strong, not_started
    action_type: str  # review_prerequisite, review_concept, practice_more, advance_next
    title: str
    recommendation: str
    reason: str
    recommended_note_id: Optional[str] = None
    prerequisite_concept_id: Optional[str] = None
    prerequisite_concept_name: Optional[str] = None


class AssessmentSubmissionResult(BaseModel):
    submission_id: str
    student_id: str
    concept_id: str
    concept_name: str
    total_questions: int
    correct_answers: int
    score_percentage: float
    status: str
    items: List[QuestionEvaluationItem]
    recommendation: RecommendationItem


# --- Progress & Dashboard Schemas ---

class ConceptProgressItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    concept_id: str
    concept_name: str
    topic_id: str
    topic_name: Optional[str] = None
    attempts_count: int
    correct_count: int
    mastery_score: float
    status: str
    last_updated: Optional[datetime] = None


class StudentDashboardResponse(BaseModel):
    student_id: str
    student_name: str
    total_attempts: int
    overall_mastery: float
    weak_concepts: List[ConceptProgressItem]
    all_progress: List[ConceptProgressItem]
    active_recommendation: Optional[RecommendationItem] = None


# --- Hierarchy Schemas (Subject, Topic, Concept) ---

class ConceptSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    topic_id: str
    name: str
    description: Optional[str] = None
    order_index: int
    prerequisite_concept_id: Optional[str] = None
    prerequisite_concept_name: Optional[str] = None
    questions_count: Optional[int] = 0
    student_status: Optional[str] = "not_started"
    student_mastery: Optional[float] = 0.0


class TopicWithConcepts(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    subject_id: str
    name: str
    description: Optional[str] = None
    order_index: int
    concepts: List[ConceptSummary] = []


class SubjectDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = "BookOpen"
    topics: List[TopicWithConcepts] = []


# --- Note Schemas ---

class NoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    concept_id: str
    concept_name: Optional[str] = None
    title: str
    markdown_content: str
    is_ai_generated: bool = False
    created_at: Optional[datetime] = None


class GenerateNoteRequest(BaseModel):
    concept_id: str
    student_id: Optional[str] = None
    focus_areas: Optional[List[str]] = None


# --- AI Question Generation Schemas ---

class GenerateQuestionRequest(BaseModel):
    concept_id: str
    subject: Optional[str] = "Machine Learning"
    topic: Optional[str] = "Optimization"
    difficulty: Optional[str] = "medium"
    learning_objective: Optional[str] = None


class AIQuestionValidationResult(BaseModel):
    is_valid: bool
    errors: List[str] = []
    validated_question: Optional[QuestionDetail] = None


# --- Dynamic Curriculum Authoring Schemas ---

class CreateSubjectRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    description: Optional[str] = None
    icon: Optional[str] = "BookOpen"


class GenerateCurriculumRequest(BaseModel):
    subject_name: str = Field(..., min_length=2, max_length=128)
    description: Optional[str] = None
    num_topics: Optional[int] = 3
    concepts_per_topic: Optional[int] = 2


class GenerateConceptRequest(BaseModel):
    concept_hint: str = Field(..., min_length=2, max_length=128)


class CreateTopicRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    description: Optional[str] = None


class CreateConceptRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    description: Optional[str] = None
    prerequisite_concept_id: Optional[str] = None
    initial_note_markdown: Optional[str] = None


class CreateQuestionRequest(BaseModel):
    concept_id: str
    question_text: str = Field(..., min_length=10)
    options: List[OptionItem]
    correct_option: str
    explanation: str = Field(..., min_length=10)
    difficulty: Optional[str] = "medium"


# --- Baseline Diagnostic Assessment Schemas ---

class DiagnosticAnswerItem(BaseModel):
    question_id: str
    concept_id: str
    selected_option: str


class SubmitDiagnosticRequest(BaseModel):
    student_id: str = "demo-student-1"
    subject_id: str
    answers: List[DiagnosticAnswerItem]


class DiagnosticConceptBreakdown(BaseModel):
    concept_id: str
    concept_name: str
    topic_name: Optional[str] = None
    total_questions: int
    correct_count: int
    score_percentage: float
    status: str  # 'weak' | 'needs_practice' | 'strong'
    recommendation: str


class DiagnosticResult(BaseModel):
    subject_id: str
    subject_name: str
    student_id: str
    total_questions: int
    total_correct: int
    overall_score: float
    weak_concept_count: int
    strong_concept_count: int
    concept_breakdown: List[DiagnosticConceptBreakdown]
    recommended_start_concept_id: Optional[str] = None
    recommended_start_concept_name: Optional[str] = None
    summary_message: str


