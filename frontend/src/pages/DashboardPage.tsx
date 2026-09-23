import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { StudentDashboard } from '../types';
import { StatusBadge } from '../components/StatusBadge';

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
      <div className="p-8 max-w-4xl text-sm text-[#738096]">
        Loading workspace...
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-8 max-w-2xl space-y-4">
        <h2 className="text-base font-semibold text-rose-300">Unable to load dashboard</h2>
        <p className="text-xs text-[#8c96a8]">{error}</p>
        <button
          onClick={loadData}
          className="px-3 py-1.5 text-xs font-medium bg-[#1c222e] hover:bg-[#252d3d] border border-[#2e3646] rounded text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const rec = dashboard.active_recommendation;
  const weakConcept = dashboard.weak_concepts.length > 0 ? dashboard.weak_concepts[0] : null;

  // Derive the active continue concept (e.g. either weak concept, in-progress, or next)
  const continueConcept =
    dashboard.all_progress.find((p) => p.status === 'needs_practice' || p.status === 'not_started') ||
    dashboard.all_progress[dashboard.all_progress.length - 1];

  return (
    <div className="p-6 md:p-10 max-w-4xl space-y-10">
      {/* Student Greeting */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Welcome, {dashboard.student_name}
        </h1>
        <p className="text-xs text-[#7f8ba0] mt-1">
          Adaptive Learning Workspace • {dashboard.all_progress.length} tracked concepts
        </p>
      </div>

      {/* 1. Continue Learning Section */}
      {continueConcept && (
        <section className="space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#1f2533]">
            <h2 className="text-xs font-semibold text-[#8e9bb0] uppercase tracking-wider">
              Continue learning
            </h2>
          </div>

          <div className="p-4 rounded-lg bg-[#11151e] border border-[#222938] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-base font-semibold text-white">
                {continueConcept.concept_name}
              </div>
              <div className="text-xs text-[#7e8aa0] mt-0.5">
                {continueConcept.topic_name || 'Active Concept'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectConcept(continueConcept.concept_id)}
                className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
              >
                Continue
              </button>
              <button
                onClick={() => onStartTest(continueConcept.concept_id)}
                className="px-3 py-1.5 text-xs font-medium bg-[#191f2c] hover:bg-[#222a3b] text-[#9ba7ba] border border-[#283142] rounded transition-colors"
              >
                Practice
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 2. What Needs Attention Section */}
      {weakConcept && (
        <section className="space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#1f2533]">
            <h2 className="text-xs font-semibold text-[#8e9bb0] uppercase tracking-wider">
              What needs attention
            </h2>
          </div>

          <div className="p-4 rounded-lg bg-[#141216] border border-[#3b1f24] space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-rose-200">
                  {weakConcept.concept_name}
                </span>
                <StatusBadge status="weak" />
              </div>
              <p className="text-xs text-[#a39498] mt-1">
                Your recent assessment performance indicates you should review foundational concepts before progressing.
              </p>
            </div>

            <div>
              <button
                onClick={() => onSelectConcept(weakConcept.concept_id)}
                className="px-3.5 py-1.5 text-xs font-medium bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/80 rounded transition-colors"
              >
                Review concept
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 3. Recent Progress Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#1f2533]">
          <h2 className="text-xs font-semibold text-[#8e9bb0] uppercase tracking-wider">
            Recent progress
          </h2>
          <button
            onClick={onBrowseLearn}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all
          </button>
        </div>

        <div className="border border-[#222938] rounded-lg overflow-hidden bg-[#11151e]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#151a24] text-[#6d7b91] uppercase text-[10px] tracking-wider border-b border-[#222938]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Concept</th>
                <th className="px-4 py-2.5 font-medium">Topic</th>
                <th className="px-4 py-2.5 font-medium">Attempts</th>
                <th className="px-4 py-2.5 font-medium text-right">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2432]">
              {dashboard.all_progress.map((prog) => (
                <tr
                  key={prog.concept_id}
                  className="hover:bg-[#151a25] transition-colors cursor-pointer"
                  onClick={() => onSelectConcept(prog.concept_id)}
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
        <section className="space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#1f2533]">
            <h2 className="text-xs font-semibold text-[#8e9bb0] uppercase tracking-wider">
              Next recommended activity
            </h2>
          </div>

          <div className="p-4 rounded-lg bg-[#11151e] border border-[#262e3f] space-y-3">
            <div className="space-y-1">
              <div className="text-sm font-semibold text-white">
                {rec.title}
              </div>
              <div className="text-xs text-[#8c98ad]">
                {rec.recommendation}
              </div>
              <div className="text-[11px] text-[#636f82] pt-1">
                Reason: {rec.reason}
              </div>
            </div>

            <div className="pt-1 flex items-center gap-2">
              <button
                onClick={() => onSelectConcept(rec.prerequisite_concept_id || rec.concept_id)}
                className="px-3.5 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
              >
                {rec.prerequisite_concept_name
                  ? `Review ${rec.prerequisite_concept_name}`
                  : `Review ${rec.concept_name}`}
              </button>

              <button
                onClick={() => onStartTest(rec.concept_id)}
                className="px-3.5 py-1.5 text-xs font-medium bg-[#191f2c] hover:bg-[#222a3b] text-[#9ba7ba] border border-[#283142] rounded transition-colors"
              >
                Practice test
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
