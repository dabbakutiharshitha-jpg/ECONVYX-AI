// Unit Tests for Document Verification Engine

import { describe, it, expect } from 'vitest';
import { runDeterministicVerification } from '../../server/services/verificationEngine.js';
import { Invoice, PurchaseOrder } from '../../server/types/index.js';

describe('Document Verification Engine - 3-Way Matching', () => {
  it('detects exact quantity discrepancy from Master Prompt (100 units vs 120 units)', () => {
    const po: PurchaseOrder = {
      id: 'po-test-1',
      workspaceId: 'ws-1',
      poNumber: 'PO-2026-001',
      poDate: '2026-01-10',
      totalValuePaise: 50000000, // ₹5,00,000 (100 units * ₹5,000)
      status: 'active',
      items: [
        {
          id: 'poi-1',
          poId: 'po-test-1',
          description: 'Precision Fasteners M12',
          quantity: 100,
          unitPricePaise: 500000, // ₹5,000
          totalAmountPaise: 50000000,
        },
      ],
      createdAt: '2026-01-10T00:00:00Z',
    };

    const invoice: Invoice = {
      id: 'inv-test-1',
      workspaceId: 'ws-1',
      customerId: 'cust-1',
      invoiceNumber: 'INV-101',
      issueDate: '2026-01-15',
      dueDate: '2026-02-14',
      paymentTermsDays: 30,
      subtotalPaise: 60000000,
      taxableAmountPaise: 60000000,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      discountPaise: 0,
      totalAmountPaise: 60000000, // ₹6,00,000 (120 units * ₹5,000)
      receivedAmountPaise: 0,
      outstandingAmountPaise: 60000000,
      status: 'open',
      items: [
        {
          id: 'item-1',
          invoiceId: 'inv-test-1',
          description: 'Precision Fasteners M12',
          quantity: 120, // 20 units excess
          unit: 'units',
          unitPricePaise: 500000,
          taxRatePercent: 0,
          taxableAmountPaise: 60000000,
          cgstPaise: 0,
          sgstPaise: 0,
          igstPaise: 0,
          totalAmountPaise: 60000000,
        },
      ],
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-01-15T00:00:00Z',
    };

    const verification = runDeterministicVerification('ws-1', {
      invoice,
      purchaseOrder: po,
    });

    expect(verification.status).toBe('mismatch');
    expect(verification.monetaryImpactPaise).toBe(10000000); // Net variance of ₹1,00,000 exactly
    const qtyFinding = verification.findings.find((f) => f.fieldName.includes('Quantity'));
    expect(qtyFinding).toBeDefined();
    expect(qtyFinding?.expectedValue).toBe('100 units');
    expect(qtyFinding?.actualValue).toBe('120 units');
    expect(qtyFinding?.monetaryDifferencePaise).toBe(10000000); // 20 * ₹5,000 = ₹1,00,000
  });

  it('verifies matching documents with zero discrepancies', () => {
    const po: PurchaseOrder = {
      id: 'po-test-2',
      workspaceId: 'ws-1',
      poNumber: 'PO-2026-002',
      poDate: '2026-01-10',
      totalValuePaise: 50000000,
      status: 'active',
      items: [
        {
          id: 'poi-2',
          poId: 'po-test-2',
          description: 'Precision Fasteners M12',
          quantity: 100,
          unitPricePaise: 500000,
          totalAmountPaise: 50000000,
        },
      ],
      createdAt: '2026-01-10T00:00:00Z',
    };

    const invoice: Invoice = {
      id: 'inv-test-2',
      workspaceId: 'ws-1',
      customerId: 'cust-1',
      invoiceNumber: 'INV-102',
      issueDate: '2026-01-15',
      dueDate: '2026-02-14',
      paymentTermsDays: 30,
      subtotalPaise: 50000000,
      taxableAmountPaise: 50000000,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      discountPaise: 0,
      totalAmountPaise: 50000000,
      receivedAmountPaise: 0,
      outstandingAmountPaise: 50000000,
      status: 'open',
      items: [
        {
          id: 'item-2',
          invoiceId: 'inv-test-2',
          description: 'Precision Fasteners M12',
          quantity: 100,
          unit: 'units',
          unitPricePaise: 500000,
          taxRatePercent: 0,
          taxableAmountPaise: 50000000,
          cgstPaise: 0,
          sgstPaise: 0,
          igstPaise: 0,
          totalAmountPaise: 50000000,
        },
      ],
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-01-15T00:00:00Z',
    };

    const verification = runDeterministicVerification('ws-1', {
      invoice,
      purchaseOrder: po,
    });

    expect(verification.status).toBe('verified');
    expect(verification.findings.length).toBe(0);
    expect(verification.monetaryImpactPaise).toBe(0);
  });
});
