'use client';

import NumberFlow from '@number-flow/react';

// An amount whose digits roll when it changes (quantity edits, a removed line). It follows the
// user's reduced-motion setting by itself, and prints exactly what formatNaira prints: "₦270,000".
const NAIRA = { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 } as const;

export function AnimatedNaira({ value, className }: { value: number; className?: string }) {
  return <NumberFlow value={value} locales="en-NG" format={NAIRA} className={className} />;
}

export function AnimatedCount({ value, className }: { value: number; className?: string }) {
  return <NumberFlow value={value} locales="en-NG" className={className} />;
}
