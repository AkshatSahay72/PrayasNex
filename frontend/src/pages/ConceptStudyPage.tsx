import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { apiClient } from '../api/client';
import type { ConceptSummary, NoteResponse } from '../types';

interface ConceptStudyPageProps {
  conceptId: string;
  onBack: () => void;
  onStartTest: (conceptId: string) => void;
  onNavigatePrerequisite?: (prereqId: string) => void;
}

export const ConceptStudyPage: React.FC<ConceptStudyPageProps> = ({
  conceptId,
  onBack,
  onStartTest,
  onNavigatePrerequisite
}) => {
  const [concept, setConcept] = useState<ConceptSummary | null>(null);
  const [note, setNote] = useState<NoteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [toggling, setToggling] = useState(false);

  const loadData = async (personalizedMode: boolean) => {
    try {
      setLoading(true);
      setError(null);
      const [conceptData, noteData] = await Promise.all([
        apiClient.getConcept(conceptId, 'demo-student-1'),
        apiClient.getNote(conceptId, 'demo-student-1', personalizedMode)
      ]);
      setConcept(conceptData);
      setNote(noteData);
    } catch (err: any) {
      setError(err.message || 'Failed to load concept note.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(isPersonalized);
  }, [conceptId]);

  const handleTogglePersonalized = async () => {
    const next = !isPersonalized;
    setIsPersonalized(next);
    setToggling(true);
    try {
      const noteData = await apiClient.getNote(conceptId, 'demo-student-1', next);
      setNote(noteData);
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-3xl text-sm text-[#738096]">
        Loading note...
      </div>
    );
  }

  if (error || !concept || !note) {
    return (
      <div className="p-8 max-w-2xl space-y-4">
        <h2 className="text-base font-semibold text-rose-300">Unable to load note</h2>
        <p className="text-xs text-[#8c96a8]">{error}</p>
        <button
          onClick={onBack}
          className="px-3 py-1.5 text-xs font-medium bg-[#1c222e] hover:bg-[#252d3d] border border-[#2e3646] rounded text-white"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-3xl mx-auto space-y-8">
      {/* Header Path & Topic */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-[#738096]">
          <span>Optimization</span>
          <button
            onClick={onBack}
            className="text-[#8c98ad] hover:text-white transition-colors"
          >
            ← Back
          </button>
        </div>
        <div className="h-px bg-[#1f2533] w-full" />
      </div>

      {/* Concept Title & Prerequisite Alert if present */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {concept.name}
        </h1>

        {concept.description && (
          <p className="text-sm text-[#9aa6bb] leading-relaxed">
            {concept.description}
          </p>
        )}

        {concept.prerequisite_concept_name && concept.prerequisite_concept_id && (
          <div className="p-3 rounded bg-[#161412] border border-[#3b2d18] text-xs text-[#c49e5d] flex items-center justify-between">
            <span>
              Prerequisite foundation: <strong>{concept.prerequisite_concept_name}</strong>
            </span>
            {onNavigatePrerequisite && (
              <button
                onClick={() => onNavigatePrerequisite(concept.prerequisite_concept_id!)}
                className="underline hover:text-[#e0b772] font-medium"
              >
                Review prerequisite
              </button>
            )}
          </div>
        )}

        {/* Personalized focus note toggle */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-[#647083]">
            {isPersonalized ? 'Personalized review focus' : 'Standard curriculum text'}
          </span>
          <button
            onClick={handleTogglePersonalized}
            disabled={toggling}
            className="text-blue-400 hover:text-blue-300 underline font-medium disabled:opacity-50"
          >
            {toggling ? 'Generating...' : isPersonalized ? 'Switch to standard note' : 'Personalize note for review'}
          </button>
        </div>
      </div>

      {/* Structured Reading Content */}
      <article className="study-prose border-t border-[#1f2533] pt-6">
        <ReactMarkdown>{note.markdown_content}</ReactMarkdown>
      </article>

      {/* Bottom Action Footer */}
      <div className="pt-8 border-t border-[#1f2533] flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-medium bg-[#141822] hover:bg-[#1d2331] text-[#9ba6b8] border border-[#273042] rounded transition-colors"
        >
          Mark as understood
        </button>

        <button
          onClick={() => onStartTest(concept.id)}
          className="px-5 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
        >
          Practice concept →
        </button>
      </div>
    </div>
  );
};
