// Verification Centre Routes (PO <-> GRN <-> Delivery Ack <-> Invoice)

import { Router, Response } from 'express';
import { AuthenticatedRequest, tenantAuthMiddleware } from '../middleware/auth.js';
import { db } from '../db/database.js';
import { runDeterministicVerification } from '../services/verificationEngine.js';
import { formatINR } from '../services/financialEngine.js';

const router = Router();
router.use(tenantAuthMiddleware);

// 1. Get all verification cases
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const cases = db.getVerificationCases(workspaceId);
  return res.json({ cases });
});

// 2. Trigger verification for an invoice
router.post('/run', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const { invoiceId, poId, grnId } = req.body;

  const invoice = db.getInvoices(workspaceId).find((i) => i.id === invoiceId);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found.' });
  }

  const purchaseOrder = poId ? db.getPurchaseOrders(workspaceId).find((p) => p.id === poId) : undefined;
  const grn = grnId ? db.getGoodsReceiptNotes(workspaceId).find((g) => g.id === grnId) : undefined;

  const verificationCase = runDeterministicVerification(workspaceId, {
    invoice,
    purchaseOrder,
    grn,
  });

  db.addVerificationCase(verificationCase);

  db.addAuditLog({
    workspaceId,
    userEmail: req.user?.email || 'user',
    action: 'VERIFICATION_EXECUTED',
    entityType: 'verification_case',
    entityId: verificationCase.id,
    details: `Executed deterministic matching for Invoice ${invoice.invoiceNumber}. Result: ${verificationCase.status} (${formatINR(verificationCase.monetaryImpactPaise)} impact).`,
  });

  return res.status(201).json({ verificationCase });
});

// 3. Resolve / Update Verification Case (Human decision)
router.post('/:id/resolve', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const caseId = req.params.id;
  const { action, comments, reason } = req.body;
  // action: 'accept_with_explanation' | 'reject' | 'request_correction' | 'mark_disputed' | 'resolved'

  const verCase = db.getVerificationCases(workspaceId).find((c) => c.id === caseId);
  if (!verCase) {
    return res.status(404).json({ error: 'Verification case not found.' });
  }

  let newStatus = verCase.status;
  if (action === 'accept_with_explanation') newStatus = 'verified';
  else if (action === 'reject') newStatus = 'mismatch';
  else if (action === 'request_correction') newStatus = 'needs_review';
  else if (action === 'mark_disputed') newStatus = 'disputed';
  else if (action === 'resolved') newStatus = 'verified';

  const updatedCase = db.updateVerificationCase(caseId, {
    status: newStatus,
    reviewerComments: comments || reason,
    resolvedAt: new Date().toISOString(),
  });

  // If marked disputed or verified, update invoice status accordingly
  if (verCase.invoiceId) {
    if (newStatus === 'disputed') {
      db.updateInvoice(verCase.invoiceId, { status: 'disputed' });
    } else if (newStatus === 'verified' && verCase.invoice?.status === 'disputed') {
      db.updateInvoice(verCase.invoiceId, { status: 'open' });
    }
  }

  db.addAuditLog({
    workspaceId,
    userEmail: req.user?.email || 'user',
    action: `VERIFICATION_${action.toUpperCase()}`,
    entityType: 'verification_case',
    entityId: caseId,
    details: `Human reviewer performed action: ${action}. Reason: ${comments || reason || 'N/A'}. Status updated to: ${newStatus}.`,
  });

  return res.json({ message: 'Verification case updated.', case: updatedCase });
});

export default router;
