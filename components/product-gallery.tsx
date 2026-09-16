'use client';

import { useState } from 'react';
import { MagnifyingGlassPlusIcon } from '@phosphor-icons/react/ssr';
import { MaterialImage } from '@/components/material-image';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// Every material has at most one real photo today (see prisma/seed.ts). The
// thumbnail strip always shows 4 slots — real photos first, then
// MaterialImage's existing category-icon placeholder (not a broken image or
// fake stock photo) for any slot we don't have a real photo for — so the
// gallery layout matches the reference instead of disappearing when a
// material has fewer than 2 real photos, which is the common case today.
export function ProductGallery({
  images,
  category,
  alt,
}: {
  images: string[];
  category: string;
  alt: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const activeImage = images[activeIndex] ?? null;
  const slots = Array.from({ length: Math.max(images.length, 4) }, (_, i) => images[i] ?? null);

  return (
    <div>
      <button
        type="button"
        onClick={() => activeImage && setZoomOpen(true)}
        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-2xl border border-border shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_rgba(16,24,40,0.06)]"
        disabled={!activeImage}
      >
        <MaterialImage imageUrl={activeImage} category={category} alt={alt} className="aspect-square w-full" />
        {activeImage && (
          <span className="absolute right-3 bottom-3 flex size-9 items-center justify-center rounded-full bg-white/90 text-ink opacity-0 transition-opacity group-hover:opacity-100">
            <MagnifyingGlassPlusIcon className="size-4" />
          </span>
        )}
      </button>

      <div className="mt-3 grid grid-cols-4 gap-2.5">
        {slots.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => img && setActiveIndex(i)}
            disabled={!img}
            className={`overflow-hidden rounded-lg border-2 ${
              img && i === activeIndex ? 'border-brand' : 'border-border'
            } ${!img ? 'cursor-default' : ''}`}
          >
            <MaterialImage imageUrl={img} category={category} alt={`${alt} photo ${i + 1}`} className="aspect-square w-full" />
          </button>
        ))}
      </div>

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="border-none bg-transparent p-0 shadow-none sm:max-w-3xl">
          {activeImage && (
            <MaterialImage
              imageUrl={activeImage}
              category={category}
              alt={alt}
              className="aspect-square w-full rounded-lg"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
