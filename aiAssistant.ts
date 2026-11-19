// ECONVYX Intelligence - Conversational AI Assistant Routes

import { Router, Response } from 'express';
import { AuthenticatedRequest, tenantAuthMiddleware } from '../middleware/auth.js';
import { db } from '../db/database.js';
import { processAssistantQuery } from '../services/aiAssistantService.js';

const router = Router();
router.use(tenantAuthMiddleware);

router.post('/query', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId!;
    const { question } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const workspace = db.getWorkspace(workspaceId);
    const invoices = db.getInvoices(workspaceId);
    const bills = db.getBills(workspaceId);
    const customers = db.getCustomers(workspaceId);
    const bankTransactions = db.getBankTransactions(workspaceId);
    const verificationCases = db.getVerificationCases(workspaceId);

    const response = await processAssistantQuery(question, {
      workspaceName: workspace?.name || 'Your Business',
      invoices,
      bills,
      customers,
      bankTransactions,
      verificationCases,
    });

    return res.json(response);
  } catch (err: any) {
    console.error('AI assistant processing error:', err);
    return res.status(500).json({ error: err.message || 'AI assistant error.' });
  }
});

router.get('/prompts', (req: AuthenticatedRequest, res: Response) => {
  const suggestedPrompts = [
    { title: 'Overdue Summary', query: 'Show my overdue receivables.' },
    { title: 'Flagged Discrepancies', query: 'Explain my biggest invoice discrepancy.' },
    { title: 'Cash Position', query: 'What is my expected cash position in 30 days?' },
    { title: 'Unreconciled Bank Transactions', query: 'Identify unreconciled payments.' },
    { title: 'Draft Payment Reminders', query: 'Draft reminders for overdue customers.' },
    { title: 'Risk Analysis', query: 'Which customer pays late most frequently?' },
  ];
  return res.json({ suggestedPrompts });
});

export default router;
