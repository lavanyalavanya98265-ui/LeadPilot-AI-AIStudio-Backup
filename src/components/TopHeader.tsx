import React from 'react';
import { NavTab } from './Sidebar.js';
import { Search, RefreshCw, Send, Bell } from 'lucide-react';

interface TopHeaderProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  onResetSeed: () => void;
  isResetting: boolean;
  pendingApprovalsCount: number;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard Overview',
    subtitle: 'Real-time telemetry, inbound lead pipeline, and routing distribution',
  },
  submit: {
    title: 'Submit Sales Enquiry',
    subtitle: 'Ingest enterprise lead for instant multi-factor AI qualification and routing',
  },
  leads: {
    title: 'Lead Management Matrix',
    subtitle: 'Comprehensive prospect database, assigned account executives, and ICP fit scores',
  },
  approvals: {
    title: 'Manager Approval Queue',
    subtitle: 'High-value threshold governance and territory routing approvals',
  },
  logs: {
    title: 'Workflow Telemetry & Audit Logs',
    subtitle: 'Traceable execution lifecycle from ingestion to CRM distribution',
  },
  tests: {
    title: 'Automated Test Reports',
    subtitle: 'Regression test suites for routing rules, gatekeepers, and scoring assertions',
  },
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  onSelectTab,
  onSearch,
  searchQuery,
  onResetSeed,
  isResetting,
  pendingApprovalsCount,
}) => {
  const currentInfo = TAB_TITLES[currentTab];

  return (
    <header className="h-16 px-6 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-sm flex items-center justify-between gap-6 shrink-0 z-10">
      {/* Breadcrumb & Section Title */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">LeadPilot AI</span>
          <span>/</span>
          <span className="text-blue-400 font-medium capitalize">{currentTab}</span>
        </div>
        <h1 className="text-base font-bold text-white truncate leading-tight">
          {currentInfo.title}
        </h1>
      </div>

      {/* Middle Search & Actions */}
      <div className="flex items-center gap-3">
        {/* Search bar */}
        <div className="relative w-64 hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearch(e.target.value);
              if (currentTab !== 'leads' && e.target.value.trim().length > 0) {
                onSelectTab('leads');
              }
            }}
            placeholder="Search leads, companies..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Reset Database Button */}
        <button
          onClick={onResetSeed}
          disabled={isResetting}
          title="Reset database to default realistic enterprise sample leads"
          className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isResetting ? 'animate-spin text-blue-400' : ''}`} />
          <span className="hidden md:inline">Reset Demo Data</span>
        </button>

        {/* Pending approvals icon with counter */}
        {pendingApprovalsCount > 0 && (
          <button
            onClick={() => onSelectTab('approvals')}
            className="px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>{pendingApprovalsCount} Approvals</span>
          </button>
        )}

        {/* Primary CTA */}
        {currentTab !== 'submit' && (
          <button
            onClick={() => onSelectTab('submit')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm shadow-blue-600/30 flex items-center gap-1.5 transition-all active:scale-[0.98] whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Enquiry</span>
          </button>
        )}
      </div>
    </header>
  );
};
