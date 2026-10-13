'use client';

import type { ReactNode } from 'react';
import { LazyMotion, MotionConfig, domAnimation, m } from 'motion/react';

// Fades and lifts content in once as it scrolls into view. LazyMotion with
// domAnimation keeps the client bundle small (no drag/layout features), and
// reducedMotion="user" makes the transform animation a no-op for visitors
// with prefers-reduced-motion set. Not for above-the-fold hero content —
// delaying it would hurt first paint.
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <m.div
          data-reveal
          className={className}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px -60px 0px' }}
          transition={{ duration: 0.4, ease: 'easeOut', delay }}
        >
          {children}
        </m.div>
      </MotionConfig>
    </LazyMotion>
  );
}
