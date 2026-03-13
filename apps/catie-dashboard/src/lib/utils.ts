// src/lib/utils.ts
// Standard shadcn cn() utility — used by Button, Select, Tooltip copy-paste components.
// clsx handles conditional/array class values; tailwind-merge resolves Tailwind conflicts.
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
