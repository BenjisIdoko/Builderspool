import type { ComponentType, ReactNode } from 'react';

// One layout for every empty/error/404 state so they read as a family:
// illustration, a clear title, one line of help, and the next action.
// "inline" is for states that sit inside a card or table on a dashboard.
export function EmptyState({
  illustration: Illustration,
  title,
  description,
  children,
  variant = 'page',
  as: Heading = 'h2',
}: {
  illustration: ComponentType<{ className?: string }>;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  variant?: 'page' | 'inline';
  as?: 'h1' | 'h2' | 'h3' | 'p';
}) {
  const inline = variant === 'inline';
  return (
    <div className={`flex flex-col items-center text-center ${inline ? 'gap-3 px-6 py-10' : 'gap-4'}`}>
      <Illustration className={inline ? 'h-28 w-auto' : 'h-40 w-auto sm:h-48'} />
      <div className="max-w-sm">
        <Heading className={`font-bold tracking-tight text-ink ${inline ? 'text-base' : 'text-xl'}`}>{title}</Heading>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}
