// Frontend TypeScript Type Definitions

export type WorkspaceRole = 'owner' | 'admin' | 'finance_manager' | 'accountant' | 'viewer';
export type BusinessType = 'manufacturing' | 'wholesale' | 'distribution' | 'services' | 'other';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  microsoftId?: string;
  role: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BusinessWorkspace {
  id: string;
  name: string;
  slug: string;
  businessType: BusinessType;
  industry?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  defaultCurrency: string;
  financialYearStart: string;
  defaultPaymentTermsDays: number;
  timezone: string;
  isDemo: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  workspaceId: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  gstin?: string;
  billingAddress?: string;
  shippingAddress?: string;
  paymentTermsDays: number;
  creditLimitPaise: number;
  notes?: string;
  isActive: boolean;
  profile?: {
    totalInvoicedPaise: number;
    totalInvoicedFormatted: string;
    totalReceivedPaise: number;
    totalReceivedFormatted: string;
    currentOutstandingPaise: number;
    currentOutstandingFormatted: string;
    overduePaise: number;
    overdueFormatted: string;
    invoiceCount: number;
    paymentCompletionPercentage: number;
    onTimePercentage: number;
    behavior: 'on_time' | 'occasionally_late' | 'frequently_late' | 'high_risk' | 'insufficient_history';
    rationale: string;
  };
  createdAt: string;
}

export interface Supplier {
  id: string;
  workspaceId: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  gstin?: string;
  address?: string;
  paymentTermsDays: number;
  notes?: string;
  isActive: boolean;
  financialSummary?: {
    totalBilledPaise: number;
    totalBilledFormatted: string;
    totalPaidPaise: number;
    totalPaidFormatted: string;
    outstandingPaise: number;
    outstandingFormatted: string;
    billCount: number;
  };
  createdAt: string;
}

export type DocumentType =
  | 'purchase_order'
  | 'grn'
  | 'delivery_acknowledgement'
  | 'tax_invoice'
  | 'credit_note'
  | 'debit_note'
  | 'bank_statement'
  | 'other';

export type ExtractionStatus =
  | 'uploaded'
  | 'processing'
  | 'extracted'
  | 'needs_review'
  | 'confirmed'
  | 'failed';

export interface DocumentItem {
  id: string;
  workspaceId: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileType: string;
  fileSizeBytes: number;
  documentType: DocumentType;
  extractionStatus: ExtractionStatus;
  confidenceScore: number;
  extractedData?: {
    documentType: DocumentType;
    overallConfidence: number;
    fields: {
      documentNumber?: { value: string; confidence: number };
      issueDate?: { value: string; confidence: number };
      dueDate?: { value: string; confidence: number };
      counterpartyName?: { value: string; confidence: number };
      counterpartyGstin?: { value: string; confidence: number };
      poReference?: { value: string; confidence: number };
      subtotalPaise?: { value: number; confidence: number };
      taxTotalPaise?: { value: number; confidence: number };
      grandTotalPaise?: { value: number; confidence: number };
      paymentTermsDays?: { value: number; confidence: number };
      lineItems?: Array<{
        description: string;
        hsnSac?: string;
        quantity: number;
        unit: string;
        unitPricePaise: number;
        taxRatePercent: number;
        totalAmountPaise: number;
        confidence: number;
      }>;
    };
  };
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export type InvoiceStatus =
  | 'draft'
  | 'awaiting_confirmation'
  | 'open'
  | 'due_soon'
  | 'overdue'
  | 'partially_paid'
  | 'paid'
  | 'disputed'
  | 'cancelled';

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  hsnSac?: string;
  quantity: number;
  unit: string;
  unitPricePaise: number;
  taxRatePercent: number;
  taxableAmountPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalAmountPaise: number;
}

export interface Invoice {
  id: string;
  workspaceId: string;
  customerId: string;
  customer?: Customer;
  documentId?: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  paymentTermsDays: number;
  poReference?: string;
  subtotalPaise: number;
  taxableAmountPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  discountPaise: number;
  totalAmountPaise: number;
  receivedAmountPaise: number;
  outstandingAmountPaise: number;
  status: InvoiceStatus;
  notes?: string;
  items?: InvoiceLineItem[];
  createdAt: string;
}

export type BillStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'disputed';

export interface Bill {
  id: string;
  workspaceId: string;
  supplierId: string;
  supplier?: Supplier;
  documentId?: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  paymentTermsDays: number;
  poReference?: string;
  totalAmountPaise: number;
  paidAmountPaise: number;
  outstandingAmountPaise: number;
  status: BillStatus;
  notes?: string;
  createdAt: string;
}

export interface BankTransaction {
  id: string;
  workspaceId: string;
  transactionDate: string;
  description: string;
  referenceNumber?: string;
  type: 'credit' | 'debit';
  amountPaise: number;
  balancePaise?: number;
  reconciliationStatus: 'unmatched' | 'suggested' | 'partially_matched' | 'matched' | 'ignored';
  matchedInvoiceId?: string;
  matchedBillId?: string;
  matchedPaymentId?: string;
  matchConfidence: number;
  matchReason?: string;
  createdAt: string;
}

export type VerificationStatus =
  | 'verified'
  | 'minor_difference'
  | 'mismatch'
  | 'missing_document'
  | 'needs_review'
  | 'disputed';

export interface VerificationFinding {
  id: string;
  caseId: string;
  fieldName: string;
  expectedValue: string;
  actualValue: string;
  differenceValue: string;
  monetaryDifferencePaise: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface VerificationCase {
  id: string;
  workspaceId: string;
  caseNumber: string;
  invoiceId?: string;
  invoice?: Invoice;
  poId?: string;
  po?: any;
  grnId?: string;
  grn?: any;
  status: VerificationStatus;
  summary: string;
  monetaryImpactPaise: number;
  findings: VerificationFinding[];
  reviewerComments?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface CashFlowTimelineItem {
  date: string;
  inflowRupees: number;
  outflowRupees: number;
  balanceRupees: number;
  inflowFormatted: string;
  outflowFormatted: string;
  balanceFormatted: string;
  description: string;
}

export interface CashFlowForecastResponse {
  openingBalance: { paise: number; formatted: string };
  horizonDays: number;
  baseline: {
    expectedInflowsPaise: number;
    expectedInflowsFormatted: string;
    expectedOutflowsPaise: number;
    expectedOutflowsFormatted: string;
    projectedBalancePaise: number;
    projectedBalanceFormatted: string;
    assumptions: string[];
    timeline: CashFlowTimelineItem[];
  };
  scenario?: {
    expectedInflowsPaise: number;
    expectedInflowsFormatted: string;
    expectedOutflowsPaise: number;
    expectedOutflowsFormatted: string;
    projectedBalancePaise: number;
    projectedBalanceFormatted: string;
    impactDifferencePaise: number;
    impactDifferenceFormatted: string;
    assumptions: string[];
  } | null;
  builtInScenarios: {
    delayMajorInvoice: {
      name: string;
      projectedBalancePaise: number;
      projectedBalanceFormatted: string;
      impactPaise: number;
      impactFormatted: string;
    };
  };
}

export interface Reminder {
  id: string;
  workspaceId: string;
  invoiceId: string;
  customerId: string;
  tone: 'friendly' | 'professional' | 'firm' | 'final_notice';
  subject: string;
  messageBody: string;
  status: 'draft' | 'copied' | 'sent';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  workspaceId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
}
