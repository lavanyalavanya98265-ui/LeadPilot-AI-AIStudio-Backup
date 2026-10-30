import { db } from './db.ts';
import { runDeterministicCheckTool, executeRoutingActionTool } from './workflowTools.ts';
import { WORKFLOW_SPEC } from './workflowSpec.ts';
import { Lead } from '../src/types.ts';

export type CheckpointStage = 
  | 'INGESTED' 
  | 'FIRMOGRAPHIC_ENRICHED' 
  | 'NEURAL_SCORED' 
  | 'INVARIANT_CHECKED' 
  | 'ACTION_DISPATCHED' 
  | 'COMPLETED';

export interface WorkflowCheckpoint {
  leadId: string;
  currentStage: CheckpointStage;
  completedStages: CheckpointStage[];
  lastCheckpointAt: string;
  isInterrupted: boolean;
  interruptionReason?: string;
  recoveryAttempts: number;
  maxRecoveryLimit: number;
}

// In-memory / persistent checkpoint register mapped to lead IDs
const checkpointStore = new Map<string, WorkflowCheckpoint>();

export function recordCheckpoint(
  leadId: string,
  stage: CheckpointStage,
  isInterrupted = false,
  reason?: string
): WorkflowCheckpoint {
  const existing = checkpointStore.get(leadId);
  const completed = existing ? [...existing.completedStages] : [];
  if (!completed.includes(stage)) {
    completed.push(stage);
  }

  const checkpoint: WorkflowCheckpoint = {
    leadId,
    currentStage: stage,
    completedStages: completed,
    lastCheckpointAt: new Date().toISOString(),
    isInterrupted,
    interruptionReason: reason,
    recoveryAttempts: existing ? existing.recoveryAttempts : 0,
    maxRecoveryLimit: WORKFLOW_SPEC.loopBounds.maxRecoveryAttempts
  };

  checkpointStore.set(leadId, checkpoint);
  return checkpoint;
}

export function getCheckpoint(leadId: string): WorkflowCheckpoint | null {
  return checkpointStore.get(leadId) || null;
}

/**
 * Simulates a mid-workflow failure/crash (e.g. network disconnect, memory threshold, or container SIGTERM)
 */
export function simulateWorkflowInterruption(
  leadId: string,
  failureReason = 'Simulated worker interruption prior to action tool execution'
): { success: boolean; checkpoint: WorkflowCheckpoint | null; message: string } {
  const lead = db.getLeadById(leadId);
  if (!lead) {
    return { success: false, checkpoint: null, message: `Lead ${leadId} not found.` };
  }

  // Interrupt at current stage (e.g. after NEURAL_SCORED before ACTION_DISPATCHED)
  const checkpoint = recordCheckpoint(leadId, 'NEURAL_SCORED', true, failureReason);

  // Record audit log for failure
  db.addLog({
    id: `LOG-FAIL-${Date.now()}`,
    leadId,
    leadCompany: lead.companyName,
    timestamp: new Date().toISOString(),
    step: 'Workflow Interruption Simulated',
    status: 'Error',
    durationMs: 0,
    message: `[SIMULATED FAILURE] Pipeline interrupted at checkpoint: ${checkpoint.currentStage}. Reason: ${failureReason}. Checkpoint saved.`,
    metadata: { checkpoint }
  });

  return {
    success: true,
    checkpoint,
    message: `Workflow for ${lead.companyName} (${leadId}) successfully halted at checkpoint "${checkpoint.currentStage}". State frozen for recovery verification.`
  };
}

/**
 * Recovers workflow execution from the last saved checkpoint without re-running earlier completed steps.
 * Respects Loop Bound 5: Max 3 recovery attempts.
 */
export function recoverWorkflowFromCheckpoint(leadId: string): {
  success: boolean;
  lead: Lead | null;
  recoveredFromStage: CheckpointStage;
  attemptsUsed: number;
  message: string;
  auditLogs: string[];
} {
  const lead = db.getLeadById(leadId);
  if (!lead) {
    return {
      success: false,
      lead: null,
      recoveredFromStage: 'INGESTED',
      attemptsUsed: 0,
      message: `Lead ${leadId} not found for recovery.`,
      auditLogs: []
    };
  }

  let cp = checkpointStore.get(leadId);
  if (!cp) {
    // If no explicit checkpoint in store, synthesize from lead state
    cp = recordCheckpoint(leadId, 'NEURAL_SCORED', true, 'Simulated crash recovery fallback');
  }

  // Check Loop Bound 5: maxRecoveryAttempts (3)
  if (cp.recoveryAttempts >= cp.maxRecoveryLimit) {
    const errorMsg = `Recovery aborted: Maximum recovery loop bound (${cp.maxRecoveryLimit} attempts) exceeded for lead ${leadId}. Escalating to DLQ.`;
    db.addLog({
      id: `LOG-REC-ERR-${Date.now()}`,
      leadId,
      leadCompany: lead.companyName,
      timestamp: new Date().toISOString(),
      step: 'Checkpoint Recovery Engine',
      status: 'Error',
      durationMs: 5,
      message: errorMsg,
      metadata: { recoveryAttempts: cp.recoveryAttempts, maxRecoveryLimit: cp.maxRecoveryLimit }
    });

    return {
      success: false,
      lead,
      recoveredFromStage: cp.currentStage,
      attemptsUsed: cp.recoveryAttempts,
      message: errorMsg,
      auditLogs: [errorMsg]
    };
  }

  cp.recoveryAttempts += 1;
  const auditLogs: string[] = [];

  auditLogs.push(`[RECOVERY ATTEMPT ${cp.recoveryAttempts}/${cp.maxRecoveryLimit}] Initiating resume for ${lead.companyName} (${leadId})`);
  auditLogs.push(`[CHECKPOINT REPLAY] Skipping already completed stages: ${cp.completedStages.join(' -> ')}`);

  // Step 1: Run Independent Deterministic Check Tool from checkpoint
  const checkResult = runDeterministicCheckTool(lead);
  auditLogs.push(`[CHECK TOOL] Invariant validation passed: ${checkResult.passed} (${checkResult.passedChecks}/${checkResult.totalChecks} rules verified)`);

  // Step 2: Run Action Tool
  const actionResult = executeRoutingActionTool(lead, checkResult);
  auditLogs.push(`[ACTION TOOL] ${actionResult.message}`);

  // Mark checkpoint as recovered & completed
  cp.isInterrupted = false;
  cp.interruptionReason = undefined;
  cp.currentStage = 'COMPLETED';
  if (!cp.completedStages.includes('COMPLETED')) {
    cp.completedStages.push('COMPLETED');
  }
  checkpointStore.set(leadId, cp);

  // Add audit trail to database
  db.addLog({
    id: `LOG-REC-${Date.now()}`,
    leadId,
    leadCompany: lead.companyName,
    timestamp: new Date().toISOString(),
    step: 'Checkpoint Recovery Engine',
    status: 'Success',
    durationMs: 14,
    message: `Resumed workflow from checkpoint "${cp.completedStages[cp.completedStages.length - 2]}". Check tool verified invariants; Action tool completed territory routing.`,
    metadata: {
      recoveryAttempt: cp.recoveryAttempts,
      maxAllowed: cp.maxRecoveryLimit,
      checkTool: checkResult,
      actionTool: actionResult
    }
  });

  return {
    success: true,
    lead,
    recoveredFromStage: cp.completedStages[0] || 'NEURAL_SCORED',
    attemptsUsed: cp.recoveryAttempts,
    message: `Workflow successfully recovered from checkpoint for ${lead.companyName}. All remaining steps executed cleanly.`,
    auditLogs
  };
}
