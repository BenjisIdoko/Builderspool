import { Skeleton } from '@/components/ui/skeleton';

export default function SellerSettingsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20 [&>*]:max-w-[900px]">
      <Skeleton className="mb-1 h-3 w-24" />
      <Skeleton className="mb-2 h-6 w-32" />
      <Skeleton className="mb-6 h-4 w-64" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </div>
  );
}
