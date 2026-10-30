import { Lead, WorkflowLog, LeadStatus, AssignedTeam } from '../src/types.js';

export interface InvariantCheckResult {
  toolName: 'DeterministicCheckTool';
  timestamp: string;
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  checks: Array<{
    ruleId: string;
    description: string;
    passed: boolean;
    details: string;
  }>;
}

export interface ActionToolResult {
  toolName: 'RoutingActionTool';
  timestamp: string;
  executed: boolean;
  targetTerritory: AssignedTeam;
  assignedAE: string;
  crmSyncStatus: 'DISPATCHED_TO_AE' | 'HELD_PENDING_APPROVAL' | 'ROUTED_TO_NURTURE' | 'ABORTED';
  slaResponseWindowHours: number;
  message: string;
}

/**
 * Tool 1: Independent Deterministic Check Tool
 * Verifies mathematical, domain, and governance invariants independently from the action execution.
 */
export function runDeterministicCheckTool(lead: Lead): InvariantCheckResult {
  const timestamp = new Date().toISOString();
  const checks: InvariantCheckResult['checks'] = [];

  // Check 1: Mathematical Score Invariant
  const expectedScore = Math.round(
    lead.aiEvaluation.fitFactors.budgetFit * 0.35 +
    lead.aiEvaluation.fitFactors.needFit * 0.30 +
    lead.aiEvaluation.fitFactors.timelineFit * 0.20 +
    lead.aiEvaluation.fitFactors.authorityFit * 0.15
  );
  const scoreMatches = Math.abs(lead.leadScore - expectedScore) <= 1;
  checks.push({
    ruleId: 'INV-01-MATH-SCORE',
    description: 'Lead score must match deterministic weighted fit factor formula within ±1 point',
    passed: scoreMatches,
    details: scoreMatches
      ? `Lead score (${lead.leadScore}) correctly verifies against calculated weighted value (${expectedScore}).`
      : `Score mismatch: Lead score is ${lead.leadScore}, calculated is ${expectedScore}.`
  });

  // Check 2: Budget Tier Invariant
  let expectedTier = 'Growth ($10K-$30K)';
  if (lead.estimatedBudget >= 100000) expectedTier = 'Enterprise (> $100K)';
  else if (lead.estimatedBudget >= 30000) expectedTier = 'Mid-Market ($30K-$100K)';
  else if (lead.estimatedBudget >= 10000) expectedTier = 'Growth ($10K-$30K)';
  else expectedTier = 'Self-Serve (< $10K)';

  const tierMatches = lead.budgetTier === expectedTier;
  checks.push({
    ruleId: 'INV-02-BUDGET-TIER',
    description: 'Contract value must correctly map to standardized budget tier boundaries',
    passed: tierMatches,
    details: tierMatches
      ? `Budget of $${lead.estimatedBudget.toLocaleString()} correctly assigned to ${lead.budgetTier}.`
      : `Tier mismatch: expected ${expectedTier}, got ${lead.budgetTier}.`
  });

  // Check 3: Escalation Threshold Invariant
  const shouldEscalate = lead.estimatedBudget >= 100000 || 
    (lead.qualificationStatus === 'Pending Approval') ||
    (lead.requiresManagerApproval);
  const escalationAccurate = !lead.estimatedBudget || (lead.estimatedBudget >= 100000 ? lead.requiresManagerApproval : true);
  checks.push({
    ruleId: 'INV-03-ESCALATION-GATE',
    description: 'Contracts >= $100,000 ARR must trigger requiresManagerApproval flag',
    passed: escalationAccurate,
    details: escalationAccurate
      ? `Escalation gate consistent: requiresManagerApproval=${lead.requiresManagerApproval} for ARR $${lead.estimatedBudget.toLocaleString()}.`
      : `Escalation violation: $${lead.estimatedBudget.toLocaleString()} did not trigger manager approval.`
  });

  // Check 4: Unassigned Guardrail Invariant
  let assignmentValid = true;
  if (lead.qualificationStatus === 'Pending Approval') {
    assignmentValid = lead.assignedAE.toLowerCase().includes('unassigned') || lead.assignedAE.toLowerCase().includes('pending');
  } else if (lead.qualificationStatus === 'Disqualified') {
    assignmentValid = lead.assignedAE.toLowerCase().includes('unassigned') || lead.assignedAE.toLowerCase().includes('nurture');
  }
  checks.push({
    ruleId: 'INV-04-UNASSIGNED-GUARDRAIL',
    description: 'Pending and rejected/disqualified leads must NOT have active AE assigned',
    passed: assignmentValid,
    details: assignmentValid
      ? `Assignment guardrail respected: status="${lead.qualificationStatus}", AE="${lead.assignedAE}".`
      : `Guardrail violation: active AE assigned while in non-approved status.`
  });

  // Check 5: Domain & Email Syntax Invariant
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email);
  checks.push({
    ruleId: 'INV-05-EMAIL-SYNTAX',
    description: 'Prospect email must conform to valid RFC 5322 format',
    passed: emailValid,
    details: emailValid ? `Email format verified: ${lead.email}` : `Invalid email syntax: ${lead.email}`
  });

  const passedChecks = checks.filter(c => c.passed).length;
  const passed = passedChecks === checks.length;

  return {
    toolName: 'DeterministicCheckTool',
    timestamp,
    passed,
    totalChecks: checks.length,
    passedChecks,
    checks
  };
}

