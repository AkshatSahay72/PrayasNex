import React, { useEffect, useState } from 'react';
import {
  GitFork,
  HelpCircle,
  Layers,
  PlayCircle,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { SubjectDetail } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface SubjectsPageProps {
  onSelectConcept: (conceptId: string) => void;
  onStartTest: (conceptId: string) => void;
}

export const SubjectsPage: React.FC<SubjectsPageProps> = ({
  onSelectConcept,
  onStartTest
}) => {
  const [subjects, setSubjects] = useState<SubjectDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getSubjects('demo-student-1');
        setSubjects(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load curriculum');
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm">Loading curriculum structure...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-6 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-center">
        <h3 className="text-lg font-semibold mb-1">Failed to load curriculum</h3>
        <p className="text-sm text-rose-400/80">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Curriculum & Concept Trees</h1>
        <p className="text-slate-400 text-sm mt-1">
          Explore structured subject modules and pedagogical prerequisite relationships.
        </p>
      </div>

      {subjects.map((subject) => (
        <div key={subject.id} className="space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{subject.name}</h2>
              <p className="text-xs text-indigo-200/70">{subject.description}</p>
            </div>
          </div>

          {subject.topics.map((topic) => (
            <div key={topic.id} className="space-y-4 pl-2 md:pl-6 border-l-2 border-indigo-500/20">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                <h3 className="text-lg font-bold text-slate-200">Topic: {topic.name}</h3>
              </div>
              <p className="text-xs text-slate-400 -mt-2">{topic.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                {topic.concepts.map((concept, index) => (
                  <div
                    key={concept.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-indigo-950/40"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-indigo-400">
                          Step #{index + 1}
                        </span>
                        <StatusBadge status={concept.student_status} size="sm" />
                      </div>

                      <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {concept.name}
                      </h4>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {concept.description}
                      </p>

                      {concept.prerequisite_concept_name && (
                        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-amber-300/90">
                          <GitFork className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Requires: <strong>{concept.prerequisite_concept_name}</strong></span>
                        </div>
                      )}
                    </div>

                    <div className="pt-5 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{concept.questions_count} MCQs</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onSelectConcept(concept.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                        >
                          Note
                        </button>
                        <button
                          onClick={() => onStartTest(concept.id)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors flex items-center gap-1"
                        >
                          <PlayCircle className="w-3 h-3" />
                          <span>Test</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
