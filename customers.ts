// Customers Intelligence Routes

import { Router, Response } from 'express';
import { AuthenticatedRequest, tenantAuthMiddleware } from '../middleware/auth.js';
import { db } from '../db/database.js';
import { evaluateCustomerPaymentBehavior, formatINR, rupeesToPaise } from '../services/financialEngine.js';
import { Customer } from '../types/index.js';

const router = Router();
router.use(tenantAuthMiddleware);

// 1. List Customers with Computed Financial Profiles & Risk Behavior
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const customers = db.getCustomers(workspaceId);
  const invoices = db.getInvoices(workspaceId);

  const customerProfiles = customers.map((customer) => {
    const custInvoices = invoices.filter((i) => i.customerId === customer.id);
    const behaviorProfile = evaluateCustomerPaymentBehavior(custInvoices);

    return {
      ...customer,
      profile: {
        totalInvoicedPaise: behaviorProfile.totalInvoicedPaise,
        totalInvoicedFormatted: formatINR(behaviorProfile.totalInvoicedPaise),
        totalReceivedPaise: behaviorProfile.totalReceivedPaise,
        totalReceivedFormatted: formatINR(behaviorProfile.totalReceivedPaise),
        currentOutstandingPaise: behaviorProfile.currentOutstandingPaise,
        currentOutstandingFormatted: formatINR(behaviorProfile.currentOutstandingPaise),
        overduePaise: behaviorProfile.overduePaise,
        overdueFormatted: formatINR(behaviorProfile.overduePaise),
        invoiceCount: behaviorProfile.invoiceCount,
        paymentCompletionPercentage: behaviorProfile.paymentCompletionPercentage,
        onTimePercentage: behaviorProfile.onTimePercentage,
        behavior: behaviorProfile.behavior,
        rationale: behaviorProfile.rationale,
      },
    };
  });

  return res.json({ customers: customerProfiles });
});

// 2. Get Single Customer Profile & History
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const customer = db.getCustomers(workspaceId).find((c) => c.id === req.params.id);

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found.' });
  }

  const invoices = db.getInvoices(workspaceId).filter((i) => i.customerId === customer.id);
  const behaviorProfile = evaluateCustomerPaymentBehavior(invoices);
  const verCases = db.getVerificationCases(workspaceId).filter(
    (v) => v.invoice?.customerId === customer.id
  );

  return res.json({
    customer,
    profile: behaviorProfile,
    invoices,
    verificationCases: verCases,
  });
});

// 3. Create Customer
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const { name, companyName, email, phone, gstin, billingAddress, paymentTermsDays, creditLimitRupees, notes } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Customer name is required.' });
  }

  const newCustomer: Customer = {
    id: `cust-${Date.now()}`,
    workspaceId,
    name,
    companyName: companyName || name,
    email,
    phone,
    gstin,
    billingAddress,
    paymentTermsDays: Number(paymentTermsDays) || 30,
    creditLimitPaise: creditLimitRupees ? rupeesToPaise(Number(creditLimitRupees)) : 0,
    notes,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.addCustomer(newCustomer);

  db.addAuditLog({
    workspaceId,
    userEmail: req.user?.email || 'user',
    action: 'CUSTOMER_CREATED',
    entityType: 'customer',
    entityId: newCustomer.id,
    details: `Added new customer profile: ${newCustomer.name}.`,
  });

  return res.status(201).json({ customer: newCustomer });
});

export default router;
