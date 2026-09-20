'use client';

import { useRef, useState } from 'react';
import { TrashIcon } from '@phosphor-icons/react/ssr';

const REVEAL = 76;

// Touch swipe-left-to-reveal-delete for list rows (BuyerMobileApp handoff).
// Vertical scrolling is left to the browser (touch-action: pan-y); only a
// horizontal drag moves the row. Mouse/desktop is unaffected — those users
// keep the row's own trash button.
export function SwipeToDelete({
  onDelete,
  label,
  children,
}: {
  onDelete: () => void;
  label: string;
  children: React.ReactNode;
}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; base: number } | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    start.current = { x: e.touches[0].clientX, base: offset };
    setDragging(true);
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!start.current) return;
    const dx = e.touches[0].clientX - start.current.x;
    setOffset(Math.min(0, Math.max(-REVEAL, start.current.base + dx)));
  }
  function onTouchEnd() {
    start.current = null;
    setDragging(false);
    setOffset((o) => (o < -REVEAL / 2 ? -REVEAL : 0));
  }

  return (
    <div className="relative overflow-hidden">
      <button
        type="button"
        onClick={onDelete}
        aria-label={label}
        tabIndex={offset === 0 ? -1 : 0}
        className="absolute inset-y-0 right-0 flex w-[76px] items-center justify-center bg-danger text-white"
      >
        <TrashIcon className="size-5" />
      </button>
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        style={{ transform: `translateX(${offset}px)`, transition: dragging ? 'none' : 'transform 0.2s ease' }}
        className="relative touch-pan-y bg-surface"
      >
        {children}
      </div>
    </div>
  );
}
