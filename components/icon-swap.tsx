import type { ReactNode } from 'react';

// Cross-fades one icon into another when `swapped` changes (scale 0.25 to 1, opacity, 4px blur,
// 300ms, no overshoot). Both stay mounted, so it only animates on a change, never on first paint.
// Pass icons with `className="size-full"`; the size comes from `className` here.
export function IconSwap({
  swapped,
  from,
  to,
  className = 'size-4',
}: {
  swapped: boolean;
  from: ReactNode;
  to: ReactNode;
  className?: string;
}) {
  const layer =
    'absolute inset-0 flex items-center justify-center transition-[opacity,filter,scale] duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none';
  const on = 'scale-100 opacity-100 blur-0';
  const off = 'scale-[0.25] opacity-0 blur-[4px]';
  return (
    <span aria-hidden className={`relative shrink-0 ${className}`}>
      <span className={`${layer} ${swapped ? off : on}`}>{from}</span>
      <span className={`${layer} ${swapped ? on : off}`}>{to}</span>
    </span>
  );
}
