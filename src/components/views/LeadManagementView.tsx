import React, { useState } from 'react';
import { Lead, LeadStatus, AssignedTeam, BudgetTier } from '../../types.js';
import {
  Search,
  Filter,
  Download,
  Building,
  RotateCw,
  ExternalLink,
  ChevronDown,
  Layers,
  ArrowUpDown
} from 'lucide-react';

interface LeadManagementViewProps {
  leads: Lead[];
  isLoading: boolean;
  onInspectLead: (lead: Lead) => void;
  onReEvaluateLead: (id: string) => Promise<void>;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const LeadManagementView: React.FC<LeadManagementViewProps> = ({
  leads,
  isLoading,
  onInspectLead,
  onReEvaluateLead,
  searchQuery,
  onSearchChange,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [teamFilter, setTeamFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'budget'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [reEvaluatingId, setReEvaluatingId] = useState<string | null>(null);

  // Filter leads
  let filtered = leads.filter((lead) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      lead.companyName.toLowerCase().includes(q) ||
      lead.contactName.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      lead.id.toLowerCase().includes(q) ||
      lead.industry.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'All' || lead.qualificationStatus === statusFilter;
    const matchesTeam = teamFilter === 'All' || lead.assignedTeam === teamFilter;

    return matchesSearch && matchesStatus && matchesTeam;
  });

  // Sort leads
  filtered.sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'date') {
      comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'score') {
      comparison = b.leadScore - a.leadScore;
    } else if (sortBy === 'budget') {
      comparison = b.estimatedBudget - a.estimatedBudget;
    }
    return sortOrder === 'asc' ? -comparison : comparison;
  });

  const toggleSort = (field: 'date' | 'score' | 'budget') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Company', 'Contact', 'Email', 'Industry', 'Headcount', 'ARR Budget', 'Status', 'Lead Score', 'Intent Grade', 'Assigned Team', 'Assigned AE', 'Created At'];
    const rows = filtered.map(l => [
      l.id,
      `"${l.companyName}"`,
      `"${l.contactName}"`,
      l.email,
      l.industry,
      l.employeeCount,
      l.estimatedBudget,
      l.qualificationStatus,
      l.leadScore,
      l.intentGrade,
      `"${l.assignedTeam}"`,
      `"${l.assignedAE}"`,
      l.createdAt
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leadpilot-leads-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Controls Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search & Filters */}
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search leads, domains, IDs..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Qualified">Qualified</option>
              <option value="Approved">Approved</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Needs Review">Needs Review</option>
              <option value="Disqualified">Disqualified</option>
            </select>
          </div>

          {/* Team selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Territory:</span>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Teams</option>
              <option value="Strategic Enterprise">Strategic Enterprise</option>
              <option value="US Mid-Market">US Mid-Market</option>
              <option value="EMEA Enterprise">EMEA Enterprise</option>
              <option value="APAC Growth">APAC Growth</option>
              <option value="Automated Nurture">Automated Nurture</option>
            </select>
          </div>
        </div>

        {/* Export action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Table Header */}
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Lead / Company</th>
                <th className="px-4 py-3">Contact</th>
                <th
                  onClick={() => toggleSort('budget')}
                  className="px-4 py-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>ARR Budget</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('score')}
                  className="px-4 py-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>AI Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned Territory</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filtered.length > 0 ? (
                filtered.map((lead) => {
                  const isPending = lead.qualificationStatus === 'Pending Approval';
                  const isApproved = lead.qualificationStatus === 'Approved';
                  const isQualified = lead.qualificationStatus === 'Qualified';
                  const isDisqualified = lead.qualificationStatus === 'Disqualified';
                  const isReEvaluating = reEvaluatingId === lead.id;

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => onInspectLead(lead)}
                    >
                      {/* Company & ID */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-400">
                            <Building className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-bold text-slate-400">{lead.id}</span>
                              <span className="font-bold text-white truncate max-w-[160px]">{lead.companyName}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>{lead.industry}</span>
                              <span>·</span>
                              <span>{lead.employeeCount}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact & Email */}
                      <td className="px-4 py-3.5">
                        <div className="text-slate-200 font-medium truncate max-w-[140px]">{lead.contactName}</div>
                        <div className="text-[11px] text-slate-400 font-mono truncate max-w-[150px]">{lead.email}</div>
                      </td>

                      {/* Budget */}
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-200 tabular-nums">
                        <div>${lead.estimatedBudget.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400 font-sans font-normal truncate max-w-[110px]">{lead.budgetTier}</div>
                      </td>

                      {/* AI Score */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-mono text-base font-extrabold text-blue-400 tabular-nums">{lead.leadScore}</span>
                          <span className="font-bold text-xs text-slate-400">({lead.intentGrade})</span>
                        </div>
                        <div className="text-[10px] text-emerald-400 font-medium">
                          ICP: {lead.icpMatchScore}%
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
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
                      </td>

                      {/* Assigned AE & Team */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-200 truncate max-w-[150px]">{lead.assignedTeam}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{lead.assignedAE}</div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={async () => {
                            setReEvaluatingId(lead.id);
                            try {
                              await onReEvaluateLead(lead.id);
                            } finally {
                              setReEvaluatingId(null);
                            }
                          }}
                          disabled={isReEvaluating}
                          title="Re-run neural AI scoring"
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <RotateCw className={`w-3.5 h-3.5 ${isReEvaluating ? 'animate-spin text-blue-400' : ''}`} />
                        </button>

                        <button
                          onClick={() => onInspectLead(lead)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <p className="text-sm font-medium text-slate-300">No leads match the specified criteria</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting the search query or status filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing <strong className="text-white font-mono">{filtered.length}</strong> of <strong className="text-white font-mono">{leads.length}</strong> total leads</span>
          <span className="font-mono text-slate-500">LeadPilot v2.4 Enterprise</span>
        </div>
      </div>
    </div>
  );
};