/**
 * Tool 2: Separate Action Tool
 * Executes territory routing dispatch and CRM synchronization after independent check tool verification.
 */
export function executeRoutingActionTool(
  lead: Lead,
  checkResult: InvariantCheckResult
): ActionToolResult {
  const timestamp = new Date().toISOString();

  // If independent check failed, action tool refuses execution to protect data integrity
  if (!checkResult.passed) {
    return {
      toolName: 'RoutingActionTool',
      timestamp,
      executed: false,
      targetTerritory: lead.assignedTeam,
      assignedAE: lead.assignedAE,
      crmSyncStatus: 'ABORTED',
      slaResponseWindowHours: 0,
      message: `Action Tool execution aborted: Independent deterministic check tool reported ${checkResult.totalChecks - checkResult.passedChecks} invariant failures.`
    };
  }

  // Handle Action Tool execution states
  if (lead.qualificationStatus === 'Pending Approval') {
    return {
      toolName: 'RoutingActionTool',
      timestamp,
      executed: true,
      targetTerritory: lead.assignedTeam,
      assignedAE: 'Unassigned (Pending Manager Approval)',
      crmSyncStatus: 'HELD_PENDING_APPROVAL',
      slaResponseWindowHours: 24,
      message: `Action Tool held lead in Manager Escalation Queue. CRM synchronization paused until human sign-off.`
    };
  }

  if (lead.qualificationStatus === 'Disqualified') {
    return {
      toolName: 'RoutingActionTool',
      timestamp,
      executed: true,
      targetTerritory: 'Automated Nurture',
      assignedAE: 'Unassigned (Disqualified)',
      crmSyncStatus: 'ROUTED_TO_NURTURE',
      slaResponseWindowHours: 0,
      message: `Action Tool routed disqualified inquiry to Automated Product-Led Nurture drip.`
    };
  }

  // Approved or Qualified
  return {
    toolName: 'RoutingActionTool',
    timestamp,
    executed: true,
    targetTerritory: lead.assignedTeam,
    assignedAE: lead.assignedAE,
    crmSyncStatus: 'DISPATCHED_TO_AE',
    slaResponseWindowHours: lead.assignedTeam === 'Strategic Enterprise' ? 1 : 2,
    message: `Action Tool dispatched lead directly to ${lead.assignedAE} (${lead.assignedTeam}) with CRM record synchronized and SLA counter initialized.`
  };
}
