// src/lib/csv.ts
// Server-side only — imported by dataLoader.ts which runs in Node.js.
// Returns Record<string, string>[] so Zod z.coerce.number() can convert CSV strings to numbers.
import Papa from 'papaparse';

export function parseCsv(raw: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  });
  return result.data;
}
