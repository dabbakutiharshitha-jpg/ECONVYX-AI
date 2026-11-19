// Typed API Client for ECONVYX AI

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('econvyx_token');
  const workspaceId = localStorage.getItem('econvyx_active_workspace') || 'ws-apex-demo-001';

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (workspaceId) {
    headers.set('x-workspace-id', workspaceId);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Request failed with status ${response.status}`;
    let errorData = null;
    try {
      errorData = await response.json();
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch {
      // not JSON
    }
    throw new ApiError(errorMsg, response.status, errorData);
  }

  // Handle file downloads
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return (await response.text()) as any;
  }

  return response.json();
}

export const api = {
  // Auth & Workspaces
  login: (credentials: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (data: { email: string; fullName: string; password: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  getMicrosoftAuthStatus: () => request('/auth/microsoft/status'),
  getWorkspaces: () => request('/workspaces'),
  createWorkspaceOnboarding: (data: any) =>
    request('/workspaces/onboarding', { method: 'POST', body: JSON.stringify(data) }),

  // Overview
  getOverview: () => request('/overview'),

  // Documents
  getDocuments: () => request('/documents'),
  uploadDocument: (formData: FormData) =>
    request('/documents/upload', { method: 'POST', body: formData }),
  updateDocumentFields: (id: string, data: any) =>
    request(`/documents/${id}/fields`, { method: 'PATCH', body: JSON.stringify(data) }),
  confirmDocument: (id: string) =>
    request(`/documents/${id}/confirm`, { method: 'POST' }),

  // Verification Centre
  getVerificationCases: () => request('/verification'),
  runVerification: (data: { invoiceId: string; poId?: string; grnId?: string }) =>
    request('/verification/run', { method: 'POST', body: JSON.stringify(data) }),
  resolveVerificationCase: (id: string, data: { action: string; comments?: string; reason?: string }) =>
    request(`/verification/${id}/resolve`, { method: 'POST', body: JSON.stringify(data) }),

  // Receivables
  getInvoices: (params?: { status?: string; customerId?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request(`/receivables${q ? `?${q}` : ''}`);
  },
  getInvoice: (id: string) => request(`/receivables/${id}`),
  createInvoice: (data: any) =>
    request('/receivables', { method: 'POST', body: JSON.stringify(data) }),
  recordInvoicePayment: (id: string, data: any) =>
    request(`/receivables/${id}/payments`, { method: 'POST', body: JSON.stringify(data) }),

  // Payables
  getBills: () => request('/payables'),
  createBill: (data: any) =>
    request('/payables', { method: 'POST', body: JSON.stringify(data) }),
  updateBillStatus: (id: string, data: { status: string; notes?: string }) =>
    request(`/payables/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  recordBillPayment: (id: string, data: any) =>
    request(`/payables/${id}/payments`, { method: 'POST', body: JSON.stringify(data) }),

  // Customers & Suppliers
  getCustomers: () => request('/customers'),
  getCustomer: (id: string) => request(`/customers/${id}`),
  createCustomer: (data: any) =>
    request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  getSuppliers: () => request('/suppliers'),
  createSupplier: (data: any) =>
    request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),

  // Bank Reconciliation
  getReconciliation: () => request('/reconciliation'),
  uploadStatementCsv: (formData: FormData) =>
    request('/reconciliation/upload-csv', { method: 'POST', body: formData }),
  confirmMatch: (data: { transactionId: string; invoiceId?: string; billId?: string }) =>
    request('/reconciliation/confirm-match', { method: 'POST', body: JSON.stringify(data) }),
  rejectMatch: (data: { transactionId: string; reason?: string }) =>
    request('/reconciliation/reject-match', { method: 'POST', body: JSON.stringify(data) }),

  // Cash Flow
  getCashFlow: (params?: { horizon?: number; delayDays?: number; delayedInvoiceId?: string; additionalExpenseRupees?: number }) => {
    const q = new URLSearchParams(params as any).toString();
    return request(`/cashflow${q ? `?${q}` : ''}`);
  },

  // AI Assistant
  queryAssistant: (question: string) =>
    request('/ai-assistant/query', { method: 'POST', body: JSON.stringify({ question }) }),
  getAssistantPrompts: () => request('/ai-assistant/prompts'),

  // Reminders
  getReminders: () => request('/reminders'),
  generateReminderDraft: (data: { invoiceId: string; tone: string }) =>
    request('/reminders/generate-draft', { method: 'POST', body: JSON.stringify(data) }),

  // Insights
  getInsights: () => request('/insights'),

  // Reports
  getReport: (reportType: string, format?: 'json' | 'csv') =>
    request(`/reports/${reportType}${format === 'csv' ? '?format=csv' : ''}`),

  // Audit
  getAuditLogs: (params?: { action?: string; entityType?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request(`/audit${q ? `?${q}` : ''}`);
  },

  // Settings
  getSettings: () => request('/settings'),
  resetDemoWorkspace: () => request('/settings/reset-demo', { method: 'POST' }),
};
