// Business Workspaces & 5-Step Onboarding Routes

import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, tenantAuthMiddleware } from '../middleware/auth.js';
import { requireAuth } from './auth.js';
import { db } from '../db/database.js';
import { BusinessWorkspace, WorkspaceMember } from '../types/index.js';
import { JWT_SECRET } from '../config.js';

const router = Router();
// GET /api/workspaces — List workspaces belonging to the authenticated user
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = (req as any).currentUser;
  const workspaces = db.getWorkspacesByUserId(user.id);
  return res.json({ workspaces });
});

// POST /api/workspaces/onboarding — Complete workspace creation after registration
router.post('/onboarding', (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  let userId: string;
  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET) as { userId: string };
    userId = decoded.userId;
  } catch {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }

  const user = db.getUsers().find((u) => u.id === userId);
  if (!user) return res.status(401).json({ error: 'User not found.' });

  const {
    name,
    businessType,
    industry,
    gstin,
    pan,
    address,
    city,
    state,
    pinCode,
    defaultCurrency,
    financialYearStart,
    defaultPaymentTermsDays,
    timezone,
  } = req.body;

  if (!name || !businessType) {
    return res.status(400).json({ error: 'Business name and type are required.' });
  }

  const workspaceId = `ws-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const newWorkspace: BusinessWorkspace = {
    id: workspaceId,
    name,
    slug,
    businessType: businessType || 'manufacturing',
    industry: industry || 'Manufacturing & Wholesale',
    gstin,
    pan,
    address,
    city,
    state,
    pinCode,
    defaultCurrency: defaultCurrency || 'INR',
    financialYearStart: financialYearStart || '04-01',
    defaultPaymentTermsDays: Number(defaultPaymentTermsDays) || 30,
    timezone: timezone || 'Asia/Kolkata',
    isDemo: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.addWorkspace(newWorkspace);

  // Create WorkspaceMember record linking user to workspace as owner
  const member: WorkspaceMember = {
    id: `wm-${Date.now()}`,
    workspaceId,
    userId: user.id,
    role: 'owner',
    createdAt: new Date().toISOString(),
  };
  db.getWorkspaceMembers().push(member);
  db.save();

  db.addAuditLog({
    workspaceId: newWorkspace.id,
    userEmail: user.email,
    action: 'BUSINESS_WORKSPACE_ONBOARDED',
    entityType: 'business_workspace',
    entityId: newWorkspace.id,
    details: `${user.fullName} completed onboarding for "${newWorkspace.name}" (${newWorkspace.businessType}).`,
  });

  return res.status(201).json({
    message: 'Workspace successfully configured.',
    workspace: newWorkspace,
    workspaces: db.getWorkspacesByUserId(user.id),
    activeWorkspaceId: newWorkspace.id,
  });
});

export default router;
