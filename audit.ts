// Activity & Audit Trail Routes

import { Router, Response } from 'express';
import { AuthenticatedRequest, tenantAuthMiddleware } from '../middleware/auth.js';
import { db } from '../db/database.js';

const router = Router();
router.use(tenantAuthMiddleware);

router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const { action, entityType, search } = req.query;

  let logs = db.getAuditLogs(workspaceId);

  if (action && action !== 'all') {
    logs = logs.filter((l) => l.action === action);
  }

  if (entityType && entityType !== 'all') {
    logs = logs.filter((l) => l.entityType === entityType);
  }

  if (search) {
    const q = (search as string).toLowerCase();
    logs = logs.filter((l) => l.details.toLowerCase().includes(q) || l.action.toLowerCase().includes(q));
  }

  return res.json({ logs });
});

export default router;
