import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';
import { evaluateEnquiry } from './server/qualificationEngine.ts';
import { runAllTests, runTestScenario } from './server/testRunner.ts';
import { WORKFLOW_SPEC } from './server/workflowSpec.ts';
import { runDeterministicCheckTool } from './server/workflowTools.ts';
import { simulateWorkflowInterruption, recoverWorkflowFromCheckpoint, getCheckpoint } from './server/checkpointRecovery.ts';
import { EnquiryInput, LeadStatus, AssignedTeam, WorkflowLog } from './src/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'LeadPilot AI API', timestamp: new Date().toISOString() });
  });

  // Dashboard Stats
  app.get('/api/stats', (req, res) => {
    try {
      const stats = db.getStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Leads list with optional filtering
  app.get('/api/leads', (req, res) => {
    try {
      let leads = db.getLeads();
      const { search, status, team, tier } = req.query;

      if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        leads = leads.filter(l => 
          l.companyName.toLowerCase().includes(q) ||
          l.contactName.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q) ||
          l.industry.toLowerCase().includes(q)
        );
      }

      if (status && typeof status === 'string' && status !== 'All') {
        leads = leads.filter(l => l.qualificationStatus === status);
      }

      if (team && typeof team === 'string' && team !== 'All') {
        leads = leads.filter(l => l.assignedTeam === team);
      }

      if (tier && typeof tier === 'string' && tier !== 'All') {
        leads = leads.filter(l => l.budgetTier === tier);
      }

      res.json(leads);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Single Lead Details
  app.get('/api/leads/:id', (req, res) => {
    try {
      const lead = db.getLeadById(req.params.id);
      if (!lead) return res.status(404).json({ error: 'Lead not found' });
      res.json(lead);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Submit new enquiry & process AI qualification
  app.post('/api/leads', async (req, res) => {
    try {
      const body = req.body as EnquiryInput;
      if (!body.companyName || !body.contactName || !body.email) {
        return res.status(400).json({ error: 'Company name, contact name, and email are required.' });
      }

      // Check for duplicate submission
      const existingLead = db.findDuplicateLead(body.companyName, body.email);
      if (existingLead) {
        db.addLog({
          id: `LOG-DUP-${Date.now()}`,
          leadId: existingLead.id,
          leadCompany: existingLead.companyName,
          timestamp: new Date().toISOString(),
          step: 'Duplicate Submission Intercepted',
          status: 'Warning',
          durationMs: 4,
          message: `Duplicate enquiry received for ${existingLead.companyName} (${existingLead.email}). Ingestion halted to prevent duplicate record. Preserved existing record ${existingLead.id}.`,
          metadata: { duplicate: true, existingId: existingLead.id, companyName: body.companyName, email: body.email }
        });

        return res.status(200).json({
          duplicate: true,
          lead: existingLead,
          workflowLogs: [],
          message: `Duplicate submission detected for ${existingLead.companyName}. Record ${existingLead.id} already exists; no duplicate record created.`
        });
      }

      const count = db.getLeads().length;
      const nextId = `LP-${1050 + count}`;

      const { lead, logs } = await evaluateEnquiry(body, nextId);

      const workflowLogs: WorkflowLog[] = logs.map((log, idx) => ({
        id: `LOG-${Date.now()}-${idx}`,
        leadId: lead.id,
        leadCompany: lead.companyName,
        timestamp: new Date().toISOString(),
        step: log.step,
        status: log.status,
        durationMs: log.durationMs,
        message: log.message,
        metadata: log.metadata,
      }));

      db.addLead(lead, workflowLogs);
      res.status(201).json({ lead, workflowLogs });
    } catch (err: any) {
      console.error('Error submitting enquiry:', err);
      res.status(500).json({ error: err.message || 'Internal evaluation failure' });
    }
  });

  // Direct Lead Assignment endpoint with strict guardrails
  app.patch('/api/leads/:id/assign', (req, res) => {
    try {
      const { id } = req.params;
      const { assignedTeam, assignedAE } = req.body;
      const lead = db.getLeadById(id);

      if (!lead) return res.status(404).json({ error: 'Lead not found' });

      // Invariant: Cannot assign an AE to a pending lead without manager approval
      if (lead.qualificationStatus === 'Pending Approval') {
        return res.status(400).json({
          error: 'Cannot assign an Account Executive to a pending lead. Manager approval is required before assignment.'
        });
      }

      // Invariant: Cannot assign an AE to a rejected / disqualified lead
      if (lead.qualificationStatus === 'Disqualified' || lead.approvalDetails?.status === 'Rejected') {
        return res.status(400).json({
          error: 'Cannot assign an Account Executive to a rejected or disqualified lead.'
        });
      }

      const updated = db.updateLead(id, {
        assignedTeam: assignedTeam || lead.assignedTeam,
        assignedAE: assignedAE || lead.assignedAE,
      });

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Manager Approval decision
  app.patch('/api/leads/:id/approval', (req, res) => {
    try {
      const { id } = req.params;
      const { action, managerNotes, assignedTeam, assignedAE } = req.body;
      const lead = db.getLeadById(id);

      if (!lead) return res.status(404).json({ error: 'Lead not found' });

      let newStatus: LeadStatus = lead.qualificationStatus;
      let newApprovalStatus: 'Approved' | 'Rejected' | 'Overridden' = 'Approved';
      let newTeam = lead.assignedTeam;
      let newAE = lead.assignedAE;

      if (action === 'approve') {
        newStatus = 'Approved';
        newApprovalStatus = 'Approved';
        newAE = assignedAE || (lead.assignedTeam === 'Strategic Enterprise' ? 'Sarah Chen (Principal AE)' : 'Marcus Vance (Senior AE)');
      } else if (action === 'reject') {
        newStatus = 'Disqualified';
        newApprovalStatus = 'Rejected';
        newAE = 'Unassigned (Disqualified)';
        newTeam = 'Automated Nurture';
      } else if (action === 'override') {
        newStatus = 'Approved';
        newApprovalStatus = 'Overridden';
        if (assignedTeam) newTeam = assignedTeam;
        if (assignedAE) newAE = assignedAE;
      } else {
        return res.status(400).json({ error: 'Invalid approval action. Must be approve, reject, or override.' });
      }

      const updatedLead = db.updateLead(id, {
        qualificationStatus: newStatus,
        assignedTeam: newTeam,
        assignedAE: newAE,
        workflowStage: newStatus === 'Disqualified' ? 'Disqualified' : 'Completed',
        approvalDetails: {
          ...lead.approvalDetails,
          status: newApprovalStatus,
          reason: lead.approvalDetails?.reason || 'Manager Review',
          requestedAt: lead.approvalDetails?.requestedAt || lead.createdAt,
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'Executive Sales Manager',
          managerNotes: managerNotes || `Manual sign-off: ${action}`,
        }
      });

      // Add audit log
      db.addLog({
        id: `LOG-${Date.now()}`,
        leadId: lead.id,
        leadCompany: lead.companyName,
        timestamp: new Date().toISOString(),
        step: 'Manager Gatekeeper Check',
        status: action === 'reject' ? 'Warning' : 'Success',
        durationMs: 18,
        message: `Manager decision recorded: ${action.toUpperCase()} by Executive Sales Manager. Assigned AE: ${newAE}. Notes: ${managerNotes || 'None'}`,
        metadata: { action, previousStatus: lead.qualificationStatus, newStatus, assignedAE: newAE }
      });

      res.json(updatedLead);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Re-evaluate Lead with AI
  app.post('/api/leads/:id/re-evaluate', async (req, res) => {
    try {
      const { id } = req.params;
      const lead = db.getLeadById(id);
      if (!lead) return res.status(404).json({ error: 'Lead not found' });

      const payload: EnquiryInput = {
        companyName: lead.companyName,
        contactName: lead.contactName,
        email: lead.email,
        phone: lead.phone,
        website: lead.website,
        industry: lead.industry,
        employeeCount: lead.employeeCount,
        estimatedBudget: lead.estimatedBudget,
        targetTimeline: lead.targetTimeline,
        problemStatement: lead.problemStatement,
        source: lead.source,
      };

      const { lead: evaluated, logs } = await evaluateEnquiry(payload, id);

      const updated = db.updateLead(id, {
        leadScore: evaluated.leadScore,
        intentGrade: evaluated.intentGrade,
        icpMatchScore: evaluated.icpMatchScore,
        aiEvaluation: evaluated.aiEvaluation,
        qualificationStatus: evaluated.qualificationStatus,
        assignedTeam: evaluated.assignedTeam,
        assignedAE: evaluated.assignedAE,
      });

      logs.forEach((l, idx) => {
        db.addLog({
          id: `LOG-RE-${Date.now()}-${idx}`,
          leadId: id,
          leadCompany: lead.companyName,
          timestamp: new Date().toISOString(),
          step: l.step,
          status: l.status,
          durationMs: l.durationMs,
          message: `[Re-evaluation] ${l.message}`,
          metadata: l.metadata
        });
      });

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Manager Approvals Queue
  app.get('/api/approvals', (req, res) => {
    try {
      const approvals = db.getPendingApprovals();
      res.json(approvals);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Workflow Audit Logs
  app.get('/api/logs', (req, res) => {
    try {
      let logs = db.getLogs();
      const { leadId, status } = req.query;

      if (leadId && typeof leadId === 'string') {
        logs = logs.filter(l => l.leadId.toLowerCase() === leadId.toLowerCase());
      }

      if (status && typeof status === 'string' && status !== 'All') {
        logs = logs.filter(l => l.status === status);
      }

      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Automated Test Scenarios & Runner
  app.get('/api/tests', (req, res) => {
    try {
      const tests = db.getTestScenarios();
      res.json(tests);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/tests/run', async (req, res) => {
    try {
      const { scenarioId } = req.body;
      if (scenarioId) {
        const result = await runTestScenario(scenarioId);
        if (!result) return res.status(404).json({ error: 'Scenario not found' });
        return res.json([result]);
      } else {
        const results = await runAllTests();
        return res.json(results);
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Reset database to seed
  app.post('/api/leads/reset', (req, res) => {
    try {
      const resetData = db.resetToSeed();
      res.json({ message: 'Database reset to default enterprise seed records successfully.', totalLeads: resetData.leads.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- G4 Problem Statement 2 Workflow Endpoints ---

  // Workflow Specification (Inputs, Steps, Outputs, Rules, Approver, Loop Bounds, Gates, Limits)
  app.get('/api/workflow/spec', (req, res) => {
    res.json(WORKFLOW_SPEC);
  });

  // Run Independent Deterministic Check Tool on demand for any lead
  app.get('/api/workflow/:id/check', (req, res) => {
    try {
      const lead = db.getLeadById(req.params.id);
      if (!lead) return res.status(404).json({ error: 'Lead not found' });
      const checkResult = runDeterministicCheckTool(lead);
      res.json(checkResult);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Simulate Workflow Failure at a Checkpoint
  app.post('/api/workflow/:id/simulate-interruption', (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = simulateWorkflowInterruption(id, reason);
      if (!result.success) return res.status(404).json(result);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Checkpoint Recovery Engine
  app.post('/api/workflow/:id/recover', (req, res) => {
    try {
      const { id } = req.params;
      const result = recoverWorkflowFromCheckpoint(id);
      if (!result.success && !result.lead) return res.status(404).json(result);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Inspect current checkpoint state
  app.get('/api/workflow/:id/checkpoint', (req, res) => {
    const cp = getCheckpoint(req.params.id);
    if (!cp) return res.status(404).json({ error: 'No checkpoint found for lead ' + req.params.id });
    res.json(cp);
  });

  // --- Vite Dev or Production Static Serving ---
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LeadPilot AI full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start LeadPilot AI server:', err);
  process.exit(1);
});
