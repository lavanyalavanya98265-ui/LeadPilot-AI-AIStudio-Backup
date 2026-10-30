import React, { useState } from 'react';
import { Lead, AssignedTeam } from '../../types.js';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  UserCheck,
  Building,
  AlertTriangle,
  Clock,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface ManagerApprovalsViewProps {
  leads: Lead[];
  onDecideApproval: (
    id: string,
    action: 'approve' | 'reject' | 'override',
    notes?: string,
    team?: string,
    ae?: string
  ) => Promise<void>;
  onInspectLead: (lead: Lead) => void;
}

export const ManagerApprovalsView: React.FC<ManagerApprovalsViewProps> = ({
  leads,
  onDecideApproval,
  onInspectLead,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [managerNotes, setManagerNotes] = useState<Record<string, string>>({});

  // Pending leads
  const pendingLeads = leads.filter(
    (l) => l.qualificationStatus === 'Pending Approval' || (l.requiresManagerApproval && l.approvalDetails?.status === 'Pending')
  );

  // History leads
  const historyLeads = leads.filter(
    (l) => l.approvalDetails && l.approvalDetails.status !== 'Pending'
  );

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'override') => {
    setProcessingId(id);
    const note = managerNotes[id] || (action === 'approve' ? 'Approved by Sales Director' : 'Rejected after executive review');
    try {
      await onDecideApproval(id, action, note);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header and Sub-tabs */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">Executive Manager Governance Queue</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Human-in-the-loop oversight for high-contract deals (&gt; $100K ARR), non-standard SLA requests, or unverified freemail registrations.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'pending'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending Review ({pendingLeads.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit History ({historyLeads.length})
          </button>
        </div>
      </div>

      {/* Main List */}
      {activeTab === 'pending' ? (
        pendingLeads.length > 0 ? (
          <div className="space-y-4">
            {pendingLeads.map((lead) => {
              const isProcessing = processingId === lead.id;
              const note = managerNotes[lead.id] || '';

              return (
                <div
                  key={lead.id}
                  className="p-6 rounded-xl bg-slate-900/90 border border-amber-500/30 shadow-lg space-y-5"
                >
                  {/* Lead Top Bar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-400">{lead.id}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                            Action Required
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white mt-0.5">{lead.companyName}</h3>
                        <p className="text-xs text-slate-400">{lead.contactName} · {lead.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-[11px] text-slate-400">Deal Contract Value</div>
                        <div className="text-xl font-bold font-mono text-white tabular-nums">
                          ${lead.estimatedBudget.toLocaleString()} ARR
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-400">Score</div>
                        <div className="text-base font-extrabold font-mono text-blue-400">
                          {lead.leadScore} ({lead.intentGrade})
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Escalation Reason Box */}
                  <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5 text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Escalation Trigger:</span>
                    </div>
                    <p className="text-amber-200/90 leading-relaxed pl-5">
                      {lead.approvalDetails?.reason || 'Contract value exceeds automated routing limits.'}
                    </p>
                  </div>

                  {/* AI Evaluation Summary & Requirements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                      <span className="font-semibold text-slate-300">AI Evaluation & Intent</span>
                      <p className="text-slate-300 leading-relaxed">{lead.aiEvaluation.summary}</p>
                      <p className="text-blue-300 pt-1 font-medium">{lead.aiEvaluation.buyingIntentAnalysis}</p>
                    </div>

                    <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                      <span className="font-semibold text-slate-300">Proposed Assignment & SLA</span>
                      <div className="space-y-1 text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Target Team:</span>
                          <span className="font-medium text-white">{lead.assignedTeam}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Target AE:</span>
                          <span className="font-medium text-white">{lead.assignedAE}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Routing Rule:</span>
                          <span className="italic text-slate-400">{lead.routingRuleApplied}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Manager Decision Input & Action Buttons */}
                  <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex-1 relative">
                      <MessageSquare className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Add optional manager audit note (e.g. Authorized for Strategic Accounts fast track)..."
                        value={note}
                        onChange={(e) => setManagerNotes({ ...managerNotes, [lead.id]: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onInspectLead(lead)}
                        className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        Inspect Dossier
                      </button>

                      <button
                        onClick={() => handleAction(lead.id, 'reject')}
                        disabled={isProcessing}
                        className="px-3.5 py-2 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Disqualify</span>
                      </button>

                      <button
                        onClick={() => handleAction(lead.id, 'approve')}
                        disabled={isProcessing}
                        className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm shadow-emerald-600/30 rounded-lg flex items-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{isProcessing ? 'Authorizing...' : 'Approve & Route'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Manager Approval Queue is Empty</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                No high-value or exception leads are currently awaiting sign-off. High-budget leads will appear here automatically when submitted.
              </p>
            </div>
          </div>
        )
      ) : (
        /* History Review Table */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Lead / Company</th>
                  <th className="px-4 py-3">Contract Value</th>
                  <th className="px-4 py-3">Decision</th>
                  <th className="px-4 py-3">Reviewer</th>
                  <th className="px-4 py-3">Manager Notes</th>
                  <th className="px-4 py-3">Reviewed At</th>
                  <th className="px-4 py-3 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {historyLeads.map((lead) => {
                  const decision = lead.approvalDetails?.status;
                  const isApproved = decision === 'Approved' || decision === 'Overridden';
                  return (
                    <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white">{lead.companyName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{lead.id}</div>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-200">
                        ${lead.estimatedBudget.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            isApproved
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {decision}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300 font-medium">
                        {lead.approvalDetails?.reviewedBy || 'System Executive'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-300 italic max-w-xs truncate">
                        {lead.approvalDetails?.managerNotes || 'N/A'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                        {lead.approvalDetails?.reviewedAt ? new Date(lead.approvalDetails.reviewedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => onInspectLead(lead)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
