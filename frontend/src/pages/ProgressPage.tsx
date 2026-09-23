import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { StudentDashboard } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface ProgressPageProps {
  onSelectConcept: (conceptId: string) => void;
  onStartTest: (conceptId: string) => void;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({
  onSelectConcept,
  onStartTest
}) => {
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getDashboard('demo-student-1');
        setDashboard(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load progress data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-4xl text-sm text-[#738096]">
        Loading progress metrics...
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-8 max-w-2xl space-y-4">
        <h2 className="text-base font-semibold text-rose-300">Error loading progress</h2>
        <p className="text-xs text-[#8c96a8]">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl space-y-10">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Student Concept Progress</h1>
        <p className="text-xs text-[#7f8ba0] mt-1">
          Detailed breakdown of concept attempts, mastery levels, and recent activity.
        </p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-[#11151e] border border-[#222938]">
          <div className="text-xs text-[#738096]">Overall mastery</div>
          <div className="text-2xl font-bold text-white mt-1">
            {Math.round(dashboard.overall_mastery * 100)}%
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#11151e] border border-[#222938]">
          <div className="text-xs text-[#738096]">Total attempts</div>
          <div className="text-2xl font-bold text-white mt-1">
            {dashboard.total_attempts}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#11151e] border border-[#222938]">
          <div className="text-xs text-[#738096]">Concepts requiring attention</div>
          <div className="text-2xl font-bold text-white mt-1">
            {dashboard.weak_concepts.length}
          </div>
        </div>
      </div>

      {/* Concept Progress Table */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-[#8e9bb0] uppercase tracking-wider">
          Concept performance table
        </h2>

        <div className="border border-[#222938] rounded-lg overflow-hidden bg-[#11151e]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#151a24] text-[#6d7b91] uppercase text-[10px] tracking-wider border-b border-[#222938]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Concept</th>
                <th className="px-4 py-2.5 font-medium">Topic</th>
                <th className="px-4 py-2.5 font-medium">Attempts</th>
                <th className="px-4 py-2.5 font-medium">Correct</th>
                <th className="px-4 py-2.5 font-medium">Mastery</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2432]">
              {dashboard.all_progress.map((prog) => (
                <tr key={prog.concept_id} className="hover:bg-[#151a25] transition-colors">
                  <td className="px-4 py-3 font-medium text-white">
                    {prog.concept_name}
                  </td>
                  <td className="px-4 py-3 text-[#7f8ba0]">
                    Optimization
                  </td>
                  <td className="px-4 py-3 text-[#7f8ba0]">
                    {prog.attempts_count}
                  </td>
                  <td className="px-4 py-3 text-[#7f8ba0]">
                    {prog.correct_count}
                  </td>
                  <td className="px-4 py-3 text-white font-medium">
                    {Math.round(prog.mastery_score * 100)}%
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={prog.status} />
                  </td>
                  <td className="px-4 py-3 text-right space-x-1.5">
                    <button
                      onClick={() => onSelectConcept(prog.concept_id)}
                      className="px-2.5 py-1 text-[11px] font-medium bg-[#191f2c] hover:bg-[#222a3b] text-[#9ba7ba] border border-[#283142] rounded transition-colors"
                    >
                      Note
                    </button>
                    <button
                      onClick={() => onStartTest(prog.concept_id)}
                      className="px-2.5 py-1 text-[11px] font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                    >
                      Test
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
