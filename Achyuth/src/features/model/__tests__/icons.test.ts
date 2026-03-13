import { readFileSync } from 'fs';
import path from 'path';

describe('icons.tsx', () => {
  const iconsPath = path.resolve(__dirname, '../../../components/ui/icons.tsx');

  it('has "use client" directive at the top', () => {
    // This test reads the actual source file — it will fail until icons.tsx is created
    let content: string;
    try {
      content = readFileSync(iconsPath, 'utf-8');
    } catch {
      throw new Error(`icons.tsx does not exist at ${iconsPath} — create it in Wave 1`);
    }
    expect(content).toMatch(/'use client'/);
  });

  it('exports at least one icon from iconsax-react', () => {
    let content: string;
    try {
      content = readFileSync(iconsPath, 'utf-8');
    } catch {
      throw new Error(`icons.tsx does not exist at ${iconsPath}`);
    }
    expect(content).toContain('iconsax-react');
  });
});
