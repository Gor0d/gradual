import { ChevronsUpDown, CircleHelp } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { OrganizationNav } from "@/components/b2b/organization-nav";
import { requireOrganizationContext } from "../../_lib/organization-context";

type OrganizationLayoutProps = { children: ReactNode; params: Promise<{ orgSlug: string }> };

export default async function OrganizationLayout({ children, params }: OrganizationLayoutProps) {
  const { orgSlug } = await params;
  const { organization, role } = await requireOrganizationContext(orgSlug);
  return (
    <div className="min-h-screen bg-[#f3f3ee] text-zinc-950 dark:bg-[#101411] dark:text-zinc-50 lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="border-b border-zinc-950/10 bg-[#e9e9e2] px-4 py-4 dark:border-white/10 dark:bg-[#151a16] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:px-3 lg:py-5">
        <Link href="/organizadora" className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-zinc-950/5 dark:hover:bg-white/5"><div className="min-w-0"><p className="truncate text-sm font-semibold tracking-[-0.02em]">{organization.name}</p><p className="mt-0.5 text-[0.68rem] uppercase tracking-[0.12em] text-zinc-500">{role}</p></div><ChevronsUpDown className="size-4 shrink-0 text-zinc-400" /></Link>
        <div className="mt-4 lg:mt-8"><OrganizationNav slug={organization.slug} /></div>
        <div className="mt-auto hidden px-3 pb-2 lg:block"><Link href="#" className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"><CircleHelp className="size-4" /> Central de ajuda</Link></div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
