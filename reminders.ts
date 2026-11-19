// Smart Payment Reminders Routes

import { Router, Response } from 'express';
import { AuthenticatedRequest, tenantAuthMiddleware } from '../middleware/auth.js';
import { db } from '../db/database.js';
import { generatePaymentReminderDraft, ReminderTone } from '../services/reminderService.js';
import { Reminder } from '../types/index.js';

const router = Router();
router.use(tenantAuthMiddleware);

// 1. Get Reminders List & Overdue/Upcoming Target Invoices
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const reminders = db.getReminders(workspaceId);
  const invoices = db.getInvoices(workspaceId);
  const today = new Date().toISOString().split('T')[0];

  const overdueInvoices = invoices.filter(
    (inv) => inv.outstandingAmountPaise > 0 && inv.dueDate < today && inv.status !== 'paid'
  );

  const upcomingInvoices = invoices.filter(
    (inv) => inv.outstandingAmountPaise > 0 && inv.dueDate >= today
  );

  return res.json({
    reminders,
    overdueInvoices,
    upcomingInvoices,
  });
});

// 2. Generate a Personalized Reminder Draft
router.post('/generate-draft', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const { invoiceId, tone } = req.body;

  const invoice = db.getInvoices(workspaceId).find((i) => i.id === invoiceId);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found.' });
  }

  const customer = db.getCustomers(workspaceId).find((c) => c.id === invoice.customerId);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found.' });
  }

  const draft = generatePaymentReminderDraft(invoice, customer, (tone as ReminderTone) || 'professional');

  const newReminder: Reminder = {
    id: `rem-${Date.now()}`,
    workspaceId,
    invoiceId,
    customerId: customer.id,
    tone: draft.tone,
    subject: draft.subject,
    messageBody: draft.messageBody,
    status: 'draft',
    createdAt: new Date().toISOString(),
  };

  db.addReminder(newReminder);

  db.addAuditLog({
    workspaceId,
    userEmail: req.user?.email || 'user',
    action: 'REMINDER_DRAFT_GENERATED',
    entityType: 'reminder',
    entityId: newReminder.id,
    details: `Generated ${tone} tone payment reminder draft for ${customer.name} (Invoice #${invoice.invoiceNumber}).`,
  });

  return res.status(201).json({ draft, reminder: newReminder });
});

export default router;
