// Bank Reconciliation Routes

import { Router, Response } from 'express';
import multer from 'multer';
import { AuthenticatedRequest, tenantAuthMiddleware } from '../middleware/auth.js';
import { db } from '../db/database.js';
import { generateReconciliationSuggestions } from '../services/reconciliationEngine.js';
import { formatINR, rupeesToPaise } from '../services/financialEngine.js';
import { BankTransaction } from '../types/index.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();
router.use(tenantAuthMiddleware);

// 1. Get Bank Transactions & Real-time Reconciliation Suggestions
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const transactions = db.getBankTransactions(workspaceId);
  const invoices = db.getInvoices(workspaceId);
  const bills = db.getBills(workspaceId);

  // Generate automated deterministic matching suggestions for unmatched items
  const suggestions = generateReconciliationSuggestions(transactions, invoices, bills);

  // Stats
  const totalCount = transactions.length;
  const matchedCount = transactions.filter((t) => t.reconciliationStatus === 'matched').length;
  const suggestedCount = transactions.filter((t) => t.reconciliationStatus === 'suggested').length;
  const unmatchedCount = transactions.filter((t) => t.reconciliationStatus === 'unmatched').length;

  return res.json({
    transactions,
    suggestions,
    stats: {
      totalCount,
      matchedCount,
      suggestedCount,
      unmatchedCount,
      reconciliationRatePercent: totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0,
    },
  });
});

// 2. Upload CSV Bank Statement & Parse Lines
router.post('/upload-csv', upload.single('file'), (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No CSV statement file uploaded.' });
  }

  const csvContent = file.buffer.toString('utf-8');
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return res.status(400).json({ error: 'CSV file is empty or missing headers.' });
  }

  // Parse lines (handles simple CSV with Date, Description, Reference, Debit, Credit, Balance)
  const headerLine = lines[0].toLowerCase();
  const parsedTxns: BankTransaction[] = [];
  const today = new Date().toISOString().split('T')[0];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 3) continue;

    const dateStr = cols[0] || today;
    const desc = cols[1] || 'Bank Transaction';
    const ref = cols[2] || `REF-${Date.now().toString().slice(-6)}`;
    const creditVal = parseFloat(cols[3] || '0');
    const debitVal = parseFloat(cols[4] || '0');

    const isCredit = creditVal > 0;
    const amountRupees = isCredit ? creditVal : (debitVal > 0 ? debitVal : 50000);
    const amountPaise = rupeesToPaise(amountRupees);

    const newTxn: BankTransaction = {
      id: `btxn-${Date.now()}-${i}`,
      workspaceId,
      transactionDate: dateStr,
      description: desc,
      referenceNumber: ref,
      type: isCredit ? 'credit' : 'debit',
      amountPaise,
      reconciliationStatus: 'unmatched',
      matchConfidence: 0,
      createdAt: new Date().toISOString(),
    };

    db.addBankTransaction(newTxn);
    parsedTxns.push(newTxn);
  }

  db.addAuditLog({
    workspaceId,
    userEmail: req.user?.email || 'user',
    action: 'BANK_CSV_IMPORTED',
    entityType: 'bank_statement',
    entityId: `import-${Date.now()}`,
    details: `Imported and parsed ${parsedTxns.length} bank transactions from ${file.originalname}.`,
  });

  return res.status(201).json({
    message: `Successfully imported ${parsedTxns.length} transactions.`,
    importedCount: parsedTxns.length,
  });
});

