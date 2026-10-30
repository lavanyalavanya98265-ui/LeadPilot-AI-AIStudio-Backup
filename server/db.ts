import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Lead, WorkflowLog, TestScenario, DashboardStats, LeadStatus, AssignedTeam } from '../src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'leadpilot-db.json');

interface DatabaseSchema {
  leads: Lead[];
  logs: WorkflowLog[];
  testScenarios: TestScenario[];
}

function getInitialSeed(): DatabaseSchema {
  const now = new Date();
  const isoAgo = (hours: number) => new Date(now.getTime() - hours * 3600000).toISOString();

  const leads: Lead[] = [
    {
      id: 'LP-1048',
      createdAt: isoAgo(1.5),
      updatedAt: isoAgo(1.5),
      companyName: 'Apex Cloud Logistics',
      contactName: 'David Sterling (VP of Infrastructure)',
      email: 'd.sterling@apexcloud.io',
      phone: '+1 (415) 882-9011',
      website: 'https://apexcloud.io',
      industry: 'Logistics',
      employeeCount: '501-2500',
      estimatedBudget: 180000,
      targetTimeline: 'Immediate (< 30 days)',
      problemStatement: 'Migrating global shipment routing telemetry from legacy on-prem Kafka cluster to AI-orchestrated event stream. Need SOC2 Type II compliance and high-availability enterprise SLA.',
      source: 'Website Demo Request',
      qualificationStatus: 'Pending Approval',
      leadScore: 94,
      intentGrade: 'A+',
      icpMatchScore: 96,
      budgetTier: 'Enterprise (> $100K)',
      assignedTeam: 'Strategic Enterprise',
      assignedAE: 'Unassigned (Pending Manager Approval)',
      routingRuleApplied: 'Enterprise Budget Rule (> $100K) -> Strategic Accounts',
      requiresManagerApproval: true,
      approvalDetails: {
        status: 'Pending',
        reason: 'High Contract Value: Estimated ARR ($180,000) exceeds the $100K automated routing threshold.',
        requestedAt: isoAgo(1.5),
      },
      aiEvaluation: {
        summary: 'Apex Cloud Logistics is a high-growth logistics provider replacing legacy telemetry infra. High budget, immediate procurement timeline, and VP-level authority.',
        buyingIntentAnalysis: 'Active buyer with near-term deployment mandate and budget allocated.',
        keyStrengths: [
          'Enterprise deal size ($180,000 ARR)',
          'Immediate timeline (< 30 days deployment target)',
          'High authority buyer (VP Infrastructure)',
          'Verified corporate domain and headcount'
        ],
        riskFlags: [
          'Requires custom SOC2 Type II and SLA terms',
          'Multi-region routing requirements'
        ],
        fitFactors: {
          budgetFit: 98,
          authorityFit: 95,
          needFit: 92,
          timelineFit: 94,
        },
        suggestedNextStep: 'Manager review & AE assignment for technical discovery call with Solutions Architect'
      },
      workflowStage: 'Waiting Approval'
    },
    {
      id: 'LP-1047',
      createdAt: isoAgo(5),
      updatedAt: isoAgo(4.2),
      companyName: 'Vanguard FinTech Group',
      contactName: 'Victoria Hastings (Head of Risk Engineering)',
      email: 'vhastings@vanguardfin.com',
      phone: '+1 (212) 555-0193',
      website: 'https://vanguardfin.com',
      industry: 'Fintech',
      employeeCount: '2500+',
      estimatedBudget: 125000,
      targetTimeline: '1-3 months',
      problemStatement: 'Automating real-time fraud signal triage across 12 banking subsidiaries with customized risk models.',
      source: 'G2 High Intent',
      qualificationStatus: 'Approved',
      leadScore: 91,
      intentGrade: 'A+',
      icpMatchScore: 94,
      budgetTier: 'Enterprise (> $100K)',
      assignedTeam: 'Strategic Enterprise',
      assignedAE: 'Sarah Chen (Principal AE)',
      routingRuleApplied: 'Fintech High ARR Rule -> Strategic Enterprise Tier 1',
      requiresManagerApproval: true,
      approvalDetails: {
        status: 'Approved',
        reason: 'High Contract Value: $125,000 ARR Tier 1 Fintech mandate',
        requestedAt: isoAgo(5),
        reviewedAt: isoAgo(4.2),
        reviewedBy: 'Rachel Adams (Global Sales Director)',
        managerNotes: 'Strategic account in banking vertical. Fast-tracked for executive sponsorship.'
      },
      aiEvaluation: {
        summary: 'Global financial institution evaluating AI fraud detection. Top tier enterprise profile with strong ARR expansion potential.',
        buyingIntentAnalysis: 'High commercial intent; active vendor bake-off with Q4 procurement target.',
        keyStrengths: [
          'Verified Tier 1 Enterprise (2500+ employees)',
          'Clear technical use case and allocated budget',
          'G2 intent score ranked 98th percentile'
        ],
        riskFlags: [],
        fitFactors: {
          budgetFit: 95,
          authorityFit: 90,
          needFit: 94,
          timelineFit: 85,
        },
        suggestedNextStep: 'Executive briefing and security questionnaire review'
      },
      workflowStage: 'Completed'
    },
    {
      id: 'LP-1046',
      createdAt: isoAgo(12),
      updatedAt: isoAgo(12),
      companyName: 'HealthPulse Solutions',
      contactName: 'Dr. Aaron Meyer (Chief Product Officer)',
      email: 'aaron.m@healthpulse.org',
      phone: '+1 (617) 492-3300',
      website: 'https://healthpulse.org',
      industry: 'Healthcare',
      employeeCount: '101-500',
      estimatedBudget: 48000,
      targetTimeline: '1-3 months',
      problemStatement: 'Seeking HIPAA-compliant patient intake orchestration to streamline clinic scheduling across 30 regional centers.',
      source: 'Partner Referral',
      qualificationStatus: 'Qualified',
      leadScore: 82,
      intentGrade: 'A',
      icpMatchScore: 85,
      budgetTier: 'Mid-Market ($30K-$100K)',
      assignedTeam: 'US Mid-Market',
      assignedAE: 'Marcus Vance (Senior AE)',
      routingRuleApplied: 'Partner Channel Rule -> Senior Account Executive',
      requiresManagerApproval: false,
      aiEvaluation: {
        summary: 'Mid-market healthcare network seeking operational efficiency for clinical intake. Clear budget and strong timeline alignment.',
        buyingIntentAnalysis: 'Warm inbound via certified partner channel. Decision maker engaged.',
        keyStrengths: [
          'Executive buyer involvement (CPO)',
          'Clear budget fit within mid-market tier',
          'Pre-qualified partner referral'
        ],
        riskFlags: [
          'BAA compliance requirement must be verified'
        ],
        fitFactors: {
          budgetFit: 82,
          authorityFit: 88,
          needFit: 84,
          timelineFit: 78,
        },
        suggestedNextStep: 'Send healthcare compliance brief and schedule AE demo'
      },
      workflowStage: 'Completed'
    },
    {
      id: 'LP-1045',
      createdAt: isoAgo(24),
      updatedAt: isoAgo(24),
      companyName: 'Nordic BioMetrics AB',
      contactName: 'Frederik Lindqvist',
      email: 'frederik@nordicbiometrics.se',
      phone: '+46 8 505 120 00',
      website: 'https://nordicbiometrics.se',
      industry: 'Healthcare',
      employeeCount: '21-100',
      estimatedBudget: 35000,
      targetTimeline: '3-6 months',
      problemStatement: 'Evaluating automated identity credentialing pipelines for regional lab telemetry.',
      source: 'Website Demo Request',
      qualificationStatus: 'Qualified',
      leadScore: 71,
      intentGrade: 'B',
      icpMatchScore: 74,
      budgetTier: 'Mid-Market ($30K-$100K)',
      assignedTeam: 'EMEA Enterprise',
      assignedAE: 'Elena Rostova (Enterprise Director)',
      routingRuleApplied: 'Mid-Market Employee Threshold (101-2500)',
      requiresManagerApproval: false,
      aiEvaluation: {
        summary: 'European biometric diagnostics company. Moderate budget with planned expansion into EU healthcare providers.',
        buyingIntentAnalysis: 'Medium urgency; currently scoping technical viability for next fiscal year.',
        keyStrengths: ['Established EU presence', 'Target industry alignment'],
        riskFlags: ['Timeline extends into next fiscal quarter', 'GDPR data residency requirement'],
        fitFactors: {
          budgetFit: 70,
          authorityFit: 75,
          needFit: 72,
          timelineFit: 65,
        },
        suggestedNextStep: 'Enroll in EMEA nurturing sequence and offer live technical walkthrough'
      },
      workflowStage: 'Completed'
    },
    {
      id: 'LP-1044',
      createdAt: isoAgo(36),
      updatedAt: isoAgo(36),
      companyName: 'Pacific Commerce Corp',
      contactName: 'Kenji Sato (Operations Lead)',
      email: 'k.sato@pacificommerce.co.jp',
      phone: '+81 3 4567 8901',
      website: 'https://pacificommerce.co.jp',
      industry: 'E-commerce',
      employeeCount: '101-500',
      estimatedBudget: 22000,
      targetTimeline: '1-3 months',
      problemStatement: 'Need to route regional supplier inquiries dynamically across Japan and Southeast Asia distribution nodes.',
      source: 'Inbound Form',
      qualificationStatus: 'Qualified',
      leadScore: 68,
      intentGrade: 'B',
      icpMatchScore: 70,
      budgetTier: 'Growth ($10K-$30K)',
      assignedTeam: 'APAC Growth',
      assignedAE: 'Liam Patel (Growth AE)',
      routingRuleApplied: 'Regional Growth Catch-all',
      requiresManagerApproval: false,
      aiEvaluation: {
        summary: 'APAC e-commerce operations seeking routing automation. Good commercial fit for Growth tier.',
        buyingIntentAnalysis: 'Operational team ready to trial with positive budget readiness.',
        keyStrengths: ['High volume lead routing demand', 'Clear regional scope'],
        riskFlags: ['Budget capped at $22K initial phase'],
        fitFactors: {
          budgetFit: 68,
          authorityFit: 65,
          needFit: 74,
          timelineFit: 75,
        },
        suggestedNextStep: 'Schedule APAC regional onboarding call'
      },
      workflowStage: 'Completed'
    },
    {
      id: 'LP-1043',
      createdAt: isoAgo(48),
      updatedAt: isoAgo(48),
      companyName: 'SoloCraft Studio',
      contactName: 'Alex River',
      email: 'alex.river1988@gmail.com',
      phone: '+1 (555) 012-3456',
      website: '',
      industry: 'Other',
      employeeCount: '1-20',
      estimatedBudget: 1500,
      targetTimeline: 'Exploratory',
      problemStatement: 'Just curious how the platform works for my personal freelance portfolio and side projects.',
      source: 'Inbound Form',
      qualificationStatus: 'Disqualified',
      leadScore: 24,
      intentGrade: 'D',
      icpMatchScore: 20,
      budgetTier: 'Self-Serve (< $10K)',
      assignedTeam: 'Automated Nurture',
      assignedAE: 'LeadPilot Auto-Nurture System',
      routingRuleApplied: 'Low Budget / Sub-40 Score -> Product-Led Nurture Stream',
      requiresManagerApproval: false,
      aiEvaluation: {
        summary: 'Solo freelancer with sub-$2k budget and exploratory timeline. Below enterprise AE routing criteria.',
        buyingIntentAnalysis: 'No enterprise purchasing intent or commercial readiness.',
        keyStrengths: ['Interested in platform capabilities'],
        riskFlags: ['Freemail domain', 'Budget below $10K threshold', 'Solo employee count'],
        fitFactors: {
          budgetFit: 15,
          authorityFit: 30,
          needFit: 25,
          timelineFit: 20,
        },
        suggestedNextStep: 'Route to automated free trial email cadence and self-serve documentation'
      },
      workflowStage: 'Disqualified'
    }
  ];

  const logs: WorkflowLog[] = [
    {
      id: 'LOG-3091',
      leadId: 'LP-1048',
      leadCompany: 'Apex Cloud Logistics',
      timestamp: isoAgo(1.5),
      step: 'Enquiry Received',
      status: 'Info',
      durationMs: 9,
      message: 'Ingested payload from Apex Cloud Logistics (David Sterling <d.sterling@apexcloud.io>)',
      metadata: { source: 'Website Demo Request', budget: 180000, employeeCount: '501-2500' }
    },
    {
      id: 'LOG-3092',
      leadId: 'LP-1048',
      leadCompany: 'Apex Cloud Logistics',
      timestamp: isoAgo(1.5),
      step: 'Firmographic Verification',
      status: 'Success',
      durationMs: 44,
      message: 'Corporate domain verified for d.sterling@apexcloud.io. Company size tier: 501-2500.',
      metadata: { domain: 'apexcloud.io', verified: true }
    },
    {
      id: 'LOG-3093',
      leadId: 'LP-1048',
      leadCompany: 'Apex Cloud Logistics',
      timestamp: isoAgo(1.5),
      step: 'Gemini AI Intent Scoring',
      status: 'Success',
      durationMs: 280,
      message: 'Gemini 2.5 Flash neural evaluation completed successfully with deep contextual breakdown.',
      metadata: { model: 'gemini-2.5-flash', intentUrgency: 'Active buyer with near-term deployment mandate.' }
    },
    {
      id: 'LOG-3094',
      leadId: 'LP-1048',
      leadCompany: 'Apex Cloud Logistics',
      timestamp: isoAgo(1.5),
      step: 'Routing Rules Evaluation',
      status: 'Success',
      durationMs: 31,
      message: 'Matched rule: "Enterprise Budget Rule (> $100K) -> Strategic Accounts". Lead score: 94 (Grade: A+).',
      metadata: { rule: 'Enterprise Budget Rule (> $100K)', targetTeam: 'Strategic Enterprise' }
    },
    {
      id: 'LOG-3095',
      leadId: 'LP-1048',
      leadCompany: 'Apex Cloud Logistics',
      timestamp: isoAgo(1.5),
      step: 'Manager Gatekeeper Check',
      status: 'Warning',
      durationMs: 14,
      message: 'Lead flagged for Manager Approval. Reason: High Contract Value ($180,000 ARR) exceeds $100K automated routing threshold.',
      metadata: { budget: 180000, trigger: 'CONTRACT_VALUE_THRESHOLD' }
    },
    {
      id: 'LOG-3088',
      leadId: 'LP-1047',
      leadCompany: 'Vanguard FinTech Group',
      timestamp: isoAgo(4.2),
      step: 'AE Assignment & SLA Sync',
      status: 'Success',
      durationMs: 25,
      message: 'Manager approved. Assigned directly to Sarah Chen (Principal AE) with 2-hour response SLA. CRM record synchronized.',
      metadata: { reviewer: 'Rachel Adams', ae: 'Sarah Chen' }
    },
    {
      id: 'LOG-3075',
      leadId: 'LP-1046',
      leadCompany: 'HealthPulse Solutions',
      timestamp: isoAgo(12),
      step: 'AE Assignment & SLA Sync',
      status: 'Success',
      durationMs: 19,
      message: 'Assigned directly to Marcus Vance (Senior AE) with 2-hour response SLA. CRM record synchronized.',
      metadata: { ae: 'Marcus Vance', team: 'US Mid-Market' }
    }
  ];

  const testScenarios: TestScenario[] = [
    {
      id: 'TEST-01',
      name: 'Fortune 500 Enterprise Deal Qualification',
      description: 'Verifies that inquiries with >$100K ARR, 2500+ employees, and corporate domains trigger Manager Approval and route to Strategic Accounts.',
      testCategory: 'High-Value Gatekeeper',
      expectedStatus: 'Pending Approval',
      expectedTeam: 'Strategic Enterprise',
      expectedMinScore: 85,
      samplePayload: {
        companyName: 'Global Cyber Corp',
        contactName: 'Amanda Lewis (VP InfoSec)',
        email: 'alewis@globalcyber.net',
        phone: '+1 415-555-8900',
        industry: 'Enterprise SaaS',
        employeeCount: '2500+',
        estimatedBudget: 150000,
        targetTimeline: 'Immediate (< 30 days)',
        problemStatement: 'Consolidating 14 enterprise SOC environments into a centralized intelligence hub. Need 99.999% SLA.',
        source: 'Website Demo Request'
      }
    },
    {
      id: 'TEST-02',
      name: 'Mid-Market FinTech Priority Routing',
      description: 'Tests automated territory assignment to US Mid-Market with >75 score without requiring manager hold.',
      testCategory: 'Routing Rules',
      expectedStatus: 'Qualified',
      expectedTeam: 'US Mid-Market',
      expectedMinScore: 75,
      samplePayload: {
        companyName: 'Beacon Ledger Tech',
        contactName: 'Marcus Wright (CTO)',
        email: 'mwright@beaconledger.io',
        phone: '+1 206-555-2244',
        industry: 'Fintech',
        employeeCount: '101-500',
        estimatedBudget: 65000,
        targetTimeline: '1-3 months',
        problemStatement: 'Automated AML triage engine replacing manual compliance workflows.',
        source: 'Partner Referral'
      }
    },
    {
      id: 'TEST-03',
      name: 'Freemail / Low-Budget Spam Defense',
      description: 'Ensures free-tier personal email providers with low budgets are safely routed to Self-Serve / Automated Nurture.',
      testCategory: 'Spam / Gatekeeper Defense',
      expectedStatus: 'Disqualified',
      expectedTeam: 'Automated Nurture',
      expectedMinScore: 10,
      samplePayload: {
        companyName: 'QuickSide Hobby',
        contactName: 'Random Guy',
        email: 'testuser12398@gmail.com',
        industry: 'Other',
        employeeCount: '1-20',
        estimatedBudget: 500,
        targetTimeline: 'Exploratory',
        problemStatement: 'Just testing your form to see what happens.',
        source: 'Inbound Form'
      }
    },
    {
      id: 'TEST-04',
      name: 'APAC Regional Expansion Routing',
      description: 'Verifies geographic and regional distribution rule catches Asia-Pacific growth prospects.',
      testCategory: 'Routing Rules',
      expectedStatus: 'Qualified',
      expectedTeam: 'APAC Growth',
      expectedMinScore: 60,
      samplePayload: {
        companyName: 'Tokyo Logistics Stream',
        contactName: 'Hana Tanaka',
        email: 'hana@tokyostream.co.jp',
        industry: 'Logistics',
        employeeCount: '21-100',
        estimatedBudget: 28000,
        targetTimeline: '1-3 months',
        problemStatement: 'Cross-dock freight tracking integration for regional Japanese parcel network.',
        source: 'Inbound Form'
      }
    },
    {
      id: 'TEST-05',
      name: 'Non-Standard Requirements Gatekeeper Flag',
      description: 'Verifies that special compliance requirements trigger the human-in-the-loop review workflow.',
      testCategory: 'High-Value Gatekeeper',
      expectedStatus: 'Pending Approval',
      expectedTeam: 'US Mid-Market',
      expectedMinScore: 65,
      samplePayload: {
        companyName: 'MedShield Health Network',
        contactName: 'Robert Vance (Director IT)',
        email: 'rvance@medshieldhealth.org',
        industry: 'Healthcare',
        employeeCount: '101-500',
        estimatedBudget: 75000,
        targetTimeline: 'Immediate (< 30 days)',
        problemStatement: 'Need clinical intake routing with custom dedicated on-prem hardware encryption gateway.',
        source: 'Website Demo Request',
        customRequirements: 'Requires custom on-premise HSM key management and multi-tenant dedicated isolation SLA.'
      }
    }
  ];

  return { leads, logs, testScenarios };
}

