
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

// Shared scene setting for every illustration: soft blobs, a dashed orbit,
// a couple of sparkles and a ground shadow, so the set reads as one family.
function Backdrop({ sparkles = true }: { sparkles?: boolean }) {
  return (
    <>
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
      {sparkles && (
        <>
          <Sparkle x={162} y={28} />
          <Sparkle x={26} y={112} delay="1.1s" />
        </>
      )}
      <ellipse cx="104" cy="132" rx="48" ry="5" className="fill-border" opacity="0.7" />
    </>
  );
}

// Round accent badge (warm orange, white ring) carrying a glyph.
function Badge({ cx, cy, children }: { cx: number; cy: number; children: React.ReactNode }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="14" className="fill-brand-warm stroke-surface" strokeWidth="3" />
      {children}
    </g>
  );
}

function BadgeText({ cx, cy, text }: { cx: number; cy: number; text: string }) {
  return (
    <text x={cx} y={cy + 6} textAnchor="middle" className="fill-white" style={{ fontSize: 17, fontWeight: 800 }}>
      {text}
    </text>
  );
}

// Empty cart — a shopping cart with a "0" badge.
export function EmptyCartIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <Backdrop />
      <g className="bp-bob">
        <path d="M34 42H54Q60 42 62 48L68 66" className="stroke-brand/55" strokeWidth="8" />
        <path
          d="M62 62H148Q155 62 153.5 69L144 106Q142.5 112 136 112H82Q76 112 74.5 106Z"
          className="fill-brand"
        />
        <path d="M62 62H148Q155 62 153.5 69L152.5 73H64Z" className="fill-white/10" />
        <rect x="90" y="76" width="8" height="26" rx="4" className="fill-white/45" />
        <rect x="106" y="76" width="8" height="26" rx="4" className="fill-white/45" />
        <rect x="122" y="76" width="8" height="26" rx="4" className="fill-white/45" />
        <circle cx="90" cy="124" r="10" className="fill-brand-soft stroke-brand/60" strokeWidth="3" />
        <circle cx="90" cy="124" r="4.5" className="fill-brand" />
        <circle cx="130" cy="124" r="10" className="fill-brand-soft stroke-brand/60" strokeWidth="3" />
        <circle cx="130" cy="124" r="4.5" className="fill-brand" />
        <Badge cx={154} cy={58}>
          <BadgeText cx={154} cy={58} text="0" />
        </Badge>
      </g>
    </Frame>
  );
}

// 404 — a browser window showing "404", with a "?" badge.
export function NotFoundIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <Backdrop />
      <g className="bp-bob">
        <rect x="48" y="38" width="104" height="80" rx="11" className="fill-brand" />
        <path d="M48 49Q48 38 59 38H141Q152 38 152 49V56H48Z" className="fill-white/15" />
        <circle cx="60" cy="47" r="3" className="fill-white/60" />
        <circle cx="70" cy="47" r="3" className="fill-white/60" />
        <circle cx="80" cy="47" r="3" className="fill-white/60" />
        <text
          x="100"
          y="94"
          textAnchor="middle"
          className="fill-white"
          style={{ fontSize: 32, fontWeight: 800, letterSpacing: '0.03em' }}
        >
          404
        </text>
        <rect x="72" y="102" width="56" height="6" rx="3" className="fill-white/35" />
        <Badge cx={152} cy={40}>
          <BadgeText cx={152} cy={40} text="?" />
        </Badge>
      </g>
    </Frame>
  );
}

// No search/filter results — a magnifier with a "0" badge.
export function NoResultsIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <Backdrop />
      <g className="bp-sway">
        <path d="M116 92L146 122" className="stroke-brand-deep" strokeWidth="13" />
        <circle cx="96" cy="68" r="32" className="fill-surface stroke-brand" strokeWidth="10" />
        <path d="M78 56a20 20 0 0 1 14-9" className="stroke-brand/35" strokeWidth="5" />
        <path d="M86 60a10 10 0 0 1 20 0c0 7-10 8-10 15" className="stroke-brand/55" strokeWidth="5" />
        <circle cx="96" cy="85" r="3.2" className="fill-brand/55" />
        <Badge cx={142} cy={44}>
          <BadgeText cx={142} cy={44} text="0" />
        </Badge>
      </g>
    </Frame>
  );
}

