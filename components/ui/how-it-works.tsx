import { REVEAL_STAGGER, Reveal } from '@/components/motion/reveal';

// "Pinned note" step cards joined by a dashed, slowly moving line. From md up the cards zig-zag
// down the page and tilt a little; on phones they stack straight. The background belongs to the
// section that holds this, so it sets none. Colours come from the storefront tokens.

export type StepTheme = 'orange' | 'blue' | 'slate' | 'green';

export interface HowItWorksStep {
  title: string;
  description: string;
  theme?: StepTheme;
}

const THEMES: Record<StepTheme, { panel: string; accent: string }> = {
  orange: { panel: 'bg-orange-soft border-orange/30', accent: 'text-orange-text' },
  blue: { panel: 'bg-pale-blue border-cyan/30', accent: 'text-cyan-text' },
  slate: { panel: 'bg-well/60 border-border', accent: 'text-ink' },
  green: { panel: 'bg-success-soft border-success/25', accent: 'text-success' },
};

// Where each card sits at md and up (the container is 1000 wide), and which way it leans.
const POSITIONS = [
  'md:absolute md:top-0 md:left-[15%] md:rotate-6',
  'md:absolute md:top-[120px] md:right-[15%] md:-rotate-6',
  'md:absolute md:top-[450px] md:left-[15%] md:rotate-6',
  'md:absolute md:top-[570px] md:right-[10%] md:-rotate-6',
  'md:absolute md:top-[850px] md:left-[15%] md:rotate-6',
] as const;

// The dashed line, one curve per gap between cards, in the same 1000-wide space.
const PATH_START = 'M 290 150';
const PATH_SEGMENTS = [
  ' C 500 150, 550 270, 710 270',
  ' C 850 270, 500 350, 290 450',
  ' C 290 600, 550 720, 750 720',
  ' C 950 720, 500 800, 290 850',
];
const HEIGHT_BY_COUNT: Record<number, number> = { 1: 400, 2: 450, 3: 800, 4: 900, 5: 1130 };

function Pin({ className }: { className?: string }) {
  return (
    <svg aria-hidden xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16 3a1 1 0 0 1 .117 1.993l-.117 .007v4.764l1.894 3.789a1 1 0 0 1 .1 .331l.006 .116v2a1 1 0 0 1 -.883 .993l-.117 .007h-4v4a1 1 0 0 1 -1.993 .117l-.007 -.117v-4h-4a1 1 0 0 1 -.993 -.883l-.007 -.117v-2a1 1 0 0 1 .06 -.34l.046 -.107l1.894 -3.791v-4.762a1 1 0 0 1 -.117 -1.993l.117 -.007h8z" />
    </svg>
  );
}

function StepCard({ number, step }: { number: string; step: HowItWorksStep }) {
  const t = THEMES[step.theme ?? 'blue'];
  return (
    <div className="w-full rounded-[24px] bg-surface p-2 shadow-[0_0_0_1px_var(--color-hairline),0_10px_20px_rgba(11,31,58,0.12)] transition-transform duration-300 hover:z-30 hover:scale-105 md:w-[280px]">
      <Pin className={`mx-auto mb-4 size-8 ${t.accent}`} />
      <div className={`flex flex-col rounded-[16px] border p-4 ${t.panel}`}>
        <span className={`mb-4 font-mono text-figure-lg tabular-nums ${t.accent}`}>{number}</span>
        <h3 className="mb-2 text-balance text-heading-sm text-ink">{step.title}</h3>
        <p className="text-pretty text-body-sm text-slate">{step.description}</p>
      </div>
    </div>
  );
}

export function HowItWorks({ steps, className = '' }: { steps: HowItWorksStep[]; className?: string }) {
  const height = HEIGHT_BY_COUNT[Math.min(steps.length, 5)] ?? 1130;
  const path = PATH_START + PATH_SEGMENTS.slice(0, Math.max(0, steps.length - 1)).join('');

  return (
    <div className={`relative mx-auto w-full max-w-[1000px] ${className}`}>
      {steps.length > 1 && (
        <svg
          aria-hidden
          viewBox={`0 0 1000 ${height}`}
          preserveAspectRatio="none"
          className="pointer-events-none absolute top-0 left-0 z-0 hidden h-full w-full md:block"
          style={{ height }}
        >
          <path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="8 6"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className="animate-[bp-dash-flow_3s_linear_infinite] text-cyan-strong/60"
          />
        </svg>
      )}
      <ol className="flex flex-col gap-8 md:block md:h-[var(--how-height)]" style={{ '--how-height': `${height}px` } as React.CSSProperties}>
        {steps.map((step, i) => (
          <li key={step.title} className={`relative ${POSITIONS[i % POSITIONS.length]}`}>
            <Reveal delay={i * REVEAL_STAGGER}>
              <StepCard number={String(i + 1).padStart(2, '0')} step={step} />
            </Reveal>
          </li>
        ))}
      </ol>
    </div>
  );
}
