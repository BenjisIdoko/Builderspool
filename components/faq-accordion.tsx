'use client';

import { useState } from 'react';
import { CaretDownIcon } from '@phosphor-icons/react/ssr';

// Answers rewritten from the Fable reference's copy to describe this app's
// real mechanics — the reference's answers assume supplier-set negotiable
// pricing, GPS-tracked haulage, a "contractor account" tier with deferred
// invoicing, and a buyer-protection refund policy, none of which exist
// here. Every answer below is honest about what's actually built.
const FAQS = [
  {
    q: 'How does pricing work?',
    a: 'Every material has one fixed catalogue price — no negotiation, no hidden markups. Demand from every buyer is pooled daily and opened to seller bidding behind the scenes, but the price you see and pay never changes based on that.',
  },
  {
    q: 'How is delivery handled?',
    a: "Once an order is confirmed, it's routed to the nearest fulfillment center and dispatched by real, ops-tracked haulage. There's no live GPS yet — dispatch status and location are updated by our team as they actually happen, not estimated.",
  },
  {
    q: 'What if a material fails to meet specification?',
    a: 'Every allocation is checked against a real goods-received note at the fulfillment center before your escrow funds are released to the seller — issues are caught before payout, not after.',
  },
  {
    q: 'Can I order across multiple sites?',
    a: "Yes — set a delivery region per order at checkout. Consolidated multi-site invoicing isn't available yet; each order is billed and tracked separately.",
  },
  {
    q: 'What are the minimum order quantities?',
    a: "There's no platform-wide minimum — you can order a single unit of most materials. Some materials are naturally sold by a larger unit (e.g. a tipper load of sand), shown on the product page.",
  },
  {
    q: 'How do I pay?',
    a: 'Bank transfer, card, or USSD — chosen at checkout. Funds are held in escrow and only released to the seller once the fulfillment center confirms receipt.',
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState(0);

  return (
    <div className="flex flex-col gap-2.5">
      {FAQS.map((faq, i) => (
        <div key={faq.q} className="overflow-hidden rounded-2xl border border-border bg-surface">
          <button
            type="button"
            onClick={() => setOpen(open === i ? -1 : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4.5 text-left"
          >
            <span className="text-[14.5px] font-bold text-ink">{faq.q}</span>
            <CaretDownIcon
              className={`size-4 shrink-0 text-muted-foreground transition-transform ${open === i ? 'rotate-180' : ''}`}
            />
          </button>
          {open === i && (
            <div className="px-5 pb-4.5 text-[13.5px] leading-relaxed text-slate">{faq.a}</div>
          )}
        </div>
      ))}
    </div>
  );
}
