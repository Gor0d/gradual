"use client";

import { Building2, LayoutDashboard, Settings2, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { segment: "dashboard", label: "Visão geral", icon: LayoutDashboard },
  { segment: "turmas", label: "Turmas", icon: Building2 },
  { segment: "crm", label: "Relacionamento", icon: UsersRound },
  { segment: "configuracoes", label: "Configurações", icon: Settings2 },
] as const;

export function OrganizationNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Navegação da organização">
      {items.map(({ segment, label, icon: Icon }) => {
        const href = `/org/${slug}/${segment}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={segment} href={href} aria-current={active ? "page" : undefined}
            className={cn("flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition", active ? "bg-emerald-400/12 text-emerald-950 dark:text-emerald-200" : "text-zinc-500 hover:bg-zinc-950/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white")}>
            <Icon className={cn("size-4", active && "text-emerald-700 dark:text-emerald-400")} />{label}
          </Link>
        );
      })}
    </nav>
  );
}
