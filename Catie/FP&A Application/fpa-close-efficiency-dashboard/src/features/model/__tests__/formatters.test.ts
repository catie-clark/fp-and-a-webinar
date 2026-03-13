import { formatCurrency, formatPercent } from '@/lib/formatters';

describe('formatCurrency', () => {
  it('formats millions compactly by default', () => {
    expect(formatCurrency(1200000)).toBe('$1.2M');
  });

  it('formats thousands compactly by default', () => {
    expect(formatCurrency(6000)).toBe('$6K');
  });

  it('formats full amount when compact=false', () => {
    // Non-compact: uses Intl.NumberFormat with 0 decimal places
    expect(formatCurrency(1234567.89, false)).toBe('$1,234,568');
  });

  it('handles negative millions', () => {
    expect(formatCurrency(-2500000)).toBe('-$2.5M');
  });

  it('handles negative thousands', () => {
    expect(formatCurrency(-5500)).toBe('-$6K');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });
});

describe('formatPercent', () => {
  it('converts decimal to percent (default)', () => {
    expect(formatPercent(0.045)).toBe('4.5%');
  });

  it('treats value as already a percentage when isDecimal=false', () => {
    expect(formatPercent(4.5, false)).toBe('4.5%');
  });

  it('handles 0%', () => {
    expect(formatPercent(0)).toBe('0.0%');
  });

  it('handles 100% (decimal = 1.0)', () => {
    expect(formatPercent(1.0)).toBe('100.0%');
  });
});
