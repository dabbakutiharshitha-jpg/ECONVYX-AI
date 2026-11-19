// Navigation Sidebar Component
// Deep Navy #050722, Aqua active indicators, 15 complete working navigation routes

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Truck,
  Building2,
  TrendingUp,
  LineChart,
  Sparkles,
  FileSpreadsheet,
  History,
  UserCheck,
  Settings,
  HelpCircle,
  X,
} from 'lucide-react';
import { Logo } from '../brand/Logo.js';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const { activeWorkspace } = useAuth();

  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Documents', path: '/documents', icon: FileText, badge: 'AI' },
    { name: 'Verification Centre', path: '/verification', icon: ShieldCheck, badge: '1 Flag' },
    { name: 'Receivables', path: '/receivables', icon: ArrowDownLeft },
    { name: 'Payables', path: '/payables', icon: ArrowUpRight },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Suppliers', path: '/suppliers', icon: Truck },
    { name: 'Bank Reconciliation', path: '/reconciliation', icon: Building2, badge: 'Suggested' },
    { name: 'Cash Flow', path: '/cashflow', icon: TrendingUp },
    { name: 'Financial Insights', path: '/insights', icon: LineChart },
    { name: 'AI Finance Assistant', path: '/ai-assistant', icon: Sparkles, badge: 'Active' },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { name: 'Activity & Audit Trail', path: '/audit', icon: History },
    { name: 'Team & Permissions', path: '/team', icon: UserCheck },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Shell */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col w-64 bg-brand-deep-navy border-r border-[#17283D] transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#17283D] bg-[#030514]/40">
          <Logo variant="transparent" size="sm" layout="horizontal" />
          <button
            onClick={onCloseMobile}
            className="p-1 text-slate-400 hover:text-white rounded-lg lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Business Workspace Indicator */}
        <div className="px-4 py-3 mx-3 my-2.5 rounded-lg bg-[#101C2C] border border-[#17283D]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              Workspace
            </span>
            {activeWorkspace?.isDemo && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold text-brand-gold bg-amber-500/10 border border-amber-500/30 rounded">
                DEMO DATA
              </span>
            )}
          </div>
          <div className="text-sm font-semibold text-white truncate mt-0.5">
            {activeWorkspace?.name || 'Apex Components'}
          </div>
          <div className="text-[11px] text-brand-teal truncate font-medium">
            {activeWorkspace?.industry || 'Manufacturing & Wholesale'}
          </div>
        </div>

        {/* Navigation Items (15 working items) */}
        <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors group ${
                    isActive
                      ? 'bg-brand-teal/15 text-brand-aqua font-semibold border-l-2 border-brand-bright-aqua'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className="w-4 h-4 shrink-0 transition-colors" />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-brand-teal/20 text-brand-aqua border border-brand-teal/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Philosophy Footer Banner */}
        <div className="p-3.5 m-3 rounded-lg bg-[#101C2C] border border-[#17283D] text-[11px]">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
            System Philosophy
          </div>
          <p className="text-slate-300 italic leading-relaxed">
            "AI interprets. Financial logic calculates. Humans approve."
          </p>
        </div>
      </aside>
    </>
  );
};
