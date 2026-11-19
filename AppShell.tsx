// Master Application Shell

import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { Topbar } from './Topbar.js';
import { CommandMenu } from './CommandMenu.js';
import { useAuth } from '../../context/AuthContext.js';
import { Loader2 } from 'lucide-react';
import { Logo } from '../brand/Logo.js';

export const AppShell: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandMenuOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Show full-screen loader while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050722] flex flex-col items-center justify-center gap-6">
        <Logo variant="transparent" size="lg" layout="stacked" />
        <Loader2 className="w-6 h-6 animate-spin text-[#12B8A6]" />
      </div>
    );
  }

  // Redirect unauthenticated users to sign-in
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="min-h-screen bg-brand-off-white flex">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Topbar
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenCommandSearch={() => setIsCommandMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandMenu
        isOpen={isCommandMenuOpen}
        onClose={() => setIsCommandMenuOpen(false)}
      />
    </div>
  );
};
