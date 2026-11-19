// Suppliers Management Routes

import { Router, Response } from 'express';
import { AuthenticatedRequest, tenantAuthMiddleware } from '../middleware/auth.js';
import { db } from '../db/database.js';
import { formatINR } from '../services/financialEngine.js';
import { Supplier } from '../types/index.js';

const router = Router();
router.use(tenantAuthMiddleware);

// 1. List Suppliers with Payables Summary
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const suppliers = db.getSuppliers(workspaceId);
  const bills = db.getBills(workspaceId);

  const supplierSummaries = suppliers.map((supplier) => {
    const suppBills = bills.filter((b) => b.supplierId === supplier.id);
    const totalBilledPaise = suppBills.reduce((sum, b) => sum + b.totalAmountPaise, 0);
    const totalPaidPaise = suppBills.reduce((sum, b) => sum + b.paidAmountPaise, 0);
    const outstandingPaise = suppBills.reduce((sum, b) => sum + b.outstandingAmountPaise, 0);

    return {
      ...supplier,
      financialSummary: {
        totalBilledPaise,
        totalBilledFormatted: formatINR(totalBilledPaise),
        totalPaidPaise,
        totalPaidFormatted: formatINR(totalPaidPaise),
        outstandingPaise,
        outstandingFormatted: formatINR(outstandingPaise),
        billCount: suppBills.length,
      },
    };
  });

  return res.json({ suppliers: supplierSummaries });
});

// 2. Create Supplier
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const { name, contactPerson, email, phone, gstin, address, paymentTermsDays, notes } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Supplier name is required.' });
  }

  const newSupplier: Supplier = {
    id: `supp-${Date.now()}`,
    workspaceId,
    name,
    contactPerson,
    email,
    phone,
    gstin,
    address,
    paymentTermsDays: Number(paymentTermsDays) || 30,
    notes,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.addSupplier(newSupplier);

  db.addAuditLog({
    workspaceId,
    userEmail: req.user?.email || 'user',
    action: 'SUPPLIER_CREATED',
    entityType: 'supplier',
    entityId: newSupplier.id,
    details: `Added new supplier profile: ${newSupplier.name}.`,
  });

  return res.status(201).json({ supplier: newSupplier });
});

export default router;