// 3. Confirm Match (Human Approval -> Deterministically allocates and updates ledger)
router.post('/confirm-match', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const { transactionId, invoiceId, billId } = req.body;

  const txn = db.getBankTransactions(workspaceId).find((t) => t.id === transactionId);
  if (!txn) {
    return res.status(404).json({ error: 'Bank transaction not found.' });
  }

  if (txn.reconciliationStatus === 'matched') {
    return res.status(400).json({ error: 'Transaction is already confirmed and reconciled.' });
  }

  if (txn.type === 'credit' && invoiceId) {
    const invoice = db.getInvoices(workspaceId).find((i) => i.id === invoiceId);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

    // Ensure allocation does not exceed outstanding
    const allocAmountPaise = Math.min(txn.amountPaise, invoice.outstandingAmountPaise);

    // Create Payment Record
    const payment = db.addPayment({
      id: `pay-rec-${Date.now()}`,
      workspaceId,
      paymentNumber: `REC-${Date.now().toString().slice(-6)}`,
      paymentType: 'incoming',
      paymentDate: txn.transactionDate,
      amountPaise: txn.amountPaise,
      allocatedAmountPaise: allocAmountPaise,
      unallocatedAmountPaise: Math.max(0, txn.amountPaise - allocAmountPaise),
      paymentMode: 'bank_transfer',
      referenceNumber: txn.referenceNumber,
      customerId: invoice.customerId,
      notes: `Reconciled from bank transaction: ${txn.description}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Allocate payment
    db.allocatePayment({
      id: `alloc-rec-${Date.now()}`,
      workspaceId,
      paymentId: payment.id,
      invoiceId: invoice.id,
      amountPaise: allocAmountPaise,
      createdAt: new Date().toISOString(),
    });

    // Update Transaction status to Matched
    const updatedTxn = db.updateBankTransaction(transactionId, {
      reconciliationStatus: 'matched',
      matchedInvoiceId: invoice.id,
      matchedPaymentId: payment.id,
      matchReason: `Confirmed match with Invoice #${invoice.invoiceNumber}. ${formatINR(allocAmountPaise)} allocated.`,
    });

    db.addAuditLog({
      workspaceId,
      userEmail: req.user?.email || 'user',
      action: 'RECONCILIATION_MATCH_CONFIRMED',
      entityType: 'bank_transaction',
      entityId: transactionId,
      details: `Reconciled credit of ${formatINR(txn.amountPaise)} with Invoice #${invoice.invoiceNumber}. Outstanding updated.`,
    });

    return res.json({ message: 'Transaction matched and reconciled successfully.', transaction: updatedTxn });
  } else if (txn.type === 'debit' && billId) {
    const bill = db.getBills(workspaceId).find((b) => b.id === billId);
    if (!bill) return res.status(404).json({ error: 'Supplier bill not found.' });

    const allocAmountPaise = Math.min(txn.amountPaise, bill.outstandingAmountPaise);

    const payment = db.addPayment({
      id: `pay-bill-${Date.now()}`,
      workspaceId,
      paymentNumber: `PAY-${Date.now().toString().slice(-6)}`,
      paymentType: 'outgoing',
      paymentDate: txn.transactionDate,
      amountPaise: txn.amountPaise,
      allocatedAmountPaise: allocAmountPaise,
      unallocatedAmountPaise: Math.max(0, txn.amountPaise - allocAmountPaise),
      paymentMode: 'bank_transfer',
      referenceNumber: txn.referenceNumber,
      supplierId: bill.supplierId,
      notes: `Reconciled from bank statement: ${txn.description}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    db.allocatePayment({
      id: `alloc-bill-${Date.now()}`,
      workspaceId,
      paymentId: payment.id,
      billId: bill.id,
      amountPaise: allocAmountPaise,
      createdAt: new Date().toISOString(),
    });

    const updatedTxn = db.updateBankTransaction(transactionId, {
      reconciliationStatus: 'matched',
      matchedBillId: bill.id,
      matchedPaymentId: payment.id,
      matchReason: `Confirmed match with Bill #${bill.billNumber}.`,
    });

    db.addAuditLog({
      workspaceId,
      userEmail: req.user?.email || 'user',
      action: 'RECONCILIATION_MATCH_CONFIRMED',
      entityType: 'bank_transaction',
      entityId: transactionId,
      details: `Reconciled debit of ${formatINR(txn.amountPaise)} with Bill #${bill.billNumber}.`,
    });

    return res.json({ message: 'Bill payment reconciled successfully.', transaction: updatedTxn });
  }

  return res.status(400).json({ error: 'Valid matching invoice or bill ID required.' });
});

// 4. Reject / Ignore Transaction
router.post('/reject-match', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const { transactionId, reason } = req.body;

  const txn = db.getBankTransactions(workspaceId).find((t) => t.id === transactionId);
  if (!txn) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }

  const updatedTxn = db.updateBankTransaction(transactionId, {
    reconciliationStatus: 'unmatched',
    matchedInvoiceId: undefined,
    matchConfidence: 0,
    matchReason: reason || 'Match suggestion dismissed by user.',
  });

  return res.json({ message: 'Match dismissed.', transaction: updatedTxn });
});

export default router;
