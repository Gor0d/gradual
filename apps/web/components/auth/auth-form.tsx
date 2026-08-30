"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "entrar" | "criar-conta";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const { data, error } =
      mode === "criar-conta"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (mode === "criar-conta" && !data.session) {
      setInfoMessage("Conta criada! Confirme seu e-mail para continuar.");
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{mode === "entrar" ? "Entrar" : "Criar conta"}</CardTitle>
        <CardDescription>
          {mode === "entrar" ? "Acesse sua jornada de formatura." : "Comece a organizar sua colação de grau."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "entrar" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
          {infoMessage ? <p className="text-sm text-muted-foreground">{infoMessage}</p> : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {mode === "entrar" ? "Entrar" : "Criar conta"}
          </Button>
          <Button
            type="button"
            variant="link"
            className="w-full"
            onClick={() => setMode(mode === "entrar" ? "criar-conta" : "entrar")}
          >
            {mode === "entrar" ? "Não tem conta? Criar uma" : "Já tem conta? Entrar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
