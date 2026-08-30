"use client";

import { MarketplaceError } from "@/components/marketplace/marketplace-error";

type VendorErrorProps = {
  reset: () => void;
};

export default function VendorError({ reset }: VendorErrorProps) {
  return (
    <main className="mx-auto max-w-[1080px] px-6 py-10 sm:px-10">
      <MarketplaceError reset={reset} />
    </main>
  );
}
