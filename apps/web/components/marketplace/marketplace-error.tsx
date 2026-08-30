"use client";

import { Button } from "@/components/ui/button";

type MarketplaceErrorProps = {
  reset: () => void;
};

export function MarketplaceError({ reset }: MarketplaceErrorProps) {
  return (
    <div className="rounded-2xl border bg-card px-6 py-16 text-center">
      <svg
        width="46"
        height="46"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--destructive)"
        strokeWidth="1.5"
        className="mx-auto mb-4"
      >
        <path d="M12 3L2 20h20L12 3z" strokeLinejoin="round" />
        <path d="M12 10v4" strokeLinecap="round" />
        <circle cx="12" cy="17" r="0.8" fill="var(--destructive)" stroke="none" />
      </svg>
      <h2 className="mb-1.5 font-serif text-xl font-normal">Não conseguimos carregar agora</h2>
      <p className="mx-auto mb-5 max-w-sm text-sm text-muted-foreground">
        Algo deu errado ao buscar os fornecedores. Verifique sua conexão e tente de novo.
      </p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  );
}
