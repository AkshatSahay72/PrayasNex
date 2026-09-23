import React from 'react';
import {
  BookOpen,
  CheckSquare,
  Home,
  Sliders,
  TrendingUp,
  User
} from 'lucide-react';

export type NavTab = 'home' | 'learn' | 'practice' | 'progress' | 'inspector';

interface AppShellProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeSubjectName?: string;
  activeTopicName?: string;
  studentName?: string;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onSelectTab,
  activeSubjectName = 'Machine Learning',
  activeTopicName = 'Optimization',
  studentName = 'Alex Rivera',
  children
}) => {
  return (
    <div className="min-h-screen bg-[#0b0d13] text-[#e1e4ea] flex flex-col antialiased">
      {/* Top Application Bar */}
      <header className="h-12 border-b border-[#222733] bg-[#11141c] px-4 flex items-center justify-between text-xs z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('home')}
            className="font-semibold text-white tracking-tight hover:text-blue-400 transition-colors flex items-center gap-2"
          >
            <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-[11px]">
              P
            </div>
            <span>PrayasNex</span>
          </button>
          <span className="text-[#454e60]">/</span>
          <span className="text-[#8c96a8]">{activeSubjectName}</span>
          <span className="text-[#454e60]">/</span>
          <span className="text-[#cfd5e1] font-medium">{activeTopicName}</span>
        </div>

        {/* Student Profile Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#171c26] border border-[#262c3a] text-xs text-[#a3adbf]">
            <User className="w-3.5 h-3.5 text-[#738096]" />
            <span>{studentName}</span>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout (Sidebar + Content Area) */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-56 border-b md:border-b-0 md:border-r border-[#222733] bg-[#0e1118] p-3 flex md:flex-col justify-between shrink-0">
          <div className="space-y-1 w-full flex md:flex-col gap-1 md:gap-0 overflow-x-auto">
            <div className="hidden md:block px-2 py-1.5 text-[10px] font-semibold text-[#5a6578] uppercase tracking-wider">
              Workspace
            </div>

            <button
              onClick={() => onSelectTab('home')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors text-left ${
                currentTab === 'home'
                  ? 'bg-[#1b212d] text-white border-l-2 border-blue-500'
                  : 'text-[#8c96a8] hover:text-[#d5dbe5] hover:bg-[#151922]'
              }`}
            >
              <Home className="w-4 h-4 text-[#738096]" />
              <span>Home</span>
            </button>

            <button
              onClick={() => onSelectTab('learn')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors text-left ${
                currentTab === 'learn'
                  ? 'bg-[#1b212d] text-white border-l-2 border-blue-500'
                  : 'text-[#8c96a8] hover:text-[#d5dbe5] hover:bg-[#151922]'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#738096]" />
              <span>Learn</span>
            </button>

            <button
              onClick={() => onSelectTab('practice')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors text-left ${
                currentTab === 'practice'
                  ? 'bg-[#1b212d] text-white border-l-2 border-blue-500'
                  : 'text-[#8c96a8] hover:text-[#d5dbe5] hover:bg-[#151922]'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-[#738096]" />
              <span>Practice</span>
            </button>

            <button
              onClick={() => onSelectTab('progress')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors text-left ${
                currentTab === 'progress'
                  ? 'bg-[#1b212d] text-white border-l-2 border-blue-500'
                  : 'text-[#8c96a8] hover:text-[#d5dbe5] hover:bg-[#151922]'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-[#738096]" />
              <span>Progress</span>
            </button>
          </div>

          {/* Bottom Utility Tools */}
          <div className="hidden md:block pt-3 border-t border-[#1c222e]">
            <button
              onClick={() => onSelectTab('inspector')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors text-left ${
                currentTab === 'inspector'
                  ? 'bg-[#1b212d] text-white border-l-2 border-blue-500'
                  : 'text-[#626e82] hover:text-[#a0aaba] hover:bg-[#151922]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Quality Inspector</span>
            </button>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 bg-[#0b0d13] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
