// Bank Reconciliation Engine
// Deterministic Matching, Confidence Scoring, and Atomic Allocations

import { BankTransaction, Invoice, Bill } from '../types/index.js';
import { calculateDaysDifference } from './financialEngine.js';

export interface MatchingCandidate {
  transaction: BankTransaction;
  suggestedInvoice?: Invoice;
  suggestedBill?: Bill;
  confidenceScore: number;
  reason: string;
}

/**
 * Score reconciliation match deterministically between bank transaction and invoice/bill.
 */
export function scoreTransactionMatch(
  txn: BankTransaction,
  invoiceOrBill: {
    id: string;
    number: string;
    amountPaise: number;
    outstandingAmountPaise: number;
    date: string;
    entityName: string;
  }
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // 1. Amount match (Highest weight: 50 points)
  if (txn.amountPaise === invoiceOrBill.outstandingAmountPaise) {
    score += 50;
    reasons.push('Exact outstanding balance match (100%)');
  } else if (txn.amountPaise === invoiceOrBill.amountPaise) {
    score += 45;
    reasons.push('Exact total invoice value match');
  } else if (txn.amountPaise < invoiceOrBill.outstandingAmountPaise) {
    score += 20;
    reasons.push('Potential partial payment');
  } else {
    // Transaction amount exceeds outstanding
    return { score: 0, reason: 'Transaction exceeds outstanding balance' };
  }

  // 2. Invoice number mention in bank description (30 points)
  const normalizedDesc = txn.description.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanNumber = invoiceOrBill.number.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (cleanNumber.length >= 3 && normalizedDesc.includes(cleanNumber)) {
    score += 30;
    reasons.push(`Invoice/Bill reference #${invoiceOrBill.number} found in statement remarks`);
  }

  // 3. Entity name mention (15 points)
  const cleanEntity = invoiceOrBill.entityName.toLowerCase().trim();
  if (cleanEntity.length >= 4 && txn.description.toLowerCase().includes(cleanEntity)) {
    score += 15;
    reasons.push(`Counterparty "${invoiceOrBill.entityName}" identified in description`);
  }

  // 4. Date Proximity (5 points)
  const daysDiff = Math.abs(calculateDaysDifference(invoiceOrBill.date, txn.transactionDate));
  if (daysDiff <= 5) {
    score += 5;
    reasons.push(`Transaction occurred within ${daysDiff} days of invoice date`);
  } else if (daysDiff <= 30) {
    score += 2;
  }

  return {
    score: Math.min(100, score),
    reason: reasons.join('; '),
  };
}

/**
 * Evaluate all bank transactions against open invoices/bills and generate deterministic suggestions.
 */
export function generateReconciliationSuggestions(
  transactions: BankTransaction[],
  openInvoices: Invoice[],
  openBills: Bill[]
): MatchingCandidate[] {
  const candidates: MatchingCandidate[] = [];

  for (const txn of transactions) {
    // Only analyze transactions that are not already confirmed matched
    if (txn.reconciliationStatus === 'matched' || txn.reconciliationStatus === 'ignored') {
      continue;
    }

    if (txn.type === 'credit') {
      // Incoming payment -> Match against open Invoices
      let bestMatch: { invoice: Invoice; score: number; reason: string } | null = null;

      for (const inv of openInvoices) {
        if (inv.outstandingAmountPaise <= 0) continue;

        const { score, reason } = scoreTransactionMatch(txn, {
          id: inv.id,
          number: inv.invoiceNumber,
          amountPaise: inv.totalAmountPaise,
          outstandingAmountPaise: inv.outstandingAmountPaise,
          date: inv.issueDate,
          entityName: inv.customer?.name || '',
        });

        if (score >= 40 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { invoice: inv, score, reason };
        }
      }

      if (bestMatch) {
        candidates.push({
          transaction: txn,
          suggestedInvoice: bestMatch.invoice,
          confidenceScore: bestMatch.score,
          reason: bestMatch.reason,
        });
      }
    } else if (txn.type === 'debit') {
      // Outgoing payment -> Match against open Bills
      let bestMatch: { bill: Bill; score: number; reason: string } | null = null;

      for (const bill of openBills) {
        if (bill.outstandingAmountPaise <= 0) continue;

        const { score, reason } = scoreTransactionMatch(txn, {
          id: bill.id,
          number: bill.billNumber,
          amountPaise: bill.totalAmountPaise,
          outstandingAmountPaise: bill.outstandingAmountPaise,
          date: bill.billDate,
          entityName: bill.supplier?.name || '',
        });

        if (score >= 40 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { bill, score, reason };
        }
      }

      if (bestMatch) {
        candidates.push({
          transaction: txn,
          suggestedBill: bestMatch.bill,
          confidenceScore: bestMatch.score,
          reason: bestMatch.reason,
        });
      }
    }
  }

  return candidates;
}
