import { Button } from "@/components/ui/button";
import { VendorCard } from "@/components/marketplace/vendor-card";
import type { VendorSummary } from "@/lib/marketplace/types";

type VendorGridProps = {
  vendors: VendorSummary[];
  clearFiltersHref: string;
};

export function VendorGrid({ vendors, clearFiltersHref }: VendorGridProps) {
  if (vendors.length === 0) {
    return (
      <div className="rounded-2xl border bg-card px-6 py-16 text-center">
        <svg
          width="46"
          height="46"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--muted-foreground)"
          strokeWidth="1.4"
          className="mx-auto mb-4"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
          <path d="M8 11h6" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <h2 className="mb-1.5 font-serif text-xl font-normal">Nenhum fornecedor encontrado</h2>
        <p className="mx-auto mb-5 max-w-sm text-sm text-muted-foreground">
          Não achamos fornecedores para esses filtros. Tente ampliar a busca ou limpar os filtros ativos.
        </p>
        <Button asChild variant="outline">
          <a href={clearFiltersHref}>Limpar filtros</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {vendors.map((vendor) => (
        <VendorCard key={vendor.id} vendor={vendor} />
      ))}
    </div>
  );
}
