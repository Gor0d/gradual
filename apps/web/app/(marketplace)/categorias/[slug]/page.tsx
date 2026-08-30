import { notFound } from "next/navigation";

import { FilterBar } from "@/components/marketplace/filter-bar";
import { VendorGrid } from "@/components/marketplace/vendor-grid";
import { getVendorCategories, getVendorCategoryBySlug, searchVendors } from "@/lib/marketplace/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  fotografia: "Fotógrafos e videomakers especializados em colação de grau — ensaio e cobertura do dia.",
  beca: "Aluguel e venda de beca, capelo e acessórios para a cerimônia.",
  "anel-de-formatura": "Joalherias especializadas em anel de formatura, do desenho à entrega.",
  buffet: "Buffets para a festa de formatura, do coquetel ao jantar completo.",
  "local-de-evento": "Espaços para a cerimônia e a festa, com estrutura para grupos grandes.",
};

type CategoriaPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cidade?: string; nota?: string; preco_max?: string }>;
};

export default async function CategoriaPage({ params, searchParams }: CategoriaPageProps) {
  const { slug } = await params;
  const filters = await searchParams;
  const supabase = await createSupabaseServerClient();

  const category = await getVendorCategoryBySlug(supabase, slug);
  if (!category) {
    notFound();
  }

  const [categories, vendors] = await Promise.all([
    getVendorCategories(supabase),
    searchVendors(supabase, {
      categorySlug: slug,
      city: filters.cidade,
      minRating: filters.nota ? Number(filters.nota) : undefined,
      maxPrice: filters.preco_max ? Number(filters.preco_max) : undefined,
    }),
  ]);

  return (
    <main className="text-foreground">
      <div className="border-b bg-gradient-to-br from-primary/25 to-accent/15 px-6 py-11 sm:px-10">
        <div className="mx-auto flex max-w-[1240px] items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-card/70">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
              <circle cx="12" cy="13" r="3.3" />
            </svg>
          </div>
          <div>
            <h1 className="mb-1 font-serif text-3xl font-normal italic">{category.name}</h1>
            <p className="text-sm text-muted-foreground">
              {CATEGORY_DESCRIPTIONS[category.slug] ?? "Fornecedores especializados nesta categoria."}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-6 py-8 sm:px-10">
        <div className="mb-5 flex items-center justify-between gap-4">
          <FilterBar categories={categories} showCategoryFilter={false} />
          <span className="shrink-0 text-sm whitespace-nowrap text-muted-foreground">
            <strong className="text-foreground">{vendors.length}</strong> nesta categoria
          </span>
        </div>

        <VendorGrid vendors={vendors} clearFiltersHref={`/categorias/${slug}`} />
      </div>
    </main>
  );
}
