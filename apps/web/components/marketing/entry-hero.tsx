const VALUE_LINES = [
  "Prazos calculados de trás pra frente, a partir da sua data de colação",
  "Beca, anel, fotógrafo, buffet e local — comparados lado a lado",
  "Peça orçamento e acompanhe tudo sem abrir 10 conversas de WhatsApp",
];

/**
 * Left panel shared by the auth screen — same headline/value props as the
 * (marketing) landing page, just in the split-screen treatment. Static
 * content only, safe as a server component.
 */
export function EntryHero() {
  return (
    <div className="relative flex flex-col overflow-hidden border-b border-border bg-gradient-to-br from-primary/15 via-secondary to-accent/10 px-8 py-10 md:border-b-0 md:border-r md:px-12 md:py-12">
      <span className="font-serif text-2xl italic tracking-tight">Gradual</span>

      <h1 className="mt-8 max-w-[11ch] text-balance font-serif text-4xl italic leading-[1.05] tracking-tight md:text-5xl">
        Sua colação de grau, do início ao dia da festa
      </h1>
      <p className="mt-4 max-w-[38ch] text-[15px] leading-relaxed text-muted-foreground">
        Um checklist que sabe o que falta e quando, mais um marketplace pra comparar fornecedores — sem virar um
        segundo trabalho.
      </p>

      <ul className="mt-8 flex max-w-[40ch] flex-col gap-3">
        {VALUE_LINES.map((line) => (
          <li key={line} className="flex items-start gap-3 text-sm leading-relaxed">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="mt-0.5 size-[18px] shrink-0 text-primary"
            >
              <path d="M4 10.5l3.8 3.8L16 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {line}
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-col items-start gap-6 md:mt-auto md:flex-row md:items-end md:justify-between">
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-24 text-foreground/85"
        >
          <path d="M60 30 12 50l48 20 48-20-48-20z" />
          <path d="M36 58v22c0 6 10.7 14 24 14s24-8 24-14V58" />
          <path d="M96 50v26" />
          <circle cx="96" cy="82" r="3.2" fill="currentColor" stroke="none" />
        </svg>
        <p className="max-w-[24ch] rotate-[-2.5deg] text-right font-serif text-lg italic leading-snug text-accent">
          porque esse dia não devia dar mais trabalho que a faculdade inteira
        </p>
      </div>
    </div>
  );
}
