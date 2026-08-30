import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VendorSummary } from "@/lib/marketplace/types";
import { cn } from "@/lib/utils";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function categoryIconPath(slug: string): string {
  if (slug.includes("fotografia")) return "M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z";
  if (slug.includes("beca")) return "M12 3L2 8l10 5 10-5-10-5z";
  if (slug.includes("anel")) return "M12 15m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0";
  if (slug.includes("buffet")) return "M4 17c0-4.5 3.6-7 8-7s8 2.5 8 7";
  return "M5 4h14v17H5z";
}

type VendorCardProps = {
  vendor: VendorSummary;
};

export function VendorCard({ vendor }: VendorCardProps) {
  const primaryCategory = vendor.categories[0];
  const gradientSeed = vendor.id.charCodeAt(0) + vendor.id.charCodeAt(vendor.id.length - 1);

  return (
    <Link href={`/fornecedor/${vendor.id}`}>
      <Card className="overflow-hidden py-0 transition-shadow hover:shadow-md">
        <div
          className="relative h-[150px]"
          style={{
            background: `linear-gradient(135deg, oklch(0.86 0.05 ${gradientSeed % 360}), oklch(0.76 0.07 ${(gradientSeed + 35) % 360}))`,
          }}
        >
          {primaryCategory ? (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-[11.5px] font-bold text-card-foreground">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d={categoryIconPath(primaryCategory.slug)} />
              </svg>
              {primaryCategory.name}
            </div>
          ) : null}

          {vendor.hasFixedPrice && vendor.minPrice !== null ? (
            <div className="absolute bottom-3 right-3 rounded-full bg-primary px-3 py-1.5 text-xs font-extrabold text-primary-foreground">
              a partir de {currencyFormatter.format(vendor.minPrice)}
            </div>
          ) : (
            <div className="absolute bottom-3 right-3 rounded-full border-[1.5px] border-accent bg-card px-3 py-1.5 text-[11.5px] font-extrabold text-accent">
              Sob consulta
            </div>
          )}
        </div>

        <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pt-4">
          <CardTitle className="font-serif text-lg font-normal">{vendor.name}</CardTitle>
          {vendor.averageRating !== null ? (
            <div className="flex shrink-0 items-center gap-1 pt-0.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--primary)">
                <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5z" />
              </svg>
              <span className="text-xs font-bold">{vendor.averageRating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({vendor.reviewCount})</span>
            </div>
          ) : (
            <span className="pt-0.5 text-xs text-muted-foreground">Sem avaliações</span>
          )}
        </CardHeader>
        <CardContent className={cn("pb-4 text-sm text-muted-foreground", !vendor.city && "hidden")}>
          {vendor.city ? `${vendor.city}${vendor.state ? `/${vendor.state}` : ""}` : null}
        </CardContent>
      </Card>
    </Link>
  );
}
