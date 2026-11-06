'use client';

import type { ReactNode } from 'react';
import { LazyMotion, MotionConfig, domAnimation, m, useReducedMotion } from 'motion/react';

// Showroom scroll reveal (DESIGN.md v3.0 section 7): fades and lifts content
// once as it enters the viewport — opacity plus a 24px translate, 240ms,
// emphasised ease. `delay` staggers siblings; use 80ms steps and no more than
// four items in a group. Under prefers-reduced-motion it renders static content
// with no hidden starting state. Not for above-the-fold content.
export const REVEAL_STAGGER = 0.08;

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <m.div
          data-reveal
          className={className}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px -60px 0px' }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1], delay }}
        >
          {children}
        </m.div>
      </MotionConfig>
    </LazyMotion>
  );
}
