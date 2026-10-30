import { db } from './db.ts';
import { evaluateEnquiry } from './qualificationEngine.ts';
import { TestScenario } from '../src/types.ts';

export async function runTestScenario(scenarioId: string): Promise<TestScenario | null> {
  const scenarios = db.getTestScenarios();
  const scenario = scenarios.find(s => s.id === scenarioId);
  if (!scenario) return null;

  const startTime = Date.now();
  const testId = `LP-TEST-${Math.floor(1000 + Math.random() * 9000)}`;

  const logs: string[] = [];
  logs.push(`[${new Date().toISOString()}] Initializing test case: ${scenario.name}`);
  logs.push(`Category: ${scenario.testCategory}`);

  try {
    const { lead, logs: workflowLogs } = await evaluateEnquiry(scenario.samplePayload, testId, { skipExternalAi: true });
    const executionTimeMs = Date.now() - startTime;

    let assertionsPassed = 0;
    const totalAssertions = 3;

    // Assertion 1: Status match
    const statusMatches = lead.qualificationStatus === scenario.expectedStatus;
    if (statusMatches) {
      assertionsPassed++;
      logs.push(`[PASS] Qualification Status: Expected "${scenario.expectedStatus}", Received "${lead.qualificationStatus}"`);
    } else {
      logs.push(`[FAIL] Qualification Status Mismatch: Expected "${scenario.expectedStatus}", Got "${lead.qualificationStatus}"`);
    }

    // Assertion 2: Team routing match
    const teamMatches = lead.assignedTeam === scenario.expectedTeam;
    if (teamMatches) {
      assertionsPassed++;
      logs.push(`[PASS] Routing Destination: Expected "${scenario.expectedTeam}", Received "${lead.assignedTeam}"`);
    } else {
      logs.push(`[FAIL] Team Mismatch: Expected "${scenario.expectedTeam}", Got "${lead.assignedTeam}"`);
    }

    // Assertion 3: Score threshold
    const scoreMeetsThreshold = lead.leadScore >= scenario.expectedMinScore;
    if (scoreMeetsThreshold) {
      assertionsPassed++;
      logs.push(`[PASS] Lead Score: ${lead.leadScore} >= minimum threshold ${scenario.expectedMinScore}`);
    } else {
      logs.push(`[FAIL] Score Below Minimum: ${lead.leadScore} < expected threshold ${scenario.expectedMinScore}`);
    }

    const passed = assertionsPassed === totalAssertions;
    logs.push(`Execution completed in ${executionTimeMs}ms. Assertions: ${assertionsPassed}/${totalAssertions} passed.`);

    const result = {
      passed,
      actualScore: lead.leadScore,
      actualStatus: lead.qualificationStatus,
      actualTeam: lead.assignedTeam,
      executionTimeMs,
      assertionsPassed,
      totalAssertions,
      logs
    };

    db.updateTestScenarioResult(scenario.id, result);

    return {
      ...scenario,
      lastRunAt: new Date().toISOString(),
      lastResult: result
    };
  } catch (error: any) {
    const executionTimeMs = Date.now() - startTime;
    logs.push(`[ERROR] Test run threw an unhandled exception: ${error?.message || error}`);
    const result = {
      passed: false,
      actualScore: 0,
      actualStatus: 'Disqualified' as const,
      actualTeam: 'Automated Nurture' as const,
      executionTimeMs,
      assertionsPassed: 0,
      totalAssertions: 3,
      logs
    };
    db.updateTestScenarioResult(scenario.id, result);
    return {
      ...scenario,
      lastRunAt: new Date().toISOString(),
      lastResult: result
    };
  }
}

export async function runAllTests(): Promise<TestScenario[]> {
  const scenarios = db.getTestScenarios();
  const results: TestScenario[] = [];
  for (const s of scenarios) {
    const res = await runTestScenario(s.id);
    if (res) results.push(res);
  }
  return results;
}
