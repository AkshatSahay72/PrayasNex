import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import type { SecureQuestion, AssessmentSubmissionResult } from '../types';
import { AlertCircle, ArrowLeft, ArrowRight, HelpCircle, Loader2 } from 'lucide-react';

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getAssessmentQuestions(conceptId, 5);
        if (isMounted) {
          if (data.length === 0) {
            throw new Error('No questions available for this concept yet. You can generate or add questions from Curriculum.');
          }
          setQuestions(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load test questions.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchQuestions();
    return () => {
      isMounted = false;
    };
  }, [conceptId]);

  const handleSelectOption = useCallback((questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
  }, []);

  // Keyboard shortcut listener (A, B, C, D or 1, 2, 3, 4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading || submitting || questions.length === 0 || showConfirmModal) return;
      const currentQ = questions[currentIndex];
      if (!currentQ) return;

      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        handleSelectOption(currentQ.id, key);
      } else if (['1', '2', '3', '4'].includes(key)) {
        const indexMap = ['A', 'B', 'C', 'D'];
        const optLetter = indexMap[parseInt(key) - 1];
        if (optLetter) {
          handleSelectOption(currentQ.id, optLetter);
        }
      } else if (e.key === 'ArrowRight' && currentIndex < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex((i) => i - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, questions, handleSelectOption, loading, submitting, showConfirmModal]);

  const executeSubmission = async () => {
    setShowConfirmModal(false);
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
      setError(err.message || 'Failed to submit assessment.');
      setSubmitting(false);
    }
  };

  const handlePreSubmit = () => {
    const unansweredCount = questions.filter((q) => !selectedAnswers[q.id]).length;
    if (unansweredCount > 0) {
      setShowConfirmModal(true);
    } else {
      executeSubmission();
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-12 max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="h-4 w-48 bg-[#182030] rounded" />
        <div className="h-10 w-full bg-[#141a26] rounded-md" />
        <div className="space-y-3 pt-4">
          <div className="h-14 bg-[#11151f] rounded-lg border border-[#1f2638]" />
          <div className="h-14 bg-[#11151f] rounded-lg border border-[#1f2638]" />
          <div className="h-14 bg-[#11151f] rounded-lg border border-[#1f2638]" />
          <div className="h-14 bg-[#11151f] rounded-lg border border-[#1f2638]" />
        </div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="p-6 md:p-12 max-w-2xl mx-auto space-y-4">
        <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-sm text-rose-300">
            <AlertCircle className="w-4 h-4" />
            <span>Assessment Session Error</span>
          </div>
          <p className="text-xs text-rose-300/80">{error}</p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs font-medium bg-[#1c222e] hover:bg-[#252d3d] border border-[#2e3646] rounded-md text-white transition-colors"
        >
          Return to Previous View
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = questions.filter((q) => !!selectedAnswers[q.id]).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="p-4 sm:p-8 md:p-12 max-w-2xl mx-auto space-y-8">
      {/* Session Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[#738096]">
          <span className="font-semibold text-[#8e9bb0]">
            {currentQ.concept_name || 'Concept Assessment'}
          </span>
          <span className="font-medium text-white">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>

        {/* Progress Bar & Indicators */}
        <div className="flex items-center gap-1.5 pt-1">
          {questions.map((q, idx) => {
            const isAnswered = !!selectedAnswers[q.id];
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  isCurrent
                    ? 'bg-blue-500'
                    : isAnswered
                    ? 'bg-blue-800/70'
                    : 'bg-[#1e2535]'
                }`}
                aria-label={`Jump to question ${idx + 1}`}
                title={`Question ${idx + 1}: ${isAnswered ? 'Answered' : 'Unanswered'}`}
              />
            );
          })}
        </div>
      </div>

      {/* Question Text */}
      <div className="space-y-6">
        <h2 className="text-base sm:text-lg font-semibold text-white leading-relaxed">
          {currentQ.question_text}
        </h2>

        {/* 4 Interactive Option Cards */}
        <div className="space-y-3" role="radiogroup" aria-label="Assessment Options">
          {currentQ.options.map((opt) => {
            const isSelected = selectedAnswers[currentQ.id] === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelectOption(currentQ.id, opt.id)}
                className={`w-full text-left p-4 rounded-lg border text-sm transition-all flex items-start gap-3.5 focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isSelected
                    ? 'bg-[#152033] border-blue-500 text-white font-medium shadow-md shadow-blue-500/10'
                    : 'bg-[#11141c] border-[#222938] text-[#c0c9d7] hover:bg-[#151a24] hover:border-[#2e374a]'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#1a212e] text-[#717d91]'
                  }`}
                >
                  {opt.id}
                </span>
                <span className="leading-snug pt-0.5">{opt.text}</span>
              </button>
            );
          })}
        </div>

        <div className="text-[11px] text-[#556379] flex items-center justify-between">
          <span>Tip: Press A, B, C, D on keyboard to select option.</span>
          <span>{answeredCount} of {questions.length} answered</span>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="pt-6 border-t border-[#1f2533] flex items-center justify-between gap-4">
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-2 text-xs font-medium bg-[#141822] hover:bg-[#1d2331] text-[#9ba6b8] border border-[#273042] rounded-md transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-3 py-2 text-xs text-[#636f82] hover:text-[#9aa5b8] transition-colors"
          >
            Cancel
          </button>

          {isLastQuestion ? (
            <button
              onClick={handlePreSubmit}
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{submitting ? 'Evaluating...' : 'Submit Assessment'}</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Accessible Unanswered Questions Confirmation Modal */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unanswered-modal-title"
        >
          <div className="bg-[#121622] border border-[#252f44] rounded-lg max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 id="unanswered-modal-title" className="text-sm font-bold text-white">
                  Unanswered Questions
                </h3>
                <p className="text-xs text-[#8c98ad] mt-0.5">
                  You have {unansweredCount} question{unansweredCount > 1 ? 's' : ''} left unanswered.
                </p>
              </div>
            </div>

            <p className="text-xs text-[#718096]">
              Submitting now will mark unanswered items as incorrect in your mastery diagnostic evaluation.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3 py-1.5 text-xs font-medium bg-[#1a2130] hover:bg-[#232d40] text-[#9cb0cb] border border-[#2b3850] rounded-md transition-colors"
              >
                Review Questions
              </button>
              <button
                type="button"
                onClick={executeSubmission}
                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
