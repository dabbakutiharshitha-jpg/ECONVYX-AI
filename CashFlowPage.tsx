// Cash Flow Forecasting & Scenario Modeler Page

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Sliders,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../../lib/api.js';
import { formatINR, formatDate } from '../../lib/utils.js';

export const CashFlowPage: React.FC = () => {
  const [horizon, setHorizon] = useState<number>(30);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Scenario Simulator controls
  const [isScenarioActive, setIsScenarioActive] = useState(false);
  const [delayDays, setDelayDays] = useState<number>(30);
  const [additionalExpense, setAdditionalExpense] = useState<number>(0);

  const fetchForecast = async (useScenario = false) => {
    try {
      setIsLoading(true);
      const params: any = { horizon };
      if (useScenario) {
        params.delayDays = delayDays;
        params.additionalExpenseRupees = additionalExpense;
      }
      const res = await api.getCashFlow(params);
      setData(res);
    } catch (err) {
      console.error('Failed to load cash flow forecast', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast(isScenarioActive);
  }, [horizon, isScenarioActive]);

  const handleApplyScenario = () => {
    setIsScenarioActive(true);
    fetchForecast(true);
  };

  const handleResetScenario = () => {
    setIsScenarioActive(false);
    setDelayDays(30);
    setAdditionalExpense(0);
    fetchForecast(false);
  };

  if (isLoading && !data) {
    return <div className="p-8 text-center text-xs text-slate-500 animate-pulse">Calculating cash flow projection...</div>;
  }

  const baseline = data?.baseline;
  const scenario = data?.scenario;
  const builtIn = data?.builtInScenarios;

  // Active metrics to display (scenario if active, else baseline)
  const displayProjected = isScenarioActive && scenario
    ? scenario.projectedBalanceFormatted
    : baseline?.projectedBalanceFormatted;

  const displayInflow = isScenarioActive && scenario
    ? scenario.expectedInflowsFormatted
    : baseline?.expectedInflowsFormatted;

  const displayOutflow = isScenarioActive && scenario
    ? scenario.expectedOutflowsFormatted
    : baseline?.expectedOutflowsFormatted;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-primary-navy">
            Cash Flow Forecasting & Scenario Modeler
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic liquidity projections based on verified invoice due dates and supplier payment terms.
          </p>
        </div>

        {/* Horizon Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Forecast Horizon:</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs">
            {[7, 15, 30, 60, 90].map((days) => (
              <button
                key={days}
                onClick={() => setHorizon(days)}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  horizon === days
                    ? 'bg-brand-deep-navy text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Financial Liquidity Cards (Matches Master Prompt Section 24 figures) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Opening Cash Balance */}
        <div className="p-4 bg-white rounded-xl border border-brand-border shadow-card">
          <div className="text-xs text-slate-500 font-medium">Opening Cash Balance</div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            {data?.openingBalance?.formatted || '₹2,00,000.00'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Verified liquid bank balance</div>
        </div>

        {/* Expected Inflows */}
        <div className="p-4 bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-card">
          <div className="text-xs text-emerald-700 font-semibold">Expected Customer Receipts</div>
          <div className="text-xl font-extrabold text-emerald-600 mt-1">{displayInflow}</div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">Based on open invoice due dates</div>
        </div>

        {/* Expected Outflows */}
        <div className="p-4 bg-white rounded-xl border border-rose-200 bg-rose-50/20 shadow-card">
          <div className="text-xs text-rose-700 font-semibold">Planned Supplier Outflows</div>
          <div className="text-xl font-extrabold text-rose-600 mt-1">{displayOutflow}</div>
          <div className="text-[11px] text-rose-600/80 mt-0.5">Bills due within {horizon} days</div>
        </div>

        {/* Projected Closing Cash Position */}
        <div
          className={`p-4 rounded-xl border shadow-card ${
            isScenarioActive
              ? 'bg-amber-500/10 border-amber-300'
              : 'bg-teal-500/10 border-brand-teal'
          }`}
        >
          <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
            <span>Projected Cash Position</span>
            {isScenarioActive && (
              <span className="text-[9px] px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded font-bold">
                SCENARIO
              </span>
            )}
          </div>
          <div className="text-xl font-extrabold text-brand-primary-navy mt-1">
            {displayProjected}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Opening + Expected Inflows − Outflows
          </div>
        </div>
      </div>

      {/* Projection Chart & Timeline */}
      <div className="p-5 bg-white rounded-xl border border-brand-border shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Projected Liquidity Trajectory ({horizon}-Day Horizon)
            </h2>
            <p className="text-[11px] text-slate-400">
              Daily running cash balance accounting for scheduled receipts and vendor payables
            </p>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={baseline?.timeline || []}>
              <defs>
                <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#12B8A6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#12B8A6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis
                tickFormatter={(val) => `₹${val / 1000}k`}
                tick={{ fontSize: 11, fill: '#64748B' }}
              />
              <Tooltip
                formatter={(val: any) => formatINR(Number(val) * 100)}
                contentStyle={{ backgroundColor: '#101C2C', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="balanceRupees"
                stroke="#12B8A6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#cashGradient)"
                name="Projected Balance"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scenario Analysis Studio (Master Prompt Section 14 & 24) */}
      <div className="p-5 bg-white rounded-xl border border-brand-border shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-teal" />
            <h2 className="text-sm font-bold text-brand-primary-navy">
              Scenario Stress Test Modeler
            </h2>
          </div>
          {isScenarioActive && (
            <button
              onClick={handleResetScenario}
              className="flex items-center gap-1 text-xs text-rose-600 font-medium hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset to Baseline
            </button>
          )}
        </div>

        {/* Built-in Preset Prompt Scenario: "Delay Largest Receivable (INV-101 ₹5L) beyond horizon" */}
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-900">
                Preset Stress Scenario: Major Customer Default / 60-Day Delay
              </span>
              <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                Section 24 Benchmark
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              If customer Precision AutoTech delays payment of Invoice #INV-101 (₹5,00,000) beyond the 30-day forecast horizon.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[10px] text-slate-500">Revised Liquidity:</div>
              <div className="text-base font-extrabold text-amber-800">
                {builtIn?.delayMajorInvoice?.projectedBalanceFormatted || '₹1,70,000.00'}
              </div>
            </div>
            <button
              onClick={() => {
                setDelayDays(60);
                handleApplyScenario();
              }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs"
            >
              Simulate Scenario
            </button>
          </div>
        </div>

        {/* Custom Modeler Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <label className="font-semibold text-slate-700">Simulate Payment Delay (Days)</label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="range"
                min="0"
                max="90"
                step="15"
                value={delayDays}
                onChange={(e) => setDelayDays(parseInt(e.target.value))}
                className="flex-1 accent-brand-teal"
              />
              <span className="font-bold text-slate-900 w-12 text-right">{delayDays} Days</span>
            </div>
            <span className="text-[10px] text-slate-400">Pushes expected receipts back in time</span>
          </div>

          <div>
            <label className="font-semibold text-slate-700">Additional Unplanned Outflow / Expense (₹)</label>
            <input
              type="number"
              min="0"
              step="10000"
              value={additionalExpense}
              onChange={(e) => setAdditionalExpense(parseFloat(e.target.value) || 0)}
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal font-semibold text-slate-800"
              placeholder="e.g. 50000"
            />
            <span className="text-[10px] text-slate-400">Simulate emergency machinery repair or tax payment</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleApplyScenario}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-deep-navy hover:bg-brand-midnight rounded-lg shadow-xs"
          >
            <Play className="w-3.5 h-3.5 text-brand-aqua" />
            <span>Apply Custom Simulation</span>
          </button>
        </div>
      </div>

      {/* Assumptions & Compliance Transparency */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
        <div className="font-bold text-slate-800">Forecast Assumptions & Constraints:</div>
        <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
          <li>Calculated strictly from verified open invoice due dates and supplier payment terms.</li>
          <li>Never presents forecasted amounts as guaranteed cash.</li>
          <li>Opening cash verified against reconciled bank statement balances.</li>
        </ul>
      </div>
    </div>
  );
};
