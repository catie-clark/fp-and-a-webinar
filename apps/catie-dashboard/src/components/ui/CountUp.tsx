// src/components/ui/CountUp.tsx
// React Bits CountUp — animated number counter.
// Source: reactbits.dev/text-animations/count-up (TS-TW variant, adapted)
// Usage: <CountUp to={value} duration={0.5} separator="," />
// Re-animation: change the React key prop to restart animation from scratch.
// IMPORTANT: duration is in SECONDS (not milliseconds).
import { useEffect, useRef } from 'react';

interface CountUpProps {
  from?: number;
  to: number;
  separator?: string;
  direction?: 'up' | 'down';
  duration?: number; // in seconds
  className?: string;
  startWhen?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function formatWithSeparator(value: number, separator: string): string {
  if (!separator) return Math.round(value).toString();
  return Math.round(value).toLocaleString('en-US').replace(/,/g, separator);
}

export default function CountUp({
  from = 0,
  to,
  separator = '',
  direction = 'up',
  duration = 2,
  className = '',
  startWhen = true,
  onStart,
  onEnd,
}: CountUpProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startWhen) return;

    const node = nodeRef.current;
    if (!node) return;

    const startValue = direction === 'up' ? from : to;
    const endValue = direction === 'up' ? to : from;
    const startTime = performance.now();
    const durationMs = duration * 1000;

    onStart?.();

    function update(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeOutExpo(progress);
      const current = startValue + (endValue - startValue) * eased;
      node!.textContent = formatWithSeparator(current, separator);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(update);
      } else {
        node!.textContent = formatWithSeparator(endValue, separator);
        onEnd?.();
      }
    }

    frameRef.current = requestAnimationFrame(update);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [from, to, duration, separator, direction, startWhen, onStart, onEnd]);

  return (
    <span ref={nodeRef} className={className}>
      {formatWithSeparator(from, separator)}
    </span>
  );
}
