import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { SubjectDetail, SecureQuestion, DiagnosticResult } from '../types';
import { StatusBadge } from '../components/StatusBadge';

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
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getSubjects('demo-student-1');
      setSubjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load curriculum');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Collect all concepts across all subjects/topics for prerequisite selection
  const allConcepts: { id: string; name: string }[] = [];
  subjects.forEach((s) => {
    s.topics.forEach((t) => {
      t.concepts.forEach((c) => {
        allConcepts.push({ id: c.id, name: `${c.name} (${t.name})` });
      });
    });
  });

  const resetForms = () => {
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
  };

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
      setActionSuccess(`Subject "${subjectName.trim()}" created.`);
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
      setActiveDiagnosticSubject({ id: subjectId, name: subjectName });
      setDiagnosticAnswers({});
      setDiagnosticCurrentIndex(0);

      const qs = await apiClient.getDiagnosticQuestions(subjectId);
      setDiagnosticQuestions(qs);
    } catch (err: any) {
      alert(err.message || 'Failed to load diagnostic assessment for this subject.');
      setActiveDiagnosticSubject(null);
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
      alert(err.message || 'Failed to submit diagnostic assessment');
    } finally {
      setDiagnosticSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl text-sm text-[#738096]">
        Loading curriculum modules...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl space-y-4">
        <h2 className="text-base font-semibold text-rose-300">Error loading curriculum</h2>
        <p className="text-xs text-[#8c96a8]">{error}</p>
        <button
          onClick={fetchSubjects}
          className="px-3 py-1.5 text-xs font-medium bg-[#1e2533] hover:bg-[#283142] text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl space-y-10">
      {/* Header with Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Curriculum & Concepts</h1>
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
            <span>✨</span>
            <span>AI Generate Subject (Groq)</span>
          </button>

          <button
            onClick={() => {
              resetForms();
              setActiveModal('subject');
            }}
            className="px-3 py-2 text-xs font-medium bg-[#1c222e] hover:bg-[#262f40] text-[#a4b2c7] border border-[#2b3548] rounded-md transition-colors shrink-0"
          >
            + Manual Subject
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-md flex items-center justify-between text-xs text-emerald-300">
          <span>{actionSuccess}</span>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-400 hover:text-white font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Subjects List */}
      {subjects.length === 0 ? (
        <div className="p-8 border border-dashed border-[#242c3d] rounded-lg text-center space-y-4 bg-[#11151e]">
          <p className="text-sm text-[#8c98ad]">No subjects configured in the curriculum yet.</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                resetForms();
                setActiveModal('ai_curriculum');
              }}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded"
            >
              ✨ Generate Entire Subject with Groq AI
            </button>
            <button
              onClick={() => {
                resetForms();
                setActiveModal('subject');
              }}
              className="px-3 py-2 text-xs font-medium bg-[#191f2c] text-[#8c98ad] hover:text-white border border-[#263145] rounded"
            >
              + Create Manually
            </button>
          </div>
        </div>
      ) : (
        subjects.map((subject) => (
          <div key={subject.id} className="space-y-6 bg-[#0f131a] p-5 rounded-lg border border-[#1b212d]">
            {/* Subject Header with Diagnostic Test & Add Topic button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1f2533] gap-3">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>{subject.name}</span>
                </h2>
                {subject.description && (
                  <p className="text-xs text-[#738096] mt-0.5">{subject.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  onClick={() => startDiagnosticTest(subject.id, subject.name)}
                  className="px-3 py-1.5 text-xs font-medium bg-amber-950/60 hover:bg-amber-900/70 text-amber-200 border border-amber-700/60 rounded transition-colors flex items-center gap-1.5 shadow-xs"
                  title="Take baseline test to evaluate prior knowledge across all concepts"
                >
                  <span>⚡</span>
                  <span>Take Baseline Diagnostic Test</span>
                </button>

                <button
                  onClick={() => {
                    resetForms();
                    setSelectedSubjectId(subject.id);
                    setActiveModal('topic');
                  }}
                  className="px-2.5 py-1.5 text-xs font-medium bg-[#1a202c] hover:bg-[#232c3d] text-[#a4b1c7] border border-[#263145] rounded transition-colors flex items-center gap-1"
                >
                  <span>+</span> Add Topic
                </button>
              </div>
            </div>

            {/* Topics */}
            {subject.topics.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#5f6c82] italic">
                No topics in this subject yet. Click "+ Add Topic" above.
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
                        className="px-2 py-0.5 text-[11px] font-medium bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/60 rounded transition-colors flex items-center gap-1"
                      >
                        <span>✨</span> AI Concept
                      </button>

                      <button
                        onClick={() => {
                          resetForms();
                          setSelectedTopicId(topic.id);
                          setConceptNote(`# ${topic.name}: New Concept\n\n## Overview\nCore pedagogical notes.\n\n## Key Mechanics\nFoundational rules and properties.\n\n## Practice\nTake assessment to confirm mastery.`);
                          setActiveModal('concept');
                        }}
                        className="px-2 py-0.5 text-[11px] font-medium bg-[#141923] hover:bg-[#1f2636] text-[#8695ad] border border-[#222938] rounded transition-colors"
                      >
                        + Manual Concept
                      </button>
                    </div>
                  </div>

                  {/* Concepts Container */}
                  <div className="border border-[#222938] rounded-lg overflow-hidden bg-[#11151e] divide-y divide-[#1e2432]">
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
                              <div className="text-[11px] text-[#857041]">
                                Requires prerequisite:{' '}
                                <span className="font-medium text-[#b59b5b]">
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
                              className="px-2.5 py-1.5 text-xs font-medium bg-[#141924] hover:bg-[#1f2738] text-[#8695ad] border border-[#222b3d] rounded transition-colors"
                              title="Add custom validated question"
                            >
                              + MCQ
                            </button>
                            <button
                              onClick={() => onSelectConcept(concept.id)}
                              className="px-3 py-1.5 text-xs font-medium bg-[#191f2c] hover:bg-[#222a3b] text-[#9ba7ba] border border-[#283142] rounded transition-colors"
                            >
                              Study note
                            </button>
                            <button
                              onClick={() => onStartTest(concept.id)}
                              className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                            >
                              Practice
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#11151e] border border-[#263145] rounded-lg max-w-2xl w-full p-6 space-y-6 shadow-2xl my-8">
            {diagnosticLoading ? (
              <div className="py-12 text-center text-sm text-[#8c98ad]">
                Loading diagnostic assessment for {activeDiagnosticSubject.name}...
              </div>
            ) : diagnosticResult ? (
              /* Diagnostic Result Report */
              <div className="space-y-6">
                <div className="border-b border-[#202738] pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Diagnostic Baseline Report: {diagnosticResult.subject_name}
                    </h3>
                    <p className="text-xs text-[#7f8ba0] mt-0.5">
                      Prior knowledge evaluated across {diagnosticResult.concept_breakdown.length} concepts.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveDiagnosticSubject(null)}
                    className="text-[#717d91] hover:text-white text-base"
                  >
                    ✕
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
                    <div className="text-[11px] text-[#717e94] uppercase tracking-wider mt-0.5">Needs Immediate Care</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-400">{diagnosticResult.strong_concept_count}</div>
                    <div className="text-[11px] text-[#717e94] uppercase tracking-wider mt-0.5">Prior Knowledge Mastered</div>
                  </div>
                </div>

                {/* Summary Alert */}
                <div className="p-3 bg-[#161c28] border border-[#273247] rounded text-xs text-[#a9b7cc]">
                  {diagnosticResult.summary_message}
                </div>

                {/* Concept Diagnostic Breakdown Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-[#8c98ad] uppercase tracking-wider">Concept Diagnostic Breakdown</h4>
                  <div className="border border-[#222938] rounded-lg overflow-hidden divide-y divide-[#1e2432] bg-[#0c0f16]">
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
                            className="px-2.5 py-1 text-xs font-medium bg-[#1a202c] hover:bg-[#232c3d] text-blue-400 border border-[#263145] rounded transition-colors"
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
                      className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                    >
                      🚀 Start Studying {diagnosticResult.recommended_start_concept_name} →
                    </button>
                  )}
                </div>
              </div>
            ) : diagnosticQuestions.length > 0 ? (
              /* Diagnostic Questions Wizard */
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#1f2636]">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Baseline Diagnostic: {activeDiagnosticSubject.name}
                    </h3>
                    <p className="text-[11px] text-[#717e94]">
                      Question {diagnosticCurrentIndex + 1} of {diagnosticQuestions.length} — Assessing prior knowledge
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveDiagnosticSubject(null)}
                    className="text-[#717d91] hover:text-white text-base"
                  >
                    ✕
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
                              className={`w-full text-left p-3 rounded text-xs transition-colors flex items-start gap-3 border ${
                                isSelected
                                  ? 'bg-amber-950/40 border-amber-600 text-amber-100 font-medium'
                                  : 'bg-[#0b0e14] border-[#202838] text-[#9eb0cc] hover:bg-[#151a24] hover:text-white'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 flex items-center justify-center rounded text-[11px] font-bold shrink-0 ${
                                  isSelected
                                    ? 'bg-amber-500 text-black'
                                    : 'bg-[#181f2c] text-[#738299]'
                                }`}
                              >
                                {opt.id}
                              </span>
                              <span className="pt-0.5">{opt.text}</span>
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
                      className="px-4 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-black rounded transition-colors"
                    >
                      Next Question →
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={diagnosticSubmitting}
                      onClick={handleSubmitDiagnostic}
                      className="px-5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors disabled:opacity-50"
                    >
                      {diagnosticSubmitting ? 'Evaluating Baseline...' : 'Submit Diagnostic Assessment'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-[#8c98ad]">
                No questions configured for this subject yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* 1. AI Generate Curriculum Modal (Groq) */}
      {activeModal === 'ai_curriculum' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-[#121620] border border-[#252e40] rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f2636]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>✨</span> AI Curriculum Generator (Groq)
                </h3>
                <p className="text-[11px] text-[#717d91]">
                  Instantly drafts topics, concepts, study notes, and MCQs.
                </p>
              </div>
              <button onClick={resetForms} className="text-[#717d91] hover:text-white text-base">✕</button>
            </div>

            {modalError && (
              <div className="p-2.5 text-xs bg-rose-950/40 border border-rose-800 text-rose-300 rounded">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAIGenerateCurriculum} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8c98ad] mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={aiSubjectName}
                  onChange={(e) => setAiSubjectName(e.target.value)}
                  placeholder="e.g. Operating Systems, Distributed Systems, Compiler Design"
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8c98ad] mb-1">Context / Syllabus Scope (optional)</label>
                <textarea
                  rows={2}
                  value={aiSubjectDesc}
                  onChange={(e) => setAiSubjectDesc(e.target.value)}
                  placeholder="e.g. Focus on memory hierarchy, virtual memory, process scheduling, and concurrency."
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8c98ad] mb-1">Number of Topics</label>
                  <select
                    value={aiTopicCount}
                    onChange={(e) => setAiTopicCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={2}>2 Topics</option>
                    <option value={3}>3 Topics</option>
                    <option value={4}>4 Topics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8c98ad] mb-1">Concepts per Topic</label>
                  <select
                    value={aiConceptCount}
                    onChange={(e) => setAiConceptCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded text-white focus:outline-none focus:border-indigo-500"
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
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded transition-colors"
                >
                  {modalSubmitting ? 'Generating with Groq LLM...' : '✨ Generate Full Curriculum'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. AI Generate Concept Modal */}
      {activeModal === 'ai_concept' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-[#121620] border border-[#252e40] rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f2636]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>✨</span> AI Concept Generator (Groq)
                </h3>
                <p className="text-[11px] text-[#717d91]">
                  Generates concept definition, study note, and validated MCQs.
                </p>
              </div>
              <button onClick={resetForms} className="text-[#717d91] hover:text-white text-base">✕</button>
            </div>

            {modalError && (
              <div className="p-2.5 text-xs bg-rose-950/40 border border-rose-800 text-rose-300 rounded">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAIGenerateConcept} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8c98ad] mb-1">Target Topic</label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded text-white focus:outline-none focus:border-indigo-500"
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
                <label className="block text-xs font-semibold text-[#8c98ad] mb-1">Concept Name / Prompt *</label>
                <input
                  type="text"
                  required
                  value={aiConceptHint}
                  onChange={(e) => setAiConceptHint(e.target.value)}
                  placeholder="e.g. Page Replacement Algorithms, LRU Cache, Semaphore Mutex"
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded text-white focus:outline-none focus:border-indigo-500"
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
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded transition-colors"
                >
                  {modalSubmitting ? 'Generating with Groq...' : '✨ Generate Concept & MCQs'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Manual Create Subject Modal */}
      {activeModal === 'subject' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-[#121620] border border-[#252e40] rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f2636]">
              <h3 className="text-sm font-bold text-white">Create New Subject</h3>
              <button onClick={resetForms} className="text-[#717d91] hover:text-white text-base">✕</button>
            </div>

            {modalError && (
              <div className="p-2.5 text-xs bg-rose-950/40 border border-rose-800 text-rose-300 rounded">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8c98ad] mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Distributed Systems"
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8c98ad] mb-1">Description (optional)</label>
                <textarea
                  rows={2}
                  value={subjectDescription}
                  onChange={(e) => setSubjectDescription(e.target.value)}
                  placeholder="e.g. Consensus protocols, replication, CAP theorem, and distributed storage."
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded text-white focus:outline-none focus:border-blue-500 resize-none"
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
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-[#121620] border border-[#252e40] rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f2636]">
              <h3 className="text-sm font-bold text-white">Add Topic to Subject</h3>
              <button onClick={resetForms} className="text-[#717d91] hover:text-white text-base">✕</button>
            </div>

            {modalError && (
              <div className="p-2.5 text-xs bg-rose-950/40 border border-rose-800 text-rose-300 rounded">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8c98ad] mb-1">Target Subject *</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded text-white focus:outline-none focus:border-blue-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8c98ad] mb-1">Topic Name *</label>
                <input
                  type="text"
                  required
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="e.g. Consensus Algorithms"
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8c98ad] mb-1">Description (optional)</label>
                <textarea
                  rows={2}
                  value={topicDescription}
                  onChange={(e) => setTopicDescription(e.target.value)}
                  placeholder="e.g. Paxos, Raft leader election, and log replication."
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded text-white focus:outline-none focus:border-blue-500 resize-none"
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
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#121620] border border-[#252e40] rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f2636]">
              <h3 className="text-sm font-bold text-white">Create New Concept</h3>
              <button onClick={resetForms} className="text-[#717d91] hover:text-white text-base">✕</button>
            </div>

            {modalError && (
              <div className="p-2.5 text-xs bg-rose-950/40 border border-rose-800 text-rose-300 rounded">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateConcept} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8c98ad] mb-1">Concept Name *</label>
                <input
                  type="text"
                  required
                  value={conceptName}
                  onChange={(e) => setConceptName(e.target.value)}
                  placeholder="e.g. Raft Leader Election"
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8c98ad] mb-1">Description</label>
                <input
                  type="text"
                  value={conceptDescription}
                  onChange={(e) => setConceptDescription(e.target.value)}
                  placeholder="e.g. Randomized timers, heartbeats, and majority vote quorum."
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8c98ad] mb-1">Prerequisite Concept (optional)</label>
                <select
                  value={conceptPrereqId}
                  onChange={(e) => setConceptPrereqId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">None (Standalone concept)</option>
                  {allConcepts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8c98ad] mb-1">Initial Study Note (Markdown)</label>
                <textarea
                  rows={6}
                  value={conceptNote}
                  onChange={(e) => setConceptNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#0b0e14] border border-[#252f42] rounded text-[#d6deeb] focus:outline-none focus:border-blue-500 resize-none"
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
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#121620] border border-[#252e40] rounded-lg max-w-xl w-full p-6 space-y-4 shadow-xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f2636]">
              <div>
                <h3 className="text-sm font-bold text-white">Add MCQ to Question Pool</h3>
                <p className="text-[11px] text-[#717d91]">
                  Strict ExamBuddy pedagogical validator runs on backend before insertion.
                </p>
              </div>
              <button onClick={resetForms} className="text-[#717d91] hover:text-white text-base">✕</button>
            </div>

            {modalError && (
              <div className="p-2.5 text-xs bg-rose-950/40 border border-rose-800 text-rose-300 rounded">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8c98ad] mb-1">Target Concept *</label>
                <select
                  value={selectedConceptId}
                  onChange={(e) => setSelectedConceptId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded text-white focus:outline-none focus:border-blue-500"
                >
                  {allConcepts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8c98ad] mb-1">Question Prompt *</label>
                <textarea
                  rows={2}
                  required
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="e.g. During Raft leader election, what condition must a candidate satisfy to win?"
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#8c98ad]">Options (4 distinct choices) *</label>
                {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                  const val = letter === 'A' ? qOptionA : letter === 'B' ? qOptionB : letter === 'C' ? qOptionC : qOptionD;
                  const setVal = letter === 'A' ? setQOptionA : letter === 'B' ? setQOptionB : letter === 'C' ? setQOptionC : setQOptionD;
                  return (
                    <div key={letter} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#627087] w-5">{letter}.</span>
                      <input
                        type="text"
                        required
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        placeholder={`Option ${letter} text`}
                        className="flex-1 px-3 py-1.5 text-xs bg-[#0b0e14] border border-[#252f42] rounded text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8c98ad] mb-1">Correct Answer *</label>
                  <select
                    value={qCorrect}
                    onChange={(e) => setQCorrect(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded text-white focus:outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8c98ad] mb-1">Difficulty</label>
                  <select
                    value={qDifficulty}
                    onChange={(e) => setQDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8c98ad] mb-1">Explanation (Rationale) *</label>
                <textarea
                  rows={2}
                  required
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Explain why the chosen option is correct and why distractors are invalid."
                  className="w-full px-3 py-2 text-xs bg-[#0b0e14] border border-[#252f42] rounded text-white focus:outline-none focus:border-blue-500 resize-none"
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
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded transition-colors"
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


