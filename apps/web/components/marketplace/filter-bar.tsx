"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { VendorCategorySummary } from "@/lib/marketplace/types";

const RATING_OPTIONS = ["4.5", "4", "3.5"];

type FilterBarProps = {
  categories: VendorCategorySummary[];
  /** Omit when the category is fixed by the route (a /categorias/[slug] page). */
  showCategoryFilter?: boolean;
};

export function FilterBar({ categories, showCategoryFilter = true }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [city, setCity] = useState(searchParams.get("cidade") ?? "");
  const category = searchParams.get("categoria") ?? "";
  const minRating = searchParams.get("nota") ?? "";
  const maxPrice = searchParams.get("preco_max") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleCitySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateParam("cidade", city);
  }

  const activeChips = [
    category && showCategoryFilter
      ? { key: "categoria", label: categories.find((c) => c.slug === category)?.name ?? category }
      : null,
    searchParams.get("cidade") ? { key: "cidade", label: searchParams.get("cidade") ?? "" } : null,
    minRating ? { key: "nota", label: `A partir de ${minRating} estrelas` } : null,
    maxPrice ? { key: "preco_max", label: `Até R$ ${maxPrice}` } : null,
  ].filter((chip): chip is { key: string; label: string } => chip !== null);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border bg-card p-3">
        {showCategoryFilter ? (
          <Select value={category || undefined} onValueChange={(value) => updateParam("categoria", value)}>
            <SelectTrigger className="w-auto min-w-[170px] border-none bg-secondary font-semibold">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.slug} value={cat.slug}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <form onSubmit={handleCitySubmit}>
          <Input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Cidade ou UF"
            className="w-[170px] border-none bg-secondary font-semibold"
          />
        </form>

        <Select value={maxPrice || undefined} onValueChange={(value) => updateParam("preco_max", value)}>
          <SelectTrigger className="w-auto min-w-[150px] border-none bg-secondary font-semibold">
            <SelectValue placeholder="Faixa de preço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="200">Até R$ 200</SelectItem>
            <SelectItem value="500">Até R$ 500</SelectItem>
            <SelectItem value="1000">Até R$ 1.000</SelectItem>
          </SelectContent>
        </Select>

        <Select value={minRating || undefined} onValueChange={(value) => updateParam("nota", value)}>
          <SelectTrigger className="w-auto min-w-[170px] border-none bg-secondary font-semibold">
            <SelectValue placeholder="Avaliação mínima" />
          </SelectTrigger>
          <SelectContent>
            {RATING_OPTIONS.map((rating) => (
              <SelectItem key={rating} value={rating}>
                A partir de {rating}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeChips.length > 0 ? (
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => updateParam(chip.key, "")}
              className="flex items-center gap-1.5 rounded-full border py-1.5 pl-3 pr-2 text-xs font-semibold"
            >
              {chip.label}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          ))}
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-xs font-semibold text-muted-foreground"
            onClick={() => router.push(pathname)}
          >
            Limpar tudo
          </Button>
        </div>
      ) : null}
    </div>
  );
}
