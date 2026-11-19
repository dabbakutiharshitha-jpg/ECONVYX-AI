// Unit Tests for Financial Engine & Deterministic Arithmetic

import { describe, it, expect } from 'vitest';
import {
  formatINR,
  rupeesToPaise,
  paiseToRupees,
  calculateGSTLine,
  calculateInvoiceTotals,
  getAgingBucket,
  calculateAgingSummary,
  evaluateCustomerPaymentBehavior,
} from '../../server/services/financialEngine.js';

describe('Financial Engine - Currency & Paise Arithmetic', () => {
  it('correctly converts rupees to integer paise', () => {
    expect(rupeesToPaise(125000)).toBe(12500000);
    expect(rupeesToPaise(5000.5)).toBe(500050);
    expect(rupeesToPaise(0)).toBe(0);
  });

  it('correctly formats integer paise in Indian numbering system', () => {
    expect(formatINR(12500000)).toBe('₹1,25,000.00');
    expect(formatINR(50000000)).toBe('₹5,00,000.00');
    expect(formatINR(10000000)).toBe('₹1,00,000.00');
    expect(formatINR(80000000)).toBe('₹8,00,000.00');
    expect(formatINR(67000000)).toBe('₹6,70,000.00');
    expect(formatINR(17000000)).toBe('₹1,70,000.00');
    expect(formatINR(250050)).toBe('₹2,500.50');
  });

  it('converts paise to rupees accurately', () => {
    expect(paiseToRupees(50000000)).toBe(500000);
    expect(paiseToRupees(12500000)).toBe(125000);
  });
});

describe('Financial Engine - GST & Invoice Totals', () => {
  it('calculates intra-state GST line items (split CGST & SGST)', () => {
    // 10 units at ₹1,000 (100000 paise), 18% GST
    const result = calculateGSTLine(10, 100000, 18, false);
    expect(result.taxableAmountPaise).toBe(1000000); // ₹10,000
    expect(result.cgstPaise).toBe(90000);           // ₹900
    expect(result.sgstPaise).toBe(90000);           // ₹900
    expect(result.igstPaise).toBe(0);
    expect(result.totalAmountPaise).toBe(1180000);   // ₹11,800
  });

  it('calculates inter-state GST line items (100% IGST)', () => {
    const result = calculateGSTLine(10, 100000, 18, true);
    expect(result.taxableAmountPaise).toBe(1000000);
    expect(result.cgstPaise).toBe(0);
    expect(result.sgstPaise).toBe(0);
    expect(result.igstPaise).toBe(180000);           // ₹1,800
    expect(result.totalAmountPaise).toBe(1180000);
  });

  it('calculates full invoice totals and outstanding balance', () => {
    const lines = [
      { quantity: 100, unitPricePaise: 423729, taxRatePercent: 18 },
    ];
    const totals = calculateInvoiceTotals(lines, 0, 0);
    expect(totals.totalAmountPaise).toBe(50000022); // ~₹5,00,000
    expect(totals.receivedAmountPaise).toBe(0);
    expect(totals.outstandingAmountPaise).toBe(50000022);

    // After receiving partial payment of ₹2,00,000
    const partial = calculateInvoiceTotals(lines, 0, 20000000);
    expect(partial.outstandingAmountPaise).toBe(30000022);
  });
});

describe('Financial Engine - Aging & Customer Behavior', () => {
  it('categorizes aging buckets properly', () => {
    const today = '2026-03-01';
    expect(getAgingBucket('2026-03-15', today)).toBe('current');
    expect(getAgingBucket('2026-02-15', today)).toBe('1-30');
    expect(getAgingBucket('2026-01-15', today)).toBe('31-60');
    expect(getAgingBucket('2025-12-15', today)).toBe('61-90');
    expect(getAgingBucket('2025-11-01', today)).toBe('90+');
  });

  it('aggregates aging buckets across an invoice portfolio', () => {
    const invoices = [
      { dueDate: '2026-03-15', outstandingAmountPaise: 10000000, status: 'open' },
      { dueDate: '2026-02-15', outstandingAmountPaise: 20000000, status: 'open' },
      { dueDate: '2026-01-15', outstandingAmountPaise: 50000000, status: 'overdue' },
    ];
    const summary = calculateAgingSummary(invoices, '2026-03-01');
    expect(summary.totalOutstandingPaise).toBe(80000000);
    expect(summary.currentPaise).toBe(10000000);
    expect(summary.bucket0to30Paise).toBe(20000000);
    expect(summary.bucket31to60Paise).toBe(50000000);
    expect(summary.totalOverduePaise).toBe(70000000);
  });

  it('flags insufficient history when fewer than 3 confirmed invoices exist', () => {
    const invoices = [
      {
        totalAmountPaise: 20000000,
        receivedAmountPaise: 20000000,
        outstandingAmountPaise: 0,
        dueDate: '2026-01-15',
        status: 'paid',
      },
    ];
    const behavior = evaluateCustomerPaymentBehavior(invoices);
    expect(behavior.behavior).toBe('insufficient_history');
  });
});
