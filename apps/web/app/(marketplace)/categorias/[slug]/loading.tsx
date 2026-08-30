import { VendorGridSkeleton } from "@/components/marketplace/vendor-grid-skeleton";

export default function CategoriaLoading() {
  return (
    <main>
      <div className="h-[142px] animate-pulse bg-muted/40" />
      <div className="mx-auto max-w-[1240px] px-6 py-8 sm:px-10">
        <div className="mb-5 h-16 animate-pulse rounded-2xl bg-muted" />
        <VendorGridSkeleton />
      </div>
    </main>
  );
}
