import React, { useEffect, useState } from 'react';
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
    const unansweredCount = questions.filter((q) => !selectedAnswers[q.id]).length;
    if (unansweredCount > 0) {
      const confirmSubmit = window.confirm(
        `You have ${unansweredCount} unanswered question(s). Submit assessment now?`
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
      <div className="p-8 max-w-2xl mx-auto text-sm text-[#738096]">
        Preparing assessment session...
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4">
        <h2 className="text-base font-semibold text-rose-300">Assessment Error</h2>
        <p className="text-xs text-[#8c96a8]">{error}</p>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium bg-[#1c222e] hover:bg-[#252d3d] border border-[#2e3646] rounded text-white"
        >
          Return
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="p-6 md:p-12 max-w-2xl mx-auto space-y-8">
      {/* Test Meta Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-[#738096]">
          <span>Optimization</span>
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>
        <div className="h-px bg-[#1f2533] w-full" />
      </div>

      {/* Question Text */}
      <div className="space-y-6">
        <h2 className="text-base sm:text-lg font-semibold text-white leading-relaxed">
          {currentQ.question_text}
        </h2>

        {/* Clean 4 Options */}
        <div className="space-y-2.5">
          {currentQ.options.map((opt) => {
            const isSelected = selectedAnswers[currentQ.id] === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectOption(currentQ.id, opt.id)}
                className={`w-full text-left p-3.5 rounded border text-sm transition-colors flex items-start gap-3 ${
                  isSelected
                    ? 'bg-[#182133] border-blue-500 text-white font-medium'
                    : 'bg-[#11151e] border-[#222938] text-[#c0c9d7] hover:bg-[#151a24] hover:border-[#2e374a]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#1b2230] text-[#717d91]'
                  }`}
                >
                  {opt.id}
                </span>
                <span className="leading-snug">{opt.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="pt-6 border-t border-[#1f2533] flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-2 text-xs font-medium bg-[#141822] hover:bg-[#1d2331] text-[#9ba6b8] border border-[#273042] rounded transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          Previous
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-2 text-xs text-[#636f82] hover:text-[#9aa5b8] transition-colors"
          >
            Cancel
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors disabled:opacity-50"
            >
              {submitting ? 'Evaluating...' : 'Submit test'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              className="px-5 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
