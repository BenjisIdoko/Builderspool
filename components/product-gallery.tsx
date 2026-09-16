'use client';

import { useState } from 'react';
import { MagnifyingGlassPlusIcon } from '@phosphor-icons/react/ssr';
import { MaterialImage } from '@/components/material-image';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// Every material has at most one real photo today (see prisma/seed.ts) —
// this renders correctly for that case, but the thumbnail strip and active-
// image state are already real gallery mechanics, not a placeholder,
// so nothing here needs rebuilding once materials carry more than one image.
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

  return (
    <div>
      <button
        type="button"
        onClick={() => activeImage && setZoomOpen(true)}
        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-lg"
        disabled={!activeImage}
      >
        <MaterialImage imageUrl={activeImage} category={category} alt={alt} className="aspect-square w-full" />
        {activeImage && (
          <span className="absolute right-3 bottom-3 flex size-9 items-center justify-center rounded-full bg-white/90 text-ink opacity-0 transition-opacity group-hover:opacity-100">
            <MagnifyingGlassPlusIcon className="size-4" />
          </span>
        )}
      </button>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2">
          {images.map((img, i) => (
            <button
              key={img + i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`overflow-hidden rounded-md border-2 ${
                i === activeIndex ? 'border-brand' : 'border-transparent'
              }`}
            >
              <MaterialImage imageUrl={img} category={category} alt={`${alt} photo ${i + 1}`} className="size-16" />
            </button>
          ))}
        </div>
      )}

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
