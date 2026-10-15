import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { StudentDashboard } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { BookOpen, CheckSquare, Sparkles, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';

interface DashboardPageProps {
  onSelectConcept: (conceptId: string) => void;
  onStartTest: (conceptId: string) => void;
  onBrowseLearn: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectConcept,
  onStartTest,
  onBrowseLearn
}) => {
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getDashboard('demo-student-1');
        if (isMounted) {
          setDashboard(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to connect to backend server.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRetry = async () => {
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

  if (loading) {
    return (
      <div className="p-6 md:p-10 max-w-4xl space-y-8 animate-pulse">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-[#182030] rounded-md" />
          <div className="h-4 w-72 bg-[#141a26] rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-24 bg-[#121622] rounded-lg border border-[#1f2638]" />
          <div className="h-24 bg-[#121622] rounded-lg border border-[#1f2638]" />
          <div className="h-24 bg-[#121622] rounded-lg border border-[#1f2638]" />
        </div>
        <div className="h-32 bg-[#121622] rounded-lg border border-[#1f2638]" />
        <div className="h-64 bg-[#121622] rounded-lg border border-[#1f2638]" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-6 md:p-10 max-w-2xl space-y-4">
        <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-sm text-rose-300">
            <AlertTriangle className="w-4 h-4" />
            <span>Unable to load workspace data</span>
          </div>
          <p className="text-xs text-rose-300/80">{error}</p>
        </div>
        <button
          onClick={handleRetry}
          className="px-4 py-2 text-xs font-medium bg-[#1c222e] hover:bg-[#252d3d] border border-[#2e3646] rounded-md text-white transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const rec = dashboard.active_recommendation;
  const weakConcept = dashboard.weak_concepts.length > 0 ? dashboard.weak_concepts[0] : null;

  // Normalized mastery score
  const masteryPercentage = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        dashboard.overall_mastery > 1
          ? dashboard.overall_mastery
          : dashboard.overall_mastery * 100
      )
    )
  );

  // Derive active continue concept
  const continueConcept =
    dashboard.all_progress.find((p) => p.status === 'needs_practice' || p.status === 'not_started') ||
    dashboard.all_progress[dashboard.all_progress.length - 1];

  return (
    <div className="p-6 md:p-10 max-w-4xl space-y-8">
      {/* Student Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Welcome back, {dashboard.student_name}
        </h1>
        <p className="text-xs text-[#8c98ad] mt-1">
          Adaptive Learning Workspace • {dashboard.all_progress.length} tracked concepts across your curriculum.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-[#11141c] border border-[#1f2638] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#738096] uppercase tracking-wider">Overall Mastery</span>
            <div className="text-2xl font-bold text-white mt-1">{masteryPercentage}%</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#11141c] border border-[#1f2638] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#738096] uppercase tracking-wider">Total Attempts</span>
            <div className="text-2xl font-bold text-white mt-1">{dashboard.total_attempts}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#11141c] border border-[#1f2638] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#738096] uppercase tracking-wider">Needs Attention</span>
            <div className="text-2xl font-bold text-rose-300 mt-1">{dashboard.weak_concepts.length}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 1. Continue Learning Section */}
      {continueConcept && (
        <section className="space-y-3" aria-labelledby="continue-learning-title">
          <div className="flex items-center justify-between pb-1 border-b border-[#1f2533]">
            <h2 id="continue-learning-title" className="text-xs font-semibold text-[#8e9bb0] uppercase tracking-wider">
              Continue learning
            </h2>
          </div>

          <div className="p-5 rounded-lg bg-[#11151f] border border-[#202738] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="text-base font-semibold text-white">
                {continueConcept.concept_name}
              </div>
              <div className="text-xs text-[#7e8aa0]">
                Topic: {continueConcept.topic_name || 'General Curriculum'}
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => onSelectConcept(continueConcept.concept_id)}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Study Note</span>
              </button>
              <button
                onClick={() => onStartTest(continueConcept.concept_id)}
                className="px-3.5 py-2 text-xs font-medium bg-[#191f2c] hover:bg-[#232b3d] text-[#a0adc2] border border-[#283244] rounded-md transition-colors flex items-center gap-1.5"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Practice</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 2. What Needs Attention Section */}
      {weakConcept && (
        <section className="space-y-3" aria-labelledby="attention-title">
          <div className="flex items-center justify-between pb-1 border-b border-[#1f2533]">
            <h2 id="attention-title" className="text-xs font-semibold text-[#8e9bb0] uppercase tracking-wider">
              What needs attention
            </h2>
          </div>

          <div className="p-5 rounded-lg bg-[#161216] border border-[#3d1d23] space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="text-base font-semibold text-rose-200">
                  {weakConcept.concept_name}
                </span>
                <StatusBadge status="weak" />
              </div>
              <p className="text-xs text-[#b8a6aa] leading-relaxed">
                Your recent assessment performance indicates gaps in foundational prerequisites. Reviewing the curated study notes is recommended before retaking the test.
              </p>
            </div>

            <div>
              <button
                onClick={() => onSelectConcept(weakConcept.concept_id)}
                className="px-4 py-2 text-xs font-medium bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/80 rounded-md transition-colors flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Review Concept Note</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 3. Recent Progress Table */}
      <section className="space-y-3" aria-labelledby="recent-progress-title">
        <div className="flex items-center justify-between pb-1 border-b border-[#1f2533]">
          <h2 id="recent-progress-title" className="text-xs font-semibold text-[#8e9bb0] uppercase tracking-wider">
            Tracked Concepts
          </h2>
          <button
            onClick={onBrowseLearn}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors flex items-center gap-1"
          >
            <span>Explore all in curriculum</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="border border-[#202738] rounded-lg overflow-x-auto bg-[#11141c]">
          <table className="w-full text-left text-xs min-w-[500px]">
            <thead className="bg-[#151a24] text-[#718096] uppercase text-[10px] tracking-wider border-b border-[#202738]">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Concept</th>
                <th scope="col" className="px-4 py-3 font-semibold">Topic</th>
                <th scope="col" className="px-4 py-3 font-semibold">Attempts</th>
                <th scope="col" className="px-4 py-3 font-semibold text-right">Mastery Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2432]">
              {dashboard.all_progress.map((prog) => (
                <tr
                  key={prog.concept_id}
                  className="hover:bg-[#151b27] transition-colors cursor-pointer focus-within:bg-[#151b27]"
                  onClick={() => onSelectConcept(prog.concept_id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectConcept(prog.concept_id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View study guide for ${prog.concept_name}`}
                >
                  <td className="px-4 py-3 font-medium text-white">
                    {prog.concept_name}
                  </td>
                  <td className="px-4 py-3 text-[#7f8ba0]">
                    {prog.topic_name || 'General'}
                  </td>
                  <td className="px-4 py-3 text-[#7f8ba0]">
                    {prog.attempts_count > 0 ? `${prog.correct_count} / ${prog.attempts_count}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <StatusBadge status={prog.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Next Recommended Activity Section */}
      {rec && (
        <section className="space-y-3" aria-labelledby="recommendation-title">
          <div className="flex items-center justify-between pb-1 border-b border-[#1f2533]">
            <h2 id="recommendation-title" className="text-xs font-semibold text-[#8e9bb0] uppercase tracking-wider">
              Next recommended activity
            </h2>
          </div>

          <div className="p-5 rounded-lg bg-[#11151f] border border-[#252f44] space-y-3 shadow-xs">
            <div className="space-y-1">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>{rec.title}</span>
              </div>
              <p className="text-xs text-[#8c98ad] leading-relaxed">
                {rec.recommendation}
              </p>
              <div className="text-[11px] text-[#636f82] pt-1">
                <strong className="text-[#7d8c9e]">Reason:</strong> {rec.reason}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => onSelectConcept(rec.prerequisite_concept_id || rec.concept_id)}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
              >
                {rec.prerequisite_concept_name
                  ? `Review ${rec.prerequisite_concept_name}`
                  : `Review ${rec.concept_name}`}
              </button>

              <button
                onClick={() => onStartTest(rec.concept_id)}
                className="px-3.5 py-2 text-xs font-medium bg-[#191f2c] hover:bg-[#222a3b] text-[#9ba7ba] border border-[#283142] rounded-md transition-colors"
              >
                Practice Assessment
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
