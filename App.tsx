// Master Application Router

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { AppShell } from './components/layout/AppShell.js';

// Pages
import { SignInPage } from './pages/auth/SignInPage.js';
import { SignUpPage } from './pages/auth/SignUpPage.js';
import { GoogleCallbackPage } from './pages/auth/GoogleCallbackPage.js';
import { OnboardingPage } from './pages/auth/OnboardingPage.js';
import { OverviewPage } from './pages/overview/OverviewPage.js';
import { DocumentIntelligencePage } from './pages/documents/DocumentIntelligencePage.js';
import { VerificationCentrePage } from './pages/verification/VerificationCentrePage.js';
import { ReceivablesPage } from './pages/receivables/ReceivablesPage.js';
import { PayablesPage } from './pages/payables/PayablesPage.js';
import { CustomersPage } from './pages/customers/CustomersPage.js';
import { SuppliersPage } from './pages/suppliers/SuppliersPage.js';
import { BankReconciliationPage } from './pages/reconciliation/BankReconciliationPage.js';
import { CashFlowPage } from './pages/cashflow/CashFlowPage.js';
import { FinancialInsightsPage } from './pages/insights/FinancialInsightsPage.js';
import { AIFinanceAssistantPage } from './pages/aiAssistant/AIFinanceAssistantPage.js';
import { PaymentRemindersPage } from './pages/reminders/PaymentRemindersPage.js';
import { ReportingCentrePage } from './pages/reports/ReportingCentrePage.js';
import { ActivityAuditTrailPage } from './pages/audit/ActivityAuditTrailPage.js';
import { TeamPermissionsPage } from './pages/team/TeamPermissionsPage.js';
import { SettingsPage } from './pages/settings/SettingsPage.js';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public / Auth Routes */}
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/auth/oauth-callback" element={<GoogleCallbackPage />} />
            <Route path="/auth/google-callback" element={<GoogleCallbackPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />

            {/* Authenticated Application Shell */}
            <Route path="/" element={<AppShell />}>
              <Route index element={<OverviewPage />} />
              <Route path="documents" element={<DocumentIntelligencePage />} />
              <Route path="verification" element={<VerificationCentrePage />} />
              <Route path="receivables" element={<ReceivablesPage />} />
              <Route path="payables" element={<PayablesPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="reconciliation" element={<BankReconciliationPage />} />
              <Route path="cashflow" element={<CashFlowPage />} />
              <Route path="insights" element={<FinancialInsightsPage />} />
              <Route path="ai-assistant" element={<AIFinanceAssistantPage />} />
              <Route path="reminders" element={<PaymentRemindersPage />} />
              <Route path="reports" element={<ReportingCentrePage />} />
              <Route path="audit" element={<ActivityAuditTrailPage />} />
              <Route path="team" element={<TeamPermissionsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
