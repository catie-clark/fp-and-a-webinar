// src/components/ui/Select.tsx
// shadcn-style Select — wraps @radix-ui/react-select with Crowe theming.
// Copy-paste model: no shadcn CLI. Radix primitives already installed.
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '@/lib/utils';

// Re-export Root, Value, and Group unchanged — callers use as Select, SelectValue, SelectGroup.
export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;
export const SelectGroup = SelectPrimitive.Group;

// Styled Trigger
export function SelectTrigger({
  className,
  children,
  style,
  ...props
}: SelectPrimitive.SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'w-full text-sm',
        'bg-[var(--card)] border border-[var(--border)] rounded-lg',
        'text-[var(--foreground)] cursor-pointer',
        'hover:bg-[var(--surface)] transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1',
        'data-[placeholder]:text-[var(--muted-color)]',
        className
      )}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem 0.75rem',
        gap: '0.5rem',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        color: 'var(--foreground)',
        cursor: 'pointer',
        width: '100%',
        fontSize: '0.875rem',
        ...style,
      }}
      {...props}
    >
      {children}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ flexShrink: 0, opacity: 0.6 }}>
        <path d="M6 9l6 6 6-6" />
      </svg>
    </SelectPrimitive.Trigger>
  );
}

// Styled Content (dropdown panel)
export function SelectContent({
  className,
  children,
  ...props
}: SelectPrimitive.SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        sideOffset={4}
        style={{ background: 'var(--card-solid, var(--card))', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(1,30,65,0.12)', zIndex: 50, overflow: 'hidden' }}
        className={cn(
          'relative min-w-[var(--radix-select-trigger-width)]',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          className
        )}
        {...props}
      >
        <SelectPrimitive.Viewport style={{ padding: 4 }}>
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

// Styled Item
export function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.SelectItemProps) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'data-[highlighted]:bg-[var(--accent-soft)]',
        className
      )}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
        borderRadius: 6,
        cursor: 'pointer',
        userSelect: 'none',
        color: 'var(--foreground)',
        outline: 'none',
        listStyle: 'none',
      }}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

// Styled Label (optional, for group headers)
export function SelectLabel({
  className,
  ...props
}: SelectPrimitive.SelectLabelProps) {
  return (
    <SelectPrimitive.Label
      className={cn(
        'px-3 py-1.5 text-xs font-semibold text-[var(--muted-color)] uppercase tracking-wide',
        className
      )}
      {...props}
    />
  );
}

// Separator
export function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.SelectSeparatorProps) {
  return (
    <SelectPrimitive.Separator
      className={cn('my-1 h-px bg-[var(--border)]', className)}
      {...props}
    />
  );
}
