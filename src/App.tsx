/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api.js';
import { Lead, WorkflowLog, TestScenario, DashboardStats, EnquiryInput, AssignedTeam } from './types.js';
import { Sidebar, NavTab } from './components/Sidebar.js';
import { TopHeader } from './components/TopHeader.js';
import { DashboardView } from './components/views/DashboardView.js';
import { SubmitEnquiryView } from './components/views/SubmitEnquiryView.js';
import { LeadManagementView } from './components/views/LeadManagementView.js';
import { ManagerApprovalsView } from './components/views/ManagerApprovalsView.js';
import { WorkflowLogsView } from './components/views/WorkflowLogsView.js';
import { TestReportsView } from './components/views/TestReportsView.js';
import { LeadDossierDrawer } from './components/LeadDossierDrawer.js';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [tests, setTests] = useState<TestScenario[]>([]);
  const [inspectedLead, setInspectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isRunningQuickTests, setIsRunningQuickTests] = useState<boolean>(false);
  const [quickTestSummary, setQuickTestSummary] = useState<{ passed: number; total: number } | null>(null);

  // Fetch all state
  const loadAllData = useCallback(async () => {
    try {
      const [statsData, leadsData, logsData, testsData] = await Promise.all([
        api.getStats().catch(() => null),
        api.getLeads().catch(() => []),
        api.getLogs().catch(() => []),
        api.getTests().catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      setLeads(leadsData);
      setLogs(logsData);
      setTests(testsData);

      // If test scenarios have previous results, update quick summary
      if (testsData && testsData.length > 0) {
        const tested = testsData.filter(t => t.lastResult !== undefined);
        if (tested.length > 0) {
          const passed = tested.filter(t => t.lastResult?.passed).length;
          setQuickTestSummary({ passed, total: tested.length });
        }
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handle Enquiry Submission
  const handleSubmitEnquiry = async (input: EnquiryInput) => {
    const res = await api.submitEnquiry(input);
    await loadAllData();
    return res;
  };

  // Handle Manager Approval Decision
  const handleDecideApproval = async (
    id: string,
    action: 'approve' | 'reject' | 'override',
    notes?: string,
    team?: string,
    ae?: string
  ) => {
    await api.decideApproval(id, action, notes, team, ae);
    await loadAllData();
    if (inspectedLead && inspectedLead.id === id) {
      const updated = await api.getLeadById(id).catch(() => null);
      if (updated) setInspectedLead(updated);
    }
  };

  // Handle Re-evaluation
  const handleReEvaluateLead = async (id: string) => {
    const updated = await api.reEvaluateLead(id);
    await loadAllData();
    if (inspectedLead && inspectedLead.id === id) {
      setInspectedLead(updated);
    }
  };

  // Handle Manual Assignment Override
  const handleOverrideAssignment = async (id: string, team: AssignedTeam, ae: string) => {
    await api.decideApproval(id, 'override', 'Manual executive reassignment', team, ae);
    await loadAllData();
    const updated = await api.getLeadById(id).catch(() => null);
    if (updated) setInspectedLead(updated);
  };

  // Run Quick Tests from Dashboard
  const handleRunQuickTests = async () => {
    setIsRunningQuickTests(true);
    try {
      const results = await api.runTests();
      setTests(results);
      const passed = results.filter(t => t.lastResult?.passed).length;
      setQuickTestSummary({ passed, total: results.length });
    } catch (err) {
      console.error('Error running quick tests:', err);
    } finally {
      setIsRunningQuickTests(false);
    }
  };

  // Run Single Test Scenario
  const handleRunSingleTest = async (scenarioId: string) => {
    const updated = await api.runTests(scenarioId);
    setTests(prev => prev.map(t => {
      const found = updated.find(u => u.id === t.id);
      return found || t;
    }));
  };

  // Reset to Demo Seed
  const handleResetSeed = async () => {
    if (!window.confirm('Reset all leads and logs to default enterprise seed records?')) return;
    setIsResetting(true);
    try {
      await api.resetDatabase();
      await loadAllData();
      setInspectedLead(null);
    } catch (err) {
      console.error('Failed to reset seed:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const pendingApprovalsCount = stats?.pendingApprovalsCount || 
    leads.filter(l => l.qualificationStatus === 'Pending Approval').length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setSearchQuery('');
        }}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <TopHeader
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onSearch={setSearchQuery}
          searchQuery={searchQuery}
          onResetSeed={handleResetSeed}
          isResetting={isResetting}
          pendingApprovalsCount={pendingApprovalsCount}
        />

        {/* View Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {currentTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              isLoading={isLoading}
              onSelectTab={setCurrentTab}
              onInspectLead={setInspectedLead}
              onRunQuickTests={handleRunQuickTests}
              isRunningTests={isRunningQuickTests}
              quickTestSummary={quickTestSummary}
            />
          )}

          {currentTab === 'submit' && (
            <SubmitEnquiryView
              onSubmit={handleSubmitEnquiry}
              onSelectTab={setCurrentTab}
              onInspectLead={setInspectedLead}
            />
          )}

          {currentTab === 'leads' && (
            <LeadManagementView
              leads={leads}
              isLoading={isLoading}
              onInspectLead={setInspectedLead}
              onReEvaluateLead={handleReEvaluateLead}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}

          {currentTab === 'approvals' && (
            <ManagerApprovalsView
              leads={leads}
              onDecideApproval={handleDecideApproval}
              onInspectLead={setInspectedLead}
            />
          )}

          {currentTab === 'logs' && (
            <WorkflowLogsView
              logs={logs}
              isLoading={isLoading}
              onRefresh={loadAllData}
            />
          )}

          {currentTab === 'tests' && (
            <TestReportsView
              tests={tests}
              isLoading={isLoading}
              onRunAll={handleRunQuickTests}
              onRunSingle={handleRunSingleTest}
            />
          )}
        </main>
      </div>

      {/* Lead Dossier Modal Drawer */}
      {inspectedLead && (
        <LeadDossierDrawer
          lead={inspectedLead}
          onClose={() => setInspectedLead(null)}
          onReEvaluate={handleReEvaluateLead}
          onApprove={async (id, notes) => handleDecideApproval(id, 'approve', notes)}
          onOverrideAssignment={handleOverrideAssignment}
        />
      )}
    </div>
  );
}
