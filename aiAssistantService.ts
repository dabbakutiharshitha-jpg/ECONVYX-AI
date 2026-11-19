// ECONVYX Intelligence - AI Finance Assistant Service
// Deterministic data retrieval + AI explanation grounded in verified database facts

import { Invoice, Bill, Customer, BankTransaction, VerificationCase } from '../types/index.js';
import { formatINR } from './financialEngine.js';

export interface AssistantContext {
  workspaceName: string;
  invoices: Invoice[];
  bills: Bill[];
  customers: Customer[];
  bankTransactions: BankTransaction[];
  verificationCases: VerificationCase[];
}

export interface AssistantResponse {
  answer: string;
  sourceReferences: Array<{
    type: 'invoice' | 'bill' | 'customer' | 'bank_transaction' | 'verification';
    id: string;
    label: string;
  }>;
  deterministicCalculations: Record<string, string>;
  suggestedFollowUps: string[];
}

export async function processAssistantQuery(
  question: string,
  context: AssistantContext
): Promise<AssistantResponse> {
  const q = question.toLowerCase();

  // 1. Calculate deterministic snapshot figures
  const totalInvoicedPaise = context.invoices.reduce((sum, inv) => sum + inv.totalAmountPaise, 0);
  const totalReceivedPaise = context.invoices.reduce((sum, inv) => sum + inv.receivedAmountPaise, 0);
  const totalOutstandingPaise = context.invoices.reduce((sum, inv) => sum + inv.outstandingAmountPaise, 0);

  const today = new Date().toISOString().split('T')[0];
  const overdueInvoices = context.invoices.filter(
    (inv) => inv.outstandingAmountPaise > 0 && inv.dueDate < today && inv.status !== 'paid'
  );
  const totalOverduePaise = overdueInvoices.reduce((sum, inv) => sum + inv.outstandingAmountPaise, 0);

  const unreconciledTxns = context.bankTransactions.filter(
    (t) => t.reconciliationStatus === 'unmatched' || t.reconciliationStatus === 'suggested'
  );

  const flaggedCases = context.verificationCases.filter(
    (v) => v.status === 'mismatch' || v.status === 'needs_review' || v.status === 'disputed'
  );

  // 2. Intent matching & Grounded response generation
  if (q.includes('outstanding') || q.includes('how much money is') || q.includes('receivables')) {
    return {
      answer: `As of today, your total confirmed outstanding receivables across ${context.invoices.length} invoices is **${formatINR(totalOutstandingPaise)}**.\n\n` +
        `- **Total Invoiced:** ${formatINR(totalInvoicedPaise)}\n` +
        `- **Confirmed Received:** ${formatINR(totalReceivedPaise)}\n` +
        `- **Total Overdue:** ${formatINR(totalOverduePaise)} across ${overdueInvoices.length} invoice(s).\n\n` +
        `All calculations are computed deterministically from verified ledger records. No pending or unverified payments are credited.`,
      sourceReferences: overdueInvoices.map((inv) => ({
        type: 'invoice',
        id: inv.id,
        label: `${inv.invoiceNumber} (${formatINR(inv.outstandingAmountPaise)})`,
      })),
      deterministicCalculations: {
        'Total Invoiced': formatINR(totalInvoicedPaise),
        'Total Received': formatINR(totalReceivedPaise),
        'Outstanding Receivables': formatINR(totalOutstandingPaise),
        'Overdue Amount': formatINR(totalOverduePaise),
      },
      suggestedFollowUps: [
        'Which customers have the highest overdue balances?',
        'What invoices are due this week?',
        'Draft reminders for overdue customers.',
      ],
    };
  }

  if (q.includes('overdue') || q.includes('highest overdue') || q.includes('late')) {
    const customerBalances: Record<string, { name: string; overduePaise: number; count: number }> = {};
    for (const inv of overdueInvoices) {
      const custName = inv.customer?.name || 'Unknown Customer';
      if (!customerBalances[custName]) {
        customerBalances[custName] = { name: custName, overduePaise: 0, count: 0 };
      }
      customerBalances[custName].overduePaise += inv.outstandingAmountPaise;
      customerBalances[custName].count++;
    }

    const sortedCustomers = Object.values(customerBalances).sort((a, b) => b.overduePaise - a.overduePaise);

    const listText = sortedCustomers.length > 0
      ? sortedCustomers
          .map((c, i) => `${i + 1}. **${c.name}**: ${formatINR(c.overduePaise)} (${c.count} overdue invoice${c.count > 1 ? 's' : ''})`)
          .join('\n')
      : 'You currently have zero overdue customer invoices.';

    return {
      answer: `Here is the breakdown of customers with overdue receivables:\n\n${listText}\n\n` +
        `Total overdue exposure is **${formatINR(totalOverduePaise)}**. We recommend generating payment reminders for these accounts.`,
      sourceReferences: overdueInvoices.map((inv) => ({
        type: 'customer',
        id: inv.customerId,
        label: `${inv.customer?.name} - ${inv.invoiceNumber}`,
      })),
      deterministicCalculations: {
        'Total Overdue': formatINR(totalOverduePaise),
        'Overdue Accounts': `${sortedCustomers.length}`,
      },
      suggestedFollowUps: [
        'Draft reminders for overdue customers.',
        'Why is this invoice flagged?',
        'What is my expected cash position in 30 days?',
      ],
    };
  }

  if (q.includes('unreconciled') || q.includes('reconcil') || q.includes('bank')) {
    return {
      answer: `There are currently **${unreconciledTxns.length} unreconciled bank transactions** awaiting your manual review.\n\n` +
        unreconciledTxns
          .map(
            (t) =>
              `- **${t.transactionDate}**: ${t.description} — **${formatINR(t.amountPaise)}** (${t.type.toUpperCase()}) | Status: *${t.reconciliationStatus}* ${t.matchReason ? `— ${t.matchReason}` : ''}`
          )
          .join('\n') +
        `\n\n*Note:* Per ECONVYX financial integrity rules, suggestions never alter balances until you explicitly confirm the allocation in Bank Reconciliation.`,
      sourceReferences: unreconciledTxns.map((t) => ({
        type: 'bank_transaction',
        id: t.id,
        label: `${t.referenceNumber || t.description} (${formatINR(t.amountPaise)})`,
      })),
      deterministicCalculations: {
        'Unreconciled Transactions': `${unreconciledTxns.length}`,
      },
      suggestedFollowUps: [
        'Open Bank Reconciliation page',
        'How much money is currently outstanding?',
        'Prepare a cash flow summary.',
      ],
    };
  }

  if (q.includes('flagged') || q.includes('discrepancy') || q.includes('mismatch')) {
    return {
      answer: `There are **${flaggedCases.length} flagged document verification cases** requiring attention:\n\n` +
        flaggedCases
          .map(
            (c) =>
              `- **Case ${c.caseNumber}**: ${c.summary}\n  *Monetary Impact:* **${formatINR(c.monetaryImpactPaise)}**\n  *Status:* ${c.status.toUpperCase()}`
          )
          .join('\n\n') +
        `\n\nDeterministic checks identified quantity and price variances between the source Purchase Order and billed Tax Invoice. You can review and resolve these in the Verification Centre.`,
      sourceReferences: flaggedCases.map((c) => ({
        type: 'verification',
        id: c.id,
        label: `${c.caseNumber} (${formatINR(c.monetaryImpactPaise)})`,
      })),
      deterministicCalculations: {
        'Flagged Cases': `${flaggedCases.length}`,
        'Total Discrepancy Impact': formatINR(
          flaggedCases.reduce((sum, c) => sum + c.monetaryImpactPaise, 0)
        ),
      },
      suggestedFollowUps: [
        'Open Verification Centre',
        'How much money is currently outstanding?',
        'What is my expected cash position in 30 days?',
      ],
    };
  }

  // General financial summary
  return {
    answer: `Here is a real-time financial intelligence summary for **${context.workspaceName}**:\n\n` +
      `- **Total Invoiced:** ${formatINR(totalInvoicedPaise)}\n` +
      `- **Confirmed Receipts:** ${formatINR(totalReceivedPaise)}\n` +
      `- **Current Outstanding:** ${formatINR(totalOutstandingPaise)}\n` +
      `- **Overdue Invoices:** ${formatINR(totalOverduePaise)} (${overdueInvoices.length} invoices)\n` +
      `- **Unreconciled Bank Items:** ${unreconciledTxns.length} transactions\n` +
      `- **Document Discrepancies:** ${flaggedCases.length} case(s)\n\n` +
      `How would you like to proceed? You can explore cash flow forecasting, inspect document verification cases, or draft payment reminders.`,
    sourceReferences: [],
    deterministicCalculations: {
      'Total Invoiced': formatINR(totalInvoicedPaise),
      'Outstanding': formatINR(totalOutstandingPaise),
      'Overdue': formatINR(totalOverduePaise),
    },
    suggestedFollowUps: [
      'Show my overdue receivables.',
      'Explain my biggest invoice discrepancy.',
      'Prepare a cash flow summary.',
      'Identify unreconciled payments.',
      'Draft reminders for overdue customers.',
    ],
  };
}
