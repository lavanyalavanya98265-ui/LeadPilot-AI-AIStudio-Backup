export type LeadStatus = 'Qualified' | 'Needs Review' | 'Disqualified' | 'Pending Approval' | 'Approved';

export type IntentGrade = 'A+' | 'A' | 'B' | 'C' | 'D';

export type BudgetTier = 'Enterprise (> $100K)' | 'Mid-Market ($30K-$100K)' | 'Growth ($10K-$30K)' | 'Self-Serve (< $10K)';

export type AssignedTeam = 'Strategic Enterprise' | 'US Mid-Market' | 'EMEA Enterprise' | 'APAC Growth' | 'Automated Nurture';

export interface EnquiryInput {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  website?: string;
  industry: string;
  employeeCount: string;
  estimatedBudget: number;
  targetTimeline: string;
  problemStatement: string;
  source: string;
  customRequirements?: string;
}

export interface LeadEvaluation {
  summary: string;
  buyingIntentAnalysis: string;
  keyStrengths: string[];
  riskFlags: string[];
  fitFactors: {
    budgetFit: number;
    authorityFit: number;
    needFit: number;
    timelineFit: number;
  };
  suggestedNextStep: string;
}

export interface Lead {
  id: string;
  createdAt: string;
  updatedAt: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  website?: string;
  industry: string;
  employeeCount: string;
  estimatedBudget: number;
  targetTimeline: string;
  problemStatement: string;
  source: string;
  qualificationStatus: LeadStatus;
  leadScore: number;
  intentGrade: IntentGrade;
  icpMatchScore: number;
  budgetTier: BudgetTier;
  assignedTeam: AssignedTeam;
  assignedAE: string;
  routingRuleApplied: string;
  requiresManagerApproval: boolean;
  approvalDetails?: {
    status: 'Pending' | 'Approved' | 'Rejected' | 'Overridden';
    reason: string;
    requestedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
    managerNotes?: string;
  };
  aiEvaluation: LeadEvaluation;
  workflowStage: 'Completed' | 'Waiting Approval' | 'Routing in Progress' | 'Disqualified';
}

export interface WorkflowLog {
  id: string;
  leadId: string;
  leadCompany: string;
  timestamp: string;
  step: string;
  status: 'Success' | 'Info' | 'Warning' | 'Error';
  durationMs: number;
  message: string;
  metadata?: Record<string, any>;
}

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  testCategory: 'Routing Rules' | 'High-Value Gatekeeper' | 'Spam / Gatekeeper Defense' | 'SLA Timing' | 'ICP Scoring';
  samplePayload: EnquiryInput;
  expectedStatus: LeadStatus;
  expectedTeam: AssignedTeam;
  expectedMinScore: number;
  lastRunAt?: string;
  lastResult?: {
    passed: boolean;
    actualScore: number;
    actualStatus: LeadStatus;
    actualTeam: AssignedTeam;
    executionTimeMs: number;
    assertionsPassed: number;
    totalAssertions: number;
    logs: string[];
  };
}

export interface DashboardStats {
  totalEnquiries: number;
  qualifiedCount: number;
  qualificationRate: number;
  pendingApprovalsCount: number;
  pipelineValue: number;
  avgAiScore: number;
  avgProcessingLatencyMs: number;
  statusBreakdown: Record<LeadStatus, number>;
  teamBreakdown: Record<AssignedTeam, number>;
  tierBreakdown: Record<string, number>;
  recentLeads: Lead[];
  recentLogs: WorkflowLog[];
}
