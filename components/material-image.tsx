import Image from 'next/image';
import { createElement } from 'react';
import { getCategoryIcon } from '@/lib/categoryIcons';

// Some materials now have a real photo (see prisma/seed.ts, public/materials/)
// sourced from the Stitch reference designs; the rest still fall back to a
// clean category-coded placeholder instead of a broken image or stock photo.
export function MaterialImage({
  imageUrl,
  category,
  alt,
  className = '',
  sizes,
}: {
  imageUrl: string | null;
  category: string;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden bg-well ${className}`}>
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes={sizes ?? '(max-width: 768px) 50vw, 25vw'}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(15,98,254,0.10),transparent_60%)] bg-well ${className}`}
    >
      {createElement(getCategoryIcon(category), { className: 'size-10 text-brand/40', strokeWidth: 1.5 })}
    </div>
  );
}