// Empty list (orders, bids, payouts, allocations…) — a blank clipboard with a "+".
export function EmptyListIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <Backdrop />
      <g className="bp-bob">
        <rect x="62" y="30" width="76" height="94" rx="11" className="fill-brand" />
        <rect x="71" y="42" width="58" height="73" rx="6" className="fill-surface" />
        <rect x="84" y="22" width="32" height="16" rx="6" className="fill-brand-deep" />
        {[56, 71, 86, 101].map((y, i) => (
          <g key={y}>
            <circle cx="80" cy={y} r="3.5" className="fill-brand/25" />
            <rect x="90" y={y - 3} width={i % 2 ? 26 : 32} height="6" rx="3" className="fill-brand/15" />
          </g>
        ))}
        <Badge cx={142} cy={42}>
          <path d="M142 35V49M135 42H149" className="stroke-white" strokeWidth="3.5" />
        </Badge>
      </g>
    </Frame>
  );
}

// No notifications — a bell with a "caught up" check.
export function NoNotificationsIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <Backdrop />
      <g className="bp-sway">
        <circle cx="100" cy="30" r="6.5" className="fill-brand-deep" />
        <path
          d="M100 34C79 34 70 52 70 70C70 86 63 92 57 100H143C137 92 130 86 130 70C130 52 121 34 100 34Z"
          className="fill-brand"
        />
        <path d="M82 52Q86 42 98 40" className="stroke-white/40" strokeWidth="5" />
        <rect x="55" y="98" width="90" height="8" rx="4" className="fill-brand-deep" />
        <path d="M89 108a11 11 0 0 0 22 0Z" className="fill-brand-deep" />
      </g>
      <g className="bp-float fill-brand/50" style={{ fontSize: 15, fontWeight: 800 }}>
        <text x="132" y="38">z</text>
      </g>
      <g className="bp-float fill-brand/35" style={{ fontSize: 11, fontWeight: 800, animationDelay: '1s' }}>
        <text x="146" y="26">z</text>
      </g>
      <Badge cx={142} cy={92}>
        <path d="M135 92L140 97L149 87" className="stroke-white" strokeWidth="3.5" />
      </Badge>
    </Frame>
  );
}

// Offline — a cloud crossed out.
export function OfflineIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <Backdrop />
      <g className="bp-bob">
        <g className="fill-brand">
          <rect x="60" y="82" width="110" height="30" rx="15" />
          <circle cx="92" cy="80" r="22" />
          <circle cx="124" cy="68" r="28" />
          <circle cx="152" cy="88" r="18" />
        </g>
        <path d="M108 54Q118 44 132 44" className="stroke-white/35" strokeWidth="5" />
        <rect x="76" y="98" width="40" height="6" rx="3" className="fill-white/35" />
        <path d="M70 40L150 118" className="stroke-surface" strokeWidth="14" />
        <path d="M70 40L150 118" className="stroke-brand-warm" strokeWidth="7" />
      </g>
    </Frame>
  );
}

// Something went wrong — a traffic cone with a "!" badge.
export function ErrorIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <Backdrop />
      <g className="bp-sway">
        <path d="M100 26L128 108H72Z" className="fill-brand-warm" />
        <path d="M91.5 56H108.5L112 68H88Z" className="fill-white/90" />
        <path d="M82 82H118L121.5 94H78.5Z" className="fill-white/90" />
        <rect x="56" y="106" width="88" height="14" rx="5" className="fill-brand-deep" />
        <Badge cx={146} cy={48}>
          <BadgeText cx={146} cy={48} text="!" />
        </Badge>
      </g>
    </Frame>
  );
}
