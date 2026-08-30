"use client";

import { Check, LoaderCircle } from "lucide-react";
import { useActionState } from "react";

import {
  type InquiryStatus,
  updateInquiryStatus,
} from "@/app/(vendor)/painel-fornecedor/actions";
import { Button } from "@/components/ui/button";

const nextAction: Record<InquiryStatus, { label: string; status: InquiryStatus } | null> = {
  new: { label: "Marcar como visto", status: "viewed" },
  viewed: { label: "Contato iniciado", status: "contacted" },
  contacted: { label: "Encerrar pedido", status: "closed" },
  closed: null,
};

export function InquiryStatusControl({ inquiryId, status }: { inquiryId: string; status: InquiryStatus }) {
  const [state, action, pending] = useActionState(updateInquiryStatus, {});
  const next = nextAction[status];

  if (!next) {
    return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500"><Check className="size-3.5" /> Finalizado</span>;
  }

  return (
    <form action={action} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="inquiryId" value={inquiryId} />
      <input type="hidden" name="status" value={next.status} />
      <Button type="submit" variant="outline" size="sm" disabled={pending} className="rounded-full border-zinc-300 bg-transparent shadow-none dark:border-white/15">
        {pending ? <LoaderCircle className="animate-spin" /> : null}
        {pending ? "Atualizando…" : next.label}
      </Button>
      {state.error ? <span role="alert" className="text-xs text-red-600 dark:text-red-400">{state.error}</span> : null}
    </form>
  );
}
