import React from 'react';
import type { AssessmentSubmissionResult } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Sparkles,
  XCircle
} from 'lucide-react';

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
  const isPassing = result.score_percentage >= 70;

  return (
    <div className="p-4 sm:p-8 md:p-12 max-w-3xl mx-auto space-y-10">
      {/* 1. Header & Score Summary Card */}
      <div className="p-6 rounded-xl bg-[#11141c] border border-[#202738] space-y-4 shadow-sm">
        <div className="flex items-center justify-between text-xs text-[#738096]">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-[#8e9bb0]">
            Assessment Diagnostic Results
          </span>
          <StatusBadge status={result.status} />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pt-1">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {result.concept_name}
            </h1>
            <p className="text-xs text-[#7f8ba0]">
              Performance evaluated and recorded in your concept knowledge graph.
            </p>
          </div>

          <div className="flex items-baseline gap-2 shrink-0">
            <span className="text-4xl font-extrabold text-white tracking-tight">
              {result.correct_answers}
            </span>
            <span className="text-base text-[#606e82]">/ {result.total_questions}</span>
            <span
              className={`text-sm font-semibold ml-2 px-2.5 py-0.5 rounded-full ${
                isPassing
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
              }`}
            >
              {result.score_percentage}% Score
            </span>
          </div>
        </div>
      </div>

      {/* 2. Recommended Next Step Card */}
      {rec && (
        <section className="space-y-3" aria-labelledby="results-recommendation-title">
          <h2 id="results-recommendation-title" className="text-xs font-semibold text-[#8e9bb0] uppercase tracking-wider">
            Recommended Action Plan
          </h2>

          <div className="p-5 rounded-lg bg-[#11151f] border border-[#242e42] space-y-3.5 shadow-xs">
            <div className="space-y-1">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>{rec.title}</span>
              </div>
              <p className="text-xs text-[#8c98ad] leading-relaxed">
                {rec.recommendation}
              </p>
              <div className="text-[11px] text-[#636f82] pt-1">
                <strong className="text-[#7c8b9d]">Reason:</strong> {rec.reason}
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onReadNote(rec.prerequisite_concept_id || rec.concept_id)}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>
                  {rec.prerequisite_concept_name
                    ? `Review ${rec.prerequisite_concept_name}`
                    : `Review ${rec.concept_name}`}
                </span>
              </button>

              <button
                onClick={() => onRetake(result.concept_id)}
                className="px-3.5 py-2 text-xs font-medium bg-[#191f2c] hover:bg-[#232b3d] text-[#9ba7ba] border border-[#283142] rounded-md transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Assessment</span>
              </button>

              <button
                onClick={onReturnDashboard}
                className="px-3.5 py-2 text-xs text-[#717d91] hover:text-white transition-colors ml-auto flex items-center gap-1"
              >
                <span>Return to Home</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 3. Question Breakdown & Explanations */}
      <section className="space-y-4" aria-labelledby="answer-review-title">
        <h2 id="answer-review-title" className="text-xs font-semibold text-[#8e9bb0] uppercase tracking-wider">
          Detailed Answer Review ({result.items.length} questions)
        </h2>

        <div className="space-y-4">
          {result.items.map((item, index) => (
            <div
              key={item.question_id}
              className="p-5 rounded-lg bg-[#11141c] border border-[#202738] space-y-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-medium text-[#c0c9d7] leading-relaxed">
                  <strong className="text-white">Q{index + 1}.</strong> {item.question_text}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                    item.is_correct
                      ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-800/60'
                      : 'text-rose-300 bg-rose-950/60 border border-rose-800/60'
                  }`}
                >
                  {item.is_correct ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Correct</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-rose-400" />
                      <span>Incorrect</span>
                    </>
                  )}
                </span>
              </div>

              {/* Options list */}
              <div className="space-y-2 pt-1 text-xs">
                {item.options.map((opt) => {
                  const isUser = item.selected_option === opt.id;
                  const isCorrect = item.correct_option === opt.id;

                  let style = 'text-[#7e8aa0] bg-[#0c0f16] border-[#1d232f]';
                  if (isCorrect) {
                    style = 'text-emerald-200 bg-emerald-950/30 border-emerald-700/60 font-medium';
                  } else if (isUser && !item.is_correct) {
                    style = 'text-rose-200 bg-rose-950/30 border-rose-700/60 font-medium';
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`p-2.5 rounded-md border flex items-center justify-between gap-2 ${style}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{opt.id}.</span>
                        <span>{opt.text}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isCorrect && (
                          <span className="text-[10px] text-emerald-400 uppercase font-semibold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/80">
                            Correct
                          </span>
                        )}
                        {isUser && !isCorrect && (
                          <span className="text-[10px] text-rose-400 uppercase font-semibold bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800/80">
                            Your Choice
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explanation Callout */}
              <div className="text-xs text-[#8c98ad] bg-[#0c0f16] p-3 rounded-md border border-[#1d232f] flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-[#aeb9c9]">Pedagogical Explanation:</strong> {item.explanation}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
