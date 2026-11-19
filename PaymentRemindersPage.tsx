// Smart Payment Reminders Page

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Copy,
  Check,
  Clock,
  Sparkles,
  Send,
  AlertTriangle,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Invoice, Reminder } from '../../types/index.js';
import { formatINR, formatDate, copyToClipboard } from '../../lib/utils.js';

export const PaymentRemindersPage: React.FC = () => {
  const { addToast } = useToast();
  const [overdueInvoices, setOverdueInvoices] = useState<Invoice[]>([]);
  const [upcomingInvoices, setUpcomingInvoices] = useState<Invoice[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Draft generator state
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [selectedTone, setSelectedTone] = useState<string>('professional');
  const [activeDraft, setActiveDraft] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchRemindersData = async () => {
    try {
      setIsLoading(true);
      const res = await api.getReminders();
      setOverdueInvoices(res.overdueInvoices || []);
      setUpcomingInvoices(res.upcomingInvoices || []);
      setReminders(res.reminders || []);

      if (res.overdueInvoices && res.overdueInvoices.length > 0 && !selectedInvoiceId) {
        setSelectedInvoiceId(res.overdueInvoices[0].id);
      }
    } catch (err) {
      console.error('Failed to load reminders data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRemindersData();
  }, []);

  const handleGenerateDraft = async () => {
    if (!selectedInvoiceId) return;
    try {
      setIsGenerating(true);
      const res = await api.generateReminderDraft({
        invoiceId: selectedInvoiceId,
        tone: selectedTone,
      });
      setActiveDraft(res.draft);
      addToast({
        type: 'success',
        title: 'Draft Generated',
        message: `Personalized ${selectedTone} reminder prepared.`,
      });
      await fetchRemindersData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Draft Generation Failed', message: err.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      addToast({
        type: 'success',
        title: 'Copied to Clipboard',
        message: 'Reminder draft is ready to paste into Email or WhatsApp.',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentSelectedInvoice = [...overdueInvoices, ...upcomingInvoices].find(
    (i) => i.id === selectedInvoiceId
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-primary-navy">
            Smart Payment Reminders Centre
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate personalized payment notices in 4 professional tones with precise invoice details.
          </p>
        </div>
      </div>

      {/* Main Layout: Selector & Draft Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Target Invoices Selector (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-brand-border shadow-card p-4 space-y-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-600" />
              <span>Overdue Follow-Up Queue ({overdueInvoices.length})</span>
            </h2>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {overdueInvoices.map((inv) => {
                const isSelected = selectedInvoiceId === inv.id;
                return (
                  <div
                    key={inv.id}
                    onClick={() => {
                      setSelectedInvoiceId(inv.id);
                      setActiveDraft(null);
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-brand-teal bg-teal-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{inv.invoiceNumber}</span>
                      <span className="font-bold text-xs text-rose-600">
                        {formatINR(inv.outstandingAmountPaise)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{inv.customer?.name}</div>
                    <div className="text-[10px] text-rose-500 font-semibold mt-1">
                      Due: {formatDate(inv.dueDate)} (OVERDUE)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-brand-border shadow-card p-4 space-y-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-teal" />
              <span>Upcoming Due Invoices ({upcomingInvoices.length})</span>
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {upcomingInvoices.map((inv) => {
                const isSelected = selectedInvoiceId === inv.id;
                return (
                  <div
                    key={inv.id}
                    onClick={() => {
                      setSelectedInvoiceId(inv.id);
                      setActiveDraft(null);
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-brand-teal bg-teal-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{inv.invoiceNumber}</span>
                      <span className="font-bold text-xs text-slate-800">
                        {formatINR(inv.outstandingAmountPaise)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{inv.customer?.name}</div>
                    <div className="text-[10px] text-slate-400 mt-1">Due: {formatDate(inv.dueDate)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Draft Generator & Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-brand-border shadow-card p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-brand-primary-navy">
                  Draft Generator
                  {currentSelectedInvoice && ` for ${currentSelectedInvoice.customer?.name}`}
                </h2>
                <p className="text-[11px] text-slate-400">
                  Target: {currentSelectedInvoice?.invoiceNumber} &bull; Outstanding:{' '}
                  {currentSelectedInvoice && formatINR(currentSelectedInvoice.outstandingAmountPaise)}
                </p>
              </div>

              {/* Tone Selection Tabs */}
              <div className="inline-flex rounded-lg border border-slate-200 p-1 text-xs bg-slate-50">
                {[
                  { id: 'friendly', label: 'Friendly' },
                  { id: 'professional', label: 'Professional' },
                  { id: 'firm', label: 'Firm' },
                  { id: 'final_notice', label: 'Final Notice' },
                ].map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setSelectedTone(tone.id)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      selectedTone === tone.id
                        ? 'bg-brand-deep-navy text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Tone: <strong className="capitalize text-slate-800">{selectedTone.replace('_', ' ')}</strong>
              </span>
              <button
                onClick={handleGenerateDraft}
                disabled={isGenerating || !selectedInvoiceId}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-brand-teal hover:bg-brand-teal/90 rounded-lg shadow-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGenerating ? 'Generating...' : 'Generate Personalized Draft'}</span>
              </button>
            </div>

            {/* Generated Draft Display / Editor */}
            {activeDraft ? (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Subject Line</label>
                  <input
                    type="text"
                    value={activeDraft.subject}
                    onChange={(e) => setActiveDraft({ ...activeDraft, subject: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Message Body</label>
                  <textarea
                    rows={10}
                    value={activeDraft.messageBody}
                    onChange={(e) => setActiveDraft({ ...activeDraft, messageBody: e.target.value })}
                    className="w-full mt-1 p-3 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-teal font-sans leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-400">
                    Never sent automatically. Review and copy to clipboard.
                  </div>
                  <button
                    onClick={() => handleCopy(`${activeDraft.subject}\n\n${activeDraft.messageBody}`)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-deep-navy hover:bg-brand-midnight rounded-lg transition-colors shadow-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-brand-aqua" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                Click "Generate Personalized Draft" above to compose a draft tailored to the customer's delay.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
