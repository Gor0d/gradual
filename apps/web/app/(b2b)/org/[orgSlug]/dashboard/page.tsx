import { ArrowRight, CalendarRange, CircleDot, Plus, UsersRound } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { requireOrganizationContext } from "../../../_lib/organization-context";

type DashboardPageProps = { params: Promise<{ orgSlug: string }> };

export default async function OrganizationDashboardPage({ params }: DashboardPageProps) {
  const { orgSlug } = await params;
  const { organization } = await requireOrganizationContext(orgSlug);
  const metrics = [
    { label: "Turmas ativas", value: "0", icon: CalendarRange, detail: "Nenhuma cadastrada" },
    { label: "Formandos", value: "0", icon: UsersRound, detail: "Aguardando primeira turma" },
    { label: "Pendências", value: "0", icon: CircleDot, detail: "Tudo em ordem" },
  ];

  return (
    <main className="px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
      <header className="flex flex-col justify-between gap-6 border-b border-zinc-950/10 pb-8 dark:border-white/10 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">Operação em foco</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Bom dia.</h1>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">O espaço de {organization.name} está pronto para receber a primeira turma.</p>
        </div>
        <Button asChild className="h-10 rounded-full bg-emerald-800 px-5 text-white shadow-none hover:bg-emerald-900 dark:bg-emerald-400 dark:text-emerald-950">
          <Link href={`/org/${organization.slug}/turmas`}><Plus /> Nova turma</Link>
        </Button>
      </header>

      <section className="grid border-b border-zinc-950/10 dark:border-white/10 md:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon, detail }, index) => (
          <article key={label} className={`py-7 md:px-7 ${index > 0 ? "border-t border-zinc-950/10 dark:border-white/10 md:border-l md:border-t-0" : ""} ${index === 0 ? "md:pl-0" : ""}`}>
            <div className="flex items-center justify-between text-zinc-500"><span className="text-xs font-medium uppercase tracking-[0.12em]">{label}</span><Icon className="size-4" /></div>
            <p className="mt-7 font-mono text-5xl tracking-[-0.06em]">{value}</p>
            <p className="mt-3 text-xs text-zinc-500">{detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 py-8 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="min-h-80 rounded-[1.5rem] border border-zinc-950/10 bg-white p-7 dark:border-white/10 dark:bg-white/[0.035]">
          <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Ritmo da operação</p><h2 className="mt-2 text-xl font-semibold tracking-tight">Próximos 30 dias</h2></div><span className="rounded-full bg-zinc-950/5 px-3 py-1 text-xs text-zinc-500 dark:bg-white/5">Sem atividade</span></div>
          <div className="mt-16 flex flex-col items-center text-center"><div className="grid size-14 place-items-center rounded-full border border-dashed border-emerald-700/40 bg-emerald-700/5"><CalendarRange className="size-5 text-emerald-700 dark:text-emerald-400" /></div><p className="mt-5 font-medium">Sua linha do tempo começa com uma turma</p><p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">Cadastre a primeira turma para acompanhar marcos, responsáveis e tudo o que pede atenção.</p></div>
        </div>
        <div className="flex min-h-80 flex-col rounded-[1.5rem] bg-emerald-950 p-7 text-emerald-50">
          <span className="font-mono text-xs text-lime-300">PRIMEIRO PASSO</span>
          <h2 className="mt-8 text-3xl font-medium leading-tight tracking-[-0.04em]">Transforme um novo contato em uma operação organizada.</h2>
          <p className="mt-4 text-sm leading-6 text-emerald-100/65">Crie uma turma e prepare o espaço antes de convidar sua equipe.</p>
          <Link href={`/org/${organization.slug}/turmas`} className="mt-auto flex items-center justify-between border-t border-emerald-100/20 pt-5 text-sm font-medium text-lime-200 hover:text-lime-100"><span>Começar agora</span><ArrowRight className="size-4" /></Link>
        </div>
      </section>
    </main>
  );
}
