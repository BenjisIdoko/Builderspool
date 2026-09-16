function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

// Initials-only — no photo upload exists anywhere in this system, so a
// stock/placeholder photo would be a fabricated identity, not a real one.
export function Avatar({ name, className = 'size-8' }: { name: string; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-brand-ink ${className}`}
    >
      {getInitials(name)}
    </span>
  );
}
