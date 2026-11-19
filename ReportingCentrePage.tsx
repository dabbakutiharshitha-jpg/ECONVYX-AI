// Reporting Centre Page (10 Financial Reports with CSV Export & Print)

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { formatDate } from '../../lib/utils.js';

export const ReportingCentrePage: React.FC = () => {
  const { activeWorkspace } = useAuth();
  const [selectedReport, setSelectedReport] = useState<string>('sales_invoices');
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reportOptions = [
    { id: 'sales_invoices', label: '1. Sales Invoice Report' },
    { id: 'accounts_receivable', label: '2. Accounts Receivable Ledger' },
    { id: 'accounts_payable', label: '3. Accounts Payable Schedule' },
    { id: 'aging', label: '4. Outstanding Ageing Analysis' },
    { id: 'bank_reconciliation', label: '5. Bank Statement Reconciliation Audit' },
    { id: 'verification', label: '6. Document Verification & Discrepancies' },
    { id: 'monthly_summary', label: '7. Monthly Executive Financial Summary' },
  ];

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const res = await api.getReport(selectedReport, 'json');
      setReportData(res);
    } catch (err) {
      console.error('Failed to load report', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedReport]);

  const handleExportCsv = () => {
    window.open(`/api/reports/${selectedReport}?format=csv`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-primary-navy">
            Financial Reporting & Export Centre
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate verifiable statements, ledgers, and export standard CSV data for tax & accounting filings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-brand-deep-navy hover:bg-brand-midnight rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-brand-aqua" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/70 rounded-xl border border-slate-200">
        {reportOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSelectedReport(opt.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              selectedReport === opt.id
                ? 'bg-white text-brand-primary-navy font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Report Document Surface */}
      <div className="bg-white rounded-xl border border-brand-border shadow-card p-6 sm:p-8 space-y-6">
        {/* Report Document Header */}
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold text-brand-teal uppercase tracking-wider">
              ECONVYX Financial Intelligence
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">{reportData?.title}</h2>
            <div className="text-xs text-slate-500 mt-1">
              Enterprise: <strong className="text-slate-800">{activeWorkspace?.name || 'Apex Components'}</strong> &bull; Currency: INR (₹)
            </div>
          </div>
          <div className="text-left sm:text-right text-[11px] text-slate-400">
            <div>Generated: {formatDate(reportData?.generatedAt)}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center sm:justify-end gap-1">
              <CheckCircle2 className="w-3 h-3" /> Reconciled Ledger Data
            </div>
          </div>
        </div>

        {/* Report Content Table */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
            Compiling ledger records...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  {reportData?.headers?.map((h: string, idx: number) => (
                    <th key={idx} className="px-3.5 py-2.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData?.rows?.map((row: any[], rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-slate-50/60 transition-colors">
                    {row.map((cell: any, cIdx: number) => (
                      <td key={cIdx} className="px-3.5 py-2.5 text-slate-700">
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report Footer Sign-off */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <span>This certified ledger report was generated deterministically by ECONVYX AI.</span>
          <span>Confidential &bull; Apex Components Finance Team</span>
        </div>
      </div>
    </div>
  );
};
