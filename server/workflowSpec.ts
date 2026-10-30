/**
 * G4 Problem Statement 2: LeadPilot AI Workflow Specification
 * Defines inputs, steps, outputs, rules, approver role, gates, limits, and loop bounds.
 */

export interface G4WorkflowSpecification {
  workflowName: string;
  version: string;
  description: string;
  
  // 1. Inputs Specification
  inputs: {
    requiredFields: string[];
    optionalFields: string[];
    schema: Record<string, string>;
  };

  // 2. Ordered Workflow Steps
  steps: Array<{
    stepNumber: number;
    name: string;
    description: string;
    toolType?: 'Action Tool' | 'Check Tool' | 'Neural Engine' | 'Human Gatekeeper';
  }>;

  // 3. Outputs Specification
  outputs: {
    schema: Record<string, string>;
    artifacts: string[];
  };

  // 4. Territory & Escalation Rules
  rules: Array<{
    ruleId: string;
    condition: string;
    action: string;
  }>;

  // 5. Approver Role
  approver: {
    role: string;
    authorityLevel: string;
    escalationThresholdUSD: number;
    permittedActions: string[];
  };

  // 6. Five Required Loop Bounds
  loopBounds: {
    maxAiRetries: number;               // Bound 1: External AI inference retry attempts
    maxWorkflowSteps: number;           // Bound 2: Maximum execution steps allowed per enquiry
    maxApprovalReEvaluations: number;   // Bound 3: Maximum manager re-evaluation cycles allowed per lead
    maxEnrichmentAttempts: number;      // Bound 4: Maximum firmographic domain resolution retries
    maxRecoveryAttempts: number;        // Bound 5: Maximum checkpoint recovery attempts after failure
  };

  // 7. Success Gate, No-Op, Escalation & Budget Limits
  gatesAndLimits: {
    successGate: {
      minScore: number;
      allowedStatuses: string[];
      description: string;
    };
    noOpCondition: {
      triggers: string[];
      behavior: string;
    };
    escalationCondition: {
      budgetThresholdUSD: number;
      triggers: string[];
      behavior: string;
    };
    perEnquiryLimits: {
      maxComputeTimeMs: number;
      maxTokenBudget: number;
      maxEstimatedCostUSD: number;
    };
  };
}

