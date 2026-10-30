import { Lead, WorkflowLog, TestScenario, DashboardStats, EnquiryInput } from '../types.js';

const API_BASE = '/api';

export const api = {
  async getStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  async getLeads(params?: { search?: string; status?: string; team?: string; tier?: string }): Promise<Lead[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status && params.status !== 'All') query.set('status', params.status);
    if (params?.team && params.team !== 'All') query.set('team', params.team);
    if (params?.tier && params.tier !== 'All') query.set('tier', params.tier);

    const res = await fetch(`${API_BASE}/leads?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch leads');
    return res.json();
  },

  async getLeadById(id: string): Promise<Lead> {
    const res = await fetch(`${API_BASE}/leads/${id}`);
    if (!res.ok) throw new Error('Failed to fetch lead');
    return res.json();
  },

  async submitEnquiry(input: EnquiryInput): Promise<{ lead: Lead; workflowLogs: WorkflowLog[] }> {
    const res = await fetch(`${API_BASE}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Submission failed' }));
      throw new Error(err.error || 'Failed to submit enquiry');
    }
    return res.json();
  },

  async decideApproval(
    id: string,
    action: 'approve' | 'reject' | 'override',
    managerNotes?: string,
    assignedTeam?: string,
    assignedAE?: string
  ): Promise<Lead> {
    const res = await fetch(`${API_BASE}/leads/${id}/approval`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, managerNotes, assignedTeam, assignedAE }),
    });
    if (!res.ok) throw new Error('Failed to update approval decision');
    return res.json();
  },

  async reEvaluateLead(id: string): Promise<Lead> {
    const res = await fetch(`${API_BASE}/leads/${id}/re-evaluate`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to re-evaluate lead');
    return res.json();
  },

  async getApprovals(): Promise<Lead[]> {
    const res = await fetch(`${API_BASE}/approvals`);
    if (!res.ok) throw new Error('Failed to fetch approvals');
    return res.json();
  },

  async getLogs(params?: { leadId?: string; status?: string }): Promise<WorkflowLog[]> {
    const query = new URLSearchParams();
    if (params?.leadId) query.set('leadId', params.leadId);
    if (params?.status && params.status !== 'All') query.set('status', params.status);

    const res = await fetch(`${API_BASE}/logs?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch workflow logs');
    return res.json();
  },

  async getTests(): Promise<TestScenario[]> {
    const res = await fetch(`${API_BASE}/tests`);
    if (!res.ok) throw new Error('Failed to fetch tests');
    return res.json();
  },

  async runTests(scenarioId?: string): Promise<TestScenario[]> {
    const res = await fetch(`${API_BASE}/tests/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId }),
    });
    if (!res.ok) throw new Error('Failed to run tests');
    return res.json();
  },

  async resetDatabase(): Promise<{ message: string; totalLeads: number }> {
    const res = await fetch(`${API_BASE}/leads/reset`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset database');
    return res.json();
  },
};
