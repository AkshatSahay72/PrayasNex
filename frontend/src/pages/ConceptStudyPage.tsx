import React, { useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { apiClient } from '../api/client';
import type { ConceptSummary, NoteResponse } from '../types';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Info,
  Loader2,
  Sparkles,
  Zap
} from 'lucide-react';

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
  const [generating, setGenerating] = useState(false);
  const [generationMsg, setGenerationMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [conceptData, noteData] = await Promise.all([
        apiClient.getConcept(conceptId, 'demo-student-1'),
        apiClient.getNote(conceptId, 'demo-student-1', false)
      ]);
      setConcept(conceptData);
      setNote(noteData);
    } catch (err: any) {
      setError(err.message || 'Failed to load concept study guide.');
    } finally {
      setLoading(false);
    }
  }, [conceptId]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const [conceptData, noteData] = await Promise.all([
          apiClient.getConcept(conceptId, 'demo-student-1'),
          apiClient.getNote(conceptId, 'demo-student-1', false)
        ]);
        if (isMounted) {
          setConcept(conceptData);
          setNote(noteData);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load concept study guide.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [conceptId]);

  const handleGenerateAINote = async (focusType?: string) => {
    try {
      setGenerating(true);
      setGenerationMsg(null);
      const focusAreas = focusType ? [focusType] : undefined;
      const newNote = await apiClient.generateNoteWithAI({
        concept_id: conceptId,
        student_id: 'demo-student-1',
        focus_areas: focusAreas
      });
      setNote(newNote);
      setGenerationMsg(`Study note dynamically regenerated with emphasis on: ${focusType || 'comprehension'}.`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI note');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyNote = async () => {
    if (!note?.markdown_content) return;
    try {
      await navigator.clipboard.writeText(note.markdown_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-12 max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-[#182030] rounded" />
          <div className="h-4 w-28 bg-[#182030] rounded" />
        </div>
        <div className="h-8 w-72 bg-[#182030] rounded" />
        <div className="h-20 bg-[#121622] rounded-lg border border-[#1f2638]" />
        <div className="space-y-3 pt-4">
          <div className="h-4 w-full bg-[#141a26] rounded" />
          <div className="h-4 w-5/6 bg-[#141a26] rounded" />
          <div className="h-4 w-4/6 bg-[#141a26] rounded" />
        </div>
      </div>
    );
  }

  if (error || !concept || !note) {
    return (
      <div className="p-6 md:p-12 max-w-2xl mx-auto space-y-4">
        <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-200 space-y-2">
          <h2 className="text-base font-semibold text-rose-300">Unable to load study guide</h2>
          <p className="text-xs text-rose-300/80">{error}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2 text-xs font-medium bg-[#1c222e] hover:bg-[#252d3d] border border-[#2e3646] rounded-md text-white transition-colors"
          >
            ← Back to Curriculum
          </button>
          <button
            onClick={() => loadData()}
            className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 md:p-12 max-w-3xl mx-auto space-y-8">
      {/* Top Header Navigation */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[#738096]">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-[#8e9bb0]">
            Concept Study Guide
          </span>
          <button
            onClick={onBack}
            className="text-[#8c98ad] hover:text-white transition-colors flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Curriculum</span>
          </button>
        </div>
        <div className="h-px bg-[#1f2533] w-full" />
      </div>

      {/* Concept Header & Badges */}
      <div className="space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {concept.name}
            </h1>
            {concept.description && (
              <p className="text-sm text-[#9aa6bb] leading-relaxed pt-1">
                {concept.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {note.is_ai_generated && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-md bg-blue-950/60 border border-blue-700/60 text-blue-300">
                <Sparkles className="w-3 h-3 text-blue-400" />
                <span>AI-Enriched</span>
              </span>
            )}
            <button
              onClick={handleCopyNote}
              className="p-1.5 rounded-md text-[#788599] hover:text-white bg-[#141924] hover:bg-[#1f2738] border border-[#232c3f] transition-colors"
              title={copied ? 'Copied to clipboard!' : 'Copy note content'}
              aria-label="Copy note content"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Prerequisite Callout */}
        {concept.prerequisite_concept_name && concept.prerequisite_concept_id && (
          <div className="p-3.5 rounded-lg bg-[#181510] border border-[#423219] text-xs text-[#cfa868] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Foundational prerequisite:{' '}
                <strong className="text-amber-200">{concept.prerequisite_concept_name}</strong>
              </span>
            </div>
            {onNavigatePrerequisite && (
              <button
                onClick={() => onNavigatePrerequisite(concept.prerequisite_concept_id!)}
                className="inline-flex items-center gap-1 text-amber-300 hover:text-white underline font-medium shrink-0"
              >
                <span>Review Prerequisite</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* AI Study Note Generator Panel */}
        <div className="p-4 bg-[#11151f] border border-[#202738] rounded-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-[#a0adc2]">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Synthesize & Refine Note with Groq AI</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleGenerateAINote('Intuitive real-world analogies and mental models')}
                disabled={generating}
                className="px-2.5 py-1 text-[11px] font-medium bg-[#191f2c] hover:bg-[#232b3d] text-[#a4b5d0] border border-[#263145] rounded-md transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>✨</span>}
                <span>Analogies & Intuition</span>
              </button>

              <button
                onClick={() => handleGenerateAINote('Technical architecture, deep mechanics, and formulas')}
                disabled={generating}
                className="px-2.5 py-1 text-[11px] font-medium bg-[#191f2c] hover:bg-[#232b3d] text-[#a4b5d0] border border-[#263145] rounded-md transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>⚡</span>}
                <span>Technical Deep Dive</span>
              </button>

              <button
                onClick={() => handleGenerateAINote('Common exam traps, misconceptions, and pitfalls')}
                disabled={generating}
                className="px-2.5 py-1 text-[11px] font-medium bg-[#191f2c] hover:bg-[#232b3d] text-[#a4b5d0] border border-[#263145] rounded-md transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>🎯</span>}
                <span>Pitfalls & Traps</span>
              </button>
            </div>
          </div>

          {generationMsg && (
            <div className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 p-2 rounded flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{generationMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Reading Markdown Content */}
      <article className="study-prose border-t border-[#1f2533] pt-6">
        <ReactMarkdown>{note.markdown_content}</ReactMarkdown>
      </article>

      {/* Bottom Actions */}
      <div className="pt-8 border-t border-[#1f2533] flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="w-full sm:w-auto px-4 py-2 text-xs font-medium bg-[#141822] hover:bg-[#1d2331] text-[#9ba6b8] border border-[#273042] rounded-md transition-colors flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Curriculum</span>
        </button>

        <button
          onClick={() => onStartTest(concept.id)}
          className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Zap className="w-3.5 h-3.5 text-blue-200" />
          <span>Practice Concept Assessment</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
