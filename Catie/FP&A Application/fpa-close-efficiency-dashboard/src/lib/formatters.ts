// src/lib/formatters.ts
// Single source of truth for all number display in the FP&A dashboard.
// Used by KPI cards, tooltips, AI summary, and the close tracker.

/**
 * Format a dollar amount.
 * @param value - The numeric value to format
 * @param compact - If true (default), abbreviate: >=1M → $X.XM, >=1K → $XK
 * @returns Formatted string like '$1.2M', '$45K', '$1,234,568'
 */
export function formatCurrency(value: number, compact = true): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (compact && abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (compact && abs >= 1_000) {
    return `${sign}$${Math.round(abs / 1_000)}K`;
  }

  // Non-compact (or <$1K): use Intl.NumberFormat for locale-correct output
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a percentage value.
 * @param value - The numeric value
 * @param isDecimal - If true (default), value is a decimal (0.045 → 4.5%); if false, already a percent (4.5 → 4.5%)
 * @returns Formatted string like '4.5%'
 */
export function formatPercent(value: number, isDecimal = true): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(isDecimal ? value : value / 100);
}
