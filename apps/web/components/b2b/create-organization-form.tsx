"use client";

import { ArrowRight, Building2 } from "lucide-react";
import { useActionState } from "react";

import { createOrganization, createOrganizationInitialState } from "@/app/(b2b)/organizadora/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateOrganizationForm() {
  const [state, action, pending] = useActionState(createOrganization, createOrganizationInitialState);
  return (
    <form action={action} className="mt-8 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="organization-name" className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Nome da organizadora</Label>
        <div className="relative">
          <Building2 className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <Input id="organization-name" name="name" minLength={3} maxLength={120} required autoFocus autoComplete="organization" placeholder="Ex.: Aurora Formaturas" className="h-12 rounded-xl border-zinc-300 bg-white pl-11 text-[0.95rem] shadow-none focus-visible:ring-2 focus-visible:ring-emerald-600/30 dark:border-white/15 dark:bg-white/5" />
        </div>
      </div>
      {state.error ? <p role="alert" className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="h-12 w-full rounded-xl bg-emerald-700 text-white shadow-none hover:bg-emerald-800 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300">
        {pending ? "Criando espaço…" : "Criar meu espaço"}{!pending ? <ArrowRight /> : null}
      </Button>
    </form>
  );
}
