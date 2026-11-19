// Receivables (Accounts Receivable) Routes

import { Router, Response } from 'express';
import { AuthenticatedRequest, tenantAuthMiddleware } from '../middleware/auth.js';
import { db } from '../db/database.js';
import { calculateInvoiceTotals, formatINR, rupeesToPaise } from '../services/financialEngine.js';
import { Invoice } from '../types/index.js';

const router = Router();
router.use(tenantAuthMiddleware);

// 1. List Invoices with Search & Filters
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const { status, customerId, search } = req.query;

  let invoices = db.getInvoices(workspaceId);

  if (status && status !== 'all') {
    invoices = invoices.filter((inv) => inv.status === status);
  }

  if (customerId && customerId !== 'all') {
    invoices = invoices.filter((inv) => inv.customerId === customerId);
  }

  if (search) {
    const q = (search as string).toLowerCase();
    invoices = invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customer?.name.toLowerCase().includes(q) ||
        inv.poReference?.toLowerCase().includes(q)
    );
  }

  return res.json({ invoices });
});

// 2. Get Single Invoice Detail
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const invoice = db.getInvoices(workspaceId).find((i) => i.id === req.params.id);

  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found.' });
  }

  const payments = db.getPaymentAllocations(workspaceId).filter((a) => a.invoiceId === invoice.id);
  const verCases = db.getVerificationCases(workspaceId).filter((v) => v.invoiceId === invoice.id);

  return res.json({ invoice, payments, verificationCases: verCases });
});

// 3. Create Invoice (Deterministic Totals & Line Tax Calculation)
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId!;
    const {
      customerId,
      invoiceNumber,
      issueDate,
      dueDate,
      paymentTermsDays,
      poReference,
      items,
      discountRupees,
      notes,
    } = req.body;

    if (!customerId || !invoiceNumber || !issueDate) {
      return res.status(400).json({ error: 'Customer, Invoice Number, and Issue Date are required.' });
    }

    // Check duplicate invoice number
    const existing = db.getInvoices(workspaceId).find(
      (inv) => inv.invoiceNumber.trim().toLowerCase() === invoiceNumber.trim().toLowerCase()
    );
    if (existing) {
      return res.status(400).json({ error: `Invoice number "${invoiceNumber}" already exists.` });
    }

    const formattedLines = (items || []).map((item: any) => ({
      quantity: Number(item.quantity) || 1,
      unitPricePaise: rupeesToPaise(Number(item.unitPriceRupees) || 0),
      taxRatePercent: Number(item.taxRatePercent) || 18,
    }));

    const discountPaise = rupeesToPaise(Number(discountRupees) || 0);

    const totals = calculateInvoiceTotals(formattedLines, discountPaise, 0);

    const invId = `inv-${Date.now()}`;
    const newInvoice: Invoice = {
      id: invId,
      workspaceId,
      customerId,
      invoiceNumber,
      issueDate,
      dueDate: dueDate || issueDate,
      paymentTermsDays: Number(paymentTermsDays) || 30,
      poReference,
      subtotalPaise: totals.subtotalPaise,
      taxableAmountPaise: totals.taxableAmountPaise,
      cgstPaise: totals.cgstPaise,
      sgstPaise: totals.sgstPaise,
      igstPaise: totals.igstPaise,
      discountPaise,
      totalAmountPaise: totals.totalAmountPaise,
      receivedAmountPaise: 0,
      outstandingAmountPaise: totals.totalAmountPaise,
      status: 'open',
      notes,
      items: (items || []).map((item: any, idx: number) => ({
        id: `item-${invId}-${idx}`,
        invoiceId: invId,
        description: item.description || 'Goods / Services',
        hsnSac: item.hsnSac || '8471',
        quantity: Number(item.quantity) || 1,
        unit: item.unit || 'units',
        unitPricePaise: rupeesToPaise(Number(item.unitPriceRupees) || 0),
        taxRatePercent: Number(item.taxRatePercent) || 18,
        taxableAmountPaise: Math.round((Number(item.quantity) || 1) * rupeesToPaise(Number(item.unitPriceRupees) || 0)),
        cgstPaise: Math.round(
          (Math.round((Number(item.quantity) || 1) * rupeesToPaise(Number(item.unitPriceRupees) || 0)) * (Number(item.taxRatePercent) || 18)) / 200
        ),
        sgstPaise: Math.round(
          (Math.round((Number(item.quantity) || 1) * rupeesToPaise(Number(item.unitPriceRupees) || 0)) * (Number(item.taxRatePercent) || 18)) / 200
        ),
        igstPaise: 0,
        totalAmountPaise: Math.round(
          (Number(item.quantity) || 1) * rupeesToPaise(Number(item.unitPriceRupees) || 0) * (1 + (Number(item.taxRatePercent) || 18) / 100)
        ),
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addInvoice(newInvoice);

    db.addAuditLog({
      workspaceId,
      userEmail: req.user?.email || 'user',
      action: 'INVOICE_CREATED',
      entityType: 'invoice',
      entityId: invId,
      details: `Created Invoice #${invoiceNumber} for ${formatINR(totals.totalAmountPaise)}.`,
    });

    return res.status(201).json({ invoice: newInvoice });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create invoice.' });
  }
});

// 4. Record Manual Payment & Allocation
router.post('/:id/payments', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const invoiceId = req.params.id;
  const { amountRupees, paymentDate, paymentMode, referenceNumber, notes } = req.body;

  const invoice = db.getInvoices(workspaceId).find((i) => i.id === invoiceId);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found.' });
  }

  const paymentAmountPaise = rupeesToPaise(Number(amountRupees));
  if (paymentAmountPaise <= 0) {
    return res.status(400).json({ error: 'Payment amount must be greater than zero.' });
  }

  if (paymentAmountPaise > invoice.outstandingAmountPaise) {
    return res.status(400).json({
      error: `Payment of ${formatINR(paymentAmountPaise)} exceeds current outstanding balance of ${formatINR(invoice.outstandingAmountPaise)}. Over-allocation prevented.`,
    });
  }

  const payId = `pay-${Date.now()}`;
  const payment = db.addPayment({
    id: payId,
    workspaceId,
    paymentNumber: `REC-${Date.now().toString().slice(-6)}`,
    paymentType: 'incoming',
    paymentDate: paymentDate || new Date().toISOString().split('T')[0],
    amountPaise: paymentAmountPaise,
    allocatedAmountPaise: 0,
    unallocatedAmountPaise: paymentAmountPaise,
    paymentMode: paymentMode || 'bank_transfer',
    referenceNumber,
    customerId: invoice.customerId,
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const allocation = db.allocatePayment({
    id: `alloc-${Date.now()}`,
    workspaceId,
    paymentId: payId,
    invoiceId,
    amountPaise: paymentAmountPaise,
    createdAt: new Date().toISOString(),
  });

  db.addAuditLog({
    workspaceId,
    userEmail: req.user?.email || 'user',
    action: 'PAYMENT_RECORDED_AND_ALLOCATED',
    entityType: 'payment',
    entityId: payId,
    details: `Recorded receipt of ${formatINR(paymentAmountPaise)} allocated to Invoice #${invoice.invoiceNumber}.`,
  });

  const updatedInvoice = db.getInvoices(workspaceId).find((i) => i.id === invoiceId);

  return res.status(201).json({
    message: 'Payment allocated successfully.',
    payment,
    allocation,
    invoice: updatedInvoice,
  });
});

export default router;
