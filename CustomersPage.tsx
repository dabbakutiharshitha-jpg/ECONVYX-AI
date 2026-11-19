// Customer Intelligence Page

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Phone,
  Mail,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Customer } from '../../types/index.js';
import { formatINR, getStatusBadgeProps } from '../../lib/utils.js';

export const CustomersPage: React.FC = () => {
  const { addToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add customer modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    gstin: '',
    paymentTermsDays: 30,
    creditLimitRupees: 500000,
    notes: '',
  });

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const res = await api.getCustomers();
      setCustomers(res.customers || []);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCustomer(newCustomerForm);
      addToast({ type: 'success', title: 'Customer Onboarded', message: `${newCustomerForm.name} profile created.` });
      setIsAddModalOpen(false);
      await fetchCustomers();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.gstin?.toLowerCase().includes(search.toLowerCase()) ||
      c.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-primary-navy">
            Customer Risk & Credit Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verified counterparty profiles, behavioral classification, on-time collection rates, and credit exposure.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-brand-deep-navy hover:bg-brand-midnight text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 text-brand-aqua" />
          <span>Add Customer Profile</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, GSTIN..."
          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:border-brand-teal outline-none"
        />
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((cust) => {
          const profile = cust.profile;
          const statusProps = getStatusBadgeProps(profile?.behavior || 'insufficient_history');

          return (
            <div
              key={cust.id}
              className="bg-white rounded-xl border border-brand-border shadow-card p-5 space-y-4 hover:shadow-card-hover transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{cust.name}</h3>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    GSTIN: {cust.gstin || 'Unregistered'}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${statusProps.className}`}>
                  {statusProps.label}
                </span>
              </div>

              {/* Behavioral Rationale Note */}
              <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-600 border border-slate-100 italic">
                "{profile?.rationale || 'Insufficient confirmed history for statistical classification.'}"
              </div>

              {/* Financial Metrics Strip */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Total Invoiced</div>
                  <div className="font-bold text-slate-900">{profile?.totalInvoicedFormatted || '₹0.00'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Collections Received</div>
                  <div className="font-bold text-emerald-600">{profile?.totalReceivedFormatted || '₹0.00'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Current Outstanding</div>
                  <div className="font-bold text-amber-600">{profile?.currentOutstandingFormatted || '₹0.00'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-rose-500 font-medium">Overdue Exposure</div>
                  <div className="font-bold text-rose-600">{profile?.overdueFormatted || '₹0.00'}</div>
                </div>
              </div>

              {/* Payment Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Collection Settlement:</span>
                  <span className="font-bold text-brand-primary-navy">
                    {profile?.paymentCompletionPercentage || 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-brand-teal h-full rounded-full"
                    style={{ width: `${profile?.paymentCompletionPercentage || 0}%` }}
                  />
                </div>
              </div>

              {/* Footer Meta */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Terms: {cust.paymentTermsDays} Days</span>
                <span>Credit Limit: {formatINR(cust.creditLimitPaise)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-brand-primary-navy">Add Customer Profile</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddCustomer} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700">Customer Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mahavir Steels Ltd"
                    value={newCustomerForm.name}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="27AABC..."
                    value={newCustomerForm.gstin}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, gstin: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    placeholder="accounts@mahavirsteels.in"
                    value={newCustomerForm.email}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98220..."
                    value={newCustomerForm.phone}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700">Payment Terms (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={newCustomerForm.paymentTermsDays}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, paymentTermsDays: parseInt(e.target.value) || 30 })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Credit Limit (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newCustomerForm.creditLimitRupees}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, creditLimitRupees: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-brand-deep-navy hover:bg-brand-midnight rounded-lg"
                >
                  Save Customer Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
