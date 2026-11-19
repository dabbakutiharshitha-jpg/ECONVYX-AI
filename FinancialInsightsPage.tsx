// Financial Insights & Analytics Page

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  PieChart as PieIcon,
  Percent,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { formatINR } from '../../lib/utils.js';

export const FinancialInsightsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setIsLoading(true);
        const res = await api.getInsights();
        setData(res);
      } catch (err) {
        console.error('Failed to load insights', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInsights();
  }, []);

  if (isLoading || !data) {
    return <div className="p-8 text-center text-xs text-slate-500 animate-pulse">Computing financial intelligence metrics...</div>;
  }

  const { metrics, insights } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-primary-navy">
            Financial Insights & Working Capital Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Data-backed metrics, debtor concentration, collection velocity, and actionable AI observations.
          </p>
        </div>
      </div>

      {/* Financial Ratio Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Collection Efficiency */}
        <div className="p-4 bg-white rounded-xl border border-brand-border shadow-card">
          <div className="text-xs text-slate-500 font-medium">Collection Efficiency Rate</div>
          <div className="text-2xl font-extrabold text-brand-teal mt-1">
            {metrics.collectionEfficiencyPercent}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {metrics.totalReceived.formatted} collected of {metrics.totalInvoiced.formatted} billed
          </div>
        </div>

        {/* Overdue Ratio */}
        <div className="p-4 bg-white rounded-xl border border-rose-200 bg-rose-50/20 shadow-card">
          <div className="text-xs text-rose-700 font-semibold">Overdue Receivables Ratio</div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">
            {metrics.overdueRatioPercent}%
          </div>
          <div className="text-[11px] text-rose-600/80 mt-0.5">
            {metrics.totalOverdue.formatted} past credit terms
          </div>
        </div>

        {/* Receivables Turnover */}
        <div className="p-4 bg-white rounded-xl border border-brand-border shadow-card">
          <div className="text-xs text-slate-500 font-medium">Receivables Turnover Multiple</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {metrics.receivablesTurnoverRatio}x
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Annualized credit velocity
          </div>
        </div>

        {/* Customer Concentration */}
        <div className="p-4 bg-white rounded-xl border border-brand-border shadow-card">
          <div className="text-xs text-slate-500 font-medium">Top Debtor Concentration</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            {metrics.customerConcentration.concentrationPercent}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
            {metrics.customerConcentration.largestDebtorName}
          </div>
        </div>
      </div>

      {/* Actionable Strategic Insights */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-teal" />
          <h2 className="text-sm font-bold text-brand-primary-navy">
            Data-Backed Actionable Financial Observations
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((item: any) => {
            const isWarning = item.type === 'warning';
            return (
              <div
                key={item.id}
                className={`p-5 rounded-xl border shadow-card flex flex-col justify-between space-y-3 ${
                  isWarning ? 'bg-amber-50/40 border-amber-200' : 'bg-white border-brand-border'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isWarning ? 'bg-amber-100 text-amber-800' : 'bg-teal-50 text-teal-700'
                      }`}
                    >
                      {item.metric}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mt-2">{item.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 text-xs">
                  <div className="font-semibold text-slate-800 text-[11px]">Recommended Action:</div>
                  <div className="text-slate-600 text-[11px] mt-0.5">{item.recommendation}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
