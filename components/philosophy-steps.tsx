'use client';

import { useState } from 'react';
import Image from 'next/image';

// The Fable reference alternates 2 hotlinked Unsplash stock photos here
// (flagged in its own README as "known placeholder... swap in real
// photography before ship"). Using our own real, already-uploaded material
// photos instead of hotlinking external placeholder URLs — not a perfect
// thematic match per step, but real assets over fake-but-polished ones,
// same principle applied everywhere else in this app.
const STEPS = [
  { title: 'Order confirmed', body: 'Fixed price, paid immediately.', img: '/materials/cement.jpg' },
  { title: 'Demand pooled', body: 'Combined daily with other buyers.', img: '/materials/blocks.jpg' },
  { title: 'Procurement negotiated', body: 'Sellers compete to supply the pool.', img: '/materials/rebar.jpg' },
  { title: 'Materials prepared', body: 'Routed to the nearest fulfillment center.', img: '/materials/fittings.jpg' },
  { title: 'Delivered', body: 'To your site, or ready for pickup.', img: '/materials/cement.jpg' },
];

export function PhilosophySteps() {
  const [active, setActive] = useState(0);

  return (
    <div className="grid grid-cols-1 items-center gap-8 rounded-[28px] bg-info-soft p-6 sm:gap-10 sm:p-10 lg:grid-cols-2 lg:p-12">
      <div className="relative aspect-square overflow-hidden rounded-2xl">
        {STEPS.map((step, i) => (
          <Image
            key={step.img + i}
            src={step.img}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className={`object-cover transition-opacity duration-300 ${i === active ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
      </div>
      <div>
        <div className="mb-3 text-xs font-bold tracking-[0.06em] text-brand uppercase">Product philosophy</div>
        <h2 className="mb-7 text-[26px] leading-[1.25] font-extrabold tracking-[-0.02em] text-ink sm:text-[32px]">
          Simple for the buyer.
          <br />
          Sophisticated behind the scenes.
        </h2>
        <div className="flex flex-col gap-0.5">
          {STEPS.map((step, i) => (
            <button
              key={step.title}
              type="button"
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              className={`flex items-start gap-3.5 rounded-xl px-4 py-3.5 text-left transition-colors ${
                i === active ? 'bg-surface shadow-[0_4px_16px_rgba(16,24,40,0.08)]' : ''
              }`}
            >
              <span
                className={`mt-1.5 size-2.5 shrink-0 rounded-full transition-colors ${
                  i === active ? 'bg-brand' : 'bg-border-strong'
                }`}
              />
              <span>
                <span className="mb-1 block text-[15px] font-bold text-ink">{step.title}</span>
                <span className="block text-[13px] leading-relaxed text-slate">{step.body}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
