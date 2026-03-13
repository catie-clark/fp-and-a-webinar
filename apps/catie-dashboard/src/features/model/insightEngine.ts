import { THRESHOLDS } from "./thresholds";
import type { ControlState, DerivedMetrics, ExecutiveSummary, RiskFlag } from "./types";

export function evaluateRiskFlags(
  metrics: DerivedMetrics,
  baseline: DerivedMetrics,
  ar90Ratio: number,
): RiskFlag[] {
  const flags: RiskFlag[] = [];

  if (metrics.cashCoverageWeeks < THRESHOLDS.cashCoverageRed) {
    flags.push({
      id: "cash-coverage",
      severity: "red",
      title: "Cash coverage below threshold",
      whatChanged: `Coverage fell to ${metrics.cashCoverageWeeks.toFixed(1)} weeks.`,
      whyItMatters: "Lower liquidity can create reporting and covenant pressure.",
      suggestedAction: "Escalate collections and review discretionary spend this week.",
    });
  }

  if (ar90Ratio > THRESHOLDS.ar90RedPct) {
    flags.push({
      id: "ar-aging",
      severity: "red",
      title: "AR 90+ concentration is elevated",
      whatChanged: `AR 90+ reached ${(ar90Ratio * 100).toFixed(1)}% of total AR.`,
      whyItMatters: "Aging pressure slows cash conversion and can increase close scrutiny.",
      suggestedAction: "Prioritize top delinquent accounts and validate credit memo timing.",
    });
  }

  if (metrics.closeEtaBusinessDays > THRESHOLDS.closeTargetDays) {
    flags.push({
      id: "close-eta",
      severity: metrics.closeEtaBusinessDays > THRESHOLDS.closeTargetDays + 1 ? "red" : "yellow",
      title: "Close ETA risk",
      whatChanged: `Projected close is D+${metrics.closeEtaBusinessDays.toFixed(1)}.`,
      whyItMatters: "Late close compresses review windows for executive reporting.",
      suggestedAction: "Pull forward cut-off review and focus staff on high-volume JE queues.",
    });
  }

  if (metrics.forecastConfidence < THRESHOLDS.forecastConfidenceRed) {
    flags.push({
      id: "forecast-confidence",
      severity: "red",
      title: "Forecast confidence is low",
      whatChanged: `Confidence dropped to ${metrics.forecastConfidence}.`,
      whyItMatters: "Low confidence weakens planning quality and executive decision support.",
      suggestedAction: "Reconcile pipeline assumptions and refresh variance commentary.",
    });
  } else if (metrics.forecastConfidence < THRESHOLDS.forecastConfidenceYellow) {
    flags.push({
      id: "forecast-confidence",
      severity: "yellow",
      title: "Forecast confidence watch",
      whatChanged: `Confidence is ${metrics.forecastConfidence}.`,
      whyItMatters: "Model reliability is slipping and requires tighter monitoring.",
      suggestedAction: "Review scenario assumptions with controllership before package finalization.",
    });
  }

  if (metrics.projGrossProfit < baseline.projGrossProfit * 0.95) {
    flags.push({
      id: "margin-compression",
      severity: "yellow",
      title: "Margin compression vs baseline",
      whatChanged: "Gross profit is more than 5% below baseline model.",
      whyItMatters: "Margin erosion increases pressure on cost controls during close.",
      suggestedAction: "Validate vendor cost changes and surcharge capture on large invoices.",
    });
  }

  return flags;
}

export function buildExecutiveSummary(params: {
  companyName: string;
  controls: ControlState;
  metrics: DerivedMetrics;
  baseline: DerivedMetrics;
  flags: RiskFlag[];
  scenarioLabel: string;
}): ExecutiveSummary {
  const { companyName, controls, metrics, baseline, flags, scenarioLabel } = params;
  const deltaSales = metrics.projNetSales - baseline.projNetSales;
  const deltaMargin = metrics.projGrossProfit - baseline.projGrossProfit;

  const bullets = [
    `${companyName} is tracking close completion around D+${metrics.closeEtaBusinessDays.toFixed(1)} under the ${scenarioLabel} scenario.`,
    `Projected net sales are $${Math.round(metrics.projNetSales).toLocaleString()} and gross profit is $${Math.round(metrics.projGrossProfit).toLocaleString()}.`,
    `Cash coverage is ${metrics.cashCoverageWeeks.toFixed(1)} weeks with AR DSO at ${metrics.arDso.toFixed(1)} days.`,
    `Forecast confidence is ${metrics.forecastConfidence}/100 with pipeline execution at ${(metrics.pipelineExecutionRatio * 100).toFixed(1)}%.`,
    `Journal load is projected at ${metrics.journalLoad} entries, influenced by late invoice impact of ${controls.lateInvoiceHours.toFixed(0)} hours.`,
    `Compared with baseline, projected sales moved ${deltaSales >= 0 ? "up" : "down"} by $${Math.abs(Math.round(deltaSales)).toLocaleString()} and gross profit moved ${deltaMargin >= 0 ? "up" : "down"} by $${Math.abs(Math.round(deltaMargin)).toLocaleString()}.`,
  ];

  const changedVsBaseline = [
    `Revenue growth assumption: ${(controls.revenueGrowthPct * 100).toFixed(1)}%`,
    `Gross margin assumption: ${(controls.grossMarginPct * 100).toFixed(1)}%`,
    `Fuel index assumption: ${controls.fuelIndex.toFixed(0)}`,
    `Collections rate assumption: ${(controls.collectionsRatePct * 100).toFixed(1)}%`,
  ];

  const risksAndMitigations =
    flags.length > 0
      ? flags.map((flag) => `${flag.title}: ${flag.suggestedAction}`)
      : ["No red/yellow risk triggers are active; continue standard close cadence."];

  const assumptionsUsed = [
    `Returns as percent of sales: ${(controls.returnsPct * 100).toFixed(2)}%`,
    `Journal load multiplier: ${controls.journalLoadMultiplier.toFixed(2)}x`,
    `Prioritize cash mode: ${controls.prioritizeCashMode ? "enabled" : "disabled"}`,
    `Conservative forecast bias: ${controls.conservativeForecastBias ? "enabled" : "disabled"}`,
    `Tighten credit holds: ${controls.tightenCreditHolds ? "enabled" : "disabled"}`,
    `Inventory complexity: ${controls.inventoryComplexity ? "enabled" : "disabled"}`,
  ];

  return {
    bullets,
    changedVsBaseline,
    risksAndMitigations,
    assumptionsUsed,
    generatedAt: new Date().toISOString(),
    enhancedByLlm: false,
  };
}
