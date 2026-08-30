import { FilterBar } from "@/components/marketplace/filter-bar";
import { VendorGrid } from "@/components/marketplace/vendor-grid";
import { getVendorCategories, searchVendors } from "@/lib/marketplace/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type BuscarPageProps = {
  searchParams: Promise<{
    categoria?: string;
    cidade?: string;
    nota?: string;
    preco_max?: string;
  }>;
};

export default async function BuscarPage({ searchParams }: BuscarPageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [categories, vendors] = await Promise.all([
    getVendorCategories(supabase),
    searchVendors(supabase, {
      categorySlug: params.categoria,
      city: params.cidade,
      minRating: params.nota ? Number(params.nota) : undefined,
      maxPrice: params.preco_max ? Number(params.preco_max) : undefined,
    }),
  ]);

  return (
    <main className="mx-auto max-w-[1240px] px-6 py-10 text-foreground sm:px-10">
      <div className="mb-6">
        <h1 className="mb-1.5 font-serif text-4xl font-normal italic">
          Encontre quem vai cuidar da sua formatura
        </h1>
        <p className="text-sm text-muted-foreground">
          Becas, anéis, fotografia, buffet e locais — comparados lado a lado, perto de você.
        </p>
      </div>

      <FilterBar categories={categories} />

      <div className="mt-7 mb-4 flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">
          <strong className="text-foreground">{vendors.length}</strong>{" "}
          {vendors.length === 1 ? "fornecedor encontrado" : "fornecedores encontrados"}
        </span>
      </div>

      <VendorGrid vendors={vendors} clearFiltersHref="/buscar" />
    </main>
  );
}
