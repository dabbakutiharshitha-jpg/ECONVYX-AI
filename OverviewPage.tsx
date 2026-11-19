// Overview Dashboard Page

import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  FileCheck2,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { formatINR, formatDate, getStatusBadgeProps } from '../../lib/utils.js';
import { useNavigate } from 'react-router-dom';

export const OverviewPage: React.FC = () => {
  const { user, activeWorkspace } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('this_month');

  const fetchOverview = async () => {
    try {
      setIsLoading(true);
      const res = await api.getOverview();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const { kpiCards, charts, topOutstandingCustomers, upcomingReceivables, documentVerificationAlerts, unmatchedBankTransactions, aiObservations, recentActivity } = data;

  // Chart data preparation
  const agingChartData = [
    { name: 'Current (0-30d)', amountRupees: charts.receivablesAging.currentPaise / 100 },
    { name: '1-30d Overdue', amountRupees: charts.receivablesAging.bucket0to30Paise / 100 },
    { name: '31-60d Overdue', amountRupees: charts.receivablesAging.bucket31to60Paise / 100 },
    { name: '61-90d Overdue', amountRupees: charts.receivablesAging.bucket61to90Paise / 100 },
    { name: '90+d Overdue', amountRupees: charts.receivablesAging.bucketAbove90Paise / 100 },
  ];

  const statusPieData = [
    { name: 'Paid', value: charts.invoiceStatusDistribution.paid.count, color: '#16A36A' },
    { name: 'Partially Paid', value: charts.invoiceStatusDistribution.partially_paid.count, color: '#F5A623' },
    { name: 'Open', value: charts.invoiceStatusDistribution.open.count, color: '#12B8A6' },
    { name: 'Overdue', value: charts.invoiceStatusDistribution.overdue.count, color: '#DC5353' },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-brand-primary-navy">
              Good morning, {user?.fullName || 'Vikram'}
            </h1>
            {activeWorkspace?.isDemo && (
              <span className="px-2 py-0.5 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded-full">
                Apex Components (Demonstration Mode)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Here is your enterprise financial intelligence overview as of {formatDate(new Date().toISOString())}.
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-xs font-medium bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 shadow-xs outline-none focus:border-brand-teal"
          >
            <option value="today">Today</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_quarter">This Quarter</option>
            <option value="custom">Custom Financial Range</option>
          </select>
          <button
            onClick={fetchOverview}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh Ledger"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 6 Key Performance Indicator Cards (Exact figures) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Invoiced */}
        <div className="p-4 bg-white rounded-xl border border-brand-border shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Invoiced</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
              <FileCheck2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-brand-primary-navy mt-2">
            {kpiCards.totalInvoiced.formatted}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Gross Sales Issued</span>
            <span className="text-slate-500 font-medium">3 Invoices</span>
          </div>
        </div>

        {/* Total Received */}
        <div className="p-4 bg-white rounded-xl border border-brand-border shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Received</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">
            {kpiCards.totalReceived.formatted}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Confirmed Liquid Collections</span>
            <span className="text-emerald-700 font-semibold">25% Collected</span>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="p-4 bg-white rounded-xl border border-brand-border shadow-card hover:shadow-card-hover transition-all cursor-pointer" onClick={() => navigate('/receivables')}>
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Outstanding Receivables</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-md">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-2">
            {kpiCards.outstandingReceivables.formatted}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Total Invoiced − Total Received</span>
            <span className="text-amber-700 font-medium">View Open &rarr;</span>
          </div>
        </div>

        {/* Overdue Receivables */}
        <div className="p-4 bg-white rounded-xl border border-rose-200 bg-rose-50/20 shadow-card hover:shadow-card-hover transition-all cursor-pointer" onClick={() => navigate('/receivables?status=overdue')}>
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold">
            <span>Overdue Receivables</span>
            <span className="p-1.5 bg-rose-100 text-rose-700 rounded-md">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-2">
            {kpiCards.overdueReceivables.formatted}
          </div>
          <div className="text-[11px] text-rose-600/80 mt-1 flex items-center justify-between">
            <span>Past agreed payment credit date</span>
            <span className="font-bold underline">83% of Outstanding</span>
          </div>
        </div>

        {/* Upcoming Payments (Accounts Payable) */}
        <div className="p-4 bg-white rounded-xl border border-brand-border shadow-card hover:shadow-card-hover transition-all cursor-pointer" onClick={() => navigate('/payables')}>
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Upcoming Payables</span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded-md">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-purple-700 mt-2">
            {kpiCards.upcomingPayments.formatted}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Supplier Bills Due</span>
            <span className="text-purple-600 font-medium">2 Bills Due</span>
          </div>
        </div>

        {/* Available Cash Balance */}
        <div className="p-4 bg-white rounded-xl border border-brand-border shadow-card hover:shadow-card-hover transition-all cursor-pointer" onClick={() => navigate('/reconciliation')}>
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Available Cash Balance</span>
            <span className="p-1.5 bg-teal-50 text-brand-teal rounded-md">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-brand-teal mt-2">
            {kpiCards.availableCashBalance.formatted}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Verified Reconciled Balance</span>
            <span className="text-brand-teal font-medium">Reconcile &rarr;</span>
          </div>
        </div>
      </div>

      {/* AI Intelligence Observations Banner */}
      <div className="p-4 bg-linear-to-r from-brand-midnight to-brand-primary-navy rounded-xl text-white shadow-elevated">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-brand-bright-aqua" />
          <span className="text-xs font-bold tracking-wider text-brand-bright-aqua uppercase">
            ECONVYX Financial Observations
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {aiObservations.map((obs: any, index: number) => (
            <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10 text-xs">
              <div className="font-semibold text-brand-aqua">{obs.title}</div>
              <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">{obs.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Analytics & Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: Cash Inflow vs Outflow */}
        <div className="p-5 bg-white rounded-xl border border-brand-border shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Cash Inflow vs Outflow (₹)</h2>
              <p className="text-[11px] text-slate-400">Monthly confirmed revenue vs supplier obligations</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 bg-brand-teal rounded-sm" /> Inflow
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 bg-rose-400 rounded-sm" /> Outflow
              </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.cashInflowVsOutflow}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis
                  tickFormatter={(val) => `₹${val / 1000}k`}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                />
                <Tooltip
                  formatter={(val: any) => formatINR(Number(val) * 100)}
                  contentStyle={{ backgroundColor: '#101C2C', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="inflowRupees" fill="#12B8A6" radius={[4, 4, 0, 0]} name="Inflow" />
                <Bar dataKey="outflowRupees" fill="#DC5353" radius={[4, 4, 0, 0]} name="Outflow" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Receivables Aging Breakdown */}
        <div className="p-5 bg-white rounded-xl border border-brand-border shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Receivables Aging Portfolio</h2>
              <p className="text-[11px] text-slate-400">Aging exposure categorized by days overdue</p>
            </div>
            <button onClick={() => navigate('/receivables')} className="text-xs text-brand-teal font-medium hover:underline">
              Ledger Details
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingChartData} layout="vertical">
                <XAxis type="number" tickFormatter={(val) => `₹${val / 1000}k`} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val: any) => formatINR(Number(val) * 100)}
                  contentStyle={{ backgroundColor: '#101C2C', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="amountRupees" fill="#F5A623" radius={[0, 4, 4, 0]} name="Outstanding" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Operational Modules: Top Debtors & Verification Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Outstanding Customers */}
        <div className="p-5 bg-white rounded-xl border border-brand-border shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800">Top Outstanding Debtors</h2>
            <button onClick={() => navigate('/customers')} className="text-xs text-brand-teal font-medium hover:underline">
              View All
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {topOutstandingCustomers.map((cust: any) => (
              <div key={cust.customerId} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800">{cust.name}</div>
                  <div className="text-[11px] text-slate-400">{cust.invoiceCount} Unsettled Invoice(s)</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-brand-primary-navy">
                    {formatINR(cust.outstandingPaise)}
                  </div>
                  <button
                    onClick={() => navigate('/reminders')}
                    className="text-[10px] text-brand-teal hover:underline font-semibold"
                  >
                    Draft Reminder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Alerts: Verification & Bank Matches */}
        <div className="p-5 bg-white rounded-xl border border-brand-border shadow-card space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Pending Financial Verifications</h2>

          {/* Verification Discrepancy Alert */}
          {documentVerificationAlerts.map((vCase: any) => (
            <div key={vCase.id} className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/50 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{vCase.caseNumber}</span>
                  <span className="text-xs font-bold text-amber-800">
                    {formatINR(vCase.monetaryImpactPaise)} Variance
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">{vCase.summary}</p>
                <div className="mt-2">
                  <button
                    onClick={() => navigate('/verification')}
                    className="text-xs font-semibold text-brand-teal hover:underline flex items-center gap-1"
                  >
                    Review Discrepancy in Verification Centre &rarr;
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Unmatched Bank Transaction Match */}
          {unmatchedBankTransactions.map((txn: any) => (
            <div key={txn.id} className="p-3.5 rounded-lg border border-teal-200 bg-teal-50/40 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Suggested Bank Match</span>
                  <span className="text-xs font-bold text-brand-teal">{formatINR(txn.amountPaise)}</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">{txn.matchReason}</p>
                <div className="mt-2">
                  <button
                    onClick={() => navigate('/reconciliation')}
                    className="text-xs font-semibold text-brand-teal hover:underline flex items-center gap-1"
                  >
                    Confirm Match in Bank Reconciliation &rarr;
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Trail Activity Feed */}
      <div className="p-5 bg-white rounded-xl border border-brand-border shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800">Audit Trail Activity</h2>
          <button onClick={() => navigate('/audit')} className="text-xs text-brand-teal font-medium hover:underline">
            Complete Audit Log
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {recentActivity.map((log: any) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-teal" />
                <span className="font-semibold text-slate-800">{log.action}</span>
                <span className="text-slate-500 truncate max-w-md">{log.details}</span>
              </div>
              <span className="text-[11px] text-slate-400 whitespace-nowrap ml-4">
                {formatDate(log.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
