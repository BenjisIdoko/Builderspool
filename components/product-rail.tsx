import Link from 'next/link';
import type { BuyerMaterial } from '@/lib/queries/materials';
import { MaterialCard } from './material-card';

// A white section card with a title, a "See all" link and a horizontally
// scrolling row of product cards (scroll-snapped, no visible scrollbar).
export function ProductRail({
  title,
  subtitle,
  href,
  materials,
}: {
  title: string;
  subtitle?: string;
  href: string;
  materials: BuyerMaterial[];
}) {
  if (materials.length === 0) return null;

  return (
    <section className="rounded-md bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-4 lg:px-6 lg:py-5">
        <div className="min-w-0">
          <h2 className="text-heading-lg text-ink">{title}</h2>
          {subtitle && <p className="text-pretty text-[13px] text-slate">{subtitle}</p>}
        </div>
        <Link href={href} className="inline-flex min-h-11 shrink-0 items-center text-sm font-bold text-orange-text hover:underline">
          SEE ALL
        </Link>
      </div>
      <ul className="flex snap-x gap-3 overflow-x-auto p-4 [scrollbar-width:none] lg:gap-4 lg:p-5 [&::-webkit-scrollbar]:hidden">
        {materials.map((material) => (
          <li key={material.id} className="w-[176px] shrink-0 snap-start sm:w-[200px] lg:w-[224px]">
            <MaterialCard material={material} />
          </li>
        ))}
      </ul>
    </section>
  );
}
