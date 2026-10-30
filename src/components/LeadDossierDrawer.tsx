import React, { useState } from 'react';
import { Lead, AssignedTeam, LeadStatus } from '../types.js';
import {
  X,
  Building,
  Mail,
  Phone,
  Globe,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  UserCheck,
  CheckCircle,
  ExternalLink,
  DollarSign
} from 'lucide-react';

interface LeadDossierDrawerProps {
  lead: Lead | null;
  onClose: () => void;
  onReEvaluate: (id: string) => Promise<void>;
  onApprove: (id: string, notes?: string) => Promise<void>;
  onOverrideAssignment: (id: string, team: AssignedTeam, ae: string) => Promise<void>;
}

export const LeadDossierDrawer: React.FC<LeadDossierDrawerProps> = ({
  lead,
  onClose,
  onReEvaluate,
  onApprove,
  onOverrideAssignment,
}) => {
  const [isReEvaluating, setIsReEvaluating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [managerNote, setManagerNote] = useState('');
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<AssignedTeam>('Strategic Enterprise');
  const [selectedAE, setSelectedAE] = useState('Sarah Chen (Principal AE)');

  if (!lead) return null;

  const handleReEval = async () => {
    setIsReEvaluating(true);
    try {
      await onReEvaluate(lead.id);
    } finally {
      setIsReEvaluating(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(lead.id, managerNote);
    } finally {
      setIsApproving(false);
    }
  };

  const handleOverride = async () => {
    await onOverrideAssignment(lead.id, selectedTeam, selectedAE);
    setShowOverrideForm(false);
  };

  const isPending = lead.qualificationStatus === 'Pending Approval';
  const isApproved = lead.qualificationStatus === 'Approved';
  const isQualified = lead.qualificationStatus === 'Qualified';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-400">{lead.id}</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-400">{new Date(lead.createdAt).toLocaleString()}</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
              {lead.companyName}
            </h2>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>{lead.industry}</span>
              <span>·</span>
              <span>{lead.employeeCount} headcount</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Status & Scores Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400">AI Score</span>
              <div className="text-2xl font-bold font-mono text-white tabular-nums mt-1 flex items-baseline gap-1">
                <span>{lead.leadScore}</span>
                <span className="text-xs text-blue-400 font-bold">({lead.intentGrade})</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400">Contract ARR</span>
              <div className="text-xl font-bold font-mono text-slate-200 tabular-nums mt-1">
                ${lead.estimatedBudget.toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400">ICP Match</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums mt-1">
                {lead.icpMatchScore}%
              </div>
            </div>
          </div>

          {/* Manager approval alert banner if needed */}
          {isPending && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Manager Approval Required</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                {lead.approvalDetails?.reason}
              </p>
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Manager note (e.g. Approved for Strategic Accounts)..."
                  value={managerNote}
                  onChange={(e) => setManagerNote(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-950 border border-amber-500/30 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors whitespace-nowrap"
                >
                  {isApproving ? 'Approving...' : 'Approve & Route'}
                </button>
              </div>
            </div>
          )}

          {/* Contact Details */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-300">Prospect Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono truncate">{lead.email}</span>
              </div>
              {lead.phone && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lead.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Timeline: {lead.targetTimeline}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Source: {lead.source}</span>
              </div>
            </div>
          </div>

          {/* Problem Statement */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-slate-300">Problem Statement & Buying Mandate</h4>
            <p className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              {lead.problemStatement}
            </p>
          </div>

          {/* AI Qualitative Analysis */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-300">AI Neural Evaluation</h4>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Evaluation Summary:</span>
                <p className="text-slate-200 mt-1 leading-relaxed">{lead.aiEvaluation.summary}</p>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Buying Intent:</span>
                <p className="text-blue-300 mt-1">{lead.aiEvaluation.buyingIntentAnalysis}</p>
              </div>

              {/* Fit factor bars */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400">ICP Fit Factor Breakdown</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Budget</span>
                      <span className="font-mono text-slate-200">{lead.aiEvaluation.fitFactors.budgetFit}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${lead.aiEvaluation.fitFactors.budgetFit}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Authority</span>
                      <span className="font-mono text-slate-200">{lead.aiEvaluation.fitFactors.authorityFit}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${lead.aiEvaluation.fitFactors.authorityFit}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Need Urgency</span>
                      <span className="font-mono text-slate-200">{lead.aiEvaluation.fitFactors.needFit}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${lead.aiEvaluation.fitFactors.needFit}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Timeline</span>
                      <span className="font-mono text-slate-200">{lead.aiEvaluation.fitFactors.timelineFit}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${lead.aiEvaluation.fitFactors.timelineFit}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths & Risks */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400">Identified Strengths & Risks</span>
                <div className="space-y-1.5">
                  {lead.aiEvaluation.keyStrengths.map((str, i) => (
                    <div key={i} className="text-xs text-emerald-300 flex items-start gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                      <span>{str}</span>
                    </div>
                  ))}
                  {lead.aiEvaluation.riskFlags.map((risk, i) => (
                    <div key={i} className="text-xs text-amber-300 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Territory & Account Executive Routing */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-300">Territory & Account Executive</h4>
              <button
                onClick={() => setShowOverrideForm(!showOverrideForm)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                {showOverrideForm ? 'Cancel Re-assign' : 'Override AE'}
              </button>
            </div>

            {showOverrideForm ? (
              <div className="pt-2 space-y-3">
                <div>
                  <label className="text-[11px] text-slate-400">Select Team</label>
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value as AssignedTeam)}
                    className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                  >
                    <option value="Strategic Enterprise">Strategic Enterprise</option>
                    <option value="US Mid-Market">US Mid-Market</option>
                    <option value="EMEA Enterprise">EMEA Enterprise</option>
                    <option value="APAC Growth">APAC Growth</option>
                    <option value="Automated Nurture">Automated Nurture</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Account Executive</label>
                  <input
                    type="text"
                    value={selectedAE}
                    onChange={(e) => setSelectedAE(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                  />
                </div>
                <button
                  onClick={handleOverride}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                >
                  Save Manual Assignment
                </button>
              </div>
            ) : (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Team:</span>
                  <span className="font-semibold text-slate-200">{lead.assignedTeam}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">AE:</span>
                  <span className="font-medium text-slate-300">{lead.assignedAE}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rule:</span>
                  <span className="italic text-slate-400 truncate max-w-[260px]">{lead.routingRuleApplied}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            onClick={handleReEval}
            disabled={isReEvaluating}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isReEvaluating ? 'animate-spin text-blue-400' : ''}`} />
            <span>{isReEvaluating ? 'Re-evaluating...' : 'Re-evaluate with AI'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
