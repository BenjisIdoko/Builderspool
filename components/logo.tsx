import { useId } from 'react';

// The actual brand mark (blue gradient monogram, building-skyline cutouts,
// wave swoosh) — sourced from the original Stitch design export's SVG, not
// redrawn from the screenshot. Previously every header used a plain "B in a
// colored square" placeholder instead of this.
export function LogoMark({ className }: { className?: string }) {
  const uid = useId();
  const blueId = `bp-blue-${uid}`;
  const waveId = `bp-wave-${uid}`;

  return (
    <svg viewBox="0 0 44 44" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={blueId} x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#0f62fe" />
        </linearGradient>
        <linearGradient id={waveId} x1="0" y1="0" x2="40" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="40" height="40" rx="8" fill={`url(#${blueId})`} />
      <rect x="8" y="14" width="6" height="20" rx="1" fill="#ffffff" opacity="0.95" />
      <rect x="17" y="8" width="8" height="26" rx="1" fill="#ffffff" />
      <rect x="28" y="18" width="6" height="16" rx="1" fill="#ffffff" opacity="0.9" />
      <path d="M4 36 Q16 28 28 34 T42 32" stroke={`url(#${waveId})`} strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Logo({
  className = '',
  size = 'md',
  showTagline = false,
}: {
  className?: string;
  size?: 'sm' | 'md';
  showTagline?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className={size === 'sm' ? 'size-7' : 'size-8'} />
      <span className="flex flex-col leading-none">
        <span className={`font-bold tracking-tight text-ink ${size === 'sm' ? 'text-sm' : 'text-[15px]'}`}>
          Builders<span className="text-brand">Pool</span>
        </span>
        {showTagline && (
          <span className="mt-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Trade materials
          </span>
        )}
      </span>
    </span>
  );
}
