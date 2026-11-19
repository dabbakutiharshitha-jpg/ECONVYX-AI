// Financial Engine - Deterministic Financial Arithmetic and Logic
// All monetary values handled as integer paise (₹1 = 100 paise)

export interface Money {
  paise: number;
}

/**
 * Format paise into Indian numbering system currency string.
 * Example: 12500000 paise -> "₹1,25,000.00"
 */
export function formatINR(paise: number): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(Math.round(paise));
  const rupees = Math.floor(absPaise / 100);
  const remainingPaise = absPaise % 100;

  const paiseStr = remainingPaise.toString().padStart(2, '0');
  let rupeeStr = rupees.toString();

  if (rupeeStr.length > 3) {
    const lastThree = rupeeStr.substring(rupeeStr.length - 3);
    const otherNumbers = rupeeStr.substring(0, rupeeStr.length - 3);
    const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    rupeeStr = `${formattedOthers},${lastThree}`;
  }

  const sign = isNegative ? '-' : '';
  return `${sign}₹${rupeeStr}.${paiseStr}`;
}

/**
 * Convert standard Rupee float to integer paise safely.
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Convert integer paise to Rupee number (for display charts if needed).
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Calculate deterministic GST line item breakdown.
 * Uses integer paise arithmetic with explicit rounding.
 */
export function calculateGSTLine(
  quantity: number,
  unitPricePaise: number,
  taxRatePercent: number,
  isInterState: boolean = false
): {
  taxableAmountPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalAmountPaise: number;
} {
  const taxableAmountPaise = Math.round(quantity * unitPricePaise);
  const totalTaxPaise = Math.round((taxableAmountPaise * taxRatePercent) / 100);

  if (isInterState) {
    return {
      taxableAmountPaise,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: totalTaxPaise,
      totalAmountPaise: taxableAmountPaise + totalTaxPaise,
    };
  }

  const halfTaxPaise = Math.floor(totalTaxPaise / 2);
  const remainderPaise = totalTaxPaise - halfTaxPaise * 2;

  return {
    taxableAmountPaise,
    cgstPaise: halfTaxPaise + remainderPaise,
    sgstPaise: halfTaxPaise,
    igstPaise: 0,
    totalAmountPaise: taxableAmountPaise + totalTaxPaise,
  };
}

/**
 * Calculate invoice totals from lines, discounts, and payments.
 */
export function calculateInvoiceTotals(
  lines: Array<{
    quantity: number;
    unitPricePaise: number;
    taxRatePercent: number;
  }>,
  discountPaise: number = 0,
  receivedAmountPaise: number = 0,
  isInterState: boolean = false
): {
  subtotalPaise: number;
  taxableAmountPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalTaxPaise: number;
  totalAmountPaise: number;
  receivedAmountPaise: number;
  outstandingAmountPaise: number;
} {
  let taxableAmountPaise = 0;
  let cgstPaise = 0;
  let sgstPaise = 0;
  let igstPaise = 0;

  for (const line of lines) {
    const calc = calculateGSTLine(line.quantity, line.unitPricePaise, line.taxRatePercent, isInterState);
    taxableAmountPaise += calc.taxableAmountPaise;
    cgstPaise += calc.cgstPaise;
    sgstPaise += calc.sgstPaise;
    igstPaise += calc.igstPaise;
  }

  const subtotalPaise = taxableAmountPaise;
  const totalTaxPaise = cgstPaise + sgstPaise + igstPaise;
  const totalAmountPaise = Math.max(0, taxableAmountPaise + totalTaxPaise - discountPaise);
  const outstandingAmountPaise = Math.max(0, totalAmountPaise - receivedAmountPaise);

  return {
    subtotalPaise,
    taxableAmountPaise,
    cgstPaise,
    sgstPaise,
    igstPaise,
    totalTaxPaise,
    totalAmountPaise,
    receivedAmountPaise,
    outstandingAmountPaise,
  };
}

/**
 * Calculate days difference between two dates (YYYY-MM-DD).
 */
