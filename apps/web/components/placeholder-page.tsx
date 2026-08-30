type PlaceholderPageProps = Readonly<{
  title: string;
}>;

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Gradual</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-muted-foreground">Esta área será implementada em uma próxima etapa.</p>
      </div>
    </main>
  );
}

