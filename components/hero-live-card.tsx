'use client';

import { useEffect, useRef, useState } from 'react';
import {
  PackageIcon,
  UsersThreeIcon,
  CheckCircleIcon,
  TruckIcon,
} from '@phosphor-icons/react/ssr';

// Phase 2 in the Fable reference ("3 suppliers responding" with named
// Supplier A/B/C prices) directly exposes competing bid identities/prices
// to the buyer — a blind-bidding violation, the same class of issue found
// and skipped in every earlier design-handoff pass this project has done.
// Replaced with our own already-real, already-vetted philosophy copy
// ("Procurement negotiated — Sellers compete to supply the pool") instead
// of inventing a fabricated supplier/price comparison.
const PHASES = [
  { icon: PackageIcon, label: 'Material request', title: '500 bags', sub: 'Cement' },
  { icon: UsersThreeIcon, label: 'Procurement negotiated', title: 'Sellers compete', sub: 'Blind bidding — no bids shown', pooling: true },
  { icon: CheckCircleIcon, label: 'Fixed price confirmed', title: '₦8,450', sub: '/ bag', success: true },
  { icon: TruckIcon, label: 'Order secured', title: 'Delivery scheduled', sub: 'Tomorrow, site delivery', success: true },
];

const VIEWBOX_W = 1280;
const VIEWBOX_H = 680;
const PATH_D = 'M700,610 C780,540 900,560 940,470 C975,390 1000,320 1080,220';

export function HeroLiveCard() {
  const pathRef = useRef<SVGPathElement>(null);
  const [fading, setFading] = useState(false);
  const [{ phase, point, reducedMotion }, setMotion] = useState({
    phase: 0,
    point: { x: 41, y: 78 },
    reducedMotion: false,
  });

  function pointForPhase(idx: number) {
    const path = pathRef.current;
    if (!path) return { x: 41, y: 78 };
    const len = path.getTotalLength();
    const t = idx / (PHASES.length - 1);
    const pt = path.getPointAtLength(t * len);
    return { x: (pt.x / VIEWBOX_W) * 100, y: (pt.y / VIEWBOX_H) * 100 };
  }

  useEffect(() => {
    // window.matchMedia and the SVG path's rendered length both only exist
    // after mount, so this can't be a useState lazy initializer — has to
    // run in an effect (same pattern as lib/cart/CartContext.tsx).
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startPhase = reduced ? 2 : 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMotion({ phase: startPhase, point: pointForPhase(startPhase), reducedMotion: reduced });
    if (reduced) return;
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setMotion((m) => {
          const next = (m.phase + 1) % PHASES.length;
          return { ...m, phase: next, point: pointForPhase(next) };
        });
        setFading(false);
      }, 260);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  const current = PHASES[phase];
  const Icon = current.icon;

  return (
    <>
      <svg viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 z-[1] size-full">
        <path ref={pathRef} d={PATH_D} stroke="rgba(255,255,255,0.14)" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
      </svg>

      <div
        className="absolute z-[2] min-w-[200px] max-w-[230px] rounded-2xl border border-white/40 bg-white/[0.22] p-3.5 shadow-[0_12px_32px_rgba(15,23,42,0.25),inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-[16px] backdrop-saturate-[1.6]"
        style={{
          left: `${point.x}%`,
          top: `${point.y}%`,
          opacity: fading ? 0.15 : 1,
          transform: `translate(-50%, -50%) translateY(${fading ? '6px' : '0px'})`,
          transition: reducedMotion
            ? 'none'
            : 'left 750ms cubic-bezier(0.22,1,0.36,1), top 750ms cubic-bezier(0.22,1,0.36,1), opacity 450ms cubic-bezier(0.22,1,0.36,1), transform 450ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <div
          className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.04em] uppercase"
          style={{ color: current.success ? '#8ef0b0' : 'rgba(255,255,255,0.75)' }}
        >
          <Icon weight="fill" className="size-3" />
          {current.label}
        </div>
        <div className="text-lg leading-tight font-extrabold text-white">{current.title}</div>
        <div className="mt-0.5 text-xs text-white/75">{current.sub}</div>
      </div>
    </>
  );
}
