// Payables (Accounts Payable) Management Page

import React, { useState, useEffect } from 'react';
import {
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Bill, Supplier } from '../../types/index.js';
import { formatINR, formatDate, getStatusBadgeProps, paiseToRupees } from '../../lib/utils.js';

export const PayablesPage: React.FC = () => {
  const { addToast } = useToast();
  const [bills, setBills] = useState<Bill[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [addBillForm, setAddBillForm] = useState({
    supplierId: '',
    billNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    paymentTermsDays: 30,
    amountRupees: 0,
    poReference: '',
    notes: '',
  });

  const [paymentBill, setPaymentBill] = useState<Bill | null>(null);
  const [paymentAmountRupees, setPaymentAmountRupees] = useState(0);
  const [paymentReference, setPaymentReference] = useState('');

  const fetchPayables = async () => {
    try {
      setIsLoading(true);
      const [billsRes, suppRes] = await Promise.all([api.getBills(), api.getSuppliers()]);
      setBills(billsRes.bills || []);
      setSummary(billsRes.summary);
      setSuppliers(suppRes.suppliers || []);
    } catch (err) {
      console.error('Failed to load payables', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayables();
  }, []);

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBill(addBillForm);
      addToast({ type: 'success', title: 'Bill Recorded', message: `Bill #${addBillForm.billNumber} added to payables.` });
      setIsAddBillOpen(false);
      await fetchPayables();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Recording Failed', message: err.message });
    }
  };

  const handleApproveBill = async (billId: string) => {
    try {
      await api.updateBillStatus(billId, { status: 'approved' });
      addToast({ type: 'success', title: 'Bill Approved', message: 'Bill approved for upcoming payment schedule.' });
      await fetchPayables();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Action Failed', message: err.message });
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentBill) return;
    try {
      await api.recordBillPayment(paymentBill.id, {
        amountRupees: paymentAmountRupees,
        paymentMode: 'bank_transfer',
        referenceNumber: paymentReference,
      });
      addToast({
        type: 'success',
        title: 'Payment Recorded',
        message: `Settled ${formatINR(paymentAmountRupees * 100)} to supplier ${paymentBill.supplier?.name}.`,
      });
      setPaymentBill(null);
      await fetchPayables();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Payment Failed', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-primary-navy">
            Accounts Payable & Procurement Bills
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage vendor liabilities, payment approvals, due dates, and outgoing cash schedules.
          </p>
        </div>

        <button
          onClick={() => setIsAddBillOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-brand-deep-navy hover:bg-brand-midnight text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 text-brand-aqua" />
          <span>Record Vendor Bill</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-brand-border shadow-card">
          <div className="text-xs text-slate-500 font-medium">Total Payables Liability</div>
          <div className="text-xl font-extrabold text-brand-primary-navy mt-1">
            {summary?.totalPayables?.formatted || '₹2,30,000.00'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Approved & pending supplier bills</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-purple-200 bg-purple-50/20 shadow-card">
          <div className="text-xs text-purple-700 font-semibold">Due This Month</div>
          <div className="text-xl font-extrabold text-purple-700 mt-1">
            {summary?.dueThisMonth?.formatted || '₹2,30,000.00'}
          </div>
          <div className="text-[11px] text-purple-600/80 mt-0.5">Obligations within 30 days</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-amber-200 bg-amber-50/20 shadow-card">
          <div className="text-xs text-amber-700 font-semibold">Due This Week</div>
          <div className="text-xl font-extrabold text-amber-700 mt-1">
            {summary?.dueThisWeek?.formatted || '₹0.00'}
          </div>
          <div className="text-[11px] text-amber-600/80 mt-0.5">Immediate cash outflow priority</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-rose-200 bg-rose-50/20 shadow-card">
          <div className="text-xs text-rose-700 font-semibold">Overdue Payables</div>
          <div className="text-xl font-extrabold text-rose-600 mt-1">
            {summary?.overduePayables?.formatted || '₹0.00'}
          </div>
          <div className="text-[11px] text-rose-600/80 mt-0.5">Past agreed vendor credit terms</div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-xl border border-brand-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-brand-border text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Bill #</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Bill Date</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3 text-right">Total (₹)</th>
                <th className="px-4 py-3 text-right">Outstanding (₹)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bills.map((bill) => {
                const statusProps = getStatusBadgeProps(bill.status);
                return (
                  <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {bill.billNumber}
                      {bill.poReference && (
                        <div className="text-[10px] text-slate-400 font-normal">PO: {bill.poReference}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {bill.supplier?.name || 'Supplier'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(bill.billDate)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(bill.dueDate)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatINR(bill.totalAmountPaise)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-purple-700">
                      {formatINR(bill.outstandingAmountPaise)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${statusProps.className}`}>
                        {statusProps.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {bill.status === 'pending_review' && (
                        <button
                          onClick={() => handleApproveBill(bill.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {bill.outstandingAmountPaise > 0 && (
                        <button
                          onClick={() => {
                            setPaymentBill(bill);
                            setPaymentAmountRupees(paiseToRupees(bill.outstandingAmountPaise));
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-brand-deep-navy hover:bg-brand-midnight rounded transition-colors"
                        >
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Bill Modal */}
      {isAddBillOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-brand-primary-navy">Record Supplier Bill</h3>
              <button onClick={() => setIsAddBillOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateBill} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700">Supplier *</label>
                  <select
                    required
                    value={addBillForm.supplierId}
                    onChange={(e) => setAddBillForm({ ...addBillForm, supplierId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Bill Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BILL-403"
                    value={addBillForm.billNumber}
                    onChange={(e) => setAddBillForm({ ...addBillForm, billNumber: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700">Bill Date *</label>
                  <input
                    type="date"
                    required
                    value={addBillForm.billDate}
                    onChange={(e) => setAddBillForm({ ...addBillForm, billDate: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={addBillForm.dueDate}
                    onChange={(e) => setAddBillForm({ ...addBillForm, dueDate: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Bill Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 75000"
                  value={addBillForm.amountRupees}
                  onChange={(e) => setAddBillForm({ ...addBillForm, amountRupees: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg font-bold text-base text-brand-primary-navy outline-none focus:border-brand-teal"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddBillOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-brand-deep-navy hover:bg-brand-midnight rounded-lg"
                >
                  Record Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-brand-primary-navy">Record Supplier Remittance</h3>
              <button onClick={() => setPaymentBill(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 flex justify-between items-center">
                <span className="text-slate-700">Outstanding Bill:</span>
                <span className="font-bold text-purple-700 text-sm">
                  {formatINR(paymentBill.outstandingAmountPaise)}
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Settlement Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={paiseToRupees(paymentBill.outstandingAmountPaise)}
                  value={paymentAmountRupees}
                  onChange={(e) => setPaymentAmountRupees(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg font-bold text-base text-brand-primary-navy outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Bank UTR / Transaction Reference</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC9901827"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentBill(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-brand-deep-navy hover:bg-brand-midnight rounded-lg"
                >
                  Confirm Remittance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
