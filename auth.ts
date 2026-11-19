// ECONVYX AI — Authentication Routes (Clean Native JWT + Bcrypt)

import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';
import { User } from '../types/index.js';
import { JWT_SECRET } from '../config.js';

const router = Router();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
}

function formatUserResponse(user: User, token: string) {
  const workspaces = db.getWorkspacesByUserId(user.id);
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
    },
    workspaces,
    activeWorkspaceId: workspaces[0]?.id || null,
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = db.getUsers().find((u) => u.id === decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found. Please sign in again.' });
    (req as any).currentUser = user;
    return next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { email, fullName, password } = req.body;

  if (!email || !fullName || !password) {
    return res.status(400).json({ error: 'Email, full name, and password are required.' });
  }
  if (typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.getUsers().find((u) => u.email === normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const newUser: User = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email: normalizedEmail,
      fullName: fullName.trim(),
      passwordHash,
      role: 'owner',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.getUsers().push(newUser);
    db.save();

    db.addAuditLog({
      workspaceId: 'global',
      userEmail: newUser.email,
      action: 'USER_REGISTERED',
      entityType: 'user',
      entityId: newUser.id,
      details: `New user registered: ${newUser.fullName} (${newUser.email})`,
    });

    const token = generateToken(newUser.id);
    return res.status(201).json(formatUserResponse(newUser, token));
  } catch (err) {
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = db.getUsers().find((u) => u.email === normalizedEmail);

  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  try {
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    db.addAuditLog({
      workspaceId: 'global',
      userEmail: user.email,
      action: 'USER_SIGNED_IN',
      entityType: 'user',
      entityId: user.id,
      details: `User signed in: ${user.email}`,
    });

    const token = generateToken(user.id);
    return res.json(formatUserResponse(user, token));
  } catch (err) {
    return res.status(500).json({ error: 'Sign in failed. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).currentUser as User;
  const workspaces = db.getWorkspacesByUserId(user.id);
  return res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
    },
    workspaces,
    activeWorkspaceId: workspaces[0]?.id || null,
  });
});

export default router;
