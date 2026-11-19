// Bank Statement Reconciliation Page

import React, { useState, useEffect } from 'react';
import {
  Building2,
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.js';
import { BankTransaction } from '../../types/index.js';
import { formatINR, formatDate, getStatusBadgeProps } from '../../lib/utils.js';

export const BankReconciliationPage: React.FC = () => {
  const { addToast } = useToast();
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchReconciliation = async () => {
    try {
      setIsLoading(true);
      const res = await api.getReconciliation();
      setTransactions(res.transactions || []);
      setSuggestions(res.suggestions || []);
      setStats(res.stats);
    } catch (err) {
      console.error('Failed to load bank reconciliation data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliation();
  }, []);

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      const res = await api.uploadStatementCsv(formData);
      addToast({
        type: 'success',
        title: 'CSV Statement Imported',
        message: res.message || 'Transactions imported.',
      });
      await fetchReconciliation();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Upload Failed', message: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmMatch = async (transactionId: string, invoiceId?: string, billId?: string) => {
    try {
      await api.confirmMatch({ transactionId, invoiceId, billId });
      addToast({
        type: 'success',
        title: 'Match Confirmed',
        message: 'Payment allocated atomically to ledger. Financial balances updated.',
      });
      await fetchReconciliation();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Confirmation Failed', message: err.message });
    }
  };

  const handleRejectMatch = async (transactionId: string) => {
    try {
      await api.rejectMatch({ transactionId, reason: 'Dismissed by reviewer' });
      addToast({ type: 'info', title: 'Match Dismissed', message: 'Suggestion removed from queue.' });
      await fetchReconciliation();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Action Failed', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-primary-navy">
            Bank Statement Reconciliation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated deterministic matching between bank statement credits/debits and accounting invoices.
          </p>
        </div>

        {/* Upload Statement CSV Button */}
        <label className="flex items-center gap-2 px-3.5 py-2 bg-brand-deep-navy hover:bg-brand-midnight text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition-colors">
          <UploadCloud className="w-4 h-4 text-brand-aqua" />
          <span>{isUploading ? 'Parsing Statement...' : 'Import Statement CSV'}</span>
          <input
            type="file"
            accept=".csv"
            disabled={isUploading}
            onChange={handleCsvUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-brand-border shadow-card">
          <div className="text-xs text-slate-500 font-medium">Total Transactions</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{stats?.totalCount || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Imported statement lines</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-teal-200 bg-teal-50/20 shadow-card">
          <div className="text-xs text-brand-teal font-semibold">Suggested Matches</div>
          <div className="text-xl font-bold text-brand-teal mt-1">{stats?.suggestedCount || 0}</div>
          <div className="text-[11px] text-teal-600/80 mt-0.5">Awaiting human confirmation</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-card">
          <div className="text-xs text-emerald-700 font-semibold">Confirmed Reconciled</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{stats?.matchedCount || 0}</div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">Allocated to ledger</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-brand-border shadow-card">
          <div className="text-xs text-slate-500 font-medium">Reconciliation Rate</div>
          <div className="text-xl font-bold text-brand-primary-navy mt-1">
            {stats?.reconciliationRatePercent || 0}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Overall matching progress</div>
        </div>
      </div>

      {/* Integrity Philosophy Alert */}
      <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
        <span>
          <strong>Financial Integrity Guard:</strong> AI and heuristic rules only suggest potential matches. Confirmed balance adjustments occur only upon your explicit approval below.
        </span>
      </div>

      {/* Suggested Matches Queue (High Priority) */}
      <div className="bg-white rounded-xl border border-brand-border shadow-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-teal" />
            <h2 className="text-sm font-bold text-brand-primary-navy">
              Suggested High-Confidence Matches Awaiting Confirmation
            </h2>
          </div>
          <span className="text-xs font-semibold text-brand-teal bg-teal-50 px-2 py-0.5 rounded">
            {transactions.filter((t) => t.reconciliationStatus === 'suggested').length} Pending
          </span>
        </div>

        <div className="space-y-3">
          {transactions
            .filter((t) => t.reconciliationStatus === 'suggested')
            .map((txn) => (
              <div
                key={txn.id}
                className="p-4 rounded-xl border border-teal-200 bg-teal-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{formatDate(txn.transactionDate)}</span>
                    <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase rounded bg-teal-100 text-teal-800">
                      {txn.type}
                    </span>
                    <span className="text-xs font-bold text-emerald-600">
                      {formatINR(txn.amountPaise)}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800">{txn.description}</div>
                  <div className="text-[11px] text-slate-600 italic">
                    Match Rationale: {txn.matchReason}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Confidence: <strong>{txn.matchConfidence}%</strong> &bull; Bank Ref: {txn.referenceNumber}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleRejectMatch(txn.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleConfirmMatch(txn.id, txn.matchedInvoiceId, txn.matchedBillId)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-brand-teal hover:bg-brand-teal/90 rounded-lg shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Allocation</span>
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Complete Bank Statement Transactions Table */}
      <div className="bg-white rounded-xl border border-brand-border shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 font-bold text-xs text-slate-800">
          Statement Transaction History
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-brand-border text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description & Reference</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Amount (₹)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Matched Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((txn) => {
                const statusProps = getStatusBadgeProps(txn.reconciliationStatus);
                return (
                  <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                      {formatDate(txn.transactionDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{txn.description}</div>
                      <div className="text-[10px] text-slate-400">Ref: {txn.referenceNumber || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          txn.type === 'credit' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {txn.type}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${
                        txn.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {formatINR(txn.amountPaise)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${statusProps.className}`}>
                        {statusProps.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-600">
                      {txn.matchReason || 'No match found yet.'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
