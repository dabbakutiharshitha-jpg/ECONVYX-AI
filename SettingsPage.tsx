// Settings & Integrations Page

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Sliders,
  Sparkles,
  Database,
  Lock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

export const SettingsPage: React.FC = () => {
  const { activeWorkspace, reloadAuth } = useAuth();
  const { addToast } = useToast();

  const [settingsData, setSettingsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await api.getSettings();
      setSettingsData(res);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleResetDemoData = async () => {
    try {
      setIsResetting(true);
      await api.resetDemoWorkspace();
      addToast({
        type: 'success',
        title: 'Demo Workspace Reset',
        message: 'Apex Components sample records have been restored to their initial verified baseline.',
      });
      setShowResetConfirm(false);
      await reloadAuth();
      window.location.reload();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Reset Failed', message: err.message });
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading || !settingsData) {
    return <div className="p-8 text-center text-xs text-slate-500 animate-pulse">Loading settings...</div>;
  }

  const { integrations, workspace } = settingsData;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-primary-navy">
            Platform Settings & Integrations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise profile, currency defaults, server integrations status, and demonstration data controls.
          </p>
        </div>
      </div>

      {/* 1. Business Profile Section */}
      <div className="bg-white rounded-xl border border-brand-border shadow-card p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Building2 className="w-4 h-4 text-brand-teal" />
          <h2 className="text-sm font-bold text-slate-900">Registered Business Workspace</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-500">Legal Business Name</label>
            <div className="font-bold text-slate-900 text-sm mt-0.5">{workspace?.name || 'Apex Components'}</div>
          </div>
          <div>
            <label className="text-slate-500">Industry & Sector</label>
            <div className="font-semibold text-slate-800 mt-0.5">{workspace?.industry || 'Precision Automotive Engineering'}</div>
          </div>
          <div>
            <label className="text-slate-500">GSTIN Identification</label>
            <div className="font-mono font-bold text-slate-800 mt-0.5">{workspace?.gstin || '27AAACA9922K1ZK'}</div>
          </div>
          <div>
            <label className="text-slate-500">Permanent Account Number (PAN)</label>
            <div className="font-mono font-bold text-slate-800 mt-0.5">{workspace?.pan || 'AAACA9922K'}</div>
          </div>
          <div className="sm:col-span-2">
            <label className="text-slate-500">Registered Business Address</label>
            <div className="text-slate-700 mt-0.5">
              {workspace?.address || 'Plot 42, Chakan Industrial Area, Phase II'}, {workspace?.city || 'Pune'}, {workspace?.state || 'Maharashtra'} - {workspace?.pinCode || '410501'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Financial Defaults & Regional Preferences */}
      <div className="bg-white rounded-xl border border-brand-border shadow-card p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sliders className="w-4 h-4 text-brand-teal" />
          <h2 className="text-sm font-bold text-slate-900">Regional Accounting Standards</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Base Currency</span>
            <span className="font-bold text-slate-900 text-sm">INR (₹) Indian Rupee</span>
            <span className="text-[10px] text-slate-500 block mt-1">Arithmetic in integer paise</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Standard Timezone</span>
            <span className="font-bold text-slate-900 text-sm">Asia/Kolkata (IST)</span>
            <span className="text-[10px] text-slate-500 block mt-1">UTC +05:30</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Date Presentation</span>
            <span className="font-bold text-slate-900 text-sm">DD MMM YYYY</span>
            <span className="text-[10px] text-slate-500 block mt-1">e.g. 15 Feb 2026</span>
          </div>
        </div>
      </div>

      {/* 3. Integrations Status */}
      <div className="bg-white rounded-xl border border-brand-border shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-teal" />
            <h2 className="text-sm font-bold text-slate-900">Backend System Integrations</h2>
          </div>
          <span className="text-[11px] text-slate-400">All services run strictly server-side</span>
        </div>

        <div className="space-y-3">
          {/* Gemini AI Status */}
          <div className="p-4 rounded-xl border border-slate-200 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-900">{integrations?.geminiAi?.name}</span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                    integrations?.geminiAi?.status === 'connected'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {integrations?.geminiAi?.status === 'connected' ? 'LIVE CONNECTED' : 'INTELLIGENT FALLBACK ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-600">{integrations?.geminiAi?.description}</p>
              <div className="text-[10px] text-slate-400">
                To connect live Google AI Studio API: Set <code>GEMINI_API_KEY</code> in your <code>.env</code> file.
              </div>
            </div>
          </div>

          {/* Database Engine Status */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-900">{integrations?.database?.name}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200 uppercase">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-600">{integrations?.database?.description}</p>
            </div>
          </div>

          {/* Vault Storage Status */}
          <div className="p-4 rounded-xl border border-slate-200 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-900">{integrations?.storage?.name}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200 uppercase">
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-600">{integrations?.storage?.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Demo Data Controls */}
      <div className="bg-white rounded-xl border border-amber-200 shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-amber-100 pb-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">Demonstration Workspace Controls</h2>
          </div>
          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
            Apex Components
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          The Apex Components workspace contains verified sample records from the Master Build prompt: INV-101 (₹5L unpaid), INV-102 (₹2L with ₹1L paid), INV-103 (₹1L settled), the 100 vs 120 unit PO mismatch (VC-2026-101), and the suggested bank statement match. You can reset these records back to default anytime.
        </p>

        <div className="pt-2">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors border border-amber-300 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Workspace Data</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900">Confirm Demonstration Reset</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to reset the Apex Components demonstration workspace? This will restore all invoices, POs, bills, and bank transactions to their verified initial values.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleResetDemoData}
                disabled={isResetting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                {isResetting ? 'Resetting...' : 'Yes, Reset Demo Workspace'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
