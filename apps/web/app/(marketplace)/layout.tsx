import type { ReactNode } from "react";

import { SiteHeader } from "@/components/layout/site-header";
import { getSiteHeaderProps } from "@/lib/layout/site-header-props";

type MarketplaceLayoutProps = { children: ReactNode };

/** No auth requirement here — marketplace stays browsable for anonymous visitors. */
export default async function MarketplaceLayout({ children }: MarketplaceLayoutProps) {
  const headerProps = await getSiteHeaderProps();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader {...headerProps} />
      {children}
    </div>
  );
}
