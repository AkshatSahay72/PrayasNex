export interface OptionItem {
  id: string;
  text: string;
}

export interface SecureQuestion {
  id: string;
  concept_id: string;
  concept_name?: string;
  question_text: string;
  options: OptionItem[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuestionEvaluationItem {
  question_id: string;
  question_text: string;
  options: OptionItem[];
  selected_option: string;
  correct_option: string;
  is_correct: boolean;
  explanation: string;
}

export interface RecommendationItem {
  student_id: string;
  concept_id: string;
  concept_name: string;
  status: 'weak' | 'needs_practice' | 'strong' | 'not_started';
  action_type: 'review_prerequisite' | 'review_concept' | 'practice_more' | 'advance_next';
  title: string;
  recommendation: string;
  reason: string;
  recommended_note_id?: string;
  prerequisite_concept_id?: string;
  prerequisite_concept_name?: string;
}

export interface AssessmentSubmissionResult {
  submission_id: string;
  student_id: string;
  concept_id: string;
  concept_name: string;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  status: 'weak' | 'needs_practice' | 'strong';
  items: QuestionEvaluationItem[];
  recommendation: RecommendationItem;
}

export interface ConceptProgressItem {
  concept_id: string;
  concept_name: string;
  topic_id: string;
  topic_name?: string;
  attempts_count: number;
  correct_count: number;
  mastery_score: number;
  status: 'weak' | 'needs_practice' | 'strong' | 'not_started';
  last_updated?: string;
}

export interface StudentDashboard {
  student_id: string;
  student_name: string;
  total_attempts: number;
  overall_mastery: number;
  weak_concepts: ConceptProgressItem[];
  all_progress: ConceptProgressItem[];
  active_recommendation?: RecommendationItem;
}

export interface ConceptSummary {
  id: string;
  topic_id: string;
  name: string;
  description?: string;
  order_index: number;
  prerequisite_concept_id?: string;
  prerequisite_concept_name?: string;
  questions_count: number;
  student_status: 'weak' | 'needs_practice' | 'strong' | 'not_started';
  student_mastery: number;
}

export interface TopicWithConcepts {
  id: string;
  subject_id: string;
  name: string;
  description?: string;
  order_index: number;
  concepts: ConceptSummary[];
}

export interface SubjectDetail {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  topics: TopicWithConcepts[];
}

export interface NoteResponse {
  id: string;
  concept_id: string;
  concept_name?: string;
  title: string;
  markdown_content: string;
  is_ai_generated: boolean;
  created_at?: string;
}

export interface QuestionDetail {
  id: string;
  concept_id: string;
  question_text: string;
  options: OptionItem[];
  correct_option: string;
  explanation: string;
  difficulty: string;
  is_ai_generated: boolean;
  is_validated: boolean;
}

export interface AIValidationResult {
  is_valid: boolean;
  errors: string[];
}

export interface DiagnosticConceptBreakdown {
  concept_id: string;
  concept_name: string;
  topic_name?: string;
  total_questions: number;
  correct_count: number;
  score_percentage: number;
  status: 'weak' | 'needs_practice' | 'strong';
  recommendation: string;
}

export interface DiagnosticResult {
  subject_id: string;
  subject_name: string;
  student_id: string;
  total_questions: number;
  total_correct: number;
  overall_score: number;
  weak_concept_count: number;
  strong_concept_count: number;
  concept_breakdown: DiagnosticConceptBreakdown[];
  recommended_start_concept_id?: string;
  recommended_start_concept_name?: string;
  summary_message: string;
}

