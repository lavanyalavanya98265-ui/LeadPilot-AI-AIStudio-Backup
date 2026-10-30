import React, { useState } from 'react';
import { EnquiryInput, Lead, WorkflowLog } from '../../types.js';
import { NavTab } from '../Sidebar.js';
import {
  Send,
  Building,
  Mail,
  User,
  DollarSign,
  Briefcase,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  FileCheck2,
  RefreshCw
} from 'lucide-react';

interface SubmitEnquiryViewProps {
  onSubmit: (input: EnquiryInput) => Promise<{ lead: Lead; workflowLogs: WorkflowLog[] }>;
  onSelectTab: (tab: NavTab) => void;
  onInspectLead: (lead: Lead) => void;
}

const TEMPLATES: Array<{ label: string; data: EnquiryInput }> = [
  {
    label: 'Fortune 500 Enterprise Deal (> $150k)',
    data: {
      companyName: 'Aegis Global Payments',
      contactName: 'Catherine Miller (Chief Compliance Officer)',
      email: 'catherine.miller@aegispayments.com',
      phone: '+1 (415) 992-8181',
      website: 'https://aegispayments.com',
      industry: 'Fintech',
      employeeCount: '2500+',
      estimatedBudget: 175000,
      targetTimeline: 'Immediate (< 30 days)',
      problemStatement: 'Modernizing cross-border sanctions clearing. Evaluating real-time AI triage engine with zero-trust encryption and SOC2 Type II SLA compliance.',
      source: 'Website Demo Request',
      customRequirements: 'Requires dedicated tenant deployment and custom contractual SLA with $250k penalty clause.',
    },
  },
  {
    label: 'US Mid-Market SaaS ($65k)',
    data: {
      companyName: 'CloudMatrix Analytics',
      contactName: 'Brian Torres (VP Engineering)',
      email: 'brian@cloudmatrix.io',
      phone: '+1 (206) 881-2299',
      website: 'https://cloudmatrix.io',
      industry: 'Enterprise SaaS',
      employeeCount: '101-500',
      estimatedBudget: 65000,
      targetTimeline: '1-3 months',
      problemStatement: 'Our distributed database clustering alerts are overwhelmed with noise. Need automated event correlation and AE escalation rules.',
      source: 'Partner Referral',
      customRequirements: '',
    },
  },
  {
    label: 'Freemail / Low-Budget (< $5k)',
    data: {
      companyName: 'DevCraft Studio',
      contactName: 'Sam Riley',
      email: 'sam.riley.dev@gmail.com',
      phone: '',
      website: '',
      industry: 'Other',
      employeeCount: '1-20',
      estimatedBudget: 2400,
      targetTimeline: 'Exploratory',
      problemStatement: 'Exploring tools for a weekend indie hacker SaaS app.',
      source: 'Inbound Form',
      customRequirements: '',
    },
  },
];

