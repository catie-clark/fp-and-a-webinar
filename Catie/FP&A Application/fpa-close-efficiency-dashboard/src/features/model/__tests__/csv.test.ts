import { parseCsv } from '@/lib/csv';

describe('parseCsv', () => {
  it('parses a simple CSV with headers', () => {
    const result = parseCsv('a,b\n1,2');
    expect(result).toEqual([{ a: '1', b: '2' }]);
  });

  it('returns empty array for empty string', () => {
    expect(parseCsv('')).toEqual([]);
  });

  it('skips empty lines', () => {
    const result = parseCsv('a,b\n1,2\n\n3,4');
    expect(result).toHaveLength(2);
  });

  it('handles multi-row CSV', () => {
    const csv = 'period,net_sales\nJan 2026,1000000\nFeb 2026,1100000';
    const result = parseCsv(csv);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ period: 'Jan 2026', net_sales: '1000000' });
  });
});