class LeadPilotDatabase {
  private db: DatabaseSchema;

  constructor() {
    this.ensureDataDirectory();
    this.db = this.loadDatabase();
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.leads && parsed.logs && parsed.testScenarios) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading db file, re-initializing seed:', e);
    }

    const seed = getInitialSeed();
    this.saveDatabase(seed);
    return seed;
  }

  private saveDatabase(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving db file:', e);
    }
  }

  public resetToSeed(): DatabaseSchema {
    this.db = getInitialSeed();
    this.saveDatabase(this.db);
    return this.db;
  }

  public getLeads(): Lead[] {
    return [...this.db.leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getLeadById(id: string): Lead | undefined {
    return this.db.leads.find(l => l.id === id);
  }

  public findDuplicateLead(companyName: string, email: string): Lead | undefined {
    const normEmail = (email || '').trim().toLowerCase();
    const normCompany = (companyName || '').trim().toLowerCase();
    return this.db.leads.find(
      l => l.email.trim().toLowerCase() === normEmail &&
           l.companyName.trim().toLowerCase() === normCompany
    );
  }

  public addLead(lead: Lead, newLogs: WorkflowLog[]): Lead {
    this.db.leads.unshift(lead);
    if (newLogs && newLogs.length > 0) {
      this.db.logs.unshift(...newLogs);
    }
    this.saveDatabase(this.db);
    return lead;
  }

  public updateLead(id: string, updates: Partial<Lead>): Lead | undefined {
    const index = this.db.leads.findIndex(l => l.id === id);
    if (index === -1) return undefined;

    this.db.leads[index] = {
      ...this.db.leads[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveDatabase(this.db);
    return this.db.leads[index];
  }

  public getPendingApprovals(): Lead[] {
    return this.db.leads.filter(l => l.qualificationStatus === 'Pending Approval' || l.requiresManagerApproval && l.approvalDetails?.status === 'Pending');
  }

  public getLogs(): WorkflowLog[] {
    return [...this.db.logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public addLog(log: WorkflowLog): void {
    this.db.logs.unshift(log);
    this.saveDatabase(this.db);
  }

  public getTestScenarios(): TestScenario[] {
    return this.db.testScenarios;
  }

  public updateTestScenarioResult(id: string, result: NonNullable<TestScenario['lastResult']>): void {
    const sc = this.db.testScenarios.find(s => s.id === id);
    if (sc) {
      sc.lastRunAt = new Date().toISOString();
      sc.lastResult = result;
      this.saveDatabase(this.db);
    }
  }

  public getStats(): DashboardStats {
    const leads = this.db.leads;
    const totalEnquiries = leads.length;
    const qualifiedLeads = leads.filter(l => l.qualificationStatus === 'Qualified' || l.qualificationStatus === 'Approved');
    const qualifiedCount = qualifiedLeads.length;
    const qualificationRate = totalEnquiries > 0 ? Math.round((qualifiedCount / totalEnquiries) * 100) : 0;
    const pendingApprovalsCount = leads.filter(l => l.qualificationStatus === 'Pending Approval').length;

    const pipelineValue = leads
      .filter(l => l.qualificationStatus === 'Qualified' || l.qualificationStatus === 'Approved' || l.qualificationStatus === 'Pending Approval')
      .reduce((sum, l) => sum + (Number(l.estimatedBudget) || 0), 0);

    const avgAiScore = totalEnquiries > 0
      ? Math.round(leads.reduce((sum, l) => sum + (l.leadScore || 0), 0) / totalEnquiries)
      : 0;

    const logs = this.db.logs;
    const avgProcessingLatencyMs = logs.length > 0
      ? Math.round(logs.slice(0, 20).reduce((sum, log) => sum + (log.durationMs || 0), 0) / Math.min(20, logs.length))
      : 42;

    const statusBreakdown: Record<LeadStatus, number> = {
      'Qualified': 0,
      'Approved': 0,
      'Pending Approval': 0,
      'Needs Review': 0,
      'Disqualified': 0,
    };

    const teamBreakdown: Record<AssignedTeam, number> = {
      'Strategic Enterprise': 0,
      'US Mid-Market': 0,
      'EMEA Enterprise': 0,
      'APAC Growth': 0,
      'Automated Nurture': 0,
    };

    const tierBreakdown: Record<string, number> = {
      'Enterprise (> $100K)': 0,
      'Mid-Market ($30K-$100K)': 0,
      'Growth ($10K-$30K)': 0,
      'Self-Serve (< $10K)': 0,
    };

    leads.forEach(l => {
      if (statusBreakdown[l.qualificationStatus] !== undefined) {
        statusBreakdown[l.qualificationStatus]++;
      }
      if (teamBreakdown[l.assignedTeam] !== undefined) {
        teamBreakdown[l.assignedTeam]++;
      }
      if (tierBreakdown[l.budgetTier] !== undefined) {
        tierBreakdown[l.budgetTier]++;
      }
    });

    return {
      totalEnquiries,
      qualifiedCount,
      qualificationRate,
      pendingApprovalsCount,
      pipelineValue,
      avgAiScore,
      avgProcessingLatencyMs,
      statusBreakdown,
      teamBreakdown,
      tierBreakdown,
      recentLeads: leads.slice(0, 5),
      recentLogs: logs.slice(0, 8),
    };
  }
}

export const db = new LeadPilotDatabase();
