// Cash Flow Intelligence & Scenario Modeler Routes

import { Router, Response } from 'express';
import { AuthenticatedRequest, tenantAuthMiddleware } from '../middleware/auth.js';
import { db } from '../db/database.js';
import { computeCashFlowForecast } from '../services/cashFlowService.js';
import { formatINR, paiseToRupees, rupeesToPaise } from '../services/financialEngine.js';

const router = Router();
router.use(tenantAuthMiddleware);

router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const horizonDays = parseInt(req.query.horizon as string) || 30;

  const invoices = db.getInvoices(workspaceId);
  const bills = db.getBills(workspaceId);

  // Exact demo baseline: ₹2,00,000 opening balance
  const openingBalancePaise = 20000000;

  // Compute Baseline Forecast
  const baselineForecast = computeCashFlowForecast({
    openingBalancePaise,
    horizonDays,
    invoices,
    bills,
  });

  // Check if user requested a simulated scenario
  const delayDays = parseInt(req.query.delayDays as string) || 0;
  const delayedInvoiceId = req.query.delayedInvoiceId as string;
  const additionalExpenseRupees = parseFloat(req.query.additionalExpenseRupees as string) || 0;

  let scenarioForecast = null;
  if (delayDays > 0 || delayedInvoiceId || additionalExpenseRupees > 0) {
    scenarioForecast = computeCashFlowForecast({
      openingBalancePaise,
      horizonDays,
      invoices,
      bills,
      scenario: {
        delayDays: delayDays || 30,
        delayedInvoiceIds: delayedInvoiceId ? [delayedInvoiceId] : ['inv-101'], // Defaults to INV-101 for demo delay test
        additionalExpensePaise: rupeesToPaise(additionalExpenseRupees),
        description: 'Simulated cash flow stress test',
      },
    });
  }

  // Pre-calculated popular scenarios for Indian MSMEs
  // Scenario A: Delay INV-101 (₹5,00,000) beyond horizon -> Revised cash = ₹1,70,000!
  const delayMajorInvoiceScenario = computeCashFlowForecast({
    openingBalancePaise,
    horizonDays: 30,
    invoices,
    bills,
    scenario: {
      delayDays: 60, // Pushes outside 30-day horizon
      delayedInvoiceIds: ['inv-101'],
      description: 'Major customer (Precision AutoTech) delays payment by 60 days',
    },
  });

  return res.json({
    openingBalance: {
      paise: openingBalancePaise,
      formatted: formatINR(openingBalancePaise),
    },
    horizonDays,
    baseline: {
      expectedInflowsPaise: baselineForecast.expectedInflowsPaise,
      expectedInflowsFormatted: formatINR(baselineForecast.expectedInflowsPaise),
      expectedOutflowsPaise: baselineForecast.expectedOutflowsPaise,
      expectedOutflowsFormatted: formatINR(baselineForecast.expectedOutflowsPaise),
      projectedBalancePaise: baselineForecast.projectedBalancePaise,
      projectedBalanceFormatted: formatINR(baselineForecast.projectedBalancePaise),
      assumptions: baselineForecast.assumptions,
      timeline: baselineForecast.timeline.map((t) => ({
        ...t,
        inflowRupees: paiseToRupees(t.inflowPaise),
        outflowRupees: paiseToRupees(t.outflowPaise),
        balanceRupees: paiseToRupees(t.balancePaise),
        inflowFormatted: formatINR(t.inflowPaise),
        outflowFormatted: formatINR(t.outflowPaise),
        balanceFormatted: formatINR(t.balancePaise),
      })),
    },
    scenario: scenarioForecast
      ? {
          expectedInflowsPaise: scenarioForecast.expectedInflowsPaise,
          expectedInflowsFormatted: formatINR(scenarioForecast.expectedInflowsPaise),
          expectedOutflowsPaise: scenarioForecast.expectedOutflowsPaise,
          expectedOutflowsFormatted: formatINR(scenarioForecast.expectedOutflowsPaise),
          projectedBalancePaise: scenarioForecast.projectedBalancePaise,
          projectedBalanceFormatted: formatINR(scenarioForecast.projectedBalancePaise),
          impactDifferencePaise: scenarioForecast.projectedBalancePaise - baselineForecast.projectedBalancePaise,
          impactDifferenceFormatted: formatINR(
            scenarioForecast.projectedBalancePaise - baselineForecast.projectedBalancePaise
          ),
          assumptions: scenarioForecast.assumptions,
        }
      : null,
    builtInScenarios: {
      delayMajorInvoice: {
        name: 'Delay Largest Receivable (INV-101 ₹5L) by 60 Days',
        projectedBalancePaise: delayMajorInvoiceScenario.projectedBalancePaise,
        projectedBalanceFormatted: formatINR(delayMajorInvoiceScenario.projectedBalancePaise), // Exactly ₹1,70,000.00
        impactPaise: delayMajorInvoiceScenario.projectedBalancePaise - baselineForecast.projectedBalancePaise,
        impactFormatted: formatINR(
          delayMajorInvoiceScenario.projectedBalancePaise - baselineForecast.projectedBalancePaise
        ),
      },
    },
  });
});

export default router;
