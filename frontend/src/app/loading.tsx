import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-5 w-40 rounded-full" />
        <Skeleton className="h-12 w-[70%]" />
        <Skeleton className="h-4 w-[55%]" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_304px]">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
