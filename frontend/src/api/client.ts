import type {
  SubjectDetail,
  ConceptSummary,
  SecureQuestion,
  AssessmentSubmissionResult,
  StudentDashboard,
  NoteResponse,
  QuestionDetail,
  AIValidationResult,
  RecommendationItem
} from '../types';

const rawBase = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const API_BASE = rawBase ? (rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`) : '/api';

export const apiClient = {
  // Subjects & Topics
  async getSubjects(studentId?: string): Promise<SubjectDetail[]> {
    const url = studentId ? `${API_BASE}/subjects?student_id=${studentId}` : `${API_BASE}/subjects`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch subjects: ${res.statusText}`);
    return res.json();
  },

  // Concepts & Progress
  async getConcept(conceptId: string, studentId?: string): Promise<ConceptSummary> {
    const url = studentId
      ? `${API_BASE}/concepts/${conceptId}?student_id=${studentId}`
      : `${API_BASE}/concepts/${conceptId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch concept: ${res.statusText}`);
    return res.json();
  },

  async getDashboard(studentId: string = 'demo-student-1'): Promise<StudentDashboard> {
    const res = await fetch(`${API_BASE}/students/${studentId}/dashboard`);
    if (!res.ok) throw new Error(`Failed to fetch student dashboard: ${res.statusText}`);
    return res.json();
  },

  // Notes
  async getNote(conceptId: string, studentId?: string, personalized: boolean = false): Promise<NoteResponse> {
    const params = new URLSearchParams();
    if (studentId) params.append('student_id', studentId);
    if (personalized) params.append('personalized', 'true');

    const res = await fetch(`${API_BASE}/notes/${conceptId}?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch note: ${res.statusText}`);
    return res.json();
  },

  // Assessments
  async getAssessmentQuestions(conceptId: string, limit: number = 5): Promise<SecureQuestion[]> {
    const res = await fetch(`${API_BASE}/assessments/questions?concept_id=${conceptId}&limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to fetch assessment questions: ${res.statusText}`);
    return res.json();
  },

  async submitAssessment(payload: {
    student_id: string;
    concept_id: string;
    answers: { question_id: string; selected_option: string }[];
  }): Promise<AssessmentSubmissionResult> {
    const res = await fetch(`${API_BASE}/assessments/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to submit assessment: ${res.statusText}`);
    return res.json();
  },

  // Recommendations
  async getRecommendation(studentId: string = 'demo-student-1'): Promise<RecommendationItem> {
    const res = await fetch(`${API_BASE}/recommendations/${studentId}`);
    if (!res.ok) throw new Error(`Failed to fetch recommendation: ${res.statusText}`);
    return res.json();
  },

  // AI & Quality Validation
  async generateQuestion(payload: {
    concept_id: string;
    subject?: string;
    topic?: string;
    difficulty?: string;
  }): Promise<QuestionDetail> {
    const res = await fetch(`${API_BASE}/assessments/generate-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to generate AI question: ${res.statusText}`);
    return res.json();
  },

  async validateQuestion(payload: any): Promise<AIValidationResult> {
    const res = await fetch(`${API_BASE}/assessments/validate-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to validate question: ${res.statusText}`);
    return res.json();
  },

  // Dynamic Curriculum Authoring
  async createSubject(payload: { name: string; description?: string; icon?: string }): Promise<SubjectDetail> {
    const res = await fetch(`${API_BASE}/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to create subject: ${res.statusText}`);
    }
    return res.json();
  },

  async createTopic(subjectId: string, payload: { name: string; description?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/subjects/${encodeURIComponent(subjectId)}/topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to create topic: ${res.statusText}`);
    }
    return res.json();
  },

  async createConcept(topicId: string, payload: {
    name: string;
    description?: string;
    prerequisite_concept_id?: string;
    initial_note_markdown?: string;
  }): Promise<ConceptSummary> {
    const res = await fetch(`${API_BASE}/subjects/topics/${encodeURIComponent(topicId)}/concepts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to create concept: ${res.statusText}`);
    }
    return res.json();
  },

  async createQuestion(payload: {
    concept_id: string;
    question_text: string;
    options: { id: string; text: string }[];
    correct_option: string;
    explanation: string;
    difficulty?: string;
  }): Promise<QuestionDetail> {
    const res = await fetch(`${API_BASE}/assessments/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to create question: ${res.statusText}`);
    }
    return res.json();
  }
};

