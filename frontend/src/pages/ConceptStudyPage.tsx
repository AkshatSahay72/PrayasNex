import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  GitFork,
  PlayCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
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
  const [personalized, setPersonalized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (isPersonalized: boolean) => {
    try {
      setLoading(true);
      setError(null);
      const [conceptData, noteData] = await Promise.all([
        apiClient.getConcept(conceptId, 'demo-student-1'),
        apiClient.getNote(conceptId, 'demo-student-1', isPersonalized)
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
    loadData(personalized);
  }, [conceptId]);

  const handleTogglePersonalized = async () => {
    const nextState = !personalized;
    setPersonalized(nextState);
    setGenerating(true);
    try {
      const noteData = await apiClient.getNote(conceptId, 'demo-student-1', nextState);
      setNote(noteData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm">Retrieving concept notes...</p>
      </div>
    );
  }

  if (error || !concept || !note) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-6 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-center">
        <h3 className="text-lg font-semibold mb-2">Error Loading Learning Note</h3>
        <p className="text-sm text-rose-400/80 mb-4">{error}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Navigation Breadcrumb & Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
          {concept.id}
        </span>
      </div>

      {/* Header Container */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Concept Milestone</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {concept.name}
            </h1>
          </div>

          <button
            onClick={() => onStartTest(concept.id)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] shrink-0"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Take Concept Test</span>
          </button>
        </div>

        {/* Prerequisite Alert if exists */}
        {concept.prerequisite_concept_name && concept.prerequisite_concept_id && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Prerequisite Foundation: <strong>{concept.prerequisite_concept_name}</strong>
              </span>
            </div>
            {onNavigatePrerequisite && (
              <button
                onClick={() => onNavigatePrerequisite(concept.prerequisite_concept_id!)}
                className="underline hover:text-amber-200 font-semibold"
              >
                Review Prerequisite
              </button>
            )}
          </div>
        )}

        {/* Personalized Note Mode Switcher */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-slate-300 font-medium">
              {personalized ? 'Personalized Review Note Mode (AI-Assisted)' : 'Standard Curriculum Note Mode'}
            </span>
            {note.is_ai_generated && (
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                AI Custom Generated
              </span>
            )}
          </div>

          <button
            onClick={handleTogglePersonalized}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 border border-slate-700 transition-colors disabled:opacity-50"
          >
            {generating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>{personalized ? 'Switch to Standard' : 'Personalize for My Weak Areas'}</span>
          </button>
        </div>
      </div>

      {/* Markdown Content Viewer */}
      <div className="p-8 rounded-3xl bg-slate-900/70 border border-slate-800/80 shadow-inner">
        <div className="markdown-content">
          <ReactMarkdown>{note.markdown_content}</ReactMarkdown>
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            Finished reading? Put your understanding to the test with 5 targeted concept questions.
          </p>
          <button
            onClick={() => onStartTest(concept.id)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Start Practice Assessment</span>
          </button>
        </div>
      </div>
    </div>
  );
};
