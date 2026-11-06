export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse motion-reduce:animate-none rounded-md bg-well ${className}`} />;
}
