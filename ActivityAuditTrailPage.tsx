// Activity & Audit Trail Page

import React, { useState, useEffect } from 'react';
import { History, Search, Filter, ShieldCheck, User } from 'lucide-react';
import { api } from '../../lib/api.js';
import { AuditLog } from '../../types/index.js';
import { formatDate } from '../../lib/utils.js';

export const ActivityAuditTrailPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await api.getAuditLogs({ entityType: entityFilter, search });
      setLogs(res.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-primary-navy">
            Activity & Immutable Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete cryptographic audit log of document extractions, invoice edits, payment allocations, and reconciliation approvals.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
              placeholder="Search actions or record details..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:border-brand-teal outline-none"
            />
          </div>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 outline-none focus:border-brand-teal"
          >
            <option value="all">All Entity Types</option>
            <option value="document">Documents</option>
            <option value="invoice">Invoices</option>
            <option value="bill">Bills</option>
            <option value="payment">Payments</option>
            <option value="verification_case">Verification Cases</option>
            <option value="bank_transaction">Bank Reconciliation</option>
            <option value="customer">Customers</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-800">{logs.length}</span> recorded events
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl border border-brand-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-brand-border text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity Type</th>
                <th className="px-4 py-3">Details / Audit Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No matching audit log events found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.userEmail}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-bold text-brand-teal px-1.5 py-0.5 bg-teal-50 rounded border border-teal-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 capitalize">
                      {log.entityType.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-slate-700 leading-relaxed max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
