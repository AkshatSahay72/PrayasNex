import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckSquare,
  Home,
  Sliders,
  TrendingUp,
  Menu,
  X,
  ChevronRight,
  BrainCircuit,
  UserCheck
} from 'lucide-react';

export type NavTab = 'home' | 'learn' | 'practice' | 'progress' | 'inspector';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface AppShellProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  breadcrumbs?: BreadcrumbItem[];
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onSelectTab,
  breadcrumbs = [],
  children
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'learn' as NavTab, label: 'Curriculum & Learn', icon: BookOpen },
    { id: 'practice' as NavTab, label: 'Practice & Assess', icon: CheckSquare },
    { id: 'progress' as NavTab, label: 'Progress & Analytics', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-[#0b0d13] text-[#e1e4ea] flex flex-col antialiased">
      {/* Top Application Bar */}
      <header className="h-14 border-b border-[#1f2533] bg-[#10131b]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between text-xs sticky top-0 z-40">
        {/* Brand & Breadcrumbs */}
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-1.5 rounded-md text-[#8c96a8] hover:text-white hover:bg-[#1a202c] transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <button
            onClick={() => handleNavClick('home')}
            className="font-bold text-white tracking-tight hover:text-blue-400 transition-colors flex items-center gap-2.5 shrink-0"
            title="PrayasNex Home"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">PrayasNex</span>
          </button>

          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumbs" className="hidden sm:flex items-center gap-1.5 text-xs overflow-x-auto py-1">
            {breadcrumbs.length > 0 && <span className="text-[#3c4556]">/</span>}
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#3c4556] shrink-0" />}
                  {crumb.onClick && !isLast ? (
                    <button
                      onClick={crumb.onClick}
                      className="text-[#8c96a8] hover:text-blue-400 transition-colors whitespace-nowrap font-medium"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span
                      className={`whitespace-nowrap ${
                        isLast ? 'text-[#e1e5ee] font-semibold' : 'text-[#8c96a8]'
                      }`}
                      aria-current={isLast ? 'page' : undefined}
                    >
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Right Status / Student Badge */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#161b26] border border-[#232b3d] text-[11px] text-[#8e9bb0]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
            <span>Adaptive Engine Online</span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#151924] border border-[#222938] text-xs text-[#d1d7e2]">
            <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium hidden sm:inline">Demo Student</span>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-out Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-72 bg-[#0e1118] border-r border-[#222733] z-50 p-4 flex flex-col justify-between transform transition-transform duration-200 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f2533]">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-xs">
                P
              </div>
              <span>PrayasNex Menu</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded text-[#738096] hover:text-white"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                      : 'text-[#8c96a8] hover:text-white hover:bg-[#151922]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-[#738096]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-[#1c222e] space-y-2">
          <button
            onClick={() => handleNavClick('inspector')}
            aria-current={currentTab === 'inspector' ? 'page' : undefined}
            className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
              currentTab === 'inspector'
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                : 'text-[#626e82] hover:text-[#a0aaba] hover:bg-[#151922]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Quality Inspector</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout (Sidebar + Content Area) */}
      <div className="flex-1 flex flex-col md:flex-row min-w-0">
        {/* Desktop Sidebar Navigation */}
        <aside
          aria-label="Sidebar Navigation"
          className="hidden md:flex w-56 border-r border-[#1f2533] bg-[#0d1017] p-3 flex-col justify-between shrink-0 min-h-[calc(100vh-3.5rem)] sticky top-14"
        >
          <div className="space-y-1 w-full">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-[#5a6578] uppercase tracking-wider">
              Workspace
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                      isActive
                        ? 'bg-[#182030] text-blue-300 border-l-2 border-blue-500 shadow-xs'
                        : 'text-[#8c96a8] hover:text-[#d5dbe5] hover:bg-[#141822]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-[#738096]'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Utility Tools */}
          <div className="pt-3 border-t border-[#1a202c]">
            <div className="px-3 py-1 text-[10px] font-semibold text-[#4e5768] uppercase tracking-wider">
              Diagnostics
            </div>
            <button
              onClick={() => handleNavClick('inspector')}
              aria-current={currentTab === 'inspector' ? 'page' : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                currentTab === 'inspector'
                  ? 'bg-[#182030] text-blue-300 border-l-2 border-blue-500'
                  : 'text-[#626e82] hover:text-[#a0aaba] hover:bg-[#141822]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Quality Inspector</span>
            </button>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 bg-[#0b0d13] overflow-y-auto min-w-0" id="main-content">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#1a1f2b] bg-[#090b10] px-4 sm:px-6 py-4 text-xs text-[#556276] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span>PrayasNex © {new Date().getFullYear()}</span>
          <span>•</span>
          <span>Concept-Level Adaptive Learning Engine</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-[#6b7990]">
          <span>Groq LLM Accelerated</span>
          <span>•</span>
          <span>Knowledge Graph Prerequisite Propagation</span>
        </div>
      </footer>
    </div>
  );
};
