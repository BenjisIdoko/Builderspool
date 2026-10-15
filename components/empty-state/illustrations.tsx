import { useId } from 'react';

// Decorative illustrations for empty/error states — hand-drawn inline SVG in
// the brand palette (via the same color tokens Tailwind uses), a few hundred
// bytes each, no network or JS. Motion is CSS-only (.bp-float/.bp-sway/
// .bp-bob in globals.css) and switches off under prefers-reduced-motion.
// Always aria-hidden: the heading next to them carries the meaning.
type Props = { className?: string };

function Frame({ className, children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 200 150"
      className={className}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

function Sparkle({ x, y, delay = '0s' }: { x: number; y: number; delay?: string }) {
  return (
    <g className="bp-float stroke-brand-warm" style={{ animationDelay: delay }} strokeWidth="2.5">
      <path d={`M${x} ${y - 5}V${y + 5}M${x - 5} ${y}H${x + 5}`} />
    </g>
  );
}

// Empty cart — a shopping cart on a soft backdrop, with a "0" badge.
export function EmptyCartIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      {/* soft backdrop blobs + a dashed orbit */}
      <path
        d="M30 84C26 62 44 44 70 40C96 36 118 28 144 40C170 52 178 78 166 98C154 118 124 124 96 124C64 124 34 108 30 84Z"
        className="fill-brand/10"
      />
      <path
        d="M120 52C142 48 168 60 170 82C172 100 156 112 138 114C122 116 112 104 108 88C104 72 108 54 120 52Z"
        className="fill-brand/10"
      />
      <path
        d="M34 96C28 70 52 46 84 42C112 38 150 40 168 62C180 78 170 100 148 108"
        className="bp-dash stroke-border-strong"
        strokeWidth="1.6"
        strokeDasharray="4 5"
      />
      <circle cx="52" cy="40" r="7" className="fill-brand-soft" />
      <circle cx="52" cy="40" r="3" className="fill-brand/30" />
      <Sparkle x={160} y={30} />
      <Sparkle x={26} y={110} delay="1.1s" />

      <ellipse cx="104" cy="132" rx="48" ry="5" className="fill-border" opacity="0.7" />

      <g className="bp-bob">
        {/* handle */}
        <path d="M34 42H54Q60 42 62 48L68 66" className="stroke-brand/55" strokeWidth="8" />
        {/* basket */}
        <path
          d="M62 62H148Q155 62 153.5 69L144 106Q142.5 112 136 112H82Q76 112 74.5 106Z"
          className="fill-brand"
        />
        <path d="M62 62H148Q155 62 153.5 69L152.5 73H64Z" className="fill-white/10" />
        {/* slats */}
        <rect x="90" y="76" width="8" height="26" rx="4" className="fill-white/45" />
        <rect x="106" y="76" width="8" height="26" rx="4" className="fill-white/45" />
        <rect x="122" y="76" width="8" height="26" rx="4" className="fill-white/45" />
        {/* wheels */}
        <circle cx="90" cy="124" r="10" className="fill-brand-soft stroke-brand/60" strokeWidth="3" />
        <circle cx="90" cy="124" r="4.5" className="fill-brand" />
        <circle cx="130" cy="124" r="10" className="fill-brand-soft stroke-brand/60" strokeWidth="3" />
        <circle cx="130" cy="124" r="4.5" className="fill-brand" />
        {/* count badge */}
        <circle cx="154" cy="58" r="14" className="fill-brand-warm" />
        <circle cx="154" cy="58" r="14" className="stroke-surface" strokeWidth="3" />
        <text
          x="154"
          y="64"
          textAnchor="middle"
          className="fill-white"
          style={{ fontSize: 17, fontWeight: 800 }}
        >
          0
        </text>
      </g>
    </Frame>
  );
}

// 404 — a brick wall with one brick missing, and a stray "?" in its place.
export function NotFoundIllustration({ className }: Props) {
  const clip = useId();
  const rows = [0, 1, 2];
  const bricks: { x: number; y: number; missing: boolean }[] = [];
  rows.forEach((r) => {
    const start = 30 - (r % 2 === 1 ? 20 : 0);
    for (let x = start, i = 0; x < 170; x += 43, i++) {
      bricks.push({ x, y: 64 + r * 22, missing: r === 1 && i === 2 });
    }
  });
  return (
    <Frame className={className}>
      <ellipse cx="100" cy="138" rx="76" ry="5" className="fill-well" />
      <text
        x="100"
        y="46"
        textAnchor="middle"
        className="fill-brand"
        style={{ fontSize: 34, fontWeight: 800, letterSpacing: '0.04em' }}
      >
        404
      </text>
      <clipPath id={clip}>
        <rect x="30" y="64" width="140" height="66" rx="4" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        {bricks.map((b) =>
          b.missing ? null : (
            <rect
              key={`${b.x}-${b.y}`}
              x={b.x}
              y={b.y}
              width="40"
              height="19"
              rx="3"
              className="fill-brand-soft stroke-brand"
              strokeWidth="2.5"
            />
          ),
        )}
      </g>
      <rect x="96" y="86" width="40" height="19" rx="3" className="stroke-border-strong" strokeWidth="2.5" strokeDasharray="5 5" />
      <g className="bp-bob">
        <circle cx="116" cy="74" r="11" className="fill-brand-warm" />
        <text x="116" y="79" textAnchor="middle" className="fill-surface" style={{ fontSize: 15, fontWeight: 800 }}>
          ?
        </text>
      </g>
    </Frame>
  );
}

