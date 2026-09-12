import type { SVGProps } from 'react';

// Custom line icons for each material category, drawn to match Lucide's
// visual language (24x24, strokeWidth 2, round caps/joins) but depicting
// the actual product instead of a generic stand-in (Lucide's Layers,
// Grid3x3, etc.) — a cement bag, not a generic "layers" glyph.
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

// A cement bag — trapezoid body tapering to a folded top, with two label
// print-lines.
export function CementIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 8 6 20a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1L17 8" />
      <path d="M7 8 9 4h6l2 4" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  );
}

// A three-core concrete masonry unit (CMU block) — the classic hollow-core
// cinder block silhouette.
export function BlocksIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="7" width="18" height="10" rx="1" />
      <path d="M9 7v10" />
      <path d="M15 7v10" />
    </svg>
  );
}

// A deformed reinforcement bar — diagonal rod with the ridge deformations
// that give rebar its grip.
export function RebarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20 20 4" />
      <path d="M7.5 16.5 9.5 14.5" />
      <path d="M11.5 12.5 13.5 10.5" />
      <path d="M15.5 8.5 17.5 6.5" />
    </svg>
  );
}

// Corrugated roofing sheets, stacked — the product itself, not a house/roof
// glyph (this app already has enough architectural icons elsewhere).
export function RoofingIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 9c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
      <path d="M3 15c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" />
    </svg>
  );
}

// A pipe elbow fitting — vertical pipe bending into a horizontal run, with
// cut-end caps at both openings.
export function FittingsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 4v8a4 4 0 0 0 4 4h8" />
      <path d="M5 4h6" />
      <path d="M17 13h6" />
    </svg>
  );
}
