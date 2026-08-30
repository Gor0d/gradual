import type { ReactNode } from "react";

import { SiteHeader } from "@/components/layout/site-header";
import { getSiteHeaderProps } from "@/lib/layout/site-header-props";

type B2cLayoutProps = { children: ReactNode };

export default async function B2cLayout({ children }: B2cLayoutProps) {
  const headerProps = await getSiteHeaderProps();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader {...headerProps} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
