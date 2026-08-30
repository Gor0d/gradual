"use client";

import { MarketplaceError } from "@/components/marketplace/marketplace-error";

type CategoriaErrorProps = {
  reset: () => void;
};

export default function CategoriaError({ reset }: CategoriaErrorProps) {
  return (
    <main className="mx-auto max-w-[1240px] px-6 py-10 sm:px-10">
      <MarketplaceError reset={reset} />
    </main>
  );
}
