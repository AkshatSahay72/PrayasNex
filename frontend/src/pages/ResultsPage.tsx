import React from 'react';
import type { AssessmentSubmissionResult } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface ResultsPageProps {
  result: AssessmentSubmissionResult;
  onRetake: (conceptId: string) => void;
  onReadNote: (conceptId: string) => void;
  onReturnDashboard: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  result,
  onRetake,
  onReadNote,
  onReturnDashboard
}) => {
  const rec = result.recommendation;

  return (
    <div className="p-6 md:p-12 max-w-3xl mx-auto space-y-10">
      {/* 1. Header & Score Summary */}
      <div className="space-y-3">
        <div className="text-xs text-[#738096] uppercase tracking-wider font-semibold">
          Assessment complete
        </div>

        <div className="flex items-baseline gap-4">
          <span className="text-4xl font-bold text-white tracking-tight">
            {result.correct_answers} / {result.total_questions}
          </span>
          <span className="text-sm text-[#7f8ba0]">
            ({result.score_percentage}% correct)
          </span>
        </div>

        <div className="h-px bg-[#1f2533] w-full pt-2" />
      </div>

      {/* 2. Concept Performance */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-[#8e9bb0] uppercase tracking-wider">
          Concept performance
        </h2>

        <div className="border border-[#222938] rounded-lg overflow-hidden bg-[#11151e]">
          <div className="p-3.5 flex items-center justify-between">
            <span className="text-sm font-medium text-white">
              {result.concept_name}
            </span>
            <StatusBadge status={result.status} />
          </div>
        </div>
      </section>

      {/* 3. Recommended Next Step */}
      {rec && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-[#8e9bb0] uppercase tracking-wider">
            Recommended next step
          </h2>

          <div className="p-5 rounded-lg bg-[#11151e] border border-[#222938] space-y-3">
            <div className="space-y-1">
              <div className="text-base font-semibold text-white">
                {rec.title}
              </div>
              <p className="text-xs text-[#8c98ad] leading-relaxed">
                {rec.recommendation}
              </p>
              <div className="text-[11px] text-[#606c7e] pt-1">
                Reason: {rec.reason}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => onReadNote(rec.prerequisite_concept_id || rec.concept_id)}
                className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
              >
                {rec.prerequisite_concept_name
                  ? `Review ${rec.prerequisite_concept_name}`
                  : `Review ${rec.concept_name}`}
              </button>

              <button
                onClick={() => onRetake(result.concept_id)}
                className="px-3.5 py-2 text-xs font-medium bg-[#191f2c] hover:bg-[#222a3b] text-[#9ba7ba] border border-[#283142] rounded transition-colors"
              >
                Retake test
              </button>

              <button
                onClick={onReturnDashboard}
                className="px-3.5 py-2 text-xs text-[#636f82] hover:text-[#9aa5b8] transition-colors ml-auto"
              >
                Return to home
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 4. Question Breakdown & Explanations */}
      <section className="space-y-4 pt-2">
        <h2 className="text-xs font-semibold text-[#8e9bb0] uppercase tracking-wider">
          Answer review
        </h2>

        <div className="space-y-4">
          {result.items.map((item, index) => (
            <div
              key={item.question_id}
              className="p-4 rounded-lg bg-[#11151e] border border-[#222938] space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-[#738096]">
                  {index + 1}. {item.question_text}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                    item.is_correct
                      ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-800/60'
                      : 'text-rose-300 bg-rose-950/60 border border-rose-800/60'
                  }`}
                >
                  {item.is_correct ? 'Correct' : 'Incorrect'}
                </span>
              </div>

              {/* Options list */}
              <div className="space-y-1.5 pt-1 text-xs">
                {item.options.map((opt) => {
                  const isUser = item.selected_option === opt.id;
                  const isCorrect = item.correct_option === opt.id;

                  let style = 'text-[#8793a5] bg-[#0c0f16] border-[#1d232f]';
                  if (isCorrect) {
                    style = 'text-emerald-200 bg-emerald-950/30 border-emerald-800/50 font-medium';
                  } else if (isUser && !item.is_correct) {
                    style = 'text-rose-200 bg-rose-950/30 border-rose-800/50';
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`p-2 rounded border flex items-center justify-between ${style}`}
                    >
                      <span>
                        <strong>{opt.id}.</strong> {opt.text}
                      </span>
                      {isCorrect && (
                        <span className="text-[10px] text-emerald-400 uppercase font-semibold">
                          Correct answer
                        </span>
                      )}
                      {isUser && !isCorrect && (
                        <span className="text-[10px] text-rose-400 uppercase font-semibold">
                          Your answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="text-xs text-[#8c98ad] bg-[#0c0f16] p-2.5 rounded border border-[#1d232f]">
                <strong className="text-[#aeb9c9]">Explanation:</strong> {item.explanation}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
