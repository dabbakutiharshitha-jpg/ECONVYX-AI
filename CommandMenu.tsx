// Global Command Palette & Fast Navigation (Ctrl + K)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  FileText,
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Building2,
  TrendingUp,
  Sparkles,
  FileSpreadsheet,
  X,
} from 'lucide-react';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandMenu: React.FC<CommandMenuProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { title: 'Overview Dashboard', path: '/', icon: LayoutDashboard, category: 'Navigation' },
    { title: 'Upload & Process Document', path: '/documents', icon: FileText, category: 'Actions' },
    { title: 'Verification Centre (PO Mismatches)', path: '/verification', icon: ShieldCheck, category: 'Verification' },
    { title: 'Receivables & Invoices (INV-101, INV-102, INV-103)', path: '/receivables', icon: ArrowDownLeft, category: 'Receivables' },
    { title: 'Payables & Supplier Bills', path: '/payables', icon: ArrowUpRight, category: 'Payables' },
    { title: 'Customer Risk Intelligence', path: '/customers', icon: Users, category: 'Intelligence' },
    { title: 'Bank Statement Reconciliation', path: '/reconciliation', icon: Building2, category: 'Banking' },
    { title: 'Cash Flow Forecasting & Scenarios', path: '/cashflow', icon: TrendingUp, category: 'Planning' },
    { title: 'ECONVYX AI Finance Assistant', path: '/ai-assistant', icon: Sparkles, category: 'AI Intelligence' },
    { title: 'Reporting Centre (CSV & Statements)', path: '/reports', icon: FileSpreadsheet, category: 'Reports' },
  ];

  const filteredActions = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            autoFocus
            className="flex-1 text-sm bg-transparent border-none outline-none text-brand-primary-navy placeholder:text-slate-400"
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredActions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No matching pages or records found for "{query}".
            </div>
          ) : (
            filteredActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.path}
                  onClick={() => {
                    navigate(action.path);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-slate-100 text-slate-600 group-hover:bg-brand-teal group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{action.title}</div>
                      <div className="text-[10px] text-slate-400">{action.category}</div>
                    </div>
                  </div>
                  <kbd className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Enter</kbd>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigate with mouse or keyboard</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
