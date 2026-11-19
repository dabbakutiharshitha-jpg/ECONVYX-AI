// Receivables (Accounts Receivable) Management Page

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  ArrowDownLeft,
  Download,
  Eye,
  CreditCard,
  AlertCircle,
  FileText,
  Clock,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Invoice, Customer } from '../../types/index.js';
import { formatINR, formatDate, getStatusBadgeProps, paiseToRupees } from '../../lib/utils.js';
import { useNavigate } from 'react-router-dom';

export const ReceivablesPage: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');

  // Create Invoice Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    customerId: '',
    invoiceNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    paymentTermsDays: 30,
    poReference: '',
    description: '',
    quantity: 1,
    unitPriceRupees: 0,
    taxRatePercent: 18,
  });

  // Record Payment Modal State
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [paymentAmountRupees, setPaymentAmountRupees] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const [invRes, custRes] = await Promise.all([
        api.getInvoices({ status: statusFilter, customerId: customerFilter, search }),
        api.getCustomers(),
      ]);
      setInvoices(invRes.invoices || []);
      setCustomers(custRes.customers || []);
    } catch (err) {
      console.error('Failed to load receivables', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, customerFilter]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createInvoice({
        customerId: createForm.customerId,
        invoiceNumber: createForm.invoiceNumber,
        issueDate: createForm.issueDate,
        dueDate: createForm.dueDate,
        paymentTermsDays: createForm.paymentTermsDays,
        poReference: createForm.poReference,
        items: [
          {
            description: createForm.description || 'Precision Components',
            quantity: createForm.quantity,
            unitPriceRupees: createForm.unitPriceRupees,
            taxRatePercent: createForm.taxRatePercent,
          },
        ],
      });
      addToast({ type: 'success', title: 'Invoice Created', message: `Invoice #${createForm.invoiceNumber} recorded.` });
      setIsCreateModalOpen(false);
      await fetchInvoices();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Creation Failed', message: err.message });
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;
    try {
      await api.recordInvoicePayment(paymentModalInvoice.id, {
        amountRupees: paymentAmountRupees,
        paymentMode,
        referenceNumber: paymentReference,
      });
      addToast({
        type: 'success',
        title: 'Payment Allocated',
        message: `Allocated ₹${paymentAmountRupees.toLocaleString('en-IN')} to Invoice #${paymentModalInvoice.invoiceNumber}.`,
      });
      setPaymentModalInvoice(null);
      await fetchInvoices();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Payment Allocation Failed', message: err.message });
    }
  };

  const totalInvoicedPaise = invoices.reduce((sum, inv) => sum + inv.totalAmountPaise, 0);
  const totalReceivedPaise = invoices.reduce((sum, inv) => sum + inv.receivedAmountPaise, 0);
  const totalOutstandingPaise = invoices.reduce((sum, inv) => sum + inv.outstandingAmountPaise, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-primary-navy">
            Accounts Receivable Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track confirmed sales invoices, customer allocations, aging, and credit settlements.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-brand-deep-navy hover:bg-brand-midnight text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 text-brand-aqua" />
          <span>Create Sales Invoice</span>
        </button>
      </div>

      {/* Summary KPI Strip (Exact Section 24 figures: ₹8L, ₹2L, ₹6L) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-brand-border shadow-card">
          <div className="text-xs text-slate-500 font-medium">Total Billed Receivables</div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            {formatINR(totalInvoicedPaise)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">All issued sales invoices</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-card">
          <div className="text-xs text-emerald-700 font-semibold">Total Collections Received</div>
          <div className="text-xl font-extrabold text-emerald-600 mt-1">
            {formatINR(totalReceivedPaise)}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">Liquid cash confirmed into bank</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-amber-200 bg-amber-50/20 shadow-card">
          <div className="text-xs text-amber-700 font-semibold">Total Current Outstanding</div>
          <div className="text-xl font-extrabold text-amber-600 mt-1">
            {formatINR(totalOutstandingPaise)}
          </div>
          <div className="text-[11px] text-amber-600/80 mt-0.5">Unsettled credit risk</div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchInvoices()}
              placeholder="Search invoice # or customer..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:border-brand-teal outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 outline-none focus:border-brand-teal"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="disputed">Disputed</option>
          </select>

          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 outline-none focus:border-brand-teal max-w-[200px] truncate"
          >
            <option value="all">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => window.open('/api/reports/sales_invoices?format=csv', '_blank')}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-brand-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-brand-border text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Issue Date</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3 text-right">Invoice Amount</th>
                <th className="px-4 py-3 text-right">Received</th>
                <th className="px-4 py-3 text-right">Outstanding</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No matching invoices found in this ledger view.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const statusProps = getStatusBadgeProps(inv.status);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {inv.invoiceNumber}
                        {inv.poReference && (
                          <div className="text-[10px] text-slate-400 font-normal">PO: {inv.poReference}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {inv.customer?.name || 'Customer'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(inv.issueDate)}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(inv.dueDate)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatINR(inv.totalAmountPaise)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-600">
                        {formatINR(inv.receivedAmountPaise)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-amber-600">
                        {formatINR(inv.outstandingAmountPaise)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${statusProps.className}`}>
                          {statusProps.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {inv.outstandingAmountPaise > 0 && (
                          <button
                            onClick={() => {
                              setPaymentModalInvoice(inv);
                              setPaymentAmountRupees(paiseToRupees(inv.outstandingAmountPaise));
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-brand-teal hover:bg-brand-teal/90 rounded transition-colors"
                          >
                            Record Payment
                          </button>
                        )}
                        <button
                          onClick={() => navigate('/reminders')}
                          className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 rounded"
                          title="Draft Reminder"
                        >
                          Reminder
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-brand-primary-navy">Create Sales Invoice</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700">Customer *</label>
                  <select
                    required
                    value={createForm.customerId}
                    onChange={(e) => setCreateForm({ ...createForm, customerId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  >
                    <option value="">Select customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Invoice Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-104"
                    value={createForm.invoiceNumber}
                    onChange={(e) => setCreateForm({ ...createForm, invoiceNumber: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700">Issue Date *</label>
                  <input
                    type="date"
                    required
                    value={createForm.issueDate}
                    onChange={(e) => setCreateForm({ ...createForm, issueDate: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div className="col-span-3">
                  <label className="font-semibold text-slate-700">Item Description</label>
                  <input
                    type="text"
                    placeholder="Precision CNC Fasteners"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={createForm.quantity}
                    onChange={(e) => setCreateForm({ ...createForm, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Unit Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="5000"
                    value={createForm.unitPriceRupees}
                    onChange={(e) => setCreateForm({ ...createForm, unitPriceRupees: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">GST %</label>
                  <select
                    value={createForm.taxRatePercent}
                    onChange={(e) => setCreateForm({ ...createForm, taxRatePercent: parseInt(e.target.value) || 18 })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between font-bold">
                <span>Calculated Total with GST:</span>
                <span className="text-sm text-brand-teal">
                  ₹{(createForm.quantity * createForm.unitPriceRupees * (1 + createForm.taxRatePercent / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-brand-deep-navy hover:bg-brand-midnight rounded-lg"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-brand-primary-navy">Record Payment Allocation</h3>
                <p className="text-[11px] text-slate-500">Invoice #{paymentModalInvoice.invoiceNumber}</p>
              </div>
              <button onClick={() => setPaymentModalInvoice(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-teal-50 rounded-lg border border-teal-200 flex justify-between items-center">
                <span className="text-slate-700">Current Outstanding:</span>
                <span className="font-bold text-brand-teal text-sm">
                  {formatINR(paymentModalInvoice.outstandingAmountPaise)}
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Settlement Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={paiseToRupees(paymentModalInvoice.outstandingAmountPaise)}
                  value={paymentAmountRupees}
                  onChange={(e) => setPaymentAmountRupees(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg font-bold text-base text-brand-primary-navy outline-none focus:border-brand-teal"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Over-allocation is strictly prohibited by deterministic ledger constraints.
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                >
                  <option value="bank_transfer">NEFT / RTGS Bank Transfer</option>
                  <option value="upi">UPI Business</option>
                  <option value="cheque">Cheque Clearing</option>
                  <option value="imps">IMPS Immediate</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Bank Reference / UTR Number</label>
                <input
                  type="text"
                  placeholder="e.g. AXISN928371004"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-brand-teal hover:bg-brand-teal/90 rounded-lg shadow-xs"
                >
                  Confirm Payment Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
