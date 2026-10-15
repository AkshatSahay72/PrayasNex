import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { StudentDashboard } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  AlertTriangle,
  BookOpen,
  CheckSquare,
  Search,
  TrendingUp,
  Filter
} from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
          setError(err.message || 'Failed to load progress data');
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
      setError(err.message || 'Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-10 max-w-4xl space-y-8 animate-pulse">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-[#182030] rounded-md" />
          <div className="h-4 w-96 bg-[#141a26] rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-24 bg-[#121622] rounded-lg border border-[#1f2638]" />
          <div className="h-24 bg-[#121622] rounded-lg border border-[#1f2638]" />
          <div className="h-24 bg-[#121622] rounded-lg border border-[#1f2638]" />
        </div>
        <div className="h-72 bg-[#121622] rounded-lg border border-[#1f2638]" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-6 md:p-10 max-w-2xl space-y-4">
        <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-sm text-rose-300">
            <AlertTriangle className="w-4 h-4" />
            <span>Error loading progress analytics</span>
          </div>
          <p className="text-xs text-rose-300/80">{error}</p>
        </div>
        <button
          onClick={handleRetry}
          className="px-4 py-2 text-xs font-medium bg-[#1c222e] hover:bg-[#252d3d] border border-[#2e3646] rounded-md text-white transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const overallMastery = Math.min(
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

  // Filtered concepts
  const filteredConcepts = dashboard.all_progress.filter((prog) => {
    const matchesSearch =
      prog.concept_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prog.topic_name && prog.topic_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === 'all' || prog.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 md:p-10 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Student Concept Progress</h1>
        <p className="text-xs text-[#7f8ba0] mt-1">
          Quantitative mastery metrics, assessment attempts, and prerequisite status tracking.
        </p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-[#11141c] border border-[#1f2638] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-[#738096] uppercase tracking-wider">Overall mastery</div>
            <div className="text-2xl font-bold text-white mt-1">{overallMastery}%</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#11141c] border border-[#1f2638] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-[#738096] uppercase tracking-wider">Total attempts</div>
            <div className="text-2xl font-bold text-white mt-1">{dashboard.total_attempts}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#11141c] border border-[#1f2638] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-[#738096] uppercase tracking-wider">Concepts requiring practice</div>
            <div className="text-2xl font-bold text-rose-300 mt-1">{dashboard.weak_concepts.length}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Concept Progress Table with Search & Filter */}
      <section className="space-y-4" aria-labelledby="performance-table-heading">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 id="performance-table-heading" className="text-xs font-semibold text-[#8e9bb0] uppercase tracking-wider">
            Concept performance table ({filteredConcepts.length})
          </h2>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#556379] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search concept or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-[#11151f] border border-[#222a3b] rounded-md text-white placeholder-[#556379] focus:outline-none focus:border-blue-500 w-48 sm:w-56"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#556379]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-2.5 text-xs bg-[#11151f] border border-[#222a3b] rounded-md text-[#9caac0] focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="weak">Weak</option>
                <option value="needs_practice">Needs Practice</option>
                <option value="strong">Strong</option>
                <option value="not_started">Not Started</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border border-[#202738] rounded-lg overflow-x-auto bg-[#11141c]">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead className="bg-[#151a24] text-[#718096] uppercase text-[10px] tracking-wider border-b border-[#202738]">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Concept</th>
                <th scope="col" className="px-4 py-3 font-semibold">Topic</th>
                <th scope="col" className="px-4 py-3 font-semibold">Attempts</th>
                <th scope="col" className="px-4 py-3 font-semibold">Correct</th>
                <th scope="col" className="px-4 py-3 font-semibold min-w-[120px]">Mastery Level</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2432]">
              {filteredConcepts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-[#525d70]">
                    No concepts match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredConcepts.map((prog) => {
                  const masteryVal = Math.min(
                    100,
                    Math.max(
                      0,
                      Math.round(
                        prog.mastery_score > 1
                          ? prog.mastery_score
                          : prog.mastery_score * 100
                      )
                    )
                  );
                  return (
                    <tr key={prog.concept_id} className="hover:bg-[#151b27] transition-colors">
                      <td className="px-4 py-3 font-medium text-white">
                        {prog.concept_name}
                      </td>
                      <td className="px-4 py-3 text-[#7f8ba0]">
                        {prog.topic_name || 'General'}
                      </td>
                      <td className="px-4 py-3 text-[#7f8ba0]">
                        {prog.attempts_count}
                      </td>
                      <td className="px-4 py-3 text-[#7f8ba0]">
                        {prog.correct_count}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="text-white font-medium text-[11px]">
                            {prog.attempts_count > 0 ? `${masteryVal}%` : '—'}
                          </div>
                          {prog.attempts_count > 0 && (
                            <div className="w-20 bg-[#1e2535] h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  masteryVal >= 80
                                    ? 'bg-emerald-500'
                                    : masteryVal >= 60
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${masteryVal}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={prog.status} />
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => onSelectConcept(prog.concept_id)}
                          className="px-2.5 py-1 text-[11px] font-medium bg-[#191f2c] hover:bg-[#222a3b] text-[#9ba7ba] border border-[#283142] rounded-md transition-colors inline-flex items-center gap-1"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Note</span>
                        </button>
                        <button
                          onClick={() => onStartTest(prog.concept_id)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors inline-flex items-center gap-1 shadow-xs"
                        >
                          <CheckSquare className="w-3 h-3" />
                          <span>Test</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
