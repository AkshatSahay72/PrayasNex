import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { SubjectDetail } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface LearnPageProps {
  onSelectConcept: (conceptId: string) => void;
  onStartTest: (conceptId: string) => void;
}

export const LearnPage: React.FC<LearnPageProps> = ({
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
      <div className="p-8 max-w-4xl text-sm text-[#738096]">
        Loading curriculum modules...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl space-y-4">
        <h2 className="text-base font-semibold text-rose-300">Error loading curriculum</h2>
        <p className="text-xs text-[#8c96a8]">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl space-y-10">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Curriculum & Concepts</h1>
        <p className="text-xs text-[#7f8ba0] mt-1">
          Structured concepts and prerequisite dependencies.
        </p>
      </div>

      {subjects.map((subject) => (
        <div key={subject.id} className="space-y-8">
          <div className="pb-2 border-b border-[#1f2533]">
            <h2 className="text-sm font-bold text-white uppercase tracking-wide">
              {subject.name}
            </h2>
            <p className="text-xs text-[#738096] mt-0.5">{subject.description}</p>
          </div>

          {subject.topics.map((topic) => (
            <div key={topic.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[#8e9bb0] uppercase tracking-wider">
                  Topic: {topic.name}
                </h3>
              </div>

              <div className="border border-[#222938] rounded-lg overflow-hidden bg-[#11151e] divide-y divide-[#1e2432]">
                {topic.concepts.map((concept, index) => (
                  <div
                    key={concept.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#151a25] transition-colors"
                  >
                    <div className="space-y-1 max-w-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#525d70] font-mono">
                          0{index + 1}.
                        </span>
                        <button
                          onClick={() => onSelectConcept(concept.id)}
                          className="text-sm font-semibold text-white hover:text-blue-400 transition-colors text-left"
                        >
                          {concept.name}
                        </button>
                        <StatusBadge status={concept.student_status} />
                      </div>

                      <p className="text-xs text-[#7e8ba0] line-clamp-1">
                        {concept.description}
                      </p>

                      {concept.prerequisite_concept_name && (
                        <div className="text-[11px] text-[#857041]">
                          Requires prerequisite: <span className="font-medium text-[#b59b5b]">{concept.prerequisite_concept_name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onSelectConcept(concept.id)}
                        className="px-3 py-1.5 text-xs font-medium bg-[#191f2c] hover:bg-[#222a3b] text-[#9ba7ba] border border-[#283142] rounded transition-colors"
                      >
                        Study note
                      </button>
                      <button
                        onClick={() => onStartTest(concept.id)}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                      >
                        Practice
                      </button>
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
