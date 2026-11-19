// Suppliers Management Page

import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Building2, Phone, Mail, FileText } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Supplier } from '../../types/index.js';
import { formatINR } from '../../lib/utils.js';

export const SuppliersPage: React.FC = () => {
  const { addToast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    gstin: '',
    address: '',
    paymentTermsDays: 30,
    notes: '',
  });

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const res = await api.getSuppliers();
      setSuppliers(res.suppliers || []);
    } catch (err) {
      console.error('Failed to load suppliers', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSupplier(form);
      addToast({ type: 'success', title: 'Supplier Saved', message: `${form.name} profile created.` });
      setIsAddModalOpen(false);
      await fetchSuppliers();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.gstin?.toLowerCase().includes(search.toLowerCase()) ||
      s.contactPerson?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-primary-navy">
            Supplier & Vendor Network
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Vendor profiles, procurement history, agreed credit terms, and payable balances.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-brand-deep-navy hover:bg-brand-midnight text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 text-brand-aqua" />
          <span>Add Supplier Profile</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by vendor name, GSTIN..."
          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:border-brand-teal outline-none"
        />
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-xl border border-brand-border shadow-card p-5 space-y-4 hover:shadow-card-hover transition-all"
          >
            <div>
              <h3 className="font-bold text-sm text-slate-900">{s.name}</h3>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Contact: {s.contactPerson || 'Procurement Team'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 border border-slate-100">
              <div className="flex items-center justify-between text-slate-600">
                <span>GSTIN:</span>
                <span className="font-semibold text-slate-800">{s.gstin || 'Unregistered'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Payment Terms:</span>
                <span className="font-semibold text-slate-800">{s.paymentTermsDays} Days</span>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Total Billed</div>
                <div className="font-bold text-slate-900">
                  {s.financialSummary?.totalBilledFormatted || '₹0.00'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-purple-600 font-medium">Outstanding Payable</div>
                <div className="font-bold text-purple-700">
                  {s.financialSummary?.outstandingFormatted || '₹0.00'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-brand-primary-navy">Add Supplier Profile</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateSupplier} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Forgings Pvt Ltd"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">GSTIN</label>
                  <input
                    type="text"
                    placeholder="27AABC..."
                    value={form.gstin}
                    onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Rajesh Verma"
                    value={form.contactPerson}
                    onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Payment Terms (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.paymentTermsDays}
                    onChange={(e) => setForm({ ...form, paymentTermsDays: parseInt(e.target.value) || 30 })}
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
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