export const WORKFLOW_SPEC: G4WorkflowSpecification = {
  workflowName: 'LeadPilot AI Enterprise Qualification & Routing Engine',
  version: '2.4.0-G4-Compliant',
  description: 'Enterprise workflow for ingestion, AI intent analysis, independent invariant validation, territory routing, and human-in-the-loop gatekeeper governance.',

  inputs: {
    requiredFields: ['companyName', 'contactName', 'email', 'problemStatement', 'estimatedBudget'],
    optionalFields: ['phone', 'website', 'industry', 'employeeCount', 'targetTimeline', 'source', 'customRequirements'],
    schema: {
      companyName: 'string (min 1 char)',
      contactName: 'string (min 1 char)',
      email: 'string (valid email format)',
      problemStatement: 'string (business trigger/mandate)',
      estimatedBudget: 'number (ARR in USD, non-negative)'
    }
  },

  steps: [
    { stepNumber: 1, name: 'Enquiry Received & Deduplication', description: 'Ingest payload and evaluate no-op duplicate check', toolType: 'Check Tool' },
    { stepNumber: 2, name: 'Firmographic & Domain Verification', description: 'Resolve company size tier and corporate domain ownership', toolType: 'Check Tool' },
    { stepNumber: 3, name: 'Neural Intent & Fit Scoring', description: 'Evaluate purchase readiness and 4-factor ICP alignment', toolType: 'Neural Engine' },
    { stepNumber: 4, name: 'Independent Invariant Validation', description: 'Deterministic check tool verifying mathematical and policy invariants', toolType: 'Check Tool' },
    { stepNumber: 5, name: 'Escalation & Gatekeeper Assessment', description: 'Evaluate whether contract value or SLA requires human approval', toolType: 'Check Tool' },
    { stepNumber: 6, name: 'Human-in-the-Loop Sign-off', description: 'Manager review queue for approvals, rejections, and manual corrections', toolType: 'Human Gatekeeper' },
    { stepNumber: 7, name: 'Territory Routing & CRM Sync', description: 'Action tool dispatching lead to assigned account executive with SLA sync', toolType: 'Action Tool' }
  ],

  outputs: {
    schema: {
      leadId: 'string (LP-XXXX identifier)',
      leadScore: 'number (0 - 100)',
      intentGrade: 'string (A+, A, B, C, D)',
      qualificationStatus: 'Qualified | Approved | Pending Approval | Needs Review | Disqualified',
      budgetTier: 'string (Enterprise | Mid-Market | Growth | Self-Serve)',
      assignedTeam: 'string (Strategic Enterprise | US Mid-Market | EMEA | APAC | Nurture)',
      assignedAE: 'string (Assigned Account Executive or Unassigned)',
      requiresManagerApproval: 'boolean'
    },
    artifacts: ['Persistent JSON database record', 'Audit trail telemetry log events', 'Checkpoint recovery state']
  },

  rules: [
    { ruleId: 'R-ENT-01', condition: 'estimatedBudget >= 100000', action: 'Route to Strategic Enterprise; escalate to Manager Approval' },
    { ruleId: 'R-FIN-02', condition: 'industry === "Fintech" && estimatedBudget >= 80000', action: 'Route to Strategic Enterprise Tier 1' },
    { ruleId: 'R-MID-03', condition: 'employeeCount in ["101-500", "501-2500"]', action: 'Route to US Mid-Market Territory' },
    { ruleId: 'R-PRT-04', condition: 'source contains "Partner" || source contains "Referral"', action: 'Fast-track to Senior Account Executive' },
    { ruleId: 'R-LOW-05', condition: 'estimatedBudget < 5000 || weightedScore < 45', action: 'Disqualify and route to Product-Led Automated Nurture' }
  ],

  approver: {
    role: 'Executive Sales Manager / Global Revenue Operations Director',
    authorityLevel: 'Enterprise Tier 1 ($100,000+ ARR)',
    escalationThresholdUSD: 100000,
    permittedActions: ['approve (authorize routing)', 'reject (disqualify deal)', 'override (correct territory/AE/tier)']
  },

  // All 5 Required Loop Bounds (Enforced at Runtime)
  loopBounds: {
    maxAiRetries: 3,               // Bound 1: Stopped after 3 attempts
    maxWorkflowSteps: 12,          // Bound 2: Maximum sequence steps before halting
    maxApprovalReEvaluations: 3,   // Bound 3: Maximum 3 re-eval cycles per lead
    maxEnrichmentAttempts: 3,      // Bound 4: Maximum 3 enrichment query attempts
    maxRecoveryAttempts: 3         // Bound 5: Maximum 3 recovery replays from checkpoint
  },

  gatesAndLimits: {
    successGate: {
      minScore: 60,
      allowedStatuses: ['Qualified', 'Approved'],
      description: 'Lead score >= 60, corporate domain verified, budget >= $10k, no escalation hold -> Auto-qualified & AE assigned.'
    },
    noOpCondition: {
      triggers: [
        'Duplicate submission with matching email & company name',
        'Submission against a lead already in terminal state (Approved/Disqualified)',
        'Zero-budget exploratory ping with invalid contact info'
      ],
      behavior: 'Workflow execution halts immediately with zero side effects; existing record preserved without creating duplicate.'
    },
    escalationCondition: {
      budgetThresholdUSD: 100000,
      triggers: [
        'Contract value (estimatedBudget) >= $100,000 ARR',
        'Custom non-standard contractual SLA or dedicated hardware requirement',
        'High-intent score (>= 70) registered under non-corporate freemail provider'
      ],
      behavior: 'Lead flagged as "Pending Approval"; AE assignment strictly withheld as "Unassigned" pending manager review.'
    },
    perEnquiryLimits: {
      maxComputeTimeMs: 10000,     // 10-second processing budget ceiling
      maxTokenBudget: 4000,        // 4,000 tokens ceiling
      maxEstimatedCostUSD: 0.05    // $0.05 USD processing budget ceiling
    }
  }
};
