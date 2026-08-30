import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function MarketingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center text-foreground">
      <span className="mb-4 text-sm font-semibold text-muted-foreground">Gradual</span>
      <h1 className="mb-4 max-w-2xl font-serif text-5xl font-normal italic sm:text-6xl">
        Sua colação de grau, do início ao dia da festa
      </h1>
      <p className="mb-9 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
        Checklist guiado com prazos automáticos, e um marketplace pra comparar beca, anel de formatura, fotógrafo,
        buffet e local perto de você — sem planilha, sem grupo de WhatsApp perdido.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg" className="font-bold">
          <Link href="/entrar">Começar meu checklist</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/buscar">Ver fornecedores</Link>
        </Button>
      </div>
    </main>
  );
}
