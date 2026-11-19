// ECONVYX AI - Master Express API Server
// Turn financial complexity into clarity.

import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import session from 'express-session';
import { CLIENT_ORIGINS } from './config.js';

// Load environment variables FIRST before any imports that read them
dotenv.config();

// Import Routes (after dotenv so env vars are available)
import authRouter from './routes/auth.js';
import workspacesRouter from './routes/workspaces.js';
import overviewRouter from './routes/overview.js';
import documentsRouter from './routes/documents.js';
import verificationRouter from './routes/verification.js';
import receivablesRouter from './routes/receivables.js';
import payablesRouter from './routes/payables.js';
import customersRouter from './routes/customers.js';
import suppliersRouter from './routes/suppliers.js';
import reconciliationRouter from './routes/reconciliation.js';
import cashflowRouter from './routes/cashflow.js';
import aiAssistantRouter from './routes/aiAssistant.js';
import remindersRouter from './routes/reminders.js';
import insightsRouter from './routes/insights.js';
import reportsRouter from './routes/reports.js';
import auditRouter from './routes/audit.js';
import settingsRouter from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middlewares
app.use(cors({
  origin(origin, callback) {
    if (!origin || process.env.NODE_ENV !== 'production' || CLIENT_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origin is not allowed by CORS.'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-workspace-id'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Uploaded documents are served only by authenticated, workspace-scoped routes.

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    product: 'ECONVYX AI',
    tagline: 'Turn financial complexity into clarity.',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount Modular API Routes
app.use('/api/auth', authRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api/overview', overviewRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/receivables', receivablesRouter);
app.use('/api/payables', payablesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/reconciliation', reconciliationRouter);
app.use('/api/cashflow', cashflowRouter);
app.use('/api/ai-assistant', aiAssistantRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/settings', settingsRouter);

// Serve frontend in production
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next();
  });
});

// Centralized Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 ECONVYX AI Platform Backend is operational`);
  console.log(`⚡ Port: ${PORT} | Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Tenant Isolation & Deterministic Engine: ACTIVE`);
  console.log(`=======================================================`);
});

export default app;
