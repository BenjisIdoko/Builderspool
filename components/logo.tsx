import Image from 'next/image';

// The brand mark: the "B" monogram with skyline and wave, from the logo file
// supplied for the Floot build (public/brand/bp-mark-160.png, cut down from the
// 512px original). The artwork has a white ground, so on navy surfaces wrap it
// in a white tile (see `LogoTile`).
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/bp-mark-160.png"
      alt=""
      width={160}
      height={160}
      sizes="80px"
      className={className}
      aria-hidden="true"
    />
  );
}

// White rounded tile for placing the mark on a navy surface.
export function LogoTile({ className = 'size-8' }: { className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-md bg-white p-0.5 ${className}`}>
      <LogoMark className="size-full" />
    </span>
  );
}

// BUILDERS in the logo's charcoal, POOL in logo orange, Plus Jakarta Sans 800.
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display font-extrabold tracking-[-0.03em] ${className}`}>
      <span className="text-logo-gray">BUILDERS</span>
      <span className="text-orange">POOL</span>
    </span>
  );
}

export function Logo({
  className = '',
  size = 'md',
  showTagline = false,
}: {
  className?: string;
  size?: 'sm' | 'md';
  showTagline?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className={size === 'sm' ? 'size-7' : 'size-8'} />
      <span className="flex flex-col leading-none">
        <Wordmark className={size === 'sm' ? 'text-sm' : 'text-[15px]'} />
        {showTagline && (
          <span className="mt-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Trade materials
          </span>
        )}
      </span>
    </span>
  );
}
