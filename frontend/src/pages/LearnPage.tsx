import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import type { SubjectDetail, SecureQuestion, DiagnosticResult } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Zap,
  X
} from 'lucide-react';

interface LearnPageProps {
  onSelectConcept: (conceptId: string) => void;
  onStartTest: (conceptId: string) => void;
}

type ModalType = 'subject' | 'topic' | 'concept' | 'question' | 'ai_curriculum' | 'ai_concept' | null;

export const LearnPage: React.FC<LearnPageProps> = ({
  onSelectConcept,
  onStartTest
}) => {
  const [subjects, setSubjects] = useState<SubjectDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Target IDs for nested creations
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedConceptId, setSelectedConceptId] = useState<string>('');

  // Form Fields - Manual
  const [subjectName, setSubjectName] = useState('');
  const [subjectDescription, setSubjectDescription] = useState('');

  const [topicName, setTopicName] = useState('');
  const [topicDescription, setTopicDescription] = useState('');

  const [conceptName, setConceptName] = useState('');
  const [conceptDescription, setConceptDescription] = useState('');
  const [conceptPrereqId, setConceptPrereqId] = useState('');
  const [conceptNote, setConceptNote] = useState('');

  const [qText, setQText] = useState('');
  const [qOptionA, setQOptionA] = useState('');
  const [qOptionB, setQOptionB] = useState('');
  const [qOptionC, setQOptionC] = useState('');
  const [qOptionD, setQOptionD] = useState('');
  const [qCorrect, setQCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [qExplanation, setQExplanation] = useState('');
  const [qDifficulty, setQDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Form Fields - AI Generation
  const [aiSubjectName, setAiSubjectName] = useState('');
  const [aiSubjectDesc, setAiSubjectDesc] = useState('');
  const [aiTopicCount, setAiTopicCount] = useState<number>(3);
  const [aiConceptCount, setAiConceptCount] = useState<number>(2);
  const [aiConceptHint, setAiConceptHint] = useState('');

  // Diagnostic Test States
  const [activeDiagnosticSubject, setActiveDiagnosticSubject] = useState<{ id: string; name: string } | null>(null);
  const [diagnosticQuestions, setDiagnosticQuestions] = useState<SecureQuestion[]>([]);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<string, string>>({});
  const [diagnosticCurrentIndex, setDiagnosticCurrentIndex] = useState<number>(0);
  const [diagnosticLoading, setDiagnosticLoading] = useState<boolean>(false);
  const [diagnosticSubmitting, setDiagnosticSubmitting] = useState<boolean>(false);
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getSubjects('demo-student-1');
      setSubjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load curriculum');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getSubjects('demo-student-1');
        if (isMounted) {
          setSubjects(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load curriculum');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const resetForms = useCallback(() => {
    setActiveModal(null);
    setModalError(null);
    setSubjectName('');
    setSubjectDescription('');
    setTopicName('');
    setTopicDescription('');
    setConceptName('');
    setConceptDescription('');
    setConceptPrereqId('');
    setConceptNote('');
    setQText('');
    setQOptionA('');
    setQOptionB('');
    setQOptionC('');
    setQOptionD('');
    setQCorrect('A');
    setQExplanation('');
    setQDifficulty('medium');
    setAiSubjectName('');
    setAiSubjectDesc('');
    setAiConceptHint('');
  }, []);

  // Keyboard Escape listener to dismiss any open modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeDiagnosticSubject) {
          setActiveDiagnosticSubject(null);
        } else if (activeModal) {
          resetForms();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDiagnosticSubject, activeModal, resetForms]);

  // Lock body scroll when modal or diagnostic is open
  useEffect(() => {
    if (activeModal || activeDiagnosticSubject) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeModal, activeDiagnosticSubject]);

  // Collect all concepts across all subjects/topics for prerequisite selection
  const allConcepts: { id: string; name: string }[] = [];
  subjects.forEach((s) => {
    s.topics.forEach((t) => {
      t.concepts.forEach((c) => {
        allConcepts.push({ id: c.id, name: `${c.name} (${t.name})` });
      });
    });
  });

  // 1. Manual Create Subject
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;
    try {
      setModalSubmitting(true);
      setModalError(null);
      await apiClient.createSubject({
        name: subjectName.trim(),
        description: subjectDescription.trim() || undefined,
      });
      setActionSuccess(`Subject "${subjectName.trim()}" created successfully.`);
      resetForms();
      await fetchSubjects();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create subject');
    } finally {
      setModalSubmitting(false);
    }
  };

  // 2. AI Generate Entire Subject Curriculum (Groq)
  const handleAIGenerateCurriculum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSubjectName.trim()) return;
    try {
      setModalSubmitting(true);
      setModalError(null);
      const generated = await apiClient.generateCurriculum({
        subject_name: aiSubjectName.trim(),
        description: aiSubjectDesc.trim() || undefined,
        num_topics: Number(aiTopicCount) || 3,
        concepts_per_topic: Number(aiConceptCount) || 2,
      });
      setActionSuccess(`Generated full curriculum for "${generated.name}" with study guides and MCQs.`);
      resetForms();
      await fetchSubjects();
      // Prompt user to take baseline diagnostic test on newly generated subject
      startDiagnosticTest(generated.id, generated.name);
    } catch (err: any) {
      setModalError(err.message || 'Failed to generate curriculum with AI');
    } finally {
      setModalSubmitting(false);
    }
  };

  // 3. AI Generate Single Concept
  const handleAIGenerateConcept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId || !aiConceptHint.trim()) return;
    try {
      setModalSubmitting(true);
      setModalError(null);
      const concept = await apiClient.generateConceptWithAI(selectedTopicId, {
        concept_hint: aiConceptHint.trim(),
      });
      setActionSuccess(`Concept "${concept.name}" generated with note and questions.`);
      resetForms();
      await fetchSubjects();
    } catch (err: any) {
      setModalError(err.message || 'Failed to generate concept with AI');
    } finally {
      setModalSubmitting(false);
    }
  };

  // 4. Manual Create Topic
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !topicName.trim()) return;
    try {
      setModalSubmitting(true);
      setModalError(null);
      await apiClient.createTopic(selectedSubjectId, {
        name: topicName.trim(),
        description: topicDescription.trim() || undefined,
      });
      setActionSuccess(`Topic "${topicName.trim()}" added.`);
      resetForms();
      await fetchSubjects();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create topic');
    } finally {
      setModalSubmitting(false);
    }
  };

  // 5. Manual Create Concept
  const handleCreateConcept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId || !conceptName.trim()) return;
    try {
      setModalSubmitting(true);
      setModalError(null);
      await apiClient.createConcept(selectedTopicId, {
        name: conceptName.trim(),
        description: conceptDescription.trim() || undefined,
        prerequisite_concept_id: conceptPrereqId || undefined,
        initial_note_markdown: conceptNote.trim() || undefined,
      });
      setActionSuccess(`Concept "${conceptName.trim()}" created.`);
      resetForms();
      await fetchSubjects();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create concept');
    } finally {
      setModalSubmitting(false);
    }
  };

  // 6. Manual Create Question
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConceptId || !qText.trim() || !qExplanation.trim()) return;
    if (!qOptionA.trim() || !qOptionB.trim() || !qOptionC.trim() || !qOptionD.trim()) {
      setModalError('Please provide text for all 4 options (A, B, C, D).');
      return;
    }
    try {
      setModalSubmitting(true);
      setModalError(null);
      await apiClient.createQuestion({
        concept_id: selectedConceptId,
        question_text: qText.trim(),
        options: [
          { id: 'A', text: qOptionA.trim() },
          { id: 'B', text: qOptionB.trim() },
          { id: 'C', text: qOptionC.trim() },
          { id: 'D', text: qOptionD.trim() },
        ],
        correct_option: qCorrect,
        explanation: qExplanation.trim(),
        difficulty: qDifficulty,
      });
      setActionSuccess('Question validated and added to concept pool.');
      resetForms();
      await fetchSubjects();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create question');
    } finally {
      setModalSubmitting(false);
    }
  };

  // --- Diagnostic Assessment Flow ---
  const startDiagnosticTest = async (subjectId: string, subjectName: string) => {
    try {
      setDiagnosticLoading(true);
      setDiagnosticResult(null);
      setDiagnosticError(null);
      setActiveDiagnosticSubject({ id: subjectId, name: subjectName });
      setDiagnosticAnswers({});
      setDiagnosticCurrentIndex(0);

      const qs = await apiClient.getDiagnosticQuestions(subjectId);
      setDiagnosticQuestions(qs);
    } catch (err: any) {
      setDiagnosticError(err.message || 'Failed to load diagnostic assessment for this subject.');
    } finally {
      setDiagnosticLoading(false);
    }
  };

  const handleSelectDiagnosticOption = (questionId: string, optionId: string) => {
    setDiagnosticAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmitDiagnostic = async () => {
    if (!activeDiagnosticSubject) return;
    try {
      setDiagnosticSubmitting(true);
      setDiagnosticError(null);
      const answersPayload = diagnosticQuestions.map((q) => ({
        question_id: q.id,
        concept_id: q.concept_id,
        selected_option: diagnosticAnswers[q.id] || 'A',
      }));

      const res = await apiClient.submitDiagnostic({
        student_id: 'demo-student-1',
        subject_id: activeDiagnosticSubject.id,
        answers: answersPayload,
      });

      setDiagnosticResult(res);
      await fetchSubjects();
    } catch (err: any) {
      setDiagnosticError(err.message || 'Failed to submit diagnostic assessment');
    } finally {
      setDiagnosticSubmitting(false);
    }
  };

  // Filter subjects / topics / concepts by searchQuery
  const filteredSubjects = subjects
    .map((s) => {
      const q = searchQuery.toLowerCase();
      if (!q) return s;
      const subjectMatches = s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q));
      if (subjectMatches) return s;

      const filteredTopics = s.topics
        .map((t) => {
          const topicMatches = t.name.toLowerCase().includes(q);
          const filteredConcepts = t.concepts.filter((c) =>
            c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q))
          );
          if (topicMatches || filteredConcepts.length > 0) {
            return { ...t, concepts: filteredConcepts.length > 0 ? filteredConcepts : t.concepts };
          }
          return null;
        })
        .filter((t): t is typeof s.topics[0] => t !== null);

      if (filteredTopics.length > 0) {
        return { ...s, topics: filteredTopics };
      }
      return null;
    })
    .filter((s): s is SubjectDetail => s !== null);

  if (loading) {
    return (
      <div className="p-6 md:p-10 max-w-4xl space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 bg-[#182030] rounded" />
          <div className="h-8 w-44 bg-[#182030] rounded" />
        </div>
        <div className="h-28 bg-[#121622] rounded-lg border border-[#1f2638]" />
        <div className="h-44 bg-[#121622] rounded-lg border border-[#1f2638]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-10 max-w-2xl space-y-4">
        <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-sm text-rose-300">
            <AlertCircle className="w-4 h-4" />
            <span>Error loading curriculum modules</span>
          </div>
          <p className="text-xs text-rose-300/80">{error}</p>
        </div>
        <button
          onClick={fetchSubjects}
          className="px-4 py-2 text-xs font-medium bg-[#1e2533] hover:bg-[#283142] text-white rounded-md transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-4xl space-y-8">
      {/* Header with Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Curriculum & Knowledge Graph</h1>
          <p className="text-xs text-[#7f8ba0] mt-1">
            Structured knowledge graph with prerequisite dependencies and diagnostic baseline assessment.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              resetForms();
              setActiveModal('ai_curriculum');
            }}
            className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Curriculum (Groq)</span>
          </button>

          <button
            onClick={() => {
              resetForms();
              setActiveModal('subject');
            }}
            className="px-3 py-2 text-xs font-medium bg-[#1c222e] hover:bg-[#262f40] text-[#a4b2c7] border border-[#2b3548] rounded-md transition-colors shrink-0 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Subject</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-md flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-400 hover:text-white font-bold ml-4 p-1"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      {subjects.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-[#556379] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search subjects, topics, or concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#11141c] border border-[#202738] rounded-lg text-white placeholder-[#556379] focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      )}

      {/* Subjects List */}
      {filteredSubjects.length === 0 ? (
        <div className="p-8 border border-dashed border-[#242c3d] rounded-lg text-center space-y-4 bg-[#11151e]">
          <p className="text-sm text-[#8c98ad]">
            {searchQuery
              ? `No curriculum elements found matching "${searchQuery}".`
              : 'No subjects configured in the curriculum yet.'}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => {
                resetForms();
                setActiveModal('ai_curriculum');
              }}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-md flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Subject with Groq AI</span>
            </button>
            <button
              onClick={() => {
                resetForms();
                setActiveModal('subject');
              }}
              className="px-3.5 py-2 text-xs font-medium bg-[#191f2c] text-[#8c98ad] hover:text-white border border-[#263145] rounded-md"
            >
              + Create Manually
            </button>
          </div>
        </div>
      ) : (
        filteredSubjects.map((subject) => (
          <div key={subject.id} className="space-y-6 bg-[#0f131a] p-4 sm:p-6 rounded-lg border border-[#1b212d]">
            {/* Subject Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1f2533] gap-3">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>{subject.name}</span>
                </h2>
                {subject.description && (
                  <p className="text-xs text-[#738096] mt-0.5">{subject.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  onClick={() => startDiagnosticTest(subject.id, subject.name)}
                  className="px-3 py-1.5 text-xs font-semibold bg-amber-950/70 hover:bg-amber-900/80 text-amber-200 border border-amber-700/60 rounded-md transition-colors flex items-center gap-1.5 shadow-xs"
                  title="Take baseline test to evaluate prior knowledge across all concepts"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Baseline Diagnostic Test</span>
                </button>

                <button
                  onClick={() => {
                    resetForms();
                    setSelectedSubjectId(subject.id);
                    setActiveModal('topic');
                  }}
                  className="px-2.5 py-1.5 text-xs font-medium bg-[#1a202c] hover:bg-[#232c3d] text-[#a4b1c7] border border-[#263145] rounded-md transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Topic</span>
                </button>
              </div>
            </div>

            {/* Topics */}
            {subject.topics.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#5f6c82] italic">
                No topics in this subject yet. Click "+ Topic" above.
              </div>
            ) : (
              subject.topics.map((topic) => (
                <div key={topic.id} className="space-y-3 pl-1 sm:pl-3">
                  {/* Topic Title with AI and Manual Add Concept buttons */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-[#8e9bb0] uppercase tracking-wider">
                      Topic: {topic.name}
                    </h3>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          resetForms();
                          setSelectedTopicId(topic.id);
                          setActiveModal('ai_concept');
                        }}
                        className="px-2 py-1 text-[11px] font-medium bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/60 rounded transition-colors flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span>AI Concept</span>
                      </button>

                      <button
                        onClick={() => {
                          resetForms();
                          setSelectedTopicId(topic.id);
                          setConceptNote(`# ${topic.name}: New Concept\n\n## Overview\nCore pedagogical notes.\n\n## Key Mechanics\nFoundational rules and properties.\n\n## Practice\nTake assessment to confirm mastery.`);
                          setActiveModal('concept');
                        }}
                        className="px-2 py-1 text-[11px] font-medium bg-[#141923] hover:bg-[#1f2636] text-[#8695ad] border border-[#222938] rounded transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Concept</span>
                      </button>
                    </div>
                  </div>

                  {/* Concepts Container */}
                  <div className="border border-[#202738] rounded-lg overflow-hidden bg-[#11141c] divide-y divide-[#1e2432]">
                    {topic.concepts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[#525d70]">
                        No concepts created under this topic yet.
                      </div>
                    ) : (
                      topic.concepts.map((concept, index) => (
                        <div
                          key={concept.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#151a25] transition-colors"
                        >
                          <div className="space-y-1 max-w-lg">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-[#525d70] font-mono">
                                0{index + 1}.
                              </span>
                              <button
                                onClick={() => onSelectConcept(concept.id)}
                                className="text-sm font-semibold text-white hover:text-blue-400 transition-colors text-left"
                              >
                                {concept.name}
                              </button>
                              <StatusBadge status={concept.student_status} />
                              {concept.questions_count !== undefined && (
                                <span className="text-[10px] text-[#556379] bg-[#161c28] px-1.5 py-0.5 rounded border border-[#202738]">
                                  {concept.questions_count} MCQs
                                </span>
                              )}
                            </div>

                            {concept.description && (
                              <p className="text-xs text-[#7e8ba0] line-clamp-1">
                                {concept.description}
                              </p>
                            )}

                            {concept.prerequisite_concept_name && (
                              <div className="text-[11px] text-[#9c844f] flex items-center gap-1">
                                <span>Prerequisite:</span>
                                <span className="font-semibold text-[#cfa868]">
                                  {concept.prerequisite_concept_name}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <button
                              onClick={() => {
                                resetForms();
                                setSelectedConceptId(concept.id);
                                setActiveModal('question');
                              }}
                              className="px-2.5 py-1.5 text-xs font-medium bg-[#141924] hover:bg-[#1f2738] text-[#8695ad] border border-[#222b3d] rounded-md transition-colors"
                              title="Add custom validated question"
                            >
                              + MCQ
                            </button>
                            <button
                              onClick={() => onSelectConcept(concept.id)}
                              className="px-3 py-1.5 text-xs font-medium bg-[#191f2c] hover:bg-[#222a3b] text-[#9ba7ba] border border-[#283142] rounded-md transition-colors flex items-center gap-1"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Study</span>
                            </button>
                            <button
                              onClick={() => onStartTest(concept.id)}
                              className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors flex items-center gap-1 shadow-xs"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>Test</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ))
      )}

      {/* --- DIAGNOSTIC ASSESSMENT MODAL / FULL VIEW --- */}
      {activeDiagnosticSubject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="diagnostic-dialog-title"
          onClick={() => setActiveDiagnosticSubject(null)}
        >
          <div
            className="bg-[#11151f] border border-[#252f44] rounded-xl max-w-2xl w-full p-6 space-y-6 shadow-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {diagnosticLoading ? (
              <div className="py-12 text-center text-sm text-[#8c98ad] flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                <span>Loading diagnostic assessment for {activeDiagnosticSubject.name}...</span>
              </div>
            ) : diagnosticError && !diagnosticResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-lg text-xs space-y-1">
                  <div className="font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>Diagnostic Test Notice</span>
                  </div>
                  <p>{diagnosticError}</p>
                </div>
                <button
                  onClick={() => setActiveDiagnosticSubject(null)}
                  className="px-4 py-2 text-xs font-medium bg-[#1c222e] text-white rounded-md"
                >
                  Close
                </button>
              </div>
            ) : diagnosticResult ? (
              /* Diagnostic Result Report */
              <div className="space-y-6">
                <div className="border-b border-[#202738] pb-4 flex items-center justify-between">
                  <div>
                    <h3 id="diagnostic-dialog-title" className="text-base font-bold text-white">
                      Diagnostic Baseline Report: {diagnosticResult.subject_name}
                    </h3>
                    <p className="text-xs text-[#7f8ba0] mt-0.5">
                      Prior knowledge evaluated across {diagnosticResult.concept_breakdown.length} concepts.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveDiagnosticSubject(null)}
                    className="p-1 rounded text-[#717d91] hover:text-white text-base"
                    aria-label="Close dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Score Summary Box */}
                <div className="grid grid-cols-3 gap-3 p-4 bg-[#0a0d13] border border-[#1e2535] rounded-lg text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">{diagnosticResult.overall_score}%</div>
                    <div className="text-[11px] text-[#717e94] uppercase tracking-wider mt-0.5">Baseline Score</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-rose-400">{diagnosticResult.weak_concept_count}</div>
                    <div className="text-[11px] text-[#717e94] uppercase tracking-wider mt-0.5">Needs Attention</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-400">{diagnosticResult.strong_concept_count}</div>
                    <div className="text-[11px] text-[#717e94] uppercase tracking-wider mt-0.5">Mastered Baseline</div>
                  </div>
                </div>

                {/* Summary Alert */}
                <div className="p-3 bg-[#151c28] border border-[#263348] rounded-md text-xs text-[#a9b7cc]">
                  {diagnosticResult.summary_message}
                </div>

                {/* Concept Diagnostic Breakdown Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-[#8c98ad] uppercase tracking-wider">Concept Diagnostic Breakdown</h4>
                  <div className="border border-[#202738] rounded-lg overflow-hidden divide-y divide-[#1e2432] bg-[#0c0f16]">
                    {diagnosticResult.concept_breakdown.map((item) => (
                      <div key={item.concept_id} className="p-3 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">{item.concept_name}</span>
                            <StatusBadge status={item.status as any} />
                          </div>
                          <p className="text-[11px] text-[#758399]">{item.recommendation}</p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-mono text-[#a3b1c6]">{item.score_percentage}%</span>
                          <button
                            onClick={() => {
                              setActiveDiagnosticSubject(null);
                              onSelectConcept(item.concept_id);
                            }}
                            className="px-2.5 py-1 text-xs font-medium bg-[#1a202c] hover:bg-[#232c3d] text-blue-400 border border-[#263145] rounded-md transition-colors"
                          >
                            Study
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-between pt-2 border-t border-[#1f2636]">
                  <button
                    onClick={() => setActiveDiagnosticSubject(null)}
                    className="px-3.5 py-1.5 text-xs text-[#8c98ad] hover:text-white"
                  >
                    Back to Curriculum
                  </button>

                  {diagnosticResult.recommended_start_concept_id && (
                    <button
                      onClick={() => {
                        const targetId = diagnosticResult.recommended_start_concept_id!;
                        setActiveDiagnosticSubject(null);
                        onSelectConcept(targetId);
                      }}
                      className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Start with {diagnosticResult.recommended_start_concept_name}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : diagnosticQuestions.length > 0 ? (
              /* Diagnostic Questions Wizard */
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#1f2636]">
                  <div>
                    <h3 id="diagnostic-dialog-title" className="text-sm font-bold text-white">
                      Baseline Diagnostic: {activeDiagnosticSubject.name}
                    </h3>
                    <p className="text-[11px] text-[#717e94]">
                      Question {diagnosticCurrentIndex + 1} of {diagnosticQuestions.length} — Assessing prior knowledge
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveDiagnosticSubject(null)}
                    className="p-1 rounded text-[#717d91] hover:text-white text-base"
                    aria-label="Close dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#181e2b] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all duration-300"
                    style={{
                      width: `${((diagnosticCurrentIndex + 1) / diagnosticQuestions.length) * 100}%`,
                    }}
                  />
                </div>

                {/* Active Question */}
                {(() => {
                  const currentQ = diagnosticQuestions[diagnosticCurrentIndex];
                  return (
                    <div className="space-y-4">
                      <div className="text-xs font-mono text-amber-400/90">
                        {currentQ.concept_name || 'Concept Assessment'}
                      </div>

                      <h4 className="text-sm font-semibold text-white leading-relaxed">
                        {currentQ.question_text}
                      </h4>

                      <div className="space-y-2 pt-2">
                        {currentQ.options.map((opt) => {
                          const isSelected = diagnosticAnswers[currentQ.id] === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSelectDiagnosticOption(currentQ.id, opt.id)}
                              className={`w-full text-left p-3.5 rounded-lg text-xs transition-colors flex items-start gap-3 border ${
                                isSelected
                                  ? 'bg-amber-950/40 border-amber-600 text-amber-100 font-medium'
                                  : 'bg-[#0b0e14] border-[#202838] text-[#9eb0cc] hover:bg-[#151a24] hover:text-white'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 flex items-center justify-center rounded text-[11px] font-bold shrink-0 mt-0.5 ${
                                  isSelected
                                    ? 'bg-amber-500 text-black'
                                    : 'bg-[#181f2c] text-[#738299]'
                                }`}
                              >
                                {opt.id}
                              </span>
                              <span className="pt-0.5 leading-snug">{opt.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Diagnostic Wizard Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-[#1f2636]">
                  <button
                    type="button"
                    disabled={diagnosticCurrentIndex === 0}
                    onClick={() => setDiagnosticCurrentIndex((i) => Math.max(0, i - 1))}
                    className="px-3 py-1.5 text-xs text-[#8c98ad] hover:text-white disabled:opacity-30"
                  >
                    ← Previous
                  </button>

                  {diagnosticCurrentIndex < diagnosticQuestions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setDiagnosticCurrentIndex((i) => i + 1)}
                      className="px-4 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-black rounded-md transition-colors"
                    >
                      Next Question →
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={diagnosticSubmitting}
                      onClick={handleSubmitDiagnostic}
                      className="px-5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {diagnosticSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{diagnosticSubmitting ? 'Evaluating Baseline...' : 'Submit Diagnostic'}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-[#8c98ad] space-y-3">
                <p>No questions configured for this subject yet.</p>
                <button
                  onClick={() => setActiveDiagnosticSubject(null)}
                  className="px-3.5 py-1.5 text-xs bg-[#1a202c] rounded-md text-white"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* 1. AI Generate Curriculum Modal (Groq) */}
      {activeModal === 'ai_curriculum' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-ai-curriculum-title"
          onClick={resetForms}
        >
          <div
            className="bg-[#121620] border border-[#252e40] rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1f2636]">
              <div>
                <h3 id="modal-ai-curriculum-title" className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>AI Curriculum Generator (Groq)</span>
                </h3>
                <p className="text-[11px] text-[#717d91]">
                  Instantly drafts topics, concepts, study notes, and MCQs.
                </p>
              </div>
              <button
                onClick={resetForms}
                className="p-1 rounded text-[#717d91] hover:text-white text-base"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 text-xs bg-rose-950/40 border border-rose-800 text-rose-300 rounded-md">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAIGenerateCurriculum} className="space-y-4">
              <div>
                <label htmlFor="ai-sub-name" className="block text-xs font-semibold text-[#8c98ad] mb-1">
                  Subject Name *
                </label>
                <input
                  id="ai-sub-name"
                  type="text"
                  required
                  value={aiSubjectName}
                  onChange={(e) => setAiSubjectName(e.target.value)}
                  placeholder="e.g. Operating Systems, Distributed Systems, Compiler Design"
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded-md text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="ai-sub-scope" className="block text-xs font-semibold text-[#8c98ad] mb-1">
                  Context / Syllabus Scope (optional)
                </label>
                <textarea
                  id="ai-sub-scope"
                  rows={2}
                  value={aiSubjectDesc}
                  onChange={(e) => setAiSubjectDesc(e.target.value)}
                  placeholder="e.g. Focus on memory hierarchy, virtual memory, process scheduling, and concurrency."
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded-md text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ai-topic-count" className="block text-xs font-semibold text-[#8c98ad] mb-1">
                    Number of Topics
                  </label>
                  <select
                    id="ai-topic-count"
                    value={aiTopicCount}
                    onChange={(e) => setAiTopicCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded-md text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={2}>2 Topics</option>
                    <option value={3}>3 Topics</option>
                    <option value={4}>4 Topics</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="ai-concept-count" className="block text-xs font-semibold text-[#8c98ad] mb-1">
                    Concepts per Topic
                  </label>
                  <select
                    id="ai-concept-count"
                    value={aiConceptCount}
                    onChange={(e) => setAiConceptCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded-md text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={2}>2 Concepts</option>
                    <option value={3}>3 Concepts</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForms}
                  className="px-3 py-1.5 text-xs font-medium text-[#8c98ad] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting || !aiSubjectName.trim()}
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-md transition-colors flex items-center gap-1.5"
                >
                  {modalSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{modalSubmitting ? 'Generating with Groq LLM...' : 'Generate Full Curriculum'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. AI Generate Concept Modal */}
      {activeModal === 'ai_concept' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-ai-concept-title"
          onClick={resetForms}
        >
          <div
            className="bg-[#121620] border border-[#252e40] rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1f2636]">
              <div>
                <h3 id="modal-ai-concept-title" className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>AI Concept Generator (Groq)</span>
                </h3>
                <p className="text-[11px] text-[#717d91]">
                  Generates concept definition, study note, and validated MCQs.
                </p>
              </div>
              <button
                onClick={resetForms}
                className="p-1 rounded text-[#717d91] hover:text-white text-base"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 text-xs bg-rose-950/40 border border-rose-800 text-rose-300 rounded-md">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAIGenerateConcept} className="space-y-4">
              <div>
                <label htmlFor="ai-target-topic" className="block text-xs font-semibold text-[#8c98ad] mb-1">
                  Target Topic
                </label>
                <select
                  id="ai-target-topic"
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded-md text-white focus:outline-none focus:border-indigo-500"
                >
                  {subjects.map((s) =>
                    s.topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {s.name} → {t.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label htmlFor="ai-concept-prompt" className="block text-xs font-semibold text-[#8c98ad] mb-1">
                  Concept Name / Prompt *
                </label>
                <input
                  id="ai-concept-prompt"
                  type="text"
                  required
                  value={aiConceptHint}
                  onChange={(e) => setAiConceptHint(e.target.value)}
                  placeholder="e.g. Page Replacement Algorithms, LRU Cache, Semaphore Mutex"
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded-md text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForms}
                  className="px-3 py-1.5 text-xs font-medium text-[#8c98ad] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting || !aiConceptHint.trim()}
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-md transition-colors flex items-center gap-1.5"
                >
                  {modalSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{modalSubmitting ? 'Generating with Groq...' : 'Generate Concept & MCQs'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Manual Create Subject Modal */}
      {activeModal === 'subject' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-subject-title"
          onClick={resetForms}
        >
          <div
            className="bg-[#121620] border border-[#252e40] rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1f2636]">
              <h3 id="modal-subject-title" className="text-sm font-bold text-white">Create New Subject</h3>
              <button
                onClick={resetForms}
                className="p-1 rounded text-[#717d91] hover:text-white text-base"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 text-xs bg-rose-950/40 border border-rose-800 text-rose-300 rounded-md">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label htmlFor="manual-sub-name" className="block text-xs font-semibold text-[#8c98ad] mb-1">
                  Subject Name *
                </label>
                <input
                  id="manual-sub-name"
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Distributed Systems"
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded-md text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="manual-sub-desc" className="block text-xs font-semibold text-[#8c98ad] mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="manual-sub-desc"
                  rows={2}
                  value={subjectDescription}
                  onChange={(e) => setSubjectDescription(e.target.value)}
                  placeholder="e.g. Consensus protocols, replication, CAP theorem, and distributed storage."
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded-md text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForms}
                  className="px-3 py-1.5 text-xs font-medium text-[#8c98ad] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting || !subjectName.trim()}
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md transition-colors"
                >
                  {modalSubmitting ? 'Creating...' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Manual Create Topic Modal */}
      {activeModal === 'topic' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-topic-title"
          onClick={resetForms}
        >
          <div
            className="bg-[#121620] border border-[#252e40] rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1f2636]">
              <h3 id="modal-topic-title" className="text-sm font-bold text-white">Add Topic to Subject</h3>
              <button
                onClick={resetForms}
                className="p-1 rounded text-[#717d91] hover:text-white text-base"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 text-xs bg-rose-950/40 border border-rose-800 text-rose-300 rounded-md">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label htmlFor="manual-topic-sub" className="block text-xs font-semibold text-[#8c98ad] mb-1">
                  Target Subject *
                </label>
                <select
                  id="manual-topic-sub"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded-md text-white focus:outline-none focus:border-blue-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="manual-topic-name" className="block text-xs font-semibold text-[#8c98ad] mb-1">
                  Topic Name *
                </label>
                <input
                  id="manual-topic-name"
                  type="text"
                  required
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="e.g. Consensus Algorithms"
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded-md text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="manual-topic-desc" className="block text-xs font-semibold text-[#8c98ad] mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="manual-topic-desc"
                  rows={2}
                  value={topicDescription}
                  onChange={(e) => setTopicDescription(e.target.value)}
                  placeholder="e.g. Paxos, Raft leader election, and log replication."
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded-md text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForms}
                  className="px-3 py-1.5 text-xs font-medium text-[#8c98ad] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting || !topicName.trim()}
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md transition-colors"
                >
                  {modalSubmitting ? 'Adding...' : 'Add Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Manual Create Concept Modal */}
      {activeModal === 'concept' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-concept-title"
          onClick={resetForms}
        >
          <div
            className="bg-[#121620] border border-[#252e40] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1f2636]">
              <h3 id="modal-concept-title" className="text-sm font-bold text-white">Create New Concept</h3>
              <button
                onClick={resetForms}
                className="p-1 rounded text-[#717d91] hover:text-white text-base"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 text-xs bg-rose-950/40 border border-rose-800 text-rose-300 rounded-md">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateConcept} className="space-y-4">
              <div>
                <label htmlFor="manual-c-name" className="block text-xs font-semibold text-[#8c98ad] mb-1">
                  Concept Name *
                </label>
                <input
                  id="manual-c-name"
                  type="text"
                  required
                  value={conceptName}
                  onChange={(e) => setConceptName(e.target.value)}
                  placeholder="e.g. Raft Leader Election"
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded-md text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="manual-c-desc" className="block text-xs font-semibold text-[#8c98ad] mb-1">
                  Description
                </label>
                <input
                  id="manual-c-desc"
                  type="text"
                  value={conceptDescription}
                  onChange={(e) => setConceptDescription(e.target.value)}
                  placeholder="e.g. Randomized timers, heartbeats, and majority vote quorum."
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded-md text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="manual-c-prereq" className="block text-xs font-semibold text-[#8c98ad] mb-1">
                  Prerequisite Concept (optional)
                </label>
                <select
                  id="manual-c-prereq"
                  value={conceptPrereqId}
                  onChange={(e) => setConceptPrereqId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded-md text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">None (Standalone concept)</option>
                  {allConcepts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="manual-c-note" className="block text-xs font-semibold text-[#8c98ad] mb-1">
                  Initial Study Note (Markdown)
                </label>
                <textarea
                  id="manual-c-note"
                  rows={6}
                  value={conceptNote}
                  onChange={(e) => setConceptNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#0b0e14] border border-[#252f42] rounded-md text-[#d6deeb] focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForms}
                  className="px-3 py-1.5 text-xs font-medium text-[#8c98ad] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting || !conceptName.trim()}
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md transition-colors"
                >
                  {modalSubmitting ? 'Creating...' : 'Create Concept & Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Manual Create Question Modal */}
      {activeModal === 'question' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-question-title"
          onClick={resetForms}
        >
          <div
            className="bg-[#121620] border border-[#252e40] rounded-xl max-w-xl w-full p-6 space-y-4 shadow-xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1f2636]">
              <div>
                <h3 id="modal-question-title" className="text-sm font-bold text-white">Add MCQ to Question Pool</h3>
                <p className="text-[11px] text-[#717d91]">
                  Strict ExamBuddy pedagogical validator runs on backend before insertion.
                </p>
              </div>
              <button
                onClick={resetForms}
                className="p-1 rounded text-[#717d91] hover:text-white text-base"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 text-xs bg-rose-950/40 border border-rose-800 text-rose-300 rounded-md">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div>
                <label htmlFor="q-target-c" className="block text-xs font-semibold text-[#8c98ad] mb-1">
                  Target Concept *
                </label>
                <select
                  id="q-target-c"
                  value={selectedConceptId}
                  onChange={(e) => setSelectedConceptId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded-md text-white focus:outline-none focus:border-blue-500"
                >
                  {allConcepts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="q-prompt-text" className="block text-xs font-semibold text-[#8c98ad] mb-1">
                  Question Prompt *
                </label>
                <textarea
                  id="q-prompt-text"
                  rows={2}
                  required
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="e.g. During Raft leader election, what condition must a candidate satisfy to win?"
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded-md text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="space-y-2">
                <span className="block text-xs font-semibold text-[#8c98ad]">Options (4 distinct choices) *</span>
                {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                  const val = letter === 'A' ? qOptionA : letter === 'B' ? qOptionB : letter === 'C' ? qOptionC : qOptionD;
                  const setVal = letter === 'A' ? setQOptionA : letter === 'B' ? setQOptionB : letter === 'C' ? setQOptionC : setQOptionD;
                  return (
                    <div key={letter} className="flex items-center gap-2">
                      <label htmlFor={`opt-field-${letter}`} className="text-xs font-bold text-[#627087] w-5">
                        {letter}.
                      </label>
                      <input
                        id={`opt-field-${letter}`}
                        type="text"
                        required
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        placeholder={`Option ${letter} text`}
                        className="flex-1 px-3 py-1.5 text-xs bg-[#0b0e14] border border-[#252f42] rounded-md text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="q-correct-opt" className="block text-xs font-semibold text-[#8c98ad] mb-1">
                    Correct Answer *
                  </label>
                  <select
                    id="q-correct-opt"
                    value={qCorrect}
                    onChange={(e) => setQCorrect(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded-md text-white focus:outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="q-difficulty-sel" className="block text-xs font-semibold text-[#8c98ad] mb-1">
                    Difficulty
                  </label>
                  <select
                    id="q-difficulty-sel"
                    value={qDifficulty}
                    onChange={(e) => setQDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded-md text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="q-expl-text" className="block text-xs font-semibold text-[#8c98ad] mb-1">
                  Explanation (Rationale) *
                </label>
                <textarea
                  id="q-expl-text"
                  rows={2}
                  required
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Explain why the chosen option is correct and why distractors are invalid."
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded-md text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForms}
                  className="px-3 py-1.5 text-xs font-medium text-[#8c98ad] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting || !qText.trim() || !qExplanation.trim()}
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md transition-colors"
                >
                  {modalSubmitting ? 'Validating...' : 'Validate & Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
