export default function VendorLoading() {
  return (
    <main>
      <div className="h-[190px] animate-pulse bg-muted/40" />
      <div className="mx-auto max-w-[1080px] px-6 pb-16 sm:px-10">
        <div className="-mt-10 flex items-end gap-4">
          <div className="size-24 animate-pulse rounded-2xl border-4 border-background bg-muted" />
          <div className="mb-1.5 space-y-2">
            <div className="h-7 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="mt-9 grid grid-cols-3 gap-2.5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="aspect-square animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </main>
  );
}
