import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  LayoutDashboard,
  RotateCcw,
  Sparkles,
  XCircle
} from 'lucide-react';
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
  const isWeak = result.status === 'weak';
  const isStrong = result.status === 'strong';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Performance Score Banner */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 ${
          isStrong
            ? 'bg-gradient-to-r from-emerald-950/80 to-slate-900 border-emerald-500/30 shadow-emerald-950/40'
            : isWeak
            ? 'bg-gradient-to-r from-rose-950/80 to-slate-900 border-rose-500/30 shadow-rose-950/40'
            : 'bg-gradient-to-r from-amber-950/80 to-slate-900 border-amber-500/30 shadow-amber-950/40'
        }`}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Assessment Evaluation
            </span>
            <StatusBadge status={result.status} size="sm" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {isStrong
              ? 'Excellent Mastery!'
              : isWeak
              ? 'Concept Review Recommended'
              : 'Good Progress, Keep Practicing!'}
          </h1>

          <p className="text-sm text-slate-300">
            You answered <strong>{result.correct_answers}</strong> of{' '}
            <strong>{result.total_questions}</strong> questions correctly on{' '}
            <span className="text-white font-semibold">"{result.concept_name}"</span>.
          </p>
        </div>

        {/* Circular Score Badge */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-center p-4 rounded-2xl bg-slate-900/90 border border-slate-800 min-w-[120px]">
            <span className="block text-3xl sm:text-4xl font-black text-white">
              {result.score_percentage}%
            </span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {result.correct_answers}/{result.total_questions} Correct
            </span>
          </div>
        </div>
      </div>

      {/* Adaptive Recommendation Card */}
      {rec && (
        <div className="p-6 sm:p-8 rounded-3xl bg-indigo-950/40 border border-indigo-500/30 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Adaptive Next Action
            </span>
          </div>

          <h3 className="text-xl font-bold text-white">{rec.title}</h3>
          <p className="text-sm text-slate-200 leading-relaxed">{rec.recommendation}</p>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
            <strong className="text-slate-300">Why was this recommended? </strong>
            <span>{rec.reason}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onReadNote(rec.prerequisite_concept_id || rec.concept_id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-105"
            >
              <BookOpen className="w-4 h-4" />
              <span>
                {rec.prerequisite_concept_name
                  ? `Review Foundation (${rec.prerequisite_concept_name})`
                  : 'Study Learning Note'}
              </span>
            </button>

            <button
              onClick={() => onRetake(result.concept_id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Practice Again</span>
            </button>

            <button
              onClick={onReturnDashboard}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium border border-slate-800 transition-colors ml-auto"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      )}

      {/* Question by Question Review */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white tracking-tight">Question Review & Explanations</h3>
        <p className="text-xs text-slate-400 -mt-2">
          Review your selected answers and pedagogical explanations.
        </p>

        <div className="space-y-4">
          {result.items.map((item, index) => (
            <div
              key={item.question_id}
              className={`p-6 rounded-2xl border transition-all ${
                item.is_correct
                  ? 'bg-slate-900/60 border-emerald-500/30'
                  : 'bg-slate-900/60 border-rose-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      item.is_correct
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {item.is_correct ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400">Question {index + 1}</span>
                    <h4 className="text-base font-semibold text-white mt-1 leading-snug">
                      {item.question_text}
                    </h4>
                  </div>
                </div>
              </div>

              {/* Options Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
                {item.options.map((opt) => {
                  const isUserChoice = item.selected_option === opt.id;
                  const isCorrect = item.correct_option === opt.id;

                  let borderClass = 'border-slate-800 bg-slate-950/40 text-slate-400';
                  if (isCorrect) {
                    borderClass = 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200 font-semibold';
                  } else if (isUserChoice && !item.is_correct) {
                    borderClass = 'border-rose-500/50 bg-rose-950/30 text-rose-200 line-through';
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs leading-relaxed ${borderClass}`}
                    >
                      <span className="font-bold shrink-0">{opt.id}.</span>
                      <span>{opt.text}</span>
                      {isCorrect && (
                        <span className="ml-auto text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                          Correct
                        </span>
                      )}
                      {isUserChoice && !isCorrect && (
                        <span className="ml-auto text-[10px] uppercase font-bold text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded">
                          Your Pick
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation Box */}
              <div className="mt-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
                <strong className="text-indigo-300">Explanation: </strong>
                <span>{item.explanation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
