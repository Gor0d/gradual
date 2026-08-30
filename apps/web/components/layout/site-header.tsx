"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useSignOut } from "@/components/auth/use-sign-out";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  user: { fullName: string | null; email: string } | null;
  primaryEventHref: string | null;
};

type NavLink = { href: string; label: string };

function useNavLinks(primaryEventHref: string | null): NavLink[] {
  const links: NavLink[] = [];
  if (primaryEventHref) {
    links.push({ href: primaryEventHref, label: "Checklist" });
    links.push({ href: "/assistente", label: "Assistente" });
  }
  links.push({ href: "/buscar", label: "Buscar fornecedores" });
  return links;
}

function initialsFor(user: SiteHeaderProps["user"]): string {
  const source = user?.fullName?.trim() || user?.email || "?";
  return source.charAt(0).toUpperCase();
}

export function SiteHeader({ user, primaryEventHref }: SiteHeaderProps) {
  const pathname = usePathname();
  const links = useNavLinks(primaryEventHref);
  const [sheetOpen, setSheetOpen] = useState(false);
  const signOut = useSignOut();

  const logoHref = user ? (primaryEventHref ?? "/onboarding") : "/";

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-6">
        <Link href={logoHref} className="font-serif text-xl italic tracking-tight">
          Gradual
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegação principal">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center md:flex">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Menu da conta"
                  className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                >
                  {initialsFor(user)}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={signOut}>Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href="/entrar">Entrar</Link>
            </Button>
          )}
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex w-64 flex-col gap-6">
            <SheetTitle className="font-serif text-xl italic">Gradual</SheetTitle>
            <nav className="flex flex-col gap-1" aria-label="Navegação principal">
              {links.map((link) => (
                <SheetClose key={link.href} asChild>
                  <Link
                    href={link.href}
                    className="rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              ))}
            </nav>
            <div className="mt-auto">
              {user ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSheetOpen(false);
                    void signOut();
                  }}
                >
                  Sair
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link href="/entrar">Entrar</Link>
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
