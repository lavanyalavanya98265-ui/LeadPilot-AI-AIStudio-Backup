import React, { useState } from 'react';
import { TestScenario } from '../../types.js';
import {
  FlaskConical,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Code,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface TestReportsViewProps {
  tests: TestScenario[];
  isLoading: boolean;
  onRunAll: () => Promise<void>;
  onRunSingle: (id: string) => Promise<void>;
}

export const TestReportsView: React.FC<TestReportsViewProps> = ({
  tests,
  isLoading,
  onRunAll,
  onRunSingle,
}) => {
  const [runningId, setRunningId] = useState<string | null>(null);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [expandedTests, setExpandedTests] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedTests((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRunAll = async () => {
    setIsRunningAll(true);
    try {
      await onRunAll();
    } finally {
      setIsRunningAll(false);
    }
  };

  const handleRunSingle = async (id: string) => {
    setRunningId(id);
    try {
      await onRunSingle(id);
    } finally {
      setRunningId(null);
    }
  };

  // Metrics
  const testedCount = tests.filter((t) => t.lastResult !== undefined).length;
  const passedCount = tests.filter((t) => t.lastResult?.passed).length;
  const failedCount = tests.filter((t) => t.lastResult && !t.lastResult.passed).length;
  const passRate = testedCount > 0 ? Math.round((passedCount / testedCount) * 100) : 100;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Overview & Run All CTA */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <FlaskConical className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">Automated Rules & Routing Test Suite</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Simulates synthetic enterprise scenarios to validate SLA gatekeepers, multi-factor scoring algorithms, freemail spam defense, and territory assignment integrity.
          </p>
        </div>

        <button
          onClick={handleRunAll}
          disabled={isRunningAll || isLoading}
          className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isRunningAll ? 'animate-spin' : ''}`} />
          <span>{isRunningAll ? 'Executing 5 Test Suites...' : 'Run All Test Scenarios'}</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-medium text-slate-400">Total Scenarios</span>
          <div className="text-2xl font-bold font-mono text-white mt-1 tabular-nums">
            {tests.length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-medium text-slate-400">Passed Assertions</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
            {passedCount}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-medium text-slate-400">Failed Assertions</span>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1 tabular-nums">
            {failedCount}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-medium text-slate-400">Regression Pass Rate</span>
          <div className="text-2xl font-bold font-mono text-blue-400 mt-1 tabular-nums">
            {passRate}%
          </div>
        </div>
      </div>

      {/* Scenarios List */}
      <div className="space-y-4">
        {tests.map((test) => {
          const isRunning = runningId === test.id;
          const res = test.lastResult;
          const isExpanded = expandedTests[test.id] ?? true;

          return (
            <div
              key={test.id}
              className={`p-5 rounded-xl bg-slate-900 border transition-all ${
                res
                  ? res.passed
                    ? 'border-emerald-500/30'
                    : 'border-rose-500/40'
                  : 'border-slate-800'
              }`}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-400">{test.id}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {test.testCategory}
                    </span>
                    {res && (
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                          res.passed
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {res.passed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{res.passed ? 'PASSED' : 'FAILED'}</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">{test.name}</h3>
                  <p className="text-xs text-slate-400 max-w-2xl">{test.description}</p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => handleRunSingle(test.id)}
                    disabled={isRunning || isRunningAll}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Play className={`w-3.5 h-3.5 text-blue-400 ${isRunning ? 'animate-spin' : ''}`} />
                    <span>{isRunning ? 'Running...' : 'Run Test'}</span>
                  </button>

                  <button
                    onClick={() => toggleExpand(test.id)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
                  {/* Expectations Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Expected Status:</span>
                      <div className="font-semibold text-slate-200 mt-0.5">{test.expectedStatus}</div>
                    </div>
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Expected Team:</span>
                      <div className="font-semibold text-slate-200 mt-0.5">{test.expectedTeam}</div>
                    </div>
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Min Score Required:</span>
                      <div className="font-mono font-bold text-blue-400 mt-0.5 tabular-nums">
                        {test.expectedMinScore}
                      </div>
                    </div>
                  </div>

                  {/* Test Results & Logs */}
                  {res && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold text-slate-300">
                          Assertion Output ({res.assertionsPassed}/{res.totalAssertions} Validated)
                        </span>
                        <span className="font-mono text-cyan-400">{res.executionTimeMs}ms execution</span>
                      </div>

                      <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1">
                        {res.logs.map((line, idx) => {
                          const isPass = line.includes('[PASS]');
                          const isFail = line.includes('[FAIL]');
                          const isErr = line.includes('[ERROR]');

                          return (
                            <div
                              key={idx}
                              className={`${
                                isPass
                                  ? 'text-emerald-400'
                                  : isFail || isErr
                                  ? 'text-rose-400 font-bold'
                                  : 'text-slate-400'
                              }`}
                            >
                              {line}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
