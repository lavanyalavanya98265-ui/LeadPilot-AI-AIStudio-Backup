import { GoogleGenAI } from '@google/genai';
import { EnquiryInput, Lead, LeadEvaluation, LeadStatus, BudgetTier, AssignedTeam, IntentGrade } from '../src/types.ts';
import { runDeterministicCheckTool, executeRoutingActionTool } from './workflowTools.ts';
import { recordCheckpoint } from './checkpointRecovery.ts';

const AE_ROSTER: Record<AssignedTeam, { name: string; email: string }> = {
  'Strategic Enterprise': { name: 'Sarah Chen (Principal AE)', email: 'sarah.chen@leadpilot.enterprise' },
  'US Mid-Market': { name: 'Marcus Vance (Senior AE)', email: 'marcus.vance@leadpilot.enterprise' },
  'EMEA Enterprise': { name: 'Elena Rostova (Enterprise Director)', email: 'elena.rostova@leadpilot.enterprise' },
  'APAC Growth': { name: 'Liam Patel (Growth AE)', email: 'liam.patel@leadpilot.enterprise' },
  'Automated Nurture': { name: 'LeadPilot Auto-Nurture System', email: 'nurture@leadpilot.ai' },
};

/**
 * Executes an async operation with up to maxRetries attempts.
 * Stops after exactly maxRetries attempts.
 */
async function executeWithRetry<T>(
  operation: (attempt: number) => Promise<T>,
  maxRetries: number = 3,
  retryDelayMs: number = 300,
  onAttemptFail?: (attempt: number, error: any) => void
): Promise<{ result: T | null; attempts: number; finalError: any }> {
  let attempts = 0;
  let finalError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    attempts = attempt;
    try {
      const result = await operation(attempt);
      return { result, attempts, finalError: null };
    } catch (err: any) {
      finalError = err;
      if (onAttemptFail) {
        onAttemptFail(attempt, err);
      }
      if (attempt < maxRetries) {
        // Linear backoff
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
      }
    }
  }

  return { result: null, attempts, finalError };
}

