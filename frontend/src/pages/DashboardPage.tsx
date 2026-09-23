import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  GraduationCap,
  PlayCircle,
  RefreshCw,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { StudentDashboard } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface DashboardPageProps {
  onSelectConcept: (conceptId: string) => void;
  onStartTest: (conceptId: string) => void;
  onBrowseCurriculum: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectConcept,
  onStartTest,
  onBrowseCurriculum
}) => {
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getDashboard('demo-student-1');
      setDashboard(data);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm">Loading adaptive learning dashboard...</p>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-6 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-center">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-rose-400" />
        <h3 className="text-lg font-semibold mb-1">Backend Connection Error</h3>
        <p className="text-sm text-rose-400/80 mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const rec = dashboard.active_recommendation;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Welcome back, {dashboard.student_name}</span>
            <span className="text-xl">👋</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Your personalized learning roadmap continuously adapts based on your concept assessment performance.
          </p>
        </div>
        <button
          onClick={loadData}
          className="self-start md:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Mastery</span>
        </button>
      </div>

      {/* Adaptive Recommendation Hero Banner */}
      {rec && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 p-6 md:p-8 shadow-2xl shadow-indigo-950/50">
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  <Sparkles className="w-3.5 h-3.5" />
                  Deterministic Adaptive Recommendation
                </span>
                <StatusBadge status={rec.status} size="sm" />
              </div>

              <h2 className="text-2xl font-bold text-white tracking-tight">
                {rec.title}
              </h2>

              <p className="text-slate-300 text-sm leading-relaxed">
                {rec.recommendation}
              </p>

              <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                <span className="font-semibold text-slate-300">Pedagogical Rationale:</span>
                <span>{rec.reason}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <button
                onClick={() => onSelectConcept(rec.prerequisite_concept_id || rec.concept_id)}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                <BookOpen className="w-4 h-4" />
                <span>Read Learning Note</span>
              </button>

              <button
                onClick={() => onStartTest(rec.concept_id)}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition-all"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Take Practice Test</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Mastery</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {Math.round(dashboard.overall_mastery * 100)}%
            </span>
            <span className="text-xs text-slate-400">weighted accuracy</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, dashboard.overall_mastery * 100))}%` }}
            />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Questions Solved</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{dashboard.total_attempts}</span>
            <span className="text-xs text-slate-400">total attempt submissions</span>
          </div>
          <p className="text-xs text-slate-500 mt-3">Evidence gathered across all concepts</p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Weak Concepts</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{dashboard.weak_concepts.length}</span>
            <span className="text-xs text-slate-400">requiring intervention</span>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            {dashboard.weak_concepts.length === 0
              ? 'No critical knowledge gaps detected'
              : 'Targeted notes ready for review'}
          </p>
        </div>
      </div>

      {/* Concept Breakdown Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Machine Learning: Optimization Concepts</h3>
            <p className="text-xs text-slate-400">Track your granular mastery at each concept milestone</p>
          </div>
          <button
            onClick={onBrowseCurriculum}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>View Full Curriculum</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {dashboard.all_progress.map((prog) => {
            const scorePct = Math.round(prog.mastery_score * 100);

            return (
              <div
                key={prog.concept_id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-base text-white">{prog.concept_name}</span>
                    <StatusBadge status={prog.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="font-mono text-slate-500">{prog.concept_id}</span>
                    <span>•</span>
                    <span>{prog.attempts_count} attempts ({prog.correct_count} correct)</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Mini Progress Bar */}
                  <div className="w-32 hidden sm:block text-right">
                    <span className="text-xs font-bold text-slate-300">{scorePct}%</span>
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          prog.status === 'strong'
                            ? 'bg-emerald-400'
                            : prog.status === 'needs_practice'
                            ? 'bg-amber-400'
                            : prog.status === 'weak'
                            ? 'bg-rose-400'
                            : 'bg-slate-600'
                        }`}
                        style={{ width: `${Math.max(5, scorePct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectConcept(prog.concept_id)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-colors flex items-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Study Note</span>
                    </button>

                    <button
                      onClick={() => onStartTest(prog.concept_id)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Take Test</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
