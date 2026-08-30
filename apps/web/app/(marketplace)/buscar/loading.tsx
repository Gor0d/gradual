import { VendorGridSkeleton } from "@/components/marketplace/vendor-grid-skeleton";

export default function BuscarLoading() {
  return (
    <main className="mx-auto max-w-[1240px] px-6 py-10 sm:px-10">
      <div className="mb-6 space-y-2">
        <div className="h-9 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
      </div>
      <div className="mb-7 h-16 animate-pulse rounded-2xl bg-muted" />
      <VendorGridSkeleton />
    </main>
  );
}
