import { LogoMark } from './logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-10 text-sm text-muted-foreground">
        <LogoMark className="size-5 opacity-70" />
        <p>© {new Date().getFullYear()} Builders Pool. Construction materials, sourced and delivered.</p>
      </div>
    </footer>
  );
}
