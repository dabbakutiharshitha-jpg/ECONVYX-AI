// Payables (Accounts Payable) Routes

import { Router, Response } from 'express';
import { AuthenticatedRequest, tenantAuthMiddleware } from '../middleware/auth.js';
import { db } from '../db/database.js';
import { formatINR, rupeesToPaise } from '../services/financialEngine.js';
import { Bill } from '../types/index.js';

const router = Router();
router.use(tenantAuthMiddleware);

// 1. List Bills with Summary Statistics
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const bills = db.getBills(workspaceId);
  const today = new Date().toISOString().split('T')[0];

  let totalPayablesPaise = 0;
  let overduePayablesPaise = 0;
  let dueThisWeekPaise = 0;
  let dueThisMonthPaise = 0;

  const nextWeekDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const nextMonthDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  for (const bill of bills) {
    if (bill.outstandingAmountPaise > 0 && bill.status !== 'paid') {
      totalPayablesPaise += bill.outstandingAmountPaise;

      if (bill.dueDate < today) {
        overduePayablesPaise += bill.outstandingAmountPaise;
      } else if (bill.dueDate <= nextWeekDate) {
        dueThisWeekPaise += bill.outstandingAmountPaise;
      }

      if (bill.dueDate <= nextMonthDate && bill.dueDate >= today) {
        dueThisMonthPaise += bill.outstandingAmountPaise;
      }
    }
  }

  return res.json({
    bills,
    summary: {
      totalPayables: { paise: totalPayablesPaise, formatted: formatINR(totalPayablesPaise) },
      overduePayables: { paise: overduePayablesPaise, formatted: formatINR(overduePayablesPaise) },
      dueThisWeek: { paise: dueThisWeekPaise, formatted: formatINR(dueThisWeekPaise) },
      dueThisMonth: { paise: dueThisMonthPaise, formatted: formatINR(dueThisMonthPaise) },
    },
  });
});

// 2. Create Supplier Bill
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId!;
    const { supplierId, billNumber, billDate, dueDate, paymentTermsDays, poReference, amountRupees, notes } = req.body;

    if (!supplierId || !billNumber || !billDate || !amountRupees) {
      return res.status(400).json({ error: 'Supplier, Bill Number, Date, and Amount are required.' });
    }

    const totalAmountPaise = rupeesToPaise(Number(amountRupees));
    const billId = `bill-${Date.now()}`;

    const newBill: Bill = {
      id: billId,
      workspaceId,
      supplierId,
      billNumber,
      billDate,
      dueDate: dueDate || billDate,
      paymentTermsDays: Number(paymentTermsDays) || 30,
      poReference,
      totalAmountPaise,
      paidAmountPaise: 0,
      outstandingAmountPaise: totalAmountPaise,
      status: 'pending_review',
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addBill(newBill);

    db.addAuditLog({
      workspaceId,
      userEmail: req.user?.email || 'user',
      action: 'BILL_RECORDED',
      entityType: 'bill',
      entityId: billId,
      details: `Created supplier bill #${billNumber} for ${formatINR(totalAmountPaise)}.`,
    });

    return res.status(201).json({ bill: newBill });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create bill.' });
  }
});

// 3. Update Bill Status (e.g. Approval Workflow: Approve, Disputed)
router.patch('/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const billId = req.params.id;
  const { status, notes } = req.body;

  const bill = db.getBills(workspaceId).find((b) => b.id === billId);
  if (!bill) {
    return res.status(404).json({ error: 'Bill not found.' });
  }

  const updatedBill = db.updateBill(billId, { status, notes: notes || bill.notes });

  db.addAuditLog({
    workspaceId,
    userEmail: req.user?.email || 'user',
    action: `BILL_STATUS_${status.toUpperCase()}`,
    entityType: 'bill',
    entityId: billId,
    details: `Updated Bill #${bill.billNumber} status from ${bill.status} to ${status}.`,
  });

  return res.json({ bill: updatedBill });
});

// 4. Record Supplier Payment
router.post('/:id/payments', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const billId = req.params.id;
  const { amountRupees, paymentDate, paymentMode, referenceNumber, notes } = req.body;

  const bill = db.getBills(workspaceId).find((b) => b.id === billId);
  if (!bill) {
    return res.status(404).json({ error: 'Bill not found.' });
  }

  const paymentAmountPaise = rupeesToPaise(Number(amountRupees));
  if (paymentAmountPaise <= 0) {
    return res.status(400).json({ error: 'Payment amount must be greater than zero.' });
  }

  if (paymentAmountPaise > bill.outstandingAmountPaise) {
    return res.status(400).json({
      error: `Payment of ${formatINR(paymentAmountPaise)} exceeds bill outstanding balance of ${formatINR(bill.outstandingAmountPaise)}. Over-allocation prevented.`,
    });
  }

  const payId = `pay-out-${Date.now()}`;
  const payment = db.addPayment({
    id: payId,
    workspaceId,
    paymentNumber: `PAY-${Date.now().toString().slice(-6)}`,
    paymentType: 'outgoing',
    paymentDate: paymentDate || new Date().toISOString().split('T')[0],
    amountPaise: paymentAmountPaise,
    allocatedAmountPaise: paymentAmountPaise,
    unallocatedAmountPaise: 0,
    paymentMode: paymentMode || 'bank_transfer',
    referenceNumber,
    supplierId: bill.supplierId,
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const allocation = db.allocatePayment({
    id: `alloc-out-${Date.now()}`,
    workspaceId,
    paymentId: payId,
    billId,
    amountPaise: paymentAmountPaise,
    createdAt: new Date().toISOString(),
  });

  db.addAuditLog({
    workspaceId,
    userEmail: req.user?.email || 'user',
    action: 'BILL_PAYMENT_ALLOCATED',
    entityType: 'bill',
    entityId: billId,
    details: `Allocated outgoing remittance of ${formatINR(paymentAmountPaise)} to Bill #${bill.billNumber}.`,
  });

  const updatedBill = db.getBills(workspaceId).find((b) => b.id === billId);

  return res.status(201).json({
    message: 'Supplier payment recorded successfully.',
    payment,
    allocation,
    bill: updatedBill,
  });
});

export default router;
