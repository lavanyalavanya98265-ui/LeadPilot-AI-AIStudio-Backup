import React, { useState } from 'react';
import { WorkflowLog } from '../../types.js';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  Clock,
  Search,
  Code2,
  Filter,
  RefreshCw,
  Zap
} from 'lucide-react';

interface WorkflowLogsViewProps {
  logs: WorkflowLog[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const WorkflowLogsView: React.FC<WorkflowLogsViewProps> = ({
  logs,
  isLoading,
  onRefresh,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchLeadId, setSearchLeadId] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<WorkflowLog | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesStatus = statusFilter === 'All' || log.status === statusFilter;
    const q = searchLeadId.toLowerCase();
    const matchesSearch =
      !searchLeadId ||
      log.leadId.toLowerCase().includes(q) ||
      log.leadCompany.toLowerCase().includes(q) ||
      log.step.toLowerCase().includes(q) ||
      log.message.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Activity className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">AI Pipeline Execution Telemetry</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic step-by-step audit trail recording firmographic checks, neural inference, and SLA synchronization.
          </p>
        </div>

        {/* Search, Filter, Refresh */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative w-48 sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchLeadId}
              onChange={(e) => setSearchLeadId(e.target.value)}
              placeholder="Filter by Lead ID, Step..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Success">Success</option>
            <option value="Warning">Warning</option>
            <option value="Info">Info</option>
            <option value="Error">Error</option>
          </select>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Timeline Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => {
              const isSuccess = log.status === 'Success';
              const isWarning = log.status === 'Warning';
              const isError = log.status === 'Error';

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="relative group cursor-pointer"
                >
                  {/* Timeline bullet */}
                  <div
                    className={`absolute -left-6 top-1.5 w-6 h-6 -translate-x-1/2 rounded-full flex items-center justify-center border transition-all ${
                      isSuccess
                        ? 'bg-slate-950 border-emerald-500 text-emerald-400 group-hover:scale-110'
                        : isWarning
                        ? 'bg-slate-950 border-amber-500 text-amber-400 group-hover:scale-110'
                        : isError
                        ? 'bg-slate-950 border-rose-500 text-rose-400 group-hover:scale-110'
                        : 'bg-slate-950 border-blue-500 text-blue-400 group-hover:scale-110'
                    }`}
                  >
                    {isSuccess && <CheckCircle className="w-3.5 h-3.5" />}
                    {isWarning && <AlertTriangle className="w-3.5 h-3.5" />}
                    {isError && <XCircle className="w-3.5 h-3.5" />}
                    {!isSuccess && !isWarning && !isError && <Info className="w-3.5 h-3.5" />}
                  </div>

                  {/* Card Content */}
                  <div className="ml-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 group-hover:border-slate-700 transition-colors space-y-2">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white tracking-tight">{log.step}</span>
                        <span className="text-xs text-slate-500">·</span>
                        <span className="text-xs font-mono font-semibold text-blue-400">{log.leadId}</span>
                        <span className="text-xs text-slate-400">({log.leadCompany})</span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Zap className="w-3 h-3 text-cyan-400" />
                          {log.durationMs}ms
                        </span>
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {log.message}
                    </p>

                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="pt-2 flex items-center justify-between text-[11px] border-t border-slate-900">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Code2 className="w-3.5 h-3.5 text-slate-400" />
                          Metadata Available
                        </span>
                        <span className="text-blue-400 hover:text-blue-300 font-medium">Inspect Payload</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400">
              <p className="text-sm font-medium text-slate-300">No logs match your filter criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Payload Modal / Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-blue-400 font-bold">{selectedLog.id}</span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedLog.step}</h3>
                <p className="text-xs text-slate-400">{selectedLog.leadCompany} ({selectedLog.leadId})</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-300 mb-1">Log Message</div>
              <p className="text-xs text-slate-300 p-3 rounded-lg bg-slate-950 border border-slate-800">
                {selectedLog.message}
              </p>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-300 mb-1">Payload Metadata</div>
              <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-60">
                {JSON.stringify(selectedLog.metadata || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