export function calculateDaysDifference(fromDateStr: string, toDateStr: string): number {
  const from = new Date(fromDateStr);
  const to = new Date(toDateStr);
  const diffTime = to.getTime() - from.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Compute invoice aging bucket relative to reference date (default: today).
 */
export function getAgingBucket(dueDateStr: string, referenceDateStr?: string): 'current' | '1-30' | '31-60' | '61-90' | '90+' {
  const today = referenceDateStr || new Date().toISOString().split('T')[0];
  const daysOverdue = calculateDaysDifference(dueDateStr, today);

  if (daysOverdue <= 0) return 'current';
  if (daysOverdue <= 30) return '1-30';
  if (daysOverdue <= 60) return '31-60';
  if (daysOverdue <= 90) return '61-90';
  return '90+';
}

/**
 * Compute aggregated aging summary from a list of invoices.
 */
export function calculateAgingSummary(
  invoices: Array<{
    dueDate: string;
    outstandingAmountPaise: number;
    status: string;
  }>,
  referenceDateStr?: string
) {
  const buckets = {
    currentPaise: 0,
    bucket0to30Paise: 0,
    bucket31to60Paise: 0,
    bucket61to90Paise: 0,
    bucketAbove90Paise: 0,
    totalOutstandingPaise: 0,
    totalOverduePaise: 0,
  };

  for (const inv of invoices) {
    if (inv.status === 'paid' || inv.status === 'cancelled' || inv.outstandingAmountPaise <= 0) {
      continue;
    }

    buckets.totalOutstandingPaise += inv.outstandingAmountPaise;
    const bucket = getAgingBucket(inv.dueDate, referenceDateStr);

    switch (bucket) {
      case 'current':
        buckets.currentPaise += inv.outstandingAmountPaise;
        break;
      case '1-30':
        buckets.bucket0to30Paise += inv.outstandingAmountPaise;
        buckets.totalOverduePaise += inv.outstandingAmountPaise;
        break;
      case '31-60':
        buckets.bucket31to60Paise += inv.outstandingAmountPaise;
        buckets.totalOverduePaise += inv.outstandingAmountPaise;
        break;
      case '61-90':
        buckets.bucket61to90Paise += inv.outstandingAmountPaise;
        buckets.totalOverduePaise += inv.outstandingAmountPaise;
        break;
      case '90+':
        buckets.bucketAbove90Paise += inv.outstandingAmountPaise;
        buckets.totalOverduePaise += inv.outstandingAmountPaise;
        break;
    }
  }

  return buckets;
}

/**
 * Determine customer payment behavior using transparent historical rules.
 */
export function evaluateCustomerPaymentBehavior(invoices: Array<{
  totalAmountPaise: number;
  receivedAmountPaise: number;
  outstandingAmountPaise: number;
  dueDate: string;
  status: string;
  payments?: Array<{ paymentDate?: string; amountPaise: number }>;
}>): {
  behavior: 'on_time' | 'occasionally_late' | 'frequently_late' | 'high_risk' | 'insufficient_history';
  onTimePercentage: number;
  paymentCompletionPercentage: number;
  totalInvoicedPaise: number;
  totalReceivedPaise: number;
  currentOutstandingPaise: number;
  overduePaise: number;
  invoiceCount: number;
  rationale: string;
} {
  const totalInvoicedPaise = invoices.reduce((sum, inv) => sum + inv.totalAmountPaise, 0);
  const totalReceivedPaise = invoices.reduce((sum, inv) => sum + inv.receivedAmountPaise, 0);
  const currentOutstandingPaise = invoices.reduce((sum, inv) => sum + inv.outstandingAmountPaise, 0);

  const today = new Date().toISOString().split('T')[0];
  let overduePaise = 0;
  let paidCount = 0;
  let onTimeCount = 0;

  for (const inv of invoices) {
    const isOverdue = inv.outstandingAmountPaise > 0 && inv.dueDate < today;
    if (isOverdue) {
      overduePaise += inv.outstandingAmountPaise;
    }

    if (inv.status === 'paid' || inv.receivedAmountPaise >= inv.totalAmountPaise) {
      paidCount++;
      // Check if latest payment was before due date
      const latestPayment = inv.payments?.filter((p) => Boolean(p.paymentDate)).sort((a, b) => (b.paymentDate || '').localeCompare(a.paymentDate || ''))[0];
      if (!latestPayment || (latestPayment.paymentDate && latestPayment.paymentDate <= inv.dueDate)) {
        onTimeCount++;
      }
    }
  }

  const invoiceCount = invoices.length;
  const onTimePercentage = paidCount > 0 ? Math.round((onTimeCount / paidCount) * 100) : 0;
  const paymentCompletionPercentage = totalInvoicedPaise > 0 ? Math.round((totalReceivedPaise / totalInvoicedPaise) * 100) : 0;

  // Transparent rule evaluation
  if (invoiceCount < 3) {
    return {
      behavior: 'insufficient_history',
      onTimePercentage,
      paymentCompletionPercentage,
      totalInvoicedPaise,
      totalReceivedPaise,
      currentOutstandingPaise,
      overduePaise,
      invoiceCount,
      rationale: `Customer has only ${invoiceCount} invoice(s). Minimum 3 confirmed invoices required for statistical classification.`,
    };
  }

  const overdueRatio = totalInvoicedPaise > 0 ? overduePaise / totalInvoicedPaise : 0;

  if (overdueRatio > 0.6 && overduePaise > 20000000) { // > 60% overdue and > ₹2 Lakh overdue
    return {
      behavior: 'high_risk',
      onTimePercentage,
      paymentCompletionPercentage,
      totalInvoicedPaise,
      totalReceivedPaise,
      currentOutstandingPaise,
      overduePaise,
      invoiceCount,
      rationale: `High Risk: ${Math.round(overdueRatio * 100)}% of invoiced balance is severely overdue (${formatINR(overduePaise)}).`,
    };
  }

  if (onTimePercentage >= 85) {
    return {
      behavior: 'on_time',
      onTimePercentage,
      paymentCompletionPercentage,
      totalInvoicedPaise,
      totalReceivedPaise,
      currentOutstandingPaise,
      overduePaise,
      invoiceCount,
      rationale: `Reliable payer: ${onTimePercentage}% of completed invoices were settled on or before due date.`,
    };
  }

  if (onTimePercentage >= 50) {
    return {
      behavior: 'occasionally_late',
      onTimePercentage,
      paymentCompletionPercentage,
      totalInvoicedPaise,
      totalReceivedPaise,
      currentOutstandingPaise,
      overduePaise,
      invoiceCount,
      rationale: `Moderate risk: settled ${onTimePercentage}% on time; occasional delay observed.`,
    };
  }

  return {
    behavior: 'frequently_late',
    onTimePercentage,
    paymentCompletionPercentage,
    totalInvoicedPaise,
    totalReceivedPaise,
    currentOutstandingPaise,
    overduePaise,
    invoiceCount,
    rationale: `Frequent delays: only ${onTimePercentage}% of invoices settled on time. Proactive payment reminders recommended.`,
  };
}
