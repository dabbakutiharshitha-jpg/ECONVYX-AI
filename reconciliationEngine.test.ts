// Unit Tests for Bank Reconciliation Engine

import { describe, it, expect } from 'vitest';
import { scoreTransactionMatch, generateReconciliationSuggestions } from '../../server/services/reconciliationEngine.js';
import { BankTransaction, Invoice } from '../../server/types/index.js';

describe('Bank Reconciliation Engine', () => {
  it('correctly scores an exact match with reference number in bank statement narration', () => {
    const txn: BankTransaction = {
      id: 'txn-1',
      workspaceId: 'ws-1',
      transactionDate: '2026-02-18',
      description: 'NEFT CR-AXIS/928371/BHARAT ELECTRICALS/INV102 TRN',
      type: 'credit',
      amountPaise: 10000000, // ₹1,00,000
      reconciliationStatus: 'suggested',
      matchConfidence: 0,
      createdAt: '2026-02-18T00:00:00Z',
    };

    const invoice: Invoice = {
      id: 'inv-102',
      workspaceId: 'ws-1',
      customerId: 'cust-2',
      customer: {
        id: 'cust-2',
        workspaceId: 'ws-1',
        name: 'Bharat Electricals',
        paymentTermsDays: 30,
        creditLimitPaise: 50000000,
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      invoiceNumber: 'INV-102',
      issueDate: '2026-02-01',
      dueDate: '2026-03-03',
      paymentTermsDays: 30,
      subtotalPaise: 20000000,
      taxableAmountPaise: 20000000,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      discountPaise: 0,
      totalAmountPaise: 20000000,
      receivedAmountPaise: 10000000,
      outstandingAmountPaise: 10000000, // ₹1,00,000 outstanding
      status: 'partially_paid',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    };

    const match = scoreTransactionMatch(txn, {
      id: invoice.id,
      number: invoice.invoiceNumber,
      amountPaise: invoice.totalAmountPaise,
      outstandingAmountPaise: invoice.outstandingAmountPaise,
      date: invoice.issueDate,
      entityName: invoice.customer?.name || '',
    });

    expect(match.score).toBeGreaterThanOrEqual(90);
    expect(match.reason).toContain('Exact outstanding balance match');
    expect(match.reason).toContain('INV-102');
  });

  it('rejects match if bank transaction exceeds outstanding invoice balance', () => {
    const txn: BankTransaction = {
      id: 'txn-2',
      workspaceId: 'ws-1',
      transactionDate: '2026-02-18',
      description: 'NEFT CR-EXCESS/999/INV102',
      type: 'credit',
      amountPaise: 15000000, // ₹1,50,000
      reconciliationStatus: 'unmatched',
      matchConfidence: 0,
      createdAt: '2026-02-18T00:00:00Z',
    };

    const match = scoreTransactionMatch(txn, {
      id: 'inv-102',
      number: 'INV-102',
      amountPaise: 20000000,
      outstandingAmountPaise: 10000000, // Only ₹1,00,000 outstanding
      date: '2026-02-01',
      entityName: 'Bharat Electricals',
    });

    expect(match.score).toBe(0);
    expect(match.reason).toContain('Transaction exceeds outstanding balance');
  });
});
