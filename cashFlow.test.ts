// Unit Tests for Cash Flow Forecasting & Scenario Modeler

import { describe, it, expect } from 'vitest';
import { computeCashFlowForecast } from '../../server/services/cashFlowService.js';
import { Invoice, Bill } from '../../server/types/index.js';

describe('Cash Flow Engine - Projection & Scenarios', () => {
  const openingBalancePaise = 20000000; // ₹2,00,000

  const invoices: Invoice[] = [
    {
      id: 'inv-101',
      workspaceId: 'ws-1',
      customerId: 'cust-1',
      invoiceNumber: 'INV-101',
      issueDate: '2026-02-01',
      dueDate: '2026-02-25', // inside 30-day horizon
      paymentTermsDays: 24,
      subtotalPaise: 50000000,
      taxableAmountPaise: 50000000,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      discountPaise: 0,
      totalAmountPaise: 50000000,
      receivedAmountPaise: 0,
      outstandingAmountPaise: 50000000, // ₹5,00,000
      status: 'open',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    },
    {
      id: 'inv-102',
      workspaceId: 'ws-1',
      customerId: 'cust-2',
      invoiceNumber: 'INV-102',
      issueDate: '2026-02-05',
      dueDate: '2026-02-28',
      paymentTermsDays: 23,
      subtotalPaise: 20000000,
      taxableAmountPaise: 20000000,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      discountPaise: 0,
      totalAmountPaise: 20000000,
      receivedAmountPaise: 10000000,
      outstandingAmountPaise: 10000000, // ₹1,00,000
      status: 'partially_paid',
      createdAt: '2026-02-05T00:00:00Z',
      updatedAt: '2026-02-05T00:00:00Z',
    },
    {
      id: 'inv-other',
      workspaceId: 'ws-1',
      customerId: 'cust-3',
      invoiceNumber: 'INV-104',
      issueDate: '2026-02-10',
      dueDate: '2026-03-01',
      paymentTermsDays: 20,
      subtotalPaise: 10000000,
      taxableAmountPaise: 10000000,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      discountPaise: 0,
      totalAmountPaise: 10000000,
      receivedAmountPaise: 0,
      outstandingAmountPaise: 10000000, // ₹1,00,000
      status: 'open',
      createdAt: '2026-02-10T00:00:00Z',
      updatedAt: '2026-02-10T00:00:00Z',
    },
  ];

  // Expected receipts total: ₹5,00,000 + ₹1,00,000 + ₹1,00,000 = ₹7,00,000 (70000000 paise)

  const bills: Bill[] = [
    {
      id: 'bill-1',
      workspaceId: 'ws-1',
      supplierId: 'supp-1',
      billNumber: 'BILL-401',
      billDate: '2026-02-01',
      dueDate: '2026-02-20',
      paymentTermsDays: 20,
      totalAmountPaise: 15000000, // ₹1,50,000
      paidAmountPaise: 0,
      outstandingAmountPaise: 15000000,
      status: 'approved',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    },
    {
      id: 'bill-2',
      workspaceId: 'ws-1',
      supplierId: 'supp-2',
      billNumber: 'BILL-402',
      billDate: '2026-02-05',
      dueDate: '2026-02-22',
      paymentTermsDays: 17,
      totalAmountPaise: 8000000, // ₹80,000
      paidAmountPaise: 0,
      outstandingAmountPaise: 8000000,
      status: 'approved',
      createdAt: '2026-02-05T00:00:00Z',
      updatedAt: '2026-02-05T00:00:00Z',
    },
  ];

  // Expected outflows total: ₹1,50,000 + ₹80,000 = ₹2,30,000 (23000000 paise)

  it('calculates exact baseline cash flow from Master Prompt Section 24', () => {
    // Opening: ₹2,00,000 + Inflows ₹7,00,000 - Outflows ₹2,30,000 = Projected ₹6,70,000
    const forecast = computeCashFlowForecast({
      openingBalancePaise,
      horizonDays: 30,
      invoices,
      bills,
      referenceDateStr: '2026-02-15',
    });

    expect(forecast.openingBalancePaise).toBe(20000000); // ₹2,00,000
    expect(forecast.expectedInflowsPaise).toBe(70000000);  // ₹7,00,000
    expect(forecast.expectedOutflowsPaise).toBe(23000000); // ₹2,30,000
    expect(forecast.projectedBalancePaise).toBe(67000000); // ₹6,70,000!
  });

  it('models delayed receipt scenario from Master Prompt Section 24', () => {
    // Delay ₹5,00,000 (INV-101) beyond the forecast horizon -> Revised estimated cash: ₹1,70,000!
    const delayedForecast = computeCashFlowForecast({
      openingBalancePaise,
      horizonDays: 30,
      invoices,
      bills,
      scenario: {
        delayDays: 60,
        delayedInvoiceIds: ['inv-101'],
      },
      referenceDateStr: '2026-02-15',
    });

    expect(delayedForecast.expectedInflowsPaise).toBe(20000000); // Only ₹2,00,000 arrives in horizon
    expect(delayedForecast.expectedOutflowsPaise).toBe(23000000); // ₹2,30,000
    // Opening ₹2,00,000 + Inflow ₹2,00,000 - Outflow ₹2,30,000 = ₹1,70,000!
    expect(delayedForecast.projectedBalancePaise).toBe(17000000); // Exactly ₹1,70,000!
  });
});
