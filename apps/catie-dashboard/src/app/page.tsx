'use client';
// src/app/page.tsx
// Landing/splash page — Client Component for Framer Motion entrance animations.
// LandingBackground loaded via next/dynamic ssr:false (same pattern as InfinityLoader).
// Navigates to /dashboard via Next.js Link.
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

// SSR-safe: LandingBackground uses canvas API (browser-only)
const LandingBackground = dynamic(
  () => import('@/components/landing/LandingBackground'),
  { ssr: false, loading: () => null }
);

// Feature highlights (locked content from CONTEXT.md)
const FEATURES = [
  { icon: '⚡', label: 'Real-time Scenario Modeling' },
  { icon: '🤖', label: 'AI-Generated Executive Narrative' },
  { icon: '📊', label: 'Live Month-End Close Tracking' },
];

// Entrance animation variants — professional fade + slide-up
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

const ctaVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function LandingPage() {
  // Respect prefers-reduced-motion — check JS-side (CSS media query doesn't disable Framer Motion)
  const reducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#011E41',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        // Subtle radial gradient overlay on top of solid background
        backgroundImage:
          'radial-gradient(ellipse at 20% 50%, rgba(0,63,159,0.25) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(245,168,0,0.08) 0%, transparent 50%)',
      }}
    >
      {/* Animated particles background — browser-only via dynamic import */}
      <LandingBackground />

      {/* Content layer — above background, centered */}
      <motion.div
        variants={reducedMotion ? undefined : containerVariants}
        initial={reducedMotion ? false : 'hidden'}
        animate={reducedMotion ? undefined : 'visible'}
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          maxWidth: '640px',
          width: '100%',
          padding: '2rem',
        }}
      >
        {/* Crowe wordmark */}
        <motion.div variants={reducedMotion ? undefined : itemVariants}>
          <span
            style={{
              display: 'inline-block',
              color: 'rgba(246,247,250,0.7)',
              fontWeight: 700,
              fontSize: '1.125rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '1.5rem',
              fontFamily: '"Helvetica Now Display", "Helvetica Neue", Arial, sans-serif',
            }}
          >
            Crowe
          </span>
        </motion.div>

        {/* Display headline */}
        <motion.h1
          variants={reducedMotion ? undefined : itemVariants}
          style={{
            color: '#f6f7fa',
            fontSize: 'clamp(1.875rem, 4vw, 2.75rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            margin: '0 0 1rem',
            fontFamily: '"Helvetica Now Display", "Helvetica Neue", Arial, sans-serif',
            letterSpacing: '-0.02em',
          }}
        >
          FP&amp;A Close Efficiency Dashboard
        </motion.h1>

        {/* Muted subheadline */}
        <motion.p
          variants={reducedMotion ? undefined : itemVariants}
          style={{
            color: 'rgba(154,178,212,0.9)',
            fontSize: '1rem',
            margin: '0 0 2.5rem',
            fontWeight: 400,
          }}
        >
          Summit Logistics Group &middot; January 2026
        </motion.p>

        {/* Feature highlights */}
        <motion.div
          variants={reducedMotion ? undefined : itemVariants}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginBottom: '2.5rem',
            alignItems: 'center',
          }}
        >
          {FEATURES.map(({ icon, label }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'rgba(246,247,250,0.85)',
                fontSize: '0.9375rem',
              }}
            >
              <span aria-hidden="true" style={{ fontSize: '1.125rem' }}>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA button — Crowe Amber, navigates to /dashboard */}
        <motion.div variants={reducedMotion ? undefined : ctaVariants}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.875rem 2rem',
                borderRadius: '10px',
                border: 'none',
                background: '#F5A800',
                color: '#011E41',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 4px 16px rgba(245,168,0,0.30)',
                transition: 'transform 150ms ease, box-shadow 150ms ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  '0 6px 24px rgba(245,168,0,0.40)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  '0 4px 16px rgba(245,168,0,0.30)';
              }}
            >
              Enter Dashboard
              <span aria-hidden="true" style={{ fontSize: '1.1em' }}>
                →
              </span>
            </button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
