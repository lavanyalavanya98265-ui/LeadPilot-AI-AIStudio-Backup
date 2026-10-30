import React from 'react';
import { DashboardStats, Lead } from '../../types.js';
import { NavTab } from '../Sidebar.js';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  DollarSign,
  ShieldAlert,
  Zap,
  ArrowRight,
  ExternalLink,
  Building,
  CheckCheck,
  RotateCcw
} from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats | null;
  isLoading: boolean;
  onSelectTab: (tab: NavTab) => void;
  onInspectLead: (lead: Lead) => void;
  onRunQuickTests: () => void;
  isRunningTests: boolean;
  quickTestSummary: { passed: number; total: number } | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  isLoading,
  onSelectTab,
  onInspectLead,
  onRunQuickTests,
  isRunningTests,
  quickTestSummary,
}) => {
  if (isLoading || !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading pipeline telemetry...</p>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Enquiries',
      value: stats.totalEnquiries.toString(),
      subtext: 'Ingested via API & forms',
      icon: TrendingUp,
      accent: 'text-blue-400',
      border: 'border-blue-500/20',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Qualification Rate',
      value: `${stats.qualificationRate}%`,
      subtext: `${stats.qualifiedCount} leads passed ICP gates`,
      icon: CheckCircle2,
      accent: 'text-emerald-400',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Pipeline Value',
      value: `$${(stats.pipelineValue / 1000).toFixed(0)}k`,
      subtext: 'Qualified & pending ARR',
      icon: DollarSign,
      accent: 'text-indigo-400',
      border: 'border-indigo-500/20',
      bg: 'bg-indigo-500/10',
    },
    {
      label: 'Pending Approvals',
      value: stats.pendingApprovalsCount.toString(),
      subtext: stats.pendingApprovalsCount > 0 ? 'Requires manager sign-off' : 'Queue cleared',
      icon: ShieldAlert,
      accent: stats.pendingApprovalsCount > 0 ? 'text-amber-400' : 'text-slate-400',
      border: stats.pendingApprovalsCount > 0 ? 'border-amber-500/30' : 'border-slate-800',
      bg: stats.pendingApprovalsCount > 0 ? 'bg-amber-500/10' : 'bg-slate-900',
      highlight: stats.pendingApprovalsCount > 0,
      action: () => onSelectTab('approvals'),
    },
    {
      label: 'Avg AI Latency',
      value: `${stats.avgProcessingLatencyMs}ms`,
      subtext: 'Neural scoring & rules SLA',
      icon: Zap,
      accent: 'text-cyan-400',
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 border border-blue-900/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Live Pipeline Active
            </span>
            <span className="text-xs text-slate-400">Deterministic scoring & territory dispatch</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Autonomous Lead Qualification & Escalation Matrix
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Inbound leads are enriched with firmographics, scored for ICP fit, matched against multi-tier territory routing rules, and gated for manager approval when contract value exceeds $100K.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onRunQuickTests}
            disabled={isRunningTests}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isRunningTests ? (
              <RotateCcw className="w-3.5 h-3.5 animate-spin text-blue-400" />
            ) : (
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>
              {isRunningTests
                ? 'Running Rules Tests...'
                : quickTestSummary
                ? `Tests: ${quickTestSummary.passed}/${quickTestSummary.total} Passed`
                : 'Run Test Scenarios'}
            </span>
          </button>

          <button
            onClick={() => onSelectTab('submit')}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-[0.98]"
          >
            <span>Submit Inbound</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={kpi.action}
              className={`p-4 rounded-xl border ${kpi.border} ${kpi.bg} flex flex-col justify-between transition-all ${
                kpi.action ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">{kpi.label}</span>
                <Icon className={`w-4 h-4 ${kpi.accent}`} />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
                  {kpi.value}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 truncate">
                  {kpi.subtext}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Distribution & Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Territory Routing Matrix */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight">Territory Routing Allocation</h3>
            <button
              onClick={() => onSelectTab('leads')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              <span>View Table</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {Object.entries(stats.teamBreakdown).map(([team, count]) => {
              const percentage = stats.totalEnquiries > 0 ? Math.round((count / stats.totalEnquiries) * 100) : 0;
              return (
                <div key={team} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{team}</span>
                    <span className="text-slate-400 font-mono tabular-nums">
                      {count} lead{count === 1 ? '' : 's'} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        team === 'Strategic Enterprise'
                          ? 'bg-blue-500'
                          : team === 'US Mid-Market'
                          ? 'bg-indigo-500'
                          : team === 'EMEA Enterprise'
                          ? 'bg-cyan-500'
                          : team === 'APAC Growth'
                          ? 'bg-teal-500'
                          : 'bg-slate-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Qualification Status Breakdown */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight">Qualification Status Funnel</h3>
            <span className="text-xs text-slate-400 font-mono">{stats.totalEnquiries} Inquiries Total</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(stats.statusBreakdown).map(([status, count]) => {
              const isPending = status === 'Pending Approval';
              const isQualified = status === 'Qualified' || status === 'Approved';
              const isDisqualified = status === 'Disqualified';
              return (
                <div
                  key={status}
                  className={`p-3 rounded-lg border flex flex-col justify-between ${
                    isPending
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : isQualified
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : isDisqualified
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                  }`}
                >
                  <span className="text-[11px] font-medium truncate">{status}</span>
                  <div className="text-xl font-bold font-mono tabular-nums mt-2">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Budget Tier Strip */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-xs font-semibold text-slate-400 mb-2">Deal Sizes in Pipeline</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.tierBreakdown).map(([tier, count]) => (
                <div
                  key={tier}
                  className="px-2.5 py-1 bg-slate-800/90 border border-slate-700/80 rounded-md text-[11px] text-slate-300 flex items-center gap-1.5"
                >
                  <span className="font-medium">{tier}:</span>
                  <span className="font-mono text-blue-400 font-bold tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent High-Impact Inbounds Stream */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Recent High-Impact Inbounds</h3>
            <p className="text-xs text-slate-400">Stream of recently evaluated enterprise enquiries and their routing targets</p>
          </div>
          <button
            onClick={() => onSelectTab('leads')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
          >
            <span>See All Leads</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/80">
          {stats.recentLeads.map((lead) => {
            const isApproved = lead.qualificationStatus === 'Approved';
            const isPending = lead.qualificationStatus === 'Pending Approval';
            const isQualified = lead.qualificationStatus === 'Qualified';
            const isDisqualified = lead.qualificationStatus === 'Disqualified';

            return (
              <div
                key={lead.id}
                className="py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300">
                    <Building className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{lead.id}</span>
                      <span className="text-sm font-bold text-white truncate">{lead.companyName}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-400 truncate">{lead.industry}</span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>{lead.contactName}</span>
                      <span>·</span>
                      <span className="font-mono text-slate-300 font-medium">
                        ${lead.estimatedBudget.toLocaleString()} ARR
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end">
                  {/* Lead Score Badge */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs">
                    <span className="text-slate-400">Score:</span>
                    <span className="font-mono font-bold text-blue-400 tabular-nums">{lead.leadScore}</span>
                    <span className="font-bold text-slate-200">({lead.intentGrade})</span>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-md border ${
                      isPending
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : isApproved || isQualified
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : isDisqualified
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {lead.qualificationStatus}
                  </span>

                  {/* Assigned AE */}
                  <div className="hidden lg:block text-right">
                    <div className="text-[11px] text-slate-400">Assigned Team</div>
                    <div className="text-xs font-medium text-slate-200 truncate max-w-[140px]">
                      {lead.assignedTeam}
                    </div>
                  </div>

                  {/* Inspect CTA */}
                  <button
                    onClick={() => onInspectLead(lead)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
