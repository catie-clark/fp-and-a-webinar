import { readFileSync } from 'fs';
import path from 'path';

describe('layout.tsx', () => {
  const layoutPath = path.resolve(__dirname, '../../../app/layout.tsx');

  let content: string;

  beforeAll(() => {
    try {
      content = readFileSync(layoutPath, 'utf-8');
    } catch {
      content = '';
    }
  });

  it('exists', () => {
    expect(content).not.toBe('');
  });

  it('does NOT have "use client" at the top (must be Server Component)', () => {
    // The first non-empty line must not be "use client"
    const firstMeaningfulLine = content.split('\n').find(l => l.trim().length > 0) ?? '';
    expect(firstMeaningfulLine).not.toMatch(/'use client'/);
  });

  it('sets data-theme via setAttribute (not classList)', () => {
    expect(content).toContain("setAttribute('data-theme'");
    expect(content).not.toContain("classList.add('dark')");
  });

  it('has suppressHydrationWarning on the html element', () => {
    expect(content).toContain('suppressHydrationWarning');
  });

  it('uses localStorage key "theme"', () => {
    expect(content).toContain("localStorage.getItem('theme')");
  });
});
