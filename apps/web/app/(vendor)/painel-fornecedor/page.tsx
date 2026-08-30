import {
  ArrowDownRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Clock3,
  Mail,
  MessageCircle,
  Phone,
  Store,
} from "lucide-react";
import Link from "next/link";

import type { InquiryStatus } from "./actions";
import { InquiryStatusControl } from "../_components/inquiry-status-control";
import { requireCurrentUser } from "@/lib/auth/require-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type VendorRow = { id: string; display_name: string };

type InquiryRow = {
  id: string;
  vendor_id: string;
  message: string;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  contact_preference: "email" | "phone" | "whatsapp";
  status: InquiryStatus;
  created_at: string;
};

const statusPresentation: Record<InquiryStatus, { label: string; className: string }> = {
  new: { label: "Novo", className: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  viewed: { label: "Visualizado", className: "bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  contacted: { label: "Em contato", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  closed: { label: "Encerrado", className: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400" },
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function contactHref(inquiry: InquiryRow): string | null {
  if (inquiry.contact_preference === "email" && inquiry.contact_email) {
    return `mailto:${inquiry.contact_email}`;
  }
  if (!inquiry.contact_phone) return null;
  const phone = inquiry.contact_phone.replace(/[^\d+]/g, "");
  return inquiry.contact_preference === "whatsapp"
    ? `https://wa.me/${phone.replace(/\D/g, "")}`
    : `tel:${phone}`;
}

function ContactIcon({ preference }: { preference: InquiryRow["contact_preference"] }) {
  if (preference === "email") return <Mail />;
  if (preference === "whatsapp") return <MessageCircle />;
  return <Phone />;
}

export default async function VendorDashboardPage() {
  await requireCurrentUser();
  const supabase = await createSupabaseServerClient();
  const { data: vendors, error: vendorsError } = await supabase
    .from("vendors")
    .select("id, display_name")
    .order("display_name")
    .returns<VendorRow[]>();

  if (vendorsError) throw vendorsError;

  if (!vendors?.length) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f1ea] px-6 text-zinc-950 dark:bg-[#121311] dark:text-zinc-50">
        <section className="max-w-xl text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-orange-600 text-white"><Store className="size-7" /></div>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700 dark:text-orange-400">Gradual parceiros</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Sua vitrine ainda não está ativa.</h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-zinc-600 dark:text-zinc-400">Quando seu cadastro de fornecedor for concluído, oportunidades e contatos recebidos aparecerão aqui.</p>
          <Link href="/" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-orange-700 hover:text-orange-800 dark:text-orange-400">Voltar ao Gradual <ArrowUpRight className="size-4" /></Link>
        </section>
      </main>
    );
  }

  const vendorNameById = new Map(vendors.map((vendor) => [vendor.id, vendor.display_name]));
  const { data: inquiries, error: inquiriesError } = await supabase
    .from("vendor_inquiries")
    .select("id, vendor_id, message, contact_name, contact_email, contact_phone, contact_preference, status, created_at")
    .in("vendor_id", vendors.map((vendor) => vendor.id))
    .order("created_at", { ascending: false })
    .returns<InquiryRow[]>();

  if (inquiriesError) throw inquiriesError;

  const rows = inquiries ?? [];
  const openCount = rows.filter((inquiry) => inquiry.status !== "closed").length;
  const newCount = rows.filter((inquiry) => inquiry.status === "new").length;
  const contactedCount = rows.filter((inquiry) => inquiry.status === "contacted").length;

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-zinc-950 dark:bg-[#121311] dark:text-zinc-50">
      <header className="border-b border-zinc-950/10 px-5 py-5 dark:border-white/10 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-orange-600 text-white"><BriefcaseBusiness className="size-4" /></div><div><p className="text-sm font-semibold tracking-tight">gradual<span className="text-orange-600">.</span> parceiros</p><p className="text-xs text-zinc-500">Central de oportunidades</p></div></div>
          <span className="rounded-full border border-zinc-950/10 px-3 py-1 text-xs text-zinc-500 dark:border-white/10">{vendors.length} {vendors.length === 1 ? "vitrine" : "vitrines"}</span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        <section className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700 dark:text-orange-400">Pedidos recebidos</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">Novas conversas<br />começam aqui.</h1></div>
          <div className="grid grid-cols-3 gap-8 border-t border-zinc-950/10 pt-5 dark:border-white/10 lg:min-w-[430px]">
            {[{ label: "Em aberto", value: openCount }, { label: "Novos", value: newCount }, { label: "Em contato", value: contactedCount }].map((metric) => <div key={metric.label}><p className="font-mono text-3xl">{metric.value.toString().padStart(2, "0")}</p><p className="mt-1 text-xs text-zinc-500">{metric.label}</p></div>)}
          </div>
        </section>

        <section className="mt-10 border-t border-zinc-950/10 dark:border-white/10">
          {rows.length === 0 ? (
            <div className="grid min-h-96 place-items-center text-center"><div><div className="mx-auto grid size-14 place-items-center rounded-full border border-dashed border-orange-700/40"><Clock3 className="size-5 text-orange-700 dark:text-orange-400" /></div><h2 className="mt-5 text-xl font-semibold">Aguardando a primeira oportunidade</h2><p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">Quando alguém solicitar um orçamento nas suas vitrines, o pedido aparecerá nesta linha do tempo.</p></div></div>
          ) : (
            <div>
              {rows.map((inquiry, index) => {
                const contact = contactHref(inquiry);
                const presentation = statusPresentation[inquiry.status];
                return (
                  <article key={inquiry.id} className="grid gap-6 border-b border-zinc-950/10 py-7 dark:border-white/10 lg:grid-cols-[70px_1fr_210px] lg:gap-8">
                    <div className="flex items-start justify-between lg:block"><span className="font-mono text-xs text-zinc-400">{String(index + 1).padStart(2, "0")}</span><span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] lg:hidden ${presentation.className}`}>{presentation.label}</span></div>
                    <div><div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-semibold tracking-[-0.03em]">{inquiry.contact_name}</h2><span className={`hidden rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] lg:inline-flex ${presentation.className}`}>{presentation.label}</span></div><p className="mt-1 text-xs text-zinc-500">Para {vendorNameById.get(inquiry.vendor_id) ?? "sua vitrine"} · {dateFormatter.format(new Date(inquiry.created_at))}</p><p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-700 dark:text-zinc-300">{inquiry.message}</p><div className="mt-5 flex flex-wrap gap-4 text-xs text-zinc-500">{inquiry.contact_email ? <span>{inquiry.contact_email}</span> : null}{inquiry.contact_phone ? <span>{inquiry.contact_phone}</span> : null}</div></div>
                    <div className="flex items-center justify-between gap-4 lg:flex-col lg:items-end lg:justify-between">
                      {contact ? <a href={contact} target={inquiry.contact_preference === "whatsapp" ? "_blank" : undefined} rel={inquiry.contact_preference === "whatsapp" ? "noreferrer" : undefined} className="inline-flex items-center gap-2 text-sm font-semibold text-orange-700 hover:text-orange-800 dark:text-orange-400">Responder <ContactIcon preference={inquiry.contact_preference} /><ArrowDownRight className="size-3.5" /></a> : <span />}
                      <InquiryStatusControl inquiryId={inquiry.id} status={inquiry.status} />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
