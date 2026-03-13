// src/components/ui/Tooltip.tsx
// shadcn-style Tooltip — wraps @radix-ui/react-tooltip with Crowe theming.
// TooltipProvider must wrap the app (or section). Added to DashboardApp.tsx.
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  className,
  sideOffset = 6,
  ...props
}: TooltipPrimitive.TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 max-w-[220px] rounded-lg px-3 py-2 text-xs',
          'bg-[var(--card)] border border-[var(--border)]',
          'text-[var(--foreground)]',
          'shadow-[0_4px_16px_rgba(1,30,65,0.12)]',
          'animate-in fade-in-0 zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
