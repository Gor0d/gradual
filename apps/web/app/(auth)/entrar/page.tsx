import { AuthForm } from "@/components/auth/auth-form";
import { EntryHero } from "@/components/marketing/entry-hero";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground md:px-8">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-border shadow-lg md:grid-cols-[1.1fr_1fr]">
        <EntryHero />
        <div className="flex items-center justify-center bg-card px-8 py-10 md:px-12 md:py-12">
          <AuthForm />
        </div>
      </div>
    </main>
  );
}
