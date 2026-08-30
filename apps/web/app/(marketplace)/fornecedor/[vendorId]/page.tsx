import { notFound } from "next/navigation";

import { RequestQuoteDialog } from "@/components/marketplace/request-quote-dialog";
import { getCurrentUserOrNull } from "@/lib/auth/get-current-user-or-null";
import { getVendorById } from "@/lib/marketplace/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

type VendorPageProps = {
  params: Promise<{ vendorId: string }>;
};

export default async function VendorPage({ params }: VendorPageProps) {
  const { vendorId } = await params;
  const supabase = await createSupabaseServerClient();
  const [vendor, currentUser] = await Promise.all([
    getVendorById(supabase, vendorId),
    getCurrentUserOrNull(),
  ]);

  if (!vendor) {
    notFound();
  }

  return (
    <main className="text-foreground">
      <div className="h-[190px] bg-gradient-to-br from-primary/50 via-primary/25 to-accent/25" />

      <div className="mx-auto max-w-[1080px] px-6 pb-16 sm:px-10">
        <div className="relative -mt-10 flex flex-wrap items-end justify-between gap-5">
          <div className="flex items-end gap-4">
            <div className="flex size-24 items-center justify-center rounded-2xl border-4 border-background bg-card shadow-md">
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5">
                <rect x="5" y="4" width="14" height="17" />
              </svg>
            </div>
            <div className="pb-1.5">
              <h1 className="mb-1 font-serif text-3xl font-normal italic">{vendor.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {vendor.averageRating !== null ? (
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--primary)">
                      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5z" />
                    </svg>
                    <strong className="text-foreground">{vendor.averageRating.toFixed(1)}</strong> (
                    {vendor.reviewCount} avaliações)
                  </span>
                ) : null}
                {vendor.city ? (
                  <>
                    <span>·</span>
                    <span>
                      {vendor.city}
                      {vendor.state ? `, ${vendor.state}` : ""}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          {vendor.hasOnRequest && !vendor.hasFixedPrice ? (
            <RequestQuoteDialog
              vendorId={vendor.id}
              vendorName={vendor.name}
              isAuthenticated={currentUser !== null}
              defaultContactName={currentUser?.fullName ?? undefined}
              defaultContactEmail={currentUser?.email}
              className="mb-1.5 font-bold"
            />
          ) : null}
        </div>

        <div className="mt-9 grid grid-cols-1 gap-9 lg:grid-cols-[1.6fr_1fr]">
          <div>
            {vendor.description ? (
              <p className="mb-7 text-[14.5px] leading-relaxed text-muted-foreground">{vendor.description}</p>
            ) : null}

            <h2 className="mb-3.5 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
              Portfólio
            </h2>
            {vendor.portfolioUrls.length > 0 ? (
              <div className="mb-9 grid grid-cols-3 gap-2.5">
                {vendor.portfolioUrls.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt="" className="aspect-square rounded-xl object-cover" />
                ))}
              </div>
            ) : (
              <p className="mb-9 text-sm text-muted-foreground">Este fornecedor ainda não adicionou fotos.</p>
            )}

            <h2 className="mb-3.5 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
              Avaliações
            </h2>
            {vendor.reviews.length > 0 ? (
              <div className="flex flex-col gap-4">
                {vendor.reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <svg
                            key={index}
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill={index < review.rating ? "var(--primary)" : "var(--border)"}
                          >
                            <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{dateFormatter.format(new Date(review.createdAt))}</span>
                    </div>
                    {review.comment ? (
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{review.comment}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Ainda não há avaliações para este fornecedor.</p>
            )}
          </div>

          <div className="flex flex-col gap-5">
            {vendor.regions.length > 0 ? (
              <div className="rounded-2xl border bg-card p-5">
                <h3 className="mb-3 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
                  Regiões atendidas
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {vendor.regions.map((region) => (
                    <span key={`${region.city}-${region.state}`} className="rounded-full bg-secondary px-2.5 py-1.5 text-xs font-semibold">
                      {region.city}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Raio de atendimento de até {Math.max(...vendor.regions.map((r) => r.serviceRadiusKm))} km.
                </p>
              </div>
            ) : null}

            {vendor.hasFixedPrice && vendor.priceTable.length > 0 ? (
              <div className="rounded-2xl border bg-card p-5">
                <h3 className="mb-3.5 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
                  Tabela de preços
                </h3>
                <div className="flex flex-col">
                  {vendor.priceTable.map((item) => (
                    <div key={item.label} className="flex items-center justify-between border-b py-3 last:border-0">
                      <span className="text-sm font-semibold">{item.label}</span>
                      <span className="font-bold text-primary">{currencyFormatter.format(item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border bg-card p-5">
                <h3 className="mb-2.5 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
                  Como funciona o orçamento
                </h3>
                <p className="mb-4 text-[13px] leading-relaxed text-muted-foreground">
                  O valor varia conforme data, pacote e número de convidados — {vendor.name} responde pedidos de
                  orçamento diretamente.
                </p>
                <RequestQuoteDialog
                  vendorId={vendor.id}
                  vendorName={vendor.name}
                  isAuthenticated={currentUser !== null}
                  defaultContactName={currentUser?.fullName ?? undefined}
                  defaultContactEmail={currentUser?.email}
                  className="w-full font-bold"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
