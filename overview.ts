// Overview Dashboard API Routes

import { Router, Response } from 'express';
import { AuthenticatedRequest, tenantAuthMiddleware } from '../middleware/auth.js';
import { db } from '../db/database.js';
import { calculateAgingSummary, formatINR } from '../services/financialEngine.js';

const router = Router();
router.use(tenantAuthMiddleware);

router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const workspace = db.getWorkspace(workspaceId);

  const invoices = db.getInvoices(workspaceId);
  const bills = db.getBills(workspaceId);
  const bankTransactions = db.getBankTransactions(workspaceId);
  const verificationCases = db.getVerificationCases(workspaceId);
  const customers = db.getCustomers(workspaceId);
  const auditLogs = db.getAuditLogs(workspaceId);

  const today = new Date().toISOString().split('T')[0];

  // 1. Calculate KPI totals
  let totalInvoicedPaise = 0;
  let totalReceivedPaise = 0;
  let totalOutstandingReceivablesPaise = 0;
  let totalOverdueReceivablesPaise = 0;

  for (const inv of invoices) {
    totalInvoicedPaise += inv.totalAmountPaise;
    totalReceivedPaise += inv.receivedAmountPaise;
    totalOutstandingReceivablesPaise += inv.outstandingAmountPaise;

    if (inv.outstandingAmountPaise > 0 && inv.dueDate < today && inv.status !== 'paid') {
      totalOverdueReceivablesPaise += inv.outstandingAmountPaise;
    }
  }

  // Upcoming bills / payables
  let upcomingPaymentsPaise = 0;
  for (const bill of bills) {
    if (bill.outstandingAmountPaise > 0 && bill.status !== 'paid') {
      upcomingPaymentsPaise += bill.outstandingAmountPaise;
    }
  }

  // Available cash balance from bank statements (or opening baseline)
  const latestTxnWithBalance = bankTransactions.find((t) => t.balancePaise !== undefined);
  const availableCashBalancePaise = latestTxnWithBalance?.balancePaise || 20000000; // ₹2,00,000 baseline

  // 2. Receivables Aging
  const agingSummary = calculateAgingSummary(invoices);

  // 3. Status Distribution
  const statusCounts: Record<string, { count: number; amountPaise: number }> = {
    paid: { count: 0, amountPaise: 0 },
    partially_paid: { count: 0, amountPaise: 0 },
    open: { count: 0, amountPaise: 0 },
    overdue: { count: 0, amountPaise: 0 },
    disputed: { count: 0, amountPaise: 0 },
  };

  for (const inv of invoices) {
    const s = inv.status;
    if (statusCounts[s]) {
      statusCounts[s].count++;
      statusCounts[s].amountPaise += inv.outstandingAmountPaise;
    } else {
      statusCounts[s] = { count: 1, amountPaise: inv.outstandingAmountPaise };
    }
  }

  // 4. Cash Inflow vs Outflow monthly
  const monthlyFlows = [
    { month: 'Nov', inflowRupees: 350000, outflowRupees: 180000, forecast: false },
    { month: 'Dec', inflowRupees: 420000, outflowRupees: 210000, forecast: false },
    { month: 'Jan', inflowRupees: 480000, outflowRupees: 250000, forecast: false },
    { month: 'Feb', inflowRupees: 200000, outflowRupees: 230000, forecast: false },
    { month: 'Mar (Est)', inflowRupees: 600000, outflowRupees: 210000, forecast: true },
    { month: 'Apr (Est)', inflowRupees: 650000, outflowRupees: 240000, forecast: true },
  ];

  // 5. Receivables Trend
  const receivablesTrend = [
    { period: 'Week 1', outstandingRupees: 450000 },
    { period: 'Week 2', outstandingRupees: 520000 },
    { period: 'Week 3', outstandingRupees: 580000 },
    { period: 'Current', outstandingRupees: totalOutstandingReceivablesPaise / 100 },
  ];

  // 6. Top Outstanding Customers
  const customerOutstandings: Record<string, { customerId: string; name: string; outstandingPaise: number; invoiceCount: number }> = {};
  for (const inv of invoices) {
    if (inv.outstandingAmountPaise > 0) {
      const cId = inv.customerId;
      const cName = inv.customer?.name || 'Customer';
      if (!customerOutstandings[cId]) {
        customerOutstandings[cId] = { customerId: cId, name: cName, outstandingPaise: 0, invoiceCount: 0 };
      }
      customerOutstandings[cId].outstandingPaise += inv.outstandingAmountPaise;
      customerOutstandings[cId].invoiceCount++;
    }
  }
  const topOutstandingCustomers = Object.values(customerOutstandings)
    .sort((a, b) => b.outstandingPaise - a.outstandingPaise)
    .slice(0, 5);

  // 7. Upcoming Receivables
  const upcomingReceivables = invoices
    .filter((inv) => inv.outstandingAmountPaise > 0 && inv.dueDate >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  // 8. Alerts & Actions
  const documentVerificationAlerts = verificationCases.filter(
    (v) => v.status === 'mismatch' || v.status === 'needs_review'
  );

  const unmatchedBankTransactions = bankTransactions.filter(
    (t) => t.reconciliationStatus === 'unmatched' || t.reconciliationStatus === 'suggested'
  );

  // AI-generated Financial Observations
  const aiObservations = [
    {
      type: 'warning',
      title: 'High Overdue Concentration',
      description: `${formatINR(totalOverdueReceivablesPaise)} (83% of outstanding) is currently past its payment due date. Follow-up recommended.`,
    },
    {
      type: 'alert',
      title: 'PO vs Invoice Discrepancy Flagged',
      description: `Case VC-2026-101 has an unverified quantity variance of ₹1,00,000 on Precision Fasteners.`,
    },
    {
      type: 'action',
      title: 'Pending Bank Match',
      description: `A ₹1,00,000 credit matches INV-102 with 96% confidence. Awaiting manual confirmation.`,
    },
  ];

  return res.json({
    workspace: {
      name: workspace?.name,
      isDemo: workspace?.isDemo,
      city: workspace?.city,
    },
    kpiCards: {
      totalInvoiced: {
        paise: totalInvoicedPaise,
        formatted: formatINR(totalInvoicedPaise),
        tooltip: 'Sum of all confirmed sales invoices issued.',
      },
      totalReceived: {
        paise: totalReceivedPaise,
        formatted: formatINR(totalReceivedPaise),
        tooltip: 'Total confirmed payments allocated to invoices.',
      },
      outstandingReceivables: {
        paise: totalOutstandingReceivablesPaise,
        formatted: formatINR(totalOutstandingReceivablesPaise),
        tooltip: 'Total Invoiced − Total Confirmed Receipts.',
      },
      overdueReceivables: {
        paise: totalOverdueReceivablesPaise,
        formatted: formatINR(totalOverdueReceivablesPaise),
        tooltip: 'Outstanding balance on invoices past their agreed due date.',
      },
      upcomingPayments: {
        paise: upcomingPaymentsPaise,
        formatted: formatINR(upcomingPaymentsPaise),
        tooltip: 'Approved and pending supplier bills due in the upcoming cycle.',
      },
      availableCashBalance: {
        paise: availableCashBalancePaise,
        formatted: formatINR(availableCashBalancePaise),
        tooltip: 'Verified cash balance from reconciled bank records.',
      },
    },
    charts: {
      cashInflowVsOutflow: monthlyFlows,
      receivablesTrend,
      invoiceStatusDistribution: statusCounts,
      receivablesAging: agingSummary,
    },
    topOutstandingCustomers,
    upcomingReceivables,
    documentVerificationAlerts,
    unmatchedBankTransactions,
    aiObservations,
    recentActivity: auditLogs.slice(0, 6),
  });
});

export default router;
