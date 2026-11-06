import Image from 'next/image';
import { ImageSquareIcon } from '@phosphor-icons/react/ssr';

// Some materials now have a real photo (see prisma/seed.ts, public/materials/)
// sourced from the Stitch reference designs; the rest still fall back to a
// neutral "Photo coming soon" tile instead of a broken image or stock photo.
export function MaterialImage({
  imageUrl,
  alt,
  className = '',
  sizes,
}: {
  imageUrl: string | null;
  /** Kept for callers; the placeholder no longer varies by category. */
  category?: string;
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

  // No photograph: a neutral tile, never an illustration or a stand-in image
  // (DESIGN.md v3.0 section 8). The label shows only where there is room.
  return (
    <div
      className={`@container flex flex-col items-center justify-center gap-1.5 bg-well text-muted-foreground ${className}`}
    >
      <ImageSquareIcon className="size-7" weight="regular" aria-hidden />
      <span className="hidden text-caption @min-[7.5rem]:block">Photo coming soon</span>
    </div>
  );
}
