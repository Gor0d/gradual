"use client";

import { MarketplaceError } from "@/components/marketplace/marketplace-error";

type BuscarErrorProps = {
  reset: () => void;
};

export default function BuscarError({ reset }: BuscarErrorProps) {
  return (
    <main className="mx-auto max-w-[1240px] px-6 py-10 sm:px-10">
      <MarketplaceError reset={reset} />
    </main>
  );
}
