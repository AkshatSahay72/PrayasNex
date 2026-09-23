import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { SubjectDetail } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface LearnPageProps {
  onSelectConcept: (conceptId: string) => void;
  onStartTest: (conceptId: string) => void;
}

type ModalType = 'subject' | 'topic' | 'concept' | 'question' | null;

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

  // Form Fields
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
  };

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
      setActionSuccess(`Concept "${conceptName.trim()}" created with study note.`);
      resetForms();
      await fetchSubjects();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create concept');
    } finally {
      setModalSubmitting(false);
    }
  };

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
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Curriculum & Concepts</h1>
          <p className="text-xs text-[#7f8ba0] mt-1">
            Structured knowledge graph with prerequisite dependencies and adaptive practice.
          </p>
        </div>
        <button
          onClick={() => {
            resetForms();
            setActiveModal('subject');
          }}
          className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
        >
          <span className="text-sm font-bold">+</span>
          <span>New Subject</span>
        </button>
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
        <div className="p-8 border border-dashed border-[#242c3d] rounded-lg text-center space-y-3 bg-[#11151e]">
          <p className="text-sm text-[#8c98ad]">No subjects configured in the curriculum yet.</p>
          <button
            onClick={() => {
              resetForms();
              setActiveModal('subject');
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded"
          >
            Create Your First Subject
          </button>
        </div>
      ) : (
        subjects.map((subject) => (
          <div key={subject.id} className="space-y-6 bg-[#0f131a] p-5 rounded-lg border border-[#1b212d]">
            {/* Subject Header with Add Topic button */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1f2533]">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  {subject.name}
                </h2>
                {subject.description && (
                  <p className="text-xs text-[#738096] mt-0.5">{subject.description}</p>
                )}
              </div>
              <button
                onClick={() => {
                  resetForms();
                  setSelectedSubjectId(subject.id);
                  setActiveModal('topic');
                }}
                className="px-2.5 py-1 text-xs font-medium bg-[#1a202c] hover:bg-[#232c3d] text-[#a4b1c7] border border-[#263145] rounded transition-colors flex items-center gap-1"
              >
                <span>+</span> Add Topic
              </button>
            </div>

            {/* Topics */}
            {subject.topics.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#5f6c82] italic">
                No topics in this subject yet. Click "+ Add Topic" above.
              </div>
            ) : (
              subject.topics.map((topic) => (
                <div key={topic.id} className="space-y-3 pl-1 sm:pl-3">
                  {/* Topic Title with Add Concept button */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-[#8e9bb0] uppercase tracking-wider">
                      Topic: {topic.name}
                    </h3>
                    <button
                      onClick={() => {
                        resetForms();
                        setSelectedTopicId(topic.id);
                        setConceptNote(`# ${topic.name}: New Concept\n\n## Overview\nCore pedagogical notes.\n\n## Key Mechanics\nFoundational rules and properties.\n\n## Practice\nTake assessment to confirm mastery.`);
                        setActiveModal('concept');
                      }}
                      className="px-2 py-0.5 text-[11px] font-medium bg-[#141923] hover:bg-[#1f2636] text-[#8695ad] border border-[#222938] rounded transition-colors"
                    >
                      + Add Concept
                    </button>
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

      {/* --- MODALS --- */}

      {/* 1. Create Subject Modal */}
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

      {/* 2. Create Topic Modal */}
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

      {/* 3. Create Concept Modal */}
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

      {/* 4. Create Question Modal */}
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

