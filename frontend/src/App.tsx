import React, { useState } from 'react';
import { AppShell, type NavTab, type BreadcrumbItem } from './components/AppShell';
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
  const [previousView, setPreviousView] = useState<ActiveView>('home');
  const [activeConceptId, setActiveConceptId] = useState<string>('ml.optimization.gradient_descent');
  const [latestResult, setLatestResult] = useState<AssessmentSubmissionResult | null>(null);

  const handleSelectTab = (tab: NavTab) => {
    setCurrentTab(tab);
    setPreviousView(activeView);
    if (tab === 'practice') {
      setActiveView('assessment');
    } else {
      setActiveView(tab);
    }
  };

  const handleOpenConceptStudy = (conceptId: string) => {
    setActiveConceptId(conceptId);
    setPreviousView(activeView);
    setActiveView('study');
    setCurrentTab('learn');
  };

  const handleStartTest = (conceptId: string) => {
    setActiveConceptId(conceptId);
    setPreviousView(activeView);
    setActiveView('assessment');
    setCurrentTab('practice');
  };

  const handleCompleteAssessment = (result: AssessmentSubmissionResult) => {
    setLatestResult(result);
    setPreviousView('assessment');
    setActiveView('results');
    setCurrentTab('practice');
  };

  const handleReturnHome = () => {
    setCurrentTab('home');
    setActiveView('home');
  };

  const handleReturnFromStudy = () => {
    if (previousView === 'learn') {
      setCurrentTab('learn');
      setActiveView('learn');
    } else {
      setCurrentTab('learn');
      setActiveView('learn');
    }
  };

  const handleCancelAssessment = () => {
    if (previousView === 'study') {
      setCurrentTab('learn');
      setActiveView('study');
    } else if (previousView === 'learn') {
      setCurrentTab('learn');
      setActiveView('learn');
    } else {
      setCurrentTab('home');
      setActiveView('home');
    }
  };

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    switch (activeView) {
      case 'home':
        return [];
      case 'learn':
        return [{ label: 'Curriculum & Learn' }];
      case 'study':
        return [
          { label: 'Curriculum & Learn', onClick: () => handleSelectTab('learn') },
          { label: 'Concept Study Guide' }
        ];
      case 'assessment':
        return [
          { label: 'Practice & Assess', onClick: () => handleSelectTab('practice') },
          { label: 'Concept Assessment' }
        ];
      case 'results':
        return [
          { label: 'Practice & Assess', onClick: () => handleSelectTab('practice') },
          { label: 'Assessment Diagnostic Results' }
        ];
      case 'progress':
        return [{ label: 'Progress & Analytics' }];
      case 'inspector':
        return [{ label: 'Quality Inspector' }];
      default:
        return [];
    }
  };

  return (
    <AppShell
      currentTab={currentTab}
      onSelectTab={handleSelectTab}
      breadcrumbs={getBreadcrumbs()}
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
          onBack={handleReturnFromStudy}
          onStartTest={handleStartTest}
          onNavigatePrerequisite={(prereqId) => handleOpenConceptStudy(prereqId)}
        />
      )}

      {activeView === 'assessment' && (
        <AssessmentPage
          conceptId={activeConceptId}
          onCancel={handleCancelAssessment}
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
