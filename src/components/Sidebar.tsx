import React from 'react';
import {
  LayoutDashboard,
  Send,
  Users,
  ShieldCheck,
  Activity,
  FlaskConical,
  Compass,
  Cpu,
  Database
} from 'lucide-react';

export type NavTab = 'dashboard' | 'submit' | 'leads' | 'approvals' | 'logs' | 'tests';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingApprovalsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingApprovalsCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Executive pipeline & KPI metrics',
    },
    {
      id: 'submit' as NavTab,
      label: 'Submit Enquiry',
      icon: Send,
      description: 'Interactive intake form with live AI scoring',
    },
    {
      id: 'leads' as NavTab,
      label: 'Lead Management',
      icon: Users,
      description: 'Filterable lead registry & routing matrix',
    },
    {
      id: 'approvals' as NavTab,
      label: 'Manager Approvals',
      icon: ShieldCheck,
      badge: pendingApprovalsCount,
      description: 'Human-in-the-loop enterprise sign-off',
    },
    {
      id: 'logs' as NavTab,
      label: 'Workflow Logs',
      icon: Activity,
      description: 'Real-time telemetry & execution audit',
    },
    {
      id: 'tests' as NavTab,
      label: 'Test Reports',
      icon: FlaskConical,
      description: 'Automated rules & scenario test suite',
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col shrink-0 select-none z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 text-white font-bold text-lg">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">LeadPilot</span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Enterprise Lead Routing</p>
          </div>
        </div>
      </div>

      {/* Navigation items */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                  }`}
                />
                <span className="truncate whitespace-nowrap">{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                    isActive
                      ? 'bg-white text-blue-700'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* System info footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
        <div className="rounded-lg p-3 bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              Engine Status
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-slate-400" />
              Persistence
            </span>
            <span className="text-slate-300 font-mono">SQLite/JSON Sync</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
