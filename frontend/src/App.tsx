import React, { useState } from 'react';
import { AppShell, type NavTab } from './components/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { LearnPage } from './pages/LearnPage';
import { ConceptStudyPage } from './pages/ConceptStudyPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { ResultsPage } from './pages/ResultsPage';
import { ProgressPage } from './pages/ProgressPage';
import { QualityInspectorPage } from './pages/QualityInspectorPage';
import type { AssessmentSubmissionResult } from './types';

type ActiveView =
  | 'home'
  | 'learn'
  | 'study'
  | 'assessment'
  | 'results'
  | 'progress'
  | 'inspector';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [activeConceptId, setActiveConceptId] = useState<string>('ml.optimization.gradient_descent');
  const [latestResult, setLatestResult] = useState<AssessmentSubmissionResult | null>(null);

  const handleSelectTab = (tab: NavTab) => {
    setCurrentTab(tab);
    if (tab === 'practice') {
      setActiveView('assessment');
    } else {
      setActiveView(tab);
    }
  };

  const handleOpenConceptStudy = (conceptId: string) => {
    setActiveConceptId(conceptId);
    setActiveView('study');
    setCurrentTab('learn');
  };

  const handleStartTest = (conceptId: string) => {
    setActiveConceptId(conceptId);
    setActiveView('assessment');
    setCurrentTab('practice');
  };

  const handleCompleteAssessment = (result: AssessmentSubmissionResult) => {
    setLatestResult(result);
    setActiveView('results');
  };

  const handleReturnHome = () => {
    setCurrentTab('home');
    setActiveView('home');
  };

  return (
    <AppShell
      currentTab={currentTab}
      onSelectTab={handleSelectTab}
      activeSubjectName="Machine Learning"
      activeTopicName="Optimization"
      studentName="Alex Rivera"
    >
      {activeView === 'home' && (
        <DashboardPage
          onSelectConcept={handleOpenConceptStudy}
          onStartTest={handleStartTest}
          onBrowseLearn={() => handleSelectTab('learn')}
        />
      )}

      {activeView === 'learn' && (
        <LearnPage
          onSelectConcept={handleOpenConceptStudy}
          onStartTest={handleStartTest}
        />
      )}

      {activeView === 'study' && (
        <ConceptStudyPage
          conceptId={activeConceptId}
          onBack={handleReturnHome}
          onStartTest={handleStartTest}
          onNavigatePrerequisite={(prereqId) => handleOpenConceptStudy(prereqId)}
        />
      )}

      {activeView === 'assessment' && (
        <AssessmentPage
          conceptId={activeConceptId}
          onCancel={handleReturnHome}
          onComplete={handleCompleteAssessment}
        />
      )}

      {activeView === 'results' && latestResult && (
        <ResultsPage
          result={latestResult}
          onRetake={handleStartTest}
          onReadNote={handleOpenConceptStudy}
          onReturnDashboard={handleReturnHome}
        />
      )}

      {activeView === 'progress' && (
        <ProgressPage
          onSelectConcept={handleOpenConceptStudy}
          onStartTest={handleStartTest}
        />
      )}

      {activeView === 'inspector' && <QualityInspectorPage />}
    </AppShell>
  );
};

export default App;
