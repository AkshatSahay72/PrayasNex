import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { SecureQuestion, AssessmentSubmissionResult } from '../types';

interface AssessmentPageProps {
  conceptId: string;
  onCancel: () => void;
  onComplete: (result: AssessmentSubmissionResult) => void;
}

export const AssessmentPage: React.FC<AssessmentPageProps> = ({
  conceptId,
  onCancel,
  onComplete
}) => {
  const [questions, setQuestions] = useState<SecureQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getAssessmentQuestions(conceptId, 5);
        if (data.length === 0) {
          throw new Error('No questions available for this concept yet.');
        }
        setQuestions(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load test questions.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [conceptId]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmit = async () => {
    // Check if any question remains unanswered
    const unanswered = questions.filter((q) => !selectedAnswers[q.id]);
    if (unanswered.length > 0) {
      const confirmSubmit = window.confirm(
        `You have ${unanswered.length} unanswered question(s). Submit test anyway?`
      );
      if (!confirmSubmit) return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const answersPayload = questions.map((q) => ({
        question_id: q.id,
        selected_option: selectedAnswers[q.id] || 'UNANSWERED'
      }));

      const result = await apiClient.submitAssessment({
        student_id: 'demo-student-1',
        concept_id: conceptId,
        answers: answersPayload
      });

      onComplete(result);
    } catch (err: any) {
      setError(err.message || 'Failed to submit test.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm">Generating secure assessment session...</p>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-6 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-center">
        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-rose-400" />
        <h3 className="text-lg font-semibold mb-1">Assessment Loading Error</h3>
        <p className="text-sm text-rose-400/80 mb-4">{error}</p>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100);
  const totalAnswered = Object.keys(selectedAnswers).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Session & Security Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Assessment</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4" />
          <span>Active Test (Backend Evaluated)</span>
        </div>
      </div>

      {/* Test Progress Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-200">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span>
            {totalAnswered} of {questions.length} answered ({progressPct}%)
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Question Selector Dots */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {questions.map((q, idx) => {
            const isAnswered = !!selectedAnswers[q.id];
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                  isCurrent
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                    : isAnswered
                    ? 'bg-slate-700 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Question Box */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
            <HelpCircle className="w-4 h-4" />
            <span>Multiple Choice Question</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
            {currentQ.question_text}
          </h2>
        </div>

        {/* 4 Options */}
        <div className="space-y-3">
          {currentQ.options.map((opt) => {
            const isSelected = selectedAnswers[currentQ.id] === opt.id;

            return (
              <div
                key={opt.id}
                onClick={() => handleSelectOption(currentQ.id, opt.id)}
                className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {opt.id}
                </div>
                <span className="text-sm sm:text-base leading-snug">{opt.text}</span>
              </div>
            );
          })}
        </div>

        {/* Bottom Pagination & Submit */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 disabled:opacity-50"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Submit Assessment</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
