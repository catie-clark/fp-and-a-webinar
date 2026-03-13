// src/app/layout.tsx
// Root App Router layout — Server Component (no "use client")
// The blocking script prevents flash-of-wrong-theme by setting data-theme
// synchronously before the browser paints any CSS.
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FP&A Close Efficiency Dashboard',
  description: 'Real-time financial close tracking and scenario modeling',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Blocking script: runs synchronously before any CSS is applied.
          Sets data-theme attribute from localStorage so globals.css
          html[data-theme="light"] / html[data-theme="dark"] selectors activate
          on the correct theme without any visible flash.
          Default: 'light' — projector-safe; dark mode can make charts invisible.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              try {
                var t = localStorage.getItem('theme') || 'light';
                document.documentElement.setAttribute('data-theme', t);
              } catch(e) {}
            })();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
