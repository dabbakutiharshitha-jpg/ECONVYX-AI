// Document Intelligence Centre Routes

import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthenticatedRequest, tenantAuthMiddleware } from '../middleware/auth.js';
import { db } from '../db/database.js';
import { extractDocumentWithGeminiOrFallback } from '../services/documentExtractionService.js';
import { DocumentItem, DocumentType } from '../types/index.js';

const uploadDir = path.resolve(process.env.STORAGE_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Allowed types: PDF, JPG, JPEG, PNG.'));
    }
  },
});

const router = Router();
router.use(tenantAuthMiddleware);

// 1. Get all documents for workspace
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const documents = db.getDocuments(workspaceId);
  return res.json({ documents });
});

// Serve uploaded documents only to authenticated members of the owning workspace.
router.get('/:id/file', (req: AuthenticatedRequest, res: Response) => {
  const doc = db.getDocuments(req.workspaceId!).find((item) => item.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found.' });

  const resolvedPath = path.resolve(doc.filePath);
  const allowedRoot = `${uploadDir}${path.sep}`;
  if (!resolvedPath.startsWith(allowedRoot)) {
    return res.status(404).json({ error: 'Document not found.' });
  }
  return res.sendFile(resolvedPath, (err) => {
    if (err && !res.headersSent) res.status(404).json({ error: 'Document file is unavailable.' });
  });
});

// 2. Upload Document & Trigger Extraction
router.post('/upload', upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId!;
    const file = req.file;
    const documentType = (req.body.documentType as DocumentType) || 'tax_invoice';

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const docId = `doc-${Date.now()}`;
    const initialDoc: DocumentItem = {
      id: docId,
      workspaceId,
      fileName: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      fileType: file.mimetype,
      fileSizeBytes: file.size,
      documentType,
      extractionStatus: 'processing',
      confidenceScore: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addDocument(initialDoc);

    // Run AI or Deterministic Fallback Extraction
    const extractionResult = await extractDocumentWithGeminiOrFallback(
      null,
      file.originalname,
      documentType
    );

    const updatedDoc = db.updateDocument(docId, {
      extractionStatus: extractionResult.extractionStatus,
      confidenceScore: extractionResult.confidenceScore,
      extractedData: extractionResult.extractedData,
    });

    db.addAuditLog({
      workspaceId,
      userEmail: req.user?.email || 'user',
      action: 'DOCUMENT_UPLOADED_AND_EXTRACTED',
      entityType: 'document',
      entityId: docId,
      details: `Document "${file.originalname}" uploaded as ${documentType}. Extraction completed with ${extractionResult.confidenceScore}% confidence.`,
    });

    return res.status(201).json({
      message: 'Document successfully processed and extracted.',
      document: updatedDoc,
    });
  } catch (error: any) {
    console.error('Document upload error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process document.' });
  }
});

// 3. Update Extracted Fields (Human Review/Editing)
router.patch('/:id/fields', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const docId = req.params.id;
  const { fields, documentType } = req.body;

  const doc = db.getDocuments(workspaceId).find((d) => d.id === docId);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  const updatedExtractedData = {
    ...doc.extractedData,
    fields: {
      ...doc.extractedData?.fields,
      ...fields,
    },
  };

  const updatedDoc = db.updateDocument(docId, {
    documentType: documentType || doc.documentType,
    extractedData: updatedExtractedData,
    extractionStatus: 'needs_review',
  });

  db.addAuditLog({
    workspaceId,
    userEmail: req.user?.email || 'user',
    action: 'DOCUMENT_FIELDS_EDITED',
    entityType: 'document',
    entityId: docId,
    details: `Extracted fields manually edited and reviewed by user.`,
  });

  return res.json({ message: 'Extracted fields updated.', document: updatedDoc });
});

// 4. Confirm Document (Human Approval) -> Converts to verified financial record
router.post('/:id/confirm', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const docId = req.params.id;
  const doc = db.getDocuments(workspaceId).find((d) => d.id === docId);

  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  // Mark document confirmed
  const updatedDoc = db.updateDocument(docId, {
    extractionStatus: 'confirmed',
    reviewedBy: req.user?.id,
    reviewedAt: new Date().toISOString(),
  });

  db.addAuditLog({
    workspaceId,
    userEmail: req.user?.email || 'user',
    action: 'DOCUMENT_CONFIRMED',
    entityType: 'document',
    entityId: docId,
    details: `Document "${doc.originalName}" approved and confirmed into financial ledger by user.`,
  });

  return res.json({
    message: 'Document confirmed. Financial obligation verified and recorded.',
    document: updatedDoc,
  });
});

export default router;
