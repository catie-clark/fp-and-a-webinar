// src/components/ui/Button.tsx
// shadcn-style Button — copy-paste model, no CLI init.
// Uses cn() for class merging. Colors via existing Crowe CSS variables.
// Radix UI not needed for Button (pure HTML button is sufficient).
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  className,
  variant = 'default',
  size = 'md',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        // Base — layout, font, transition
        'inline-flex items-center justify-center font-semibold transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 whitespace-nowrap',
        // Disabled state
        disabled && 'opacity-60 cursor-not-allowed',
        // Variants — using Crowe CSS variables via arbitrary values
        variant === 'default' && [
          'bg-[var(--accent)] text-[#011E41] border-0',
          !disabled && 'hover:opacity-90 active:scale-[0.98]',
        ],
        variant === 'outline' && [
          'bg-transparent border border-[var(--border)] text-[var(--foreground)]',
          !disabled && 'hover:bg-[var(--surface)]',
        ],
        variant === 'ghost' && [
          'bg-transparent border-0 text-[var(--foreground)]',
          !disabled && 'hover:bg-[var(--surface)]',
        ],
        variant === 'destructive' && [
          'bg-[#E5376B] text-white border-0',
          !disabled && 'hover:opacity-90',
        ],
        // Sizes
        size === 'sm' && 'text-xs px-3 py-1.5 rounded-md gap-1.5',
        size === 'md' && 'text-sm px-4 py-2 rounded-lg gap-2',
        size === 'lg' && 'text-base px-6 py-3 rounded-xl gap-2',
        className
      )}
      {...props}
    />
  );
}
