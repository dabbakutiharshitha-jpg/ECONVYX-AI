// Team & Permissions (RBAC) Page

import React, { useState } from 'react';
import { UserCheck, Shield, Plus, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

export const TeamPermissionsPage: React.FC = () => {
  const { user, activeWorkspace } = useAuth();
  const { addToast } = useToast();

  const [members, setMembers] = useState([
    { id: 'usr-1', name: 'Vikram Joshi', email: 'demo@econvyx.ai', role: 'Owner', status: 'Active' },
    { id: 'usr-2', name: 'Ananya Sharma', email: 'ananya.s@apexcomponents.in', role: 'Finance Manager', status: 'Active' },
    { id: 'usr-3', name: 'Rohan Deshmukh', email: 'rohan.d@apexcomponents.in', role: 'Accountant', status: 'Active' },
    { id: 'usr-4', name: 'Kavita Patel', email: 'kavita.p@apexcomponents.in', role: 'Viewer', status: 'Invited' },
  ]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Accountant');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setMembers([
      ...members,
      {
        id: `usr-${Date.now()}`,
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        status: 'Invited',
      },
    ]);

    addToast({
      type: 'success',
      title: 'Invitation Sent',
      message: `Invited ${inviteEmail} as ${inviteRole}.`,
    });
    setInviteEmail('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-primary-navy">
            Team & Role-Based Permissions (RBAC)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage authorized staff members, accounting roles, and server-side financial access policies.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-brand-deep-navy hover:bg-brand-midnight text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 text-brand-aqua" />
          <span>Invite Team Member</span>
        </button>
      </div>

      {/* Role Definitions Card */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {[
          { role: 'Owner', desc: 'Full workspace control, billing, security, and member invites.' },
          { role: 'Admin', desc: 'Manage business records, documents, and team permissions.' },
          { role: 'Finance Manager', desc: 'Approve invoices, payments, reconciliation, and bank exports.' },
          { role: 'Accountant', desc: 'Create invoices, bills, upload documents, and match lines.' },
          { role: 'Viewer', desc: 'Strictly read-only visibility into dashboards and reports.' },
        ].map((r) => (
          <div key={r.role} className="p-3 bg-white rounded-lg border border-brand-border text-xs">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-brand-teal" />
              <span>{r.role}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-brand-border shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 font-bold text-xs text-slate-800">
          Active Workspace Members ({activeWorkspace?.name || 'Apex Components'})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-brand-border text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Access Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{m.name}</div>
                    <div className="text-[11px] text-slate-400">{m.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-800 px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                      {m.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500 font-medium">
                    {m.role === 'Owner' || m.role === 'Admin' ? 'Unrestricted Ledger' : 'Role Bound'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-brand-primary-navy">Invite Team Member</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Work Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Workspace Role *</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                >
                  <option value="Admin">Admin</option>
                  <option value="Finance Manager">Finance Manager</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Viewer">Viewer (Read-only)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-brand-deep-navy hover:bg-brand-midnight rounded-lg"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
