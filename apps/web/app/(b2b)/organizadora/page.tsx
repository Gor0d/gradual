import { ArrowUpRight, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { CreateOrganizationForm } from "@/components/b2b/create-organization-form";
import { listCurrentOrganizations } from "../_lib/organization-context";

const roleLabel = { owner: "Proprietário", admin: "Administrador", member: "Membro" } as const;

export default async function OrganizationEntryPage() {
  const organizationContexts = await listCurrentOrganizations();
  if (organizationContexts.length > 0) {
    return (
      <main className="min-h-screen bg-[#f3f3ee] px-5 py-10 text-zinc-950 dark:bg-[#101411] dark:text-zinc-50 sm:px-8 lg:py-16">
        <div className="mx-auto max-w-5xl">
          <header className="flex items-end justify-between gap-6 border-b border-zinc-950/10 pb-8 dark:border-white/10">
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">Gradual para organizadoras</p><h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Qual operação você quer abrir?</h1></div>
            <span className="hidden text-sm text-zinc-500 sm:block">{organizationContexts.length} {organizationContexts.length === 1 ? "espaço" : "espaços"}</span>
          </header>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {organizationContexts.map(({ organization, role }, index) => (
              <Link key={organization.id} href={`/org/${organization.slug}/dashboard`} className="group min-h-56 rounded-[1.5rem] border border-zinc-950/10 bg-white p-7 transition hover:-translate-y-0.5 hover:border-emerald-700/30 hover:shadow-[0_24px_70px_-35px_rgba(6,78,59,0.45)] dark:border-white/10 dark:bg-white/[0.045]">
                <div className="flex items-start justify-between"><span className="font-mono text-xs text-zinc-400">0{index + 1}</span><ArrowUpRight className="size-5 text-zinc-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-700" /></div>
                <div className="mt-16"><h2 className="text-2xl font-semibold tracking-[-0.035em]">{organization.name}</h2><p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{roleLabel[role]} · abrir painel</p></div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f3ee] text-zinc-950 dark:bg-[#101411] dark:text-zinc-50">
      <div className="absolute inset-y-0 right-0 hidden w-[46%] bg-emerald-950 lg:block" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.08fr_0.92fr]">
        <section className="flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
          <p className="text-sm font-semibold tracking-[-0.02em]">gradual<span className="text-emerald-700 dark:text-emerald-400">.</span> negócios</p>
          <div className="my-16 max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-800/15 bg-emerald-700/5 px-3 py-1.5 text-xs font-medium text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-300"><Sparkles className="size-3.5" /> Sua operação começa aqui</span>
            <h1 className="mt-6 text-5xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-6xl">Menos planilhas.<br />Mais celebrações.</h1>
            <p className="mt-6 max-w-md text-base leading-7 text-zinc-600 dark:text-zinc-400">Crie o espaço da sua organizadora para reunir turmas, relacionamento e operação em um só lugar.</p>
            <CreateOrganizationForm />
          </div>
          <p className="text-xs text-zinc-500">Ambiente protegido por isolamento entre organizações.</p>
        </section>
        <aside className="hidden flex-col justify-between bg-emerald-950 p-14 text-emerald-50 lg:flex">
          <div className="flex justify-end"><span className="rounded-full border border-emerald-200/20 px-3 py-1 text-[0.7rem] uppercase tracking-[0.15em] text-emerald-100/70">Workspace 01</span></div>
          <div><div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-emerald-100/15">
            <div className="bg-emerald-950 p-6"><Layers3 className="size-5 text-lime-300" /><p className="mt-12 text-3xl font-medium tracking-tight">Tudo junto</p><p className="mt-2 text-sm leading-6 text-emerald-100/60">Uma visão operacional, do primeiro contato à entrega.</p></div>
            <div className="bg-emerald-950 p-6"><ShieldCheck className="size-5 text-lime-300" /><p className="mt-12 text-3xl font-medium tracking-tight">Seu espaço</p><p className="mt-2 text-sm leading-6 text-emerald-100/60">Dados isolados e acesso de equipe por função.</p></div>
          </div><p className="mt-8 max-w-md text-xl leading-8 text-emerald-100/80">“Uma operação clara deixa a equipe livre para fazer o que realmente importa.”</p></div>
          <div className="h-px bg-gradient-to-r from-lime-300/70 to-transparent" />
        </aside>
      </div>
    </main>
  );
}
