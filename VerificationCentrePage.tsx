// Verification Centre Page (3-Way / 4-Way Matching)

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.js';
import { VerificationCase } from '../../types/index.js';
import { formatINR, formatDate, getStatusBadgeProps } from '../../lib/utils.js';

export const VerificationCentrePage: React.FC = () => {
  const { addToast } = useToast();
  const [cases, setCases] = useState<VerificationCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<VerificationCase | null>(null);

  // Resolution modal state
  const [resolutionAction, setResolutionAction] = useState<string>('accept_with_explanation');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCases = async () => {
    try {
      setIsLoading(true);
      const res = await api.getVerificationCases();
      setCases(res.cases || []);
      if (res.cases && res.cases.length > 0 && !selectedCase) {
        setSelectedCase(res.cases[0]);
      }
    } catch (err) {
      console.error('Failed to load verification cases', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleResolveCase = async () => {
    if (!selectedCase) return;
    try {
      setIsSubmitting(true);
      await api.resolveVerificationCase(selectedCase.id, {
        action: resolutionAction,
        comments,
      });

      addToast({
        type: 'success',
        title: 'Decision Recorded',
        message: `Action "${resolutionAction.replace(/_/g, ' ')}" logged with full audit history.`,
      });

      setComments('');
      await fetchCases();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Resolution Failed', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-primary-navy">
            Document Verification Centre
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated 3-Way Cross-Verification: Purchase Order ↔ Goods Receipt Note (GRN) ↔ Tax Invoice.
          </p>
        </div>
      </div>

      {/* Discrepancy Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-brand-border shadow-card">
          <div className="text-xs font-medium text-slate-500">Total Verification Cases</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{cases.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Scanned transactions</div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-amber-200 bg-amber-50/20 shadow-card">
          <div className="text-xs font-semibold text-amber-700">Flagged Discrepancies</div>
          <div className="text-xl font-bold text-amber-800 mt-1">
            {cases.filter((c) => c.status === 'mismatch' || c.status === 'needs_review').length}
          </div>
          <div className="text-[11px] text-amber-600/80 mt-0.5">Requires human intervention</div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-rose-200 bg-rose-50/20 shadow-card">
          <div className="text-xs font-semibold text-rose-700">Total Monetary Exposure</div>
          <div className="text-xl font-bold text-rose-600 mt-1">
            {formatINR(cases.reduce((sum, c) => sum + c.monetaryImpactPaise, 0))}
          </div>
          <div className="text-[11px] text-rose-600/80 mt-0.5">Calculated in deterministic integer paise</div>
        </div>
      </div>

      {/* Main Grid: Cases List + Detail Side-by-Side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Cases List (4 columns) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-brand-border shadow-card p-4 space-y-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Verification Queue
          </h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {cases.map((c) => {
              const statusProps = getStatusBadgeProps(c.status);
              const isSelected = selectedCase?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-brand-teal bg-teal-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{c.caseNumber}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${statusProps.className}`}>
                      {statusProps.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                    {c.summary}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px]">
                    <span className="text-slate-400">Exposure:</span>
                    <span className="font-bold text-rose-600">{formatINR(c.monetaryImpactPaise)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Side-by-Side Document Comparison & Resolution Engine (8 columns) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedCase ? (
            <div className="bg-white rounded-xl border border-brand-border shadow-card p-6 space-y-6">
              {/* Case Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-brand-primary-navy">
                      Case {selectedCase.caseNumber}
                    </h2>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        getStatusBadgeProps(selectedCase.status).className
                      }`}
                    >
                      {selectedCase.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedCase.summary}</p>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Total Quantified Discrepancy</div>
                  <div className="text-xl font-extrabold text-rose-600">
                    {formatINR(selectedCase.monetaryImpactPaise)}
                  </div>
                </div>
              </div>

              {/* Side-by-Side 3-Way Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Purchase Order */}
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className="font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Purchase Order (PO)</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Ref: PO-2026-001</div>
                  <div className="pt-2 border-t border-slate-200">
                    <div className="font-semibold text-slate-800">100 units authorized</div>
                    <div className="text-slate-500">@ ₹5,000/unit</div>
                    <div className="font-bold text-slate-900 mt-1">Total: ₹5,00,000.00</div>
                  </div>
                </div>

                {/* 2. Goods Receipt Note (GRN) */}
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className="font-bold text-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Physical Receipt (GRN)</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Ref: GRN-2026-001</div>
                  <div className="pt-2 border-t border-slate-200">
                    <div className="font-semibold text-emerald-700">100 units received</div>
                    <div className="text-slate-500">0 damaged / rejected</div>
                    <div className="font-bold text-emerald-800 mt-1">Confirmed at Gate</div>
                  </div>
                </div>

                {/* 3. Vendor Invoice */}
                <div className="p-3.5 bg-rose-50/50 rounded-lg border border-rose-200 text-xs space-y-1.5">
                  <div className="font-bold text-rose-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Billed Tax Invoice</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Ref: INV-101</div>
                  <div className="pt-2 border-t border-rose-200">
                    <div className="font-semibold text-rose-700">120 units billed (+20 excess)</div>
                    <div className="text-slate-500">@ ₹5,000/unit</div>
                    <div className="font-bold text-rose-800 mt-1">Total: ₹6,00,000.00</div>
                  </div>
                </div>
              </div>

              {/* Line-by-Line Discrepancy Findings Table */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 mb-2">
                  Deterministic Discrepancy Line Findings
                </h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Field / Item</th>
                        <th className="p-2.5">Expected (PO/GRN)</th>
                        <th className="p-2.5">Actual (Invoice)</th>
                        <th className="p-2.5">Variance</th>
                        <th className="p-2.5 text-right">Exposure (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedCase.findings.map((f) => (
                        <tr key={f.id} className="bg-rose-50/30">
                          <td className="p-2.5 font-semibold text-slate-800">{f.fieldName}</td>
                          <td className="p-2.5 text-slate-600">{f.expectedValue}</td>
                          <td className="p-2.5 font-bold text-rose-600">{f.actualValue}</td>
                          <td className="p-2.5 text-rose-700 font-medium">{f.differenceValue}</td>
                          <td className="p-2.5 text-right font-extrabold text-rose-700">
                            {formatINR(f.monetaryDifferencePaise)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Reviewer Audit Comments */}
              {selectedCase.reviewerComments && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700">Reviewer History / Audit Note: </span>
                  <span className="text-slate-600">{selectedCase.reviewerComments}</span>
                </div>
              )}

              {/* Human Decision & Resolution Action Panel */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-teal" />
                  <span className="text-xs font-bold text-brand-primary-navy">
                    Human Reviewer Resolution Workflow
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700">Resolution Decision</label>
                    <select
                      value={resolutionAction}
                      onChange={(e) => setResolutionAction(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-brand-teal font-medium"
                    >
                      <option value="accept_with_explanation">Accept with Explanation (Approved)</option>
                      <option value="request_correction">Request Correction / Credit Note</option>
                      <option value="mark_disputed">Mark as Disputed (Hold Invoice)</option>
                      <option value="reject">Reject Invoice</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Auditable Reason / Comments</label>
                    <input
                      type="text"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Enter justification for audit log..."
                      className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleResolveCase}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-bold text-white bg-brand-deep-navy hover:bg-brand-midnight rounded-lg transition-colors shadow-xs"
                  >
                    {isSubmitting ? 'Recording Decision...' : 'Apply Decision & Update Audit Trail'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 bg-white rounded-xl border border-brand-border text-center text-slate-400 text-xs">
              Select a verification case to inspect the 3-way match.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