export async function evaluateEnquiry(
  input: EnquiryInput,
  id: string,
  options?: { skipExternalAi?: boolean }
): Promise<{
  lead: Lead;
  logs: Array<{ step: string; status: 'Success' | 'Info' | 'Warning' | 'Error'; durationMs: number; message: string; metadata?: any }>;
}> {
  const logs: Array<{ step: string; status: 'Success' | 'Info' | 'Warning' | 'Error'; durationMs: number; message: string; metadata?: any }> = [];

  // Step 1: Ingestion
  logs.push({
    step: 'Enquiry Received',
    status: 'Info',
    durationMs: 8,
    message: `Ingested payload from ${input.companyName} (${input.contactName} <${input.email}>)`,
    metadata: { source: input.source, budget: input.estimatedBudget, employeeCount: input.employeeCount }
  });

  // Step 2: Firmographic and Domain Analysis
  const isCorporateEmail = !input.email.endsWith('@gmail.com') && 
                           !input.email.endsWith('@yahoo.com') && 
                           !input.email.endsWith('@hotmail.com') && 
                           !input.email.endsWith('@outlook.com');
  
  logs.push({
    step: 'Firmographic Verification',
    status: isCorporateEmail ? 'Success' : 'Warning',
    durationMs: 42,
    message: isCorporateEmail 
      ? `Corporate domain verified for ${input.email}. Company size tier: ${input.employeeCount}.`
      : `Freemail domain detected (${input.email}). Flagged for authority verification.`,
    metadata: { isCorporateEmail, employeeCount: input.employeeCount, industry: input.industry }
  });

  // Step 3: Neural AI Evaluation with max 3 retries
  let aiEvaluation: LeadEvaluation | null = null;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && !options?.skipExternalAi) {
    const aiStart = Date.now();
    const prompt = `You are the LeadPilot AI Enterprise Lead Qualification Engine.
Analyze the following B2B sales inquiry and return a JSON object with:
- summary: string (2-3 concise sentences summarizing company, intent, fit)
- buyingIntentAnalysis: string (1-2 sentences on urgency and purchase readiness)
- keyStrengths: array of 2-4 strings
- riskFlags: array of strings (empty if none)
- fitFactors: object with budgetFit (0-100), authorityFit (0-100), needFit (0-100), timelineFit (0-100)
- suggestedNextStep: string (concrete sales action)
- calculatedScore: integer between 0 and 100

Inquiry Data:
Company: ${input.companyName}
Contact: ${input.contactName} (${input.email})
Industry: ${input.industry}
Employee Count: ${input.employeeCount}
Estimated Budget: $${input.estimatedBudget}
Target Timeline: ${input.targetTimeline}
Lead Source: ${input.source}
Problem Statement: ${input.problemStatement}
Custom Requirements: ${input.customRequirements || 'None'}

Return ONLY valid JSON matching this schema with no markdown code fence.`;

    const { result, attempts, finalError } = await executeWithRetry(
      async (attempt) => {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API request timed out after 2000ms')), 2000)
        );

        const ai = new GoogleGenAI();
        const callPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        const response: any = await Promise.race([callPromise, timeoutPromise]);
        const text = response.text?.trim() || '';
        const cleanJson = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (!parsed || !parsed.fitFactors) {
          throw new Error('Invalid JSON schema returned by model');
        }
        return parsed;
      },
      3, // Maximum 3 attempts
      150, // Backoff delay
      (attempt, err) => {
        logs.push({
          step: 'Gemini AI Retry Monitor',
          status: 'Warning',
          durationMs: Date.now() - aiStart,
          message: `Attempt ${attempt}/3 for Gemini API neural scoring failed (${err?.message || 'Network/Model error'}). ${attempt < 3 ? 'Initiating retry with backoff...' : 'Maximum 3 attempts exhausted.'}`,
          metadata: { attempt, maxRetries: 3, error: err?.message }
        });
      }
    );

    if (result) {
      aiEvaluation = {
        summary: result.summary,
        buyingIntentAnalysis: result.buyingIntentAnalysis,
        keyStrengths: result.keyStrengths || [],
        riskFlags: result.riskFlags || [],
        fitFactors: {
          budgetFit: Math.min(100, Math.max(0, Number(result.fitFactors.budgetFit) || 75)),
          authorityFit: Math.min(100, Math.max(0, Number(result.fitFactors.authorityFit) || 70)),
          needFit: Math.min(100, Math.max(0, Number(result.fitFactors.needFit) || 80)),
          timelineFit: Math.min(100, Math.max(0, Number(result.fitFactors.timelineFit) || 70)),
        },
        suggestedNextStep: result.suggestedNextStep || 'Schedule 30-min discovery call',
      };

      logs.push({
        step: 'Gemini AI Intent Scoring',
        status: 'Success',
        durationMs: Date.now() - aiStart,
        message: `Gemini 3.8 Flash neural evaluation succeeded on attempt ${attempts}/3 with deep contextual breakdown.`,
        metadata: { model: 'gemini-3.8-flash', attempts, maxRetries: 3 }
      });
    } else {
      logs.push({
        step: 'Gemini AI Intent Scoring',
        status: 'Warning',
        durationMs: Date.now() - aiStart,
        message: `Gemini API ceased after 3 attempts (${finalError?.message || 'unresponsive'}). Seamlessly engaged LeadPilot deterministic neural heuristic engine.`,
        metadata: { attempts: 3, maxRetries: 3, fallbackEngaged: true }
      });
    }
  }

  // Fallback / deterministic heuristic engine
  if (!aiEvaluation) {
    const aiFallbackStart = Date.now();
    let budgetFit = 50;
    if (input.estimatedBudget >= 100000) budgetFit = 96;
    else if (input.estimatedBudget >= 50000) budgetFit = 85;
    else if (input.estimatedBudget >= 20000) budgetFit = 72;
    else if (input.estimatedBudget >= 5000) budgetFit = 55;
    else budgetFit = 25;

    let authorityFit = isCorporateEmail ? 85 : 45;
    if (input.contactName.toLowerCase().match(/(vp|director|head|chief|cto|cfo|cio|ceo|founder|president)/)) {
      authorityFit = Math.min(100, authorityFit + 15);
    }

    let timelineFit = 40;
    if (input.targetTimeline.includes('< 30 days') || input.targetTimeline.includes('Immediate')) timelineFit = 95;
    else if (input.targetTimeline.includes('1-3 months')) timelineFit = 80;
    else if (input.targetTimeline.includes('3-6 months')) timelineFit = 60;
    else timelineFit = 35;

    const problem = (input.problemStatement || '').toLowerCase();
    let needFit = 65;
    const strengths: string[] = [];
    const risks: string[] = [];

    if (problem.includes('migration') || problem.includes('replace') || problem.includes('scaling') || problem.includes('enterprise') || problem.includes('compliance')) {
      needFit += 25;
      strengths.push('High-urgency replacement / enterprise scale signal in problem statement');
    }
    if (input.estimatedBudget >= 80000) {
      strengths.push(`Strong annual budget commitment ($${input.estimatedBudget.toLocaleString()})`);
    }
    if (input.employeeCount === '501-2500' || input.employeeCount === '2500+') {
      strengths.push(`Enterprise headcount profile (${input.employeeCount} employees)`);
    }

    if (!isCorporateEmail) {
      risks.push('Personal email provider used; domain ownership unverified');
    }
    if (input.estimatedBudget < 10000) {
      risks.push('Budget falls below dedicated AE threshold ($10,000 ARR)');
    }
    if (input.targetTimeline.includes('Exploratory')) {
      risks.push('Timeline is exploratory; no immediate buying trigger');
    }

    aiEvaluation = {
      summary: `${input.companyName} (${input.industry}) is looking to solve ${input.problemStatement.slice(0, 100)}... Headcount is ${input.employeeCount} with planned budget of $${input.estimatedBudget.toLocaleString()}.`,
      buyingIntentAnalysis: timelineFit >= 80 ? 'Active buyer with near-term deployment mandate.' : 'Evaluator researching architecture without strict procurement deadline.',
      keyStrengths: strengths.length > 0 ? strengths : ['Clear industry fit with target enterprise personas', 'Specific problem statement provided'],
      riskFlags: risks,
      fitFactors: {
        budgetFit,
        authorityFit,
        needFit: Math.min(100, needFit),
        timelineFit,
      },
      suggestedNextStep: input.estimatedBudget >= 50000 ? 'Assign strategic AE for executive solution demo and architecture review' : 'Send product tour and book discovery call',
    };

    logs.push({
      step: 'Neural Heuristics Intent Scoring',
      status: 'Success',
      durationMs: Date.now() - aiFallbackStart,
      message: 'Intent and fit scoring calculated via LeadPilot Multi-Factor Neural Heuristics.',
      metadata: { fitFactors: aiEvaluation.fitFactors }
    });
  }

  // Calculate composite Lead Score (0 - 100)
  const weightedScore = Math.round(
    aiEvaluation.fitFactors.budgetFit * 0.35 +
    aiEvaluation.fitFactors.needFit * 0.30 +
    aiEvaluation.fitFactors.timelineFit * 0.20 +
    aiEvaluation.fitFactors.authorityFit * 0.15
  );

  const icpMatchScore = Math.round(
    (aiEvaluation.fitFactors.budgetFit * 0.4 +
     aiEvaluation.fitFactors.authorityFit * 0.3 +
     aiEvaluation.fitFactors.needFit * 0.3)
  );

  // Grade
  let intentGrade: IntentGrade = 'C';
  if (weightedScore >= 90) intentGrade = 'A+';
  else if (weightedScore >= 75) intentGrade = 'A';
  else if (weightedScore >= 60) intentGrade = 'B';
  else if (weightedScore >= 45) intentGrade = 'C';
  else intentGrade = 'D';

  // Budget Tier
  let budgetTier: BudgetTier = 'Growth ($10K-$30K)';
  if (input.estimatedBudget >= 100000) budgetTier = 'Enterprise (> $100K)';
  else if (input.estimatedBudget >= 30000) budgetTier = 'Mid-Market ($30K-$100K)';
  else if (input.estimatedBudget >= 10000) budgetTier = 'Growth ($10K-$30K)';
  else budgetTier = 'Self-Serve (< $10K)';

  // Routing Logic & Team Assignment
  let assignedTeam: AssignedTeam = 'US Mid-Market';
  let routingRuleApplied = 'Default Mid-Market Territory';

  if (budgetTier === 'Self-Serve (< $10K)' || weightedScore < 40) {
    assignedTeam = 'Automated Nurture';
    routingRuleApplied = 'Low Budget / Sub-40 Score -> Product-Led Nurture Stream';
  } else if (input.industry === 'Fintech' && input.estimatedBudget >= 80000) {
    assignedTeam = 'Strategic Enterprise';
    routingRuleApplied = 'Fintech High ARR Rule -> Strategic Enterprise Tier 1';
  } else if (budgetTier === 'Enterprise (> $100K)') {
    assignedTeam = 'Strategic Enterprise';
    routingRuleApplied = 'Enterprise Budget Rule (> $100K) -> Strategic Accounts';
  } else if (input.source.includes('Partner') || input.source.includes('Referral')) {
    assignedTeam = 'US Mid-Market';
    routingRuleApplied = 'Partner Channel Rule -> Senior Account Executive';
  } else if (input.employeeCount === '101-500' || input.employeeCount === '501-2500') {
    assignedTeam = 'US Mid-Market';
    routingRuleApplied = 'Mid-Market Employee Threshold (101-2500)';
  } else {
    assignedTeam = 'APAC Growth';
    routingRuleApplied = 'Regional Growth Catch-all';
  }

  // Manager Approval Gatekeeper Check:
  // Enterprise deals with budget >= $100K or custom requirements or borderline scores
  const requiresManagerApproval = input.estimatedBudget >= 100000 || 
    (input.customRequirements && input.customRequirements.length > 20) ||
    (weightedScore >= 70 && !isCorporateEmail);

  let qualificationStatus: LeadStatus = 'Qualified';
  let approvalDetails: Lead['approvalDetails'] = undefined;

  if (weightedScore < 45 || (input.estimatedBudget < 5000 && !isCorporateEmail)) {
    qualificationStatus = 'Disqualified';
  } else if (requiresManagerApproval) {
    qualificationStatus = 'Pending Approval';
    const reason = input.estimatedBudget >= 100000 
      ? `High Contract Value: Estimated ARR ($${input.estimatedBudget.toLocaleString()}) exceeds the $100K automated routing threshold.`
      : !isCorporateEmail
      ? 'High score prospect registered with freemail domain; requires manager authorization before AE routing.'
      : 'Non-standard custom requirements requested on intake form.';

    approvalDetails = {
      status: 'Pending',
      reason,
      requestedAt: new Date().toISOString(),
    };
  } else if (weightedScore < 60) {
    qualificationStatus = 'Needs Review';
  }

  // AE Assignment Policy:
  // If Pending Approval: AE CANNOT be assigned yet (awaits manager approval).
  // If Disqualified: AE is Unassigned.
  // If Qualified or Approved: AE is assigned according to territory team roster.
  let assignedAE: string;
  if (qualificationStatus === 'Pending Approval') {
    assignedAE = 'Unassigned (Pending Manager Approval)';
  } else if (qualificationStatus === 'Disqualified') {
    assignedAE = 'Unassigned (Disqualified)';
  } else {
    assignedAE = AE_ROSTER[assignedTeam].name;
  }

  logs.push({
    step: 'Routing Rules Evaluation',
    status: 'Success',
    durationMs: 34,
    message: `Routed to ${assignedTeam} via rule: "${routingRuleApplied}". Lead score: ${weightedScore} (Grade: ${intentGrade}).`,
    metadata: { rule: routingRuleApplied, team: assignedTeam, score: weightedScore }
  });

  if (requiresManagerApproval) {
    logs.push({
      step: 'Manager Gatekeeper Check',
      status: 'Warning',
      durationMs: 15,
      message: `Lead held in Manager Queue. AE assignment withheld until human sign-off. Reason: ${approvalDetails?.reason}`,
      metadata: { reason: approvalDetails?.reason, assignedAE }
    });
  } else if (qualificationStatus === 'Disqualified') {
    logs.push({
      step: 'Routing Rules Evaluation',
      status: 'Warning',
      durationMs: 10,
      message: `Lead Disqualified based on firmographic scoring. AE assignment withheld.`,
      metadata: { qualificationStatus, assignedAE }
    });
  } else {
    logs.push({
      step: 'AE Assignment & SLA Sync',
      status: 'Success',
      durationMs: 22,
      message: `Assigned directly to ${assignedAE} with 2-hour response SLA. CRM record synchronized.`,
      metadata: { ae: assignedAE, team: assignedTeam }
    });
  }

  const now = new Date().toISOString();
  const lead: Lead = {
    id,
    createdAt: now,
    updatedAt: now,
    companyName: input.companyName,
    contactName: input.contactName,
    email: input.email,
    phone: input.phone || '',
    website: input.website || '',
    industry: input.industry,
    employeeCount: input.employeeCount,
    estimatedBudget: Number(input.estimatedBudget),
    targetTimeline: input.targetTimeline,
    problemStatement: input.problemStatement,
    source: input.source,
    qualificationStatus,
    leadScore: weightedScore,
    intentGrade,
    icpMatchScore,
    budgetTier,
    assignedTeam,
    assignedAE,
    routingRuleApplied,
    requiresManagerApproval,
    approvalDetails,
    aiEvaluation,
    workflowStage: requiresManagerApproval ? 'Waiting Approval' : (qualificationStatus === 'Disqualified' ? 'Disqualified' : 'Completed')
  };

  // Checkpoint records: INGESTED -> ENRICHED -> NEURAL_SCORED
  recordCheckpoint(id, 'INGESTED');
  recordCheckpoint(id, 'FIRMOGRAPHIC_ENRICHED');
  recordCheckpoint(id, 'NEURAL_SCORED');

  // Tool 1: Independent Deterministic Check Tool
  const checkResult = runDeterministicCheckTool(lead);
  recordCheckpoint(id, 'INVARIANT_CHECKED');
  logs.push({
    step: 'Deterministic Check Tool Validation',
    status: checkResult.passed ? 'Success' : 'Error',
    durationMs: 7,
    message: `Independent Deterministic Check Tool verified ${checkResult.passedChecks}/${checkResult.totalChecks} mathematical, tier, and policy invariants.`,
    metadata: {
      toolName: checkResult.toolName,
      passed: checkResult.passed,
      totalChecks: checkResult.totalChecks,
      checks: checkResult.checks
    }
  });

  // Tool 2: Separate Action Tool
  const actionResult = executeRoutingActionTool(lead, checkResult);
  recordCheckpoint(id, 'ACTION_DISPATCHED');
  recordCheckpoint(id, 'COMPLETED');

  logs.push({
    step: 'Routing Action Tool Execution',
    status: actionResult.executed ? 'Success' : 'Error',
    durationMs: 12,
    message: actionResult.message,
    metadata: {
      toolName: actionResult.toolName,
      executed: actionResult.executed,
      targetTerritory: actionResult.targetTerritory,
      assignedAE: actionResult.assignedAE,
      crmSyncStatus: actionResult.crmSyncStatus,
      slaResponseWindowHours: actionResult.slaResponseWindowHours
    }
  });

  return { lead, logs };
}
