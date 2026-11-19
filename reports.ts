// Reporting Centre Routes (10 Financial & Operational Reports with CSV Export)

import { Router, Response } from 'express';
import { AuthenticatedRequest, tenantAuthMiddleware } from '../middleware/auth.js';
import { db } from '../db/database.js';
import { calculateAgingSummary, formatINR, paiseToRupees } from '../services/financialEngine.js';

const router = Router();
router.use(tenantAuthMiddleware);

router.get('/:reportType', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const reportType = req.params.reportType;
  const format = req.query.format as string; // 'json' or 'csv'

  const workspace = db.getWorkspace(workspaceId);
  const invoices = db.getInvoices(workspaceId);
  const bills = db.getBills(workspaceId);
  const customers = db.getCustomers(workspaceId);
  const suppliers = db.getSuppliers(workspaceId);
  const payments = db.getPayments(workspaceId);
  const bankTransactions = db.getBankTransactions(workspaceId);
  const verificationCases = db.getVerificationCases(workspaceId);

  const timestamp = new Date().toISOString();
  let title = 'Financial Report';
  let headers: string[] = [];
  let rows: any[] = [];

  switch (reportType) {
    case 'sales_invoices':
      title = 'Sales Invoice Ledger Report';
      headers = ['Invoice #', 'Customer', 'Date', 'Due Date', 'Status', 'Total (₹)', 'Received (₹)', 'Outstanding (₹)'];
      rows = invoices.map((inv) => [
        inv.invoiceNumber,
        inv.customer?.name || 'Customer',
        inv.issueDate,
        inv.dueDate,
        inv.status.toUpperCase(),
        paiseToRupees(inv.totalAmountPaise).toFixed(2),
        paiseToRupees(inv.receivedAmountPaise).toFixed(2),
        paiseToRupees(inv.outstandingAmountPaise).toFixed(2),
      ]);
      break;

    case 'accounts_receivable':
      title = 'Accounts Receivable Ledger Report';
      headers = ['Customer', 'Invoice #', 'Due Date', 'Total Value (₹)', 'Outstanding (₹)', 'Status'];
      rows = invoices
        .filter((i) => i.outstandingAmountPaise > 0)
        .map((inv) => [
          inv.customer?.name || 'Customer',
          inv.invoiceNumber,
          inv.dueDate,
          paiseToRupees(inv.totalAmountPaise).toFixed(2),
          paiseToRupees(inv.outstandingAmountPaise).toFixed(2),
          inv.status.toUpperCase(),
        ]);
      break;

    case 'accounts_payable':
      title = 'Accounts Payable Schedule Report';
      headers = ['Supplier', 'Bill #', 'Bill Date', 'Due Date', 'Total Amount (₹)', 'Outstanding (₹)', 'Status'];
      rows = bills.map((b) => [
        b.supplier?.name || 'Supplier',
        b.billNumber,
        b.billDate,
        b.dueDate,
        paiseToRupees(b.totalAmountPaise).toFixed(2),
        paiseToRupees(b.outstandingAmountPaise).toFixed(2),
        b.status.toUpperCase(),
      ]);
      break;

    case 'aging':
      title = 'Receivables Aging Analysis Report';
      const aging = calculateAgingSummary(invoices);
      headers = ['Aging Bucket', 'Amount (₹)', 'Percentage of Total (%)'];
      const totalOut = aging.totalOutstandingPaise || 1;
      rows = [
        ['Current (Not Due)', paiseToRupees(aging.currentPaise).toFixed(2), `${Math.round((aging.currentPaise / totalOut) * 100)}%`],
        ['1-30 Days Overdue', paiseToRupees(aging.bucket0to30Paise).toFixed(2), `${Math.round((aging.bucket0to30Paise / totalOut) * 100)}%`],
        ['31-60 Days Overdue', paiseToRupees(aging.bucket31to60Paise).toFixed(2), `${Math.round((aging.bucket31to60Paise / totalOut) * 100)}%`],
        ['61-90 Days Overdue', paiseToRupees(aging.bucket61to90Paise).toFixed(2), `${Math.round((aging.bucket61to90Paise / totalOut) * 100)}%`],
        ['Above 90 Days Overdue', paiseToRupees(aging.bucketAbove90Paise).toFixed(2), `${Math.round((aging.bucketAbove90Paise / totalOut) * 100)}%`],
      ];
      break;

    case 'bank_reconciliation':
      title = 'Bank Statement Reconciliation Audit Report';
      headers = ['Date', 'Description', 'Reference #', 'Type', 'Amount (₹)', 'Status', 'Matched Entity'];
      rows = bankTransactions.map((t) => [
        t.transactionDate,
        t.description,
        t.referenceNumber || 'N/A',
        t.type.toUpperCase(),
        paiseToRupees(t.amountPaise).toFixed(2),
        t.reconciliationStatus.toUpperCase(),
        t.matchReason || 'None',
      ]);
      break;

    case 'verification':
      title = 'Document Verification & Discrepancy Report';
      headers = ['Case #', 'Invoice #', 'Status', 'Exposure (₹)', 'Summary'];
      rows = verificationCases.map((c) => [
        c.caseNumber,
        c.invoice?.invoiceNumber || 'N/A',
        c.status.toUpperCase(),
        paiseToRupees(c.monetaryImpactPaise).toFixed(2),
        c.summary,
      ]);
      break;

    default:
      title = 'Monthly Financial Performance Summary';
      headers = ['Metric Name', 'Value (₹ / Count)', 'Description'];
      const totalInvPaise = invoices.reduce((s, i) => s + i.totalAmountPaise, 0);
      const totalRecPaise = invoices.reduce((s, i) => s + i.receivedAmountPaise, 0);
      const totalOutPaise = invoices.reduce((s, i) => s + i.outstandingAmountPaise, 0);
      rows = [
        ['Total Invoiced Sales', formatINR(totalInvPaise), 'Gross value of all issued invoices'],
        ['Total Collections Received', formatINR(totalRecPaise), 'Liquid payment remittances confirmed'],
        ['Total Current Receivables', formatINR(totalOutPaise), 'Uncollected customer balances'],
        ['Total Supplier Payables', formatINR(bills.reduce((s, b) => s + b.outstandingAmountPaise, 0)), 'Open procurement liabilities'],
        ['Active Customer Count', `${customers.length}`, 'Registered active enterprise accounts'],
      ];
      break;
  }

  // Handle CSV download
  if (format === 'csv') {
    const csvRows = [
      `"${title} - ${workspace?.name || 'Apex Components'}"`,
      `"Generated at: ${timestamp}"`,
      '',
      headers.map((h) => `"${h}"`).join(','),
      ...rows.map((row) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-${Date.now()}.csv"`);
    return res.send(csvRows.join('\r\n'));
  }

  return res.json({
    reportType,
    title,
    workspaceName: workspace?.name,
    generatedAt: timestamp,
    headers,
    rows,
  });
});

export default router;
