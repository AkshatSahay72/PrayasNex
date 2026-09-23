import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { ConceptStudyPage } from './pages/ConceptStudyPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { ResultsPage } from './pages/ResultsPage';
import { AIPlaygroundPage } from './pages/AIPlaygroundPage';
import type { AssessmentSubmissionResult } from './types';

type ViewMode =
  | 'dashboard'
  | 'curriculum'
  | 'study'
  | 'assessment'
  | 'results'
  | 'playground';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'curriculum' | 'playground'>('dashboard');
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [activeConceptId, setActiveConceptId] = useState<string>('ml.optimization.gradient_descent');
  const [latestResult, setLatestResult] = useState<AssessmentSubmissionResult | null>(null);

  const handleSelectTab = (tab: 'dashboard' | 'curriculum' | 'playground') => {
    setCurrentTab(tab);
    setViewMode(tab);
  };

  const handleOpenConceptStudy = (conceptId: string) => {
    setActiveConceptId(conceptId);
    setViewMode('study');
  };

  const handleStartTest = (conceptId: string) => {
    setActiveConceptId(conceptId);
    setViewMode('assessment');
  };

  const handleCompleteAssessment = (result: AssessmentSubmissionResult) => {
    setLatestResult(result);
    setViewMode('results');
  };

  const handleReturnDashboard = () => {
    setCurrentTab('dashboard');
    setViewMode('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        studentName="Alex Rivera"
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {viewMode === 'dashboard' && (
          <DashboardPage
            onSelectConcept={handleOpenConceptStudy}
            onStartTest={handleStartTest}
            onBrowseCurriculum={() => handleSelectTab('curriculum')}
          />
        )}

        {viewMode === 'curriculum' && (
          <SubjectsPage
            onSelectConcept={handleOpenConceptStudy}
            onStartTest={handleStartTest}
          />
        )}

        {viewMode === 'study' && (
          <ConceptStudyPage
            conceptId={activeConceptId}
            onBack={handleReturnDashboard}
            onStartTest={handleStartTest}
            onNavigatePrerequisite={(prereqId) => handleOpenConceptStudy(prereqId)}
          />
        )}

        {viewMode === 'assessment' && (
          <AssessmentPage
            conceptId={activeConceptId}
            onCancel={handleReturnDashboard}
            onComplete={handleCompleteAssessment}
          />
        )}

        {viewMode === 'results' && latestResult && (
          <ResultsPage
            result={latestResult}
            onRetake={handleStartTest}
            onReadNote={handleOpenConceptStudy}
            onReturnDashboard={handleReturnDashboard}
          />
        )}

        {viewMode === 'playground' && <AIPlaygroundPage />}
      </main>

      {/* Modern Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>PrayasNex • Adaptive Learning Platform Prototype</span>
          <span className="font-mono text-slate-600">FastAPI • SQLite • React • TypeScript • Tailwind</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