export const SubmitEnquiryView: React.FC<SubmitEnquiryViewProps> = ({
  onSubmit,
  onSelectTab,
  onInspectLead,
}) => {
  const [formData, setFormData] = useState<EnquiryInput>({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    industry: 'Enterprise SaaS',
    employeeCount: '101-500',
    estimatedBudget: 60000,
    targetTimeline: '1-3 months',
    problemStatement: '',
    source: 'Website Demo Request',
    customRequirements: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ lead: Lead; logs: WorkflowLog[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApplyTemplate = (template: typeof TEMPLATES[0]) => {
    setFormData(template.data);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim() || !formData.contactName.trim() || !formData.email.trim()) {
      setError('Please provide company name, contact name, and valid email.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await onSubmit(formData);
      setResult({ lead: res.lead, logs: res.workflowLogs });
    } catch (err: any) {
      setError(err?.message || 'Failed to submit enquiry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Intro strip */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Enterprise Sales Lead Ingestion</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Submit a live prospect inquiry. LeadPilot AI will execute firmographic verification, AI intent scoring, and automated routing rules in real time.
          </p>
        </div>

        {/* Quick templates */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
          {TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplyTemplate(tpl)}
              className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-md transition-colors whitespace-nowrap"
            >
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main form + Live AI Output Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: 7 cols */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Row 1: Company & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Company Name <span className="text-blue-400">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. Acme Global Logistics"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Contact Name & Title <span className="text-blue-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="e.g. Sarah Jenkins (Head of Data)"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Work Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Work Email <span className="text-blue-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@company.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Phone (Optional)
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Row 3: Industry & Employee Headcount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Industry Vertical
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="Enterprise SaaS">Enterprise SaaS</option>
                  <option value="Fintech">Fintech / Banking</option>
                  <option value="Healthcare">Healthcare / Life Sciences</option>
                  <option value="Logistics">Logistics & Supply Chain</option>
                  <option value="E-commerce">E-commerce / Retail</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Other">Other Vertical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Company Headcount
                </label>
                <select
                  value={formData.employeeCount}
                  onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="1-20">1 - 20 employees (Seed/Early)</option>
                  <option value="21-100">21 - 100 employees (Growth)</option>
                  <option value="101-500">101 - 500 employees (Mid-Market)</option>
                  <option value="501-2500">501 - 2,500 employees (Scale Enterprise)</option>
                  <option value="2500+">2,500+ employees (Fortune 500 / Global)</option>
                </select>
              </div>
            </div>

            {/* Row 4: Annual Budget ARR */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Estimated Annual Budget / ARR Target
                </label>
                <span className="text-sm font-bold font-mono text-blue-400 tabular-nums">
                  ${Number(formData.estimatedBudget).toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="2000"
                max="250000"
                step="5000"
                value={formData.estimatedBudget}
                onChange={(e) => setFormData({ ...formData, estimatedBudget: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span>$2,000</span>
                <span>$50,000</span>
                <span>$100,000 (Approval Gate)</span>
                <span>$250,000+</span>
              </div>
            </div>

            {/* Row 5: Target Timeline & Acquisition Source */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Deployment Timeline
                </label>
                <select
                  value={formData.targetTimeline}
                  onChange={(e) => setFormData({ ...formData, targetTimeline: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="Immediate (< 30 days)">Immediate (&lt; 30 days)</option>
                  <option value="1-3 months">1 - 3 months</option>
                  <option value="3-6 months">3 - 6 months</option>
                  <option value="Exploratory">Exploratory / Research only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Lead Acquisition Channel
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="Website Demo Request">Website Demo Request</option>
                  <option value="Partner Referral">Partner Referral (Fast-Track)</option>
                  <option value="G2 High Intent">G2 High Intent</option>
                  <option value="Inbound Form">Inbound Contact Form</option>
                  <option value="Direct Outbound">Direct Outbound</option>
                </select>
              </div>
            </div>

            {/* Row 6: Problem Statement */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Problem Statement & Technical Mandate <span className="text-blue-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={formData.problemStatement}
                onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
                placeholder="Describe current architecture bottlenecks, legacy replacements, scaling targets, or integration requirements..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Row 7: Custom Requirements */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Custom Requirements / SLA Clauses (Optional)
              </label>
              <input
                type="text"
                value={formData.customRequirements}
                onChange={(e) => setFormData({ ...formData, customRequirements: e.target.value })}
                placeholder="e.g. Dedicated on-prem HSM, 99.999% SLA, or custom security reviews"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Note: Budgets $\ge$ $100K or custom contractual terms automatically trigger manager approval.
              </p>
            </div>

            {/* Submit CTA */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleApplyTemplate(TEMPLATES[1])}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Reset to default
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing with LeadPilot AI...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Run AI Qualification & Route</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Panel: Live AI Qualification Output: 5 cols */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 min-h-[500px] flex flex-col justify-between">
            {result ? (
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* Result Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">{result.lead.id}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {result.lead.budgetTier}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">
                      {result.lead.companyName}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                      result.lead.qualificationStatus === 'Pending Approval'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : result.lead.qualificationStatus === 'Qualified' || result.lead.qualificationStatus === 'Approved'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {result.lead.qualificationStatus}
                  </span>
                </div>

                {/* Score & Grade Display */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-slate-400">Composite Lead Score</div>
                    <div className="text-3xl font-extrabold font-mono text-white tracking-tight tabular-nums mt-0.5 flex items-baseline gap-2">
                      <span>{result.lead.leadScore}</span>
                      <span className="text-sm font-semibold text-blue-400">/ 100</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-slate-400">Intent Grade</div>
                    <div className="text-2xl font-black font-mono text-blue-400">
                      {result.lead.intentGrade}
                    </div>
                  </div>
                </div>

                {/* ICP Fit Breakdown */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300">ICP Fit Factor Dimensions</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <div className="text-slate-400">Budget Fit</div>
                      <div className="font-mono font-bold text-slate-200 mt-0.5">
                        {result.lead.aiEvaluation.fitFactors.budgetFit}%
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <div className="text-slate-400">Authority Fit</div>
                      <div className="font-mono font-bold text-slate-200 mt-0.5">
                        {result.lead.aiEvaluation.fitFactors.authorityFit}%
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <div className="text-slate-400">Need / Urgency</div>
                      <div className="font-mono font-bold text-slate-200 mt-0.5">
                        {result.lead.aiEvaluation.fitFactors.needFit}%
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <div className="text-slate-400">Timeline Fit</div>
                      <div className="font-mono font-bold text-slate-200 mt-0.5">
                        {result.lead.aiEvaluation.fitFactors.timelineFit}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Routing Assignment */}
                <div className="p-3.5 rounded-lg bg-blue-950/30 border border-blue-900/50 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-300 font-semibold">Routing Target:</span>
                    <span className="font-mono text-white font-bold">{result.lead.assignedTeam}</span>
                  </div>
                  <div className="text-xs text-slate-300 flex items-center justify-between">
                    <span className="text-slate-400">Assigned AE:</span>
                    <span className="font-medium">{result.lead.assignedAE}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-blue-900/40">
                    Rule applied: <span className="italic text-slate-300">{result.lead.routingRuleApplied}</span>
                  </div>
                </div>

                {/* Manager Hold Alert if any */}
                {result.lead.requiresManagerApproval && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span>Manager Approval Escalation Triggered</span>
                    </div>
                    <p className="text-[11px] text-amber-200/90">
                      {result.lead.approvalDetails?.reason}
                    </p>
                  </div>
                )}

                {/* Quick actions */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => onInspectLead(result.lead)}
                    className="flex-1 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>View Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onSelectTab('leads')}
                    className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors text-center"
                  >
                    Leads Table
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-400">
                <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-blue-400 shadow-inner">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Awaiting Inquiry Submission</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Fill the form or click a quick preset to trigger real-time AI scoring, territory assignment, and gatekeeper rules.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
