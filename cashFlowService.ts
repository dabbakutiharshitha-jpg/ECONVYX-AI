// Cash Flow Forecasting Engine and Scenario Modeling
// Deterministic projected balance = Opening Balance + Expected Inflows - Expected Outflows

import { CashFlowForecast, Invoice, Bill } from '../types/index.js';
import { calculateDaysDifference, formatINR } from './financialEngine.js';

export interface CashFlowCalculationOptions {
  openingBalancePaise: number;
  horizonDays: number; // 7, 15, 30, 60, 90
  invoices: Invoice[];
  bills: Bill[];
  scenario?: {
    delayDays?: number;
    delayedInvoiceIds?: string[];
    additionalExpensePaise?: number;
    description?: string;
  };
  referenceDateStr?: string;
}

export function computeCashFlowForecast(options: CashFlowCalculationOptions): CashFlowForecast {
  const {
    openingBalancePaise,
    horizonDays,
    invoices,
    bills,
    scenario,
    referenceDateStr,
  } = options;

  const today = referenceDateStr || new Date().toISOString().split('T')[0];
  const horizonEndDate = new Date(new Date(today).getTime() + horizonDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  let expectedInflowsPaise = 0;
  let expectedOutflowsPaise = 0;

  const timelineEvents: Array<{
    date: string;
    inflowPaise: number;
    outflowPaise: number;
    description: string;
  }> = [];

  // 1. Process Open Invoices (Expected Inflows)
  for (const inv of invoices) {
    if (inv.status === 'paid' || inv.status === 'cancelled' || inv.outstandingAmountPaise <= 0) {
      continue;
    }

    let effectiveDueDate = inv.dueDate;

    // Check if this invoice is delayed in scenario
    if (scenario?.delayedInvoiceIds && scenario.delayedInvoiceIds.includes(inv.id)) {
      const delayDays = scenario.delayDays || 30;
      const delayed = new Date(new Date(inv.dueDate).getTime() + delayDays * 24 * 60 * 60 * 1000);
      effectiveDueDate = delayed.toISOString().split('T')[0];
    }

    // Only include if due date falls within forecast horizon
    if (effectiveDueDate <= horizonEndDate) {
      expectedInflowsPaise += inv.outstandingAmountPaise;
      timelineEvents.push({
        date: effectiveDueDate,
        inflowPaise: inv.outstandingAmountPaise,
        outflowPaise: 0,
        description: `Customer Receipt: ${inv.customer?.name || 'Customer'} (#${inv.invoiceNumber})`,
      });
    }
  }

  // 2. Process Supplier Bills (Expected Outflows)
  for (const bill of bills) {
    if (bill.status === 'paid' || bill.outstandingAmountPaise <= 0) {
      continue;
    }

    if (bill.dueDate <= horizonEndDate) {
      expectedOutflowsPaise += bill.outstandingAmountPaise;
      timelineEvents.push({
        date: bill.dueDate,
        outflowPaise: bill.outstandingAmountPaise,
        inflowPaise: 0,
        description: `Supplier Payment: ${bill.supplier?.name || 'Supplier'} (#${bill.billNumber})`,
      });
    }
  }

  // 3. Process additional scenario expenses
  if (scenario?.additionalExpensePaise && scenario.additionalExpensePaise > 0) {
    expectedOutflowsPaise += scenario.additionalExpensePaise;
    timelineEvents.push({
      date: today,
      outflowPaise: scenario.additionalExpensePaise,
      inflowPaise: 0,
      description: `Scenario Adjustment: ${scenario.description || 'Additional Planned Expense'}`,
    });
  }

  // Sort timeline chronologically
  timelineEvents.sort((a, b) => a.date.localeCompare(b.date));

  // Build running balance timeline
  let runningBalance = openingBalancePaise;
  const timelineWithBalance = timelineEvents.map((event) => {
    runningBalance = runningBalance + event.inflowPaise - event.outflowPaise;
    return {
      date: event.date,
      inflowPaise: event.inflowPaise,
      outflowPaise: event.outflowPaise,
      balancePaise: runningBalance,
      description: event.description,
    };
  });

  const projectedBalancePaise = openingBalancePaise + expectedInflowsPaise - expectedOutflowsPaise;

  const assumptions: string[] = [
    `Assumes customers settle within payment terms without unannounced default.`,
    `Supplier obligations settled strictly on due dates.`,
    `Forecast range: ${horizonDays} days (until ${horizonEndDate}).`,
    `Monetary values deterministic based on verified database records.`,
  ];

  if (scenario?.delayedInvoiceIds && scenario.delayedInvoiceIds.length > 0) {
    assumptions.push(
      `Scenario modeled: ${scenario.delayedInvoiceIds.length} invoice(s) delayed by ${scenario.delayDays || 30} days.`
    );
  }

  return {
    openingBalancePaise,
    horizonDays,
    expectedInflowsPaise,
    expectedOutflowsPaise,
    projectedBalancePaise,
    timeline: timelineWithBalance,
    assumptions,
  };
}
