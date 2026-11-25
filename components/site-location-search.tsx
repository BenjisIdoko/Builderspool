'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { MapPinIcon } from '@phosphor-icons/react/ssr';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type PickedSite = { lat: number; lng: number; address: string };
type Suggestion = { placeId: string; main: string; secondary: string };

// Where the delivery goes. The buyer types an address, picks a suggestion, and we get its map position, which the
// delivery fee is worked out from. All Google calls go through our own routes (the key stays on the server).
export function SiteLocationSearch({
  site,
  onPick,
  onClear,
}: {
  site: PickedSite | null;
  onPick: (site: PickedSite) => void;
  onClear: () => void;
}) {
  const inputId = useId();
  const listId = `${inputId}-list`;
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One session per search-then-pick, so Google bills the lookups together.
  const sessionRef = useRef<string>('');
  const skipSearchRef = useRef(false);

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }
    const text = query.trim();
    if (text.length < 3) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      sessionRef.current ||= crypto.randomUUID();
      try {
        const res = await fetch(`/api/checkout/places?q=${encodeURIComponent(text)}&s=${sessionRef.current}`, { signal: controller.signal });
        if (!res.ok) throw new Error('unavailable');
        const body = (await res.json()) as { suggestions: Suggestion[] };
        setSuggestions(body.suggestions);
        setActive(-1);
        setOpen(true);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setSuggestions([]);
          setError('Address search is unavailable right now. Type your address below and we will use the standard delivery rate.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Nothing is shown for a search too short to run, even if an earlier, longer one left results behind.
  const searched = query.trim().length >= 3;
  const shown = searched ? suggestions : [];

  async function choose(s: Suggestion) {
    setOpen(false);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/checkout/places?id=${encodeURIComponent(s.placeId)}&s=${sessionRef.current}`);
      const body = (await res.json()) as { site?: PickedSite; error?: string };
      if (!res.ok || !body.site) throw new Error(body.error ?? 'We could not find that place.');
      sessionRef.current = '';
      skipSearchRef.current = true;
      setQuery(`${s.main}${s.secondary ? `, ${s.secondary}` : ''}`);
      onPick(body.site);
    } catch (e) {
      setError((e as Error).message || 'We could not find that place. Try another.');
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || shown.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % shown.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? shown.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      void choose(shown[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <Label htmlFor={inputId} className="mb-1.5 text-body-sm font-medium text-ink">
        Find your site on the map
      </Label>
      <div className="relative">
        <MapPinIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={inputId}
          role="combobox"
          aria-expanded={open && shown.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (site) onClear();
          }}
          onFocus={() => shown.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder="Start typing the street, estate or town"
          className="pl-9"
        />
      </div>
      {open && shown.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md bg-popover p-1 shadow-[0_0_0_1px_var(--color-hairline),0_8px_24px_rgba(0,0,0,0.12)]"
        >
          {shown.map((s, i) => (
            <li
              key={s.placeId}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown, not click: the input's blur would close the list before a click lands.
              onMouseDown={(e) => {
                e.preventDefault();
                void choose(s);
              }}
              className={`flex min-h-11 cursor-pointer flex-col justify-center rounded-sm px-3 py-1.5 text-sm ${i === active ? 'bg-info-soft' : 'hover:bg-well/60'}`}
            >
              <span className="font-medium text-ink">{s.main}</span>
              {s.secondary && <span className="text-caption text-muted-foreground">{s.secondary}</span>}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-1.5 min-h-5 text-caption text-muted-foreground" role="status" aria-live="polite">
        {loading && searched ? 'Searching…' : error ? <span className="text-warning-text">{error}</span> : site ? 'Site found. Your delivery price is worked out from it.' : null}
      </p>
    </div>
  );
}