// No search/filter results — a magnifier over a stack of blocks.
export function NoResultsIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <ellipse cx="100" cy="136" rx="66" ry="6" className="fill-well" />
      <rect x="40" y="100" width="56" height="28" rx="4" className="fill-brand-soft stroke-brand" strokeWidth="3" />
      <rect x="62" y="74" width="56" height="26" rx="4" className="fill-surface stroke-border-strong" strokeWidth="3" />
      <rect x="44" y="52" width="48" height="22" rx="4" className="fill-brand-soft stroke-brand" strokeWidth="3" />
      <g className="bp-sway">
        <circle cx="128" cy="62" r="28" className="fill-surface/70 stroke-ink" strokeWidth="6" />
        <path d="M148 84L170 108" className="stroke-ink" strokeWidth="9" />
        <path d="M117 56a14 14 0 0 1 12-8" className="stroke-brand" strokeWidth="3.5" />
      </g>
    </Frame>
  );
}

// Empty list (orders, bids, payouts, allocations…) — a blank clipboard.
export function EmptyListIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <ellipse cx="100" cy="138" rx="56" ry="5" className="fill-well" />
      <rect x="60" y="20" width="80" height="108" rx="10" className="fill-surface stroke-border-strong" strokeWidth="4" />
      <rect x="82" y="12" width="36" height="18" rx="6" className="fill-brand" />
      {[52, 70, 88, 106].map((y) => (
        <g key={y}>
          <circle cx="76" cy={y} r="4" className="fill-well stroke-border-strong" strokeWidth="2" />
          <rect x="88" y={y - 3.5} width={y % 36 === 16 ? 34 : 42} height="7" rx="3.5" className="fill-well" />
        </g>
      ))}
      <g className="bp-bob">
        <path d="M150 96L174 72L182 80L158 104L148 108Z" className="fill-brand-warm stroke-ink" strokeWidth="3" />
      </g>
    </Frame>
  );
}

// No notifications — a quiet bell.
export function NoNotificationsIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <ellipse cx="100" cy="136" rx="46" ry="5" className="fill-well" />
      <g className="bp-sway">
        <circle cx="100" cy="26" r="6" className="fill-brand" />
        <path
          d="M100 30C78 30 70 50 70 68C70 84 62 90 56 98H144C138 90 130 84 130 68C130 50 122 30 100 30Z"
          className="fill-brand-soft stroke-brand"
          strokeWidth="4"
        />
        <path d="M89 104a11 11 0 0 0 22 0Z" className="fill-brand" />
      </g>
      <g className="bp-float fill-muted-foreground" style={{ fontSize: 16, fontWeight: 800 }}>
        <text x="136" y="48">z</text>
      </g>
      <g className="bp-float fill-muted-foreground" style={{ fontSize: 11, fontWeight: 800, animationDelay: '1s' }}>
        <text x="152" y="34">z</text>
      </g>
    </Frame>
  );
}

// Offline — signal arcs with a slash through them.
export function OfflineIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <ellipse cx="100" cy="136" rx="52" ry="5" className="fill-well" />
      <path d="M52 66Q100 24 148 66" className="stroke-brand/30" strokeWidth="8" />
      <path d="M68 84Q100 56 132 84" className="stroke-brand/60" strokeWidth="8" />
      <path d="M84 102Q100 88 116 102" className="stroke-brand" strokeWidth="8" />
      <circle cx="100" cy="118" r="6" className="fill-brand" />
      <g className="bp-bob">
        <path d="M54 28L146 124" className="stroke-surface" strokeWidth="14" />
        <path d="M54 28L146 124" className="stroke-danger" strokeWidth="6" />
      </g>
    </Frame>
  );
}

// Something went wrong — a traffic cone.
export function ErrorIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <ellipse cx="100" cy="138" rx="56" ry="5" className="fill-well" />
      <g className="bp-sway">
        <path d="M100 22L130 108H70Z" className="fill-brand-warm stroke-ink" strokeWidth="4" />
        <path d="M91 52H109L112 64H88Z" className="fill-surface" />
        <path d="M82 80H118L121 92H79Z" className="fill-surface" />
        <rect x="56" y="108" width="88" height="14" rx="4" className="fill-ink" />
      </g>
      <Sparkle x={150} y={44} />
      <Sparkle x={52} y={56} delay="1.2s" />
    </Frame>
  );
}
