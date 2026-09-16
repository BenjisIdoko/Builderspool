'use client';

import { useState } from 'react';

// A quantity field that's actually typeable — buffers keystrokes in local
// text state so the field doesn't snap back to the last committed number
// mid-edit (e.g. while the field is briefly empty between clearing "1" and
// typing "25"), then commits a parsed, clamped value on blur/Enter. Stays
// in sync when the +/- buttons change `value` externally.
export function QuantityInput({
  value,
  onChange,
  min = 1,
  label,
  className = '',
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  label: string;
  className?: string;
}) {
  const [text, setText] = useState(String(value));
  // Adjusting state during render (React's documented alternative to an
  // effect for this) so typing "1" -> "" -> "25" doesn't fight a re-sync
  // from the last committed value while the field is mid-edit.
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    setText(String(value));
  }

  function commit(raw: string) {
    const parsed = Math.floor(Number(raw));
    const next = Number.isFinite(parsed) && raw.trim() !== '' ? Math.max(min, parsed) : min;
    setText(String(next));
    if (next !== value) onChange(next);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      onChange={(e) => {
        const next = e.target.value;
        if (next === '' || /^[0-9]+$/.test(next)) setText(next);
      }}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit(e.currentTarget.value);
          e.currentTarget.blur();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const current = Math.max(min, Math.floor(Number(e.currentTarget.value)) || min);
          commit(String(current + 1));
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const current = Math.max(min, Math.floor(Number(e.currentTarget.value)) || min);
          commit(String(Math.max(min, current - 1)));
        }
      }}
      aria-label={`Quantity of ${label}`}
      className={`bg-transparent text-center outline-none ${className}`}
    />
  );
}
