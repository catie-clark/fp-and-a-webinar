// src/components/ui/InfinityLoader.tsx
// React Bits InfinityLoader — TS-TW variant copy-paste.
// Rendered via next/dynamic { ssr: false } in AiSummarySection.
// Pure SVG + CSS animation — no window/document access.

interface InfinityLoaderProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function InfinityLoader({
  size = 48,
  color = 'var(--accent)',
  className = '',
}: InfinityLoaderProps) {
  return (
    <svg
      width={size}
      height={size / 2}
      viewBox="0 0 100 50"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Loading"
      role="status"
    >
      <style>{`
        @keyframes infinity-dash {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -314; }
        }
        .infinity-path {
          fill: none;
          stroke-width: 6;
          stroke-linecap: round;
          stroke-dasharray: 157 157;
          animation: infinity-dash 1.6s linear infinite;
        }
      `}</style>
      {/* Infinity symbol: two tangent circles drawn as a single path */}
      <path
        className="infinity-path"
        stroke={color}
        d="M25,25 A15,15 0 1,1 25,24.999 M75,25 A15,15 0 1,0 75,24.999 M40,25 Q50,10 60,25 Q50,40 40,25"
      />
    </svg>
  );
}
