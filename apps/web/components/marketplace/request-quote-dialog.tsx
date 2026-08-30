"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { sendVendorInquiry, type ContactPreference } from "@/lib/marketplace/send-inquiry";

type RequestQuoteDialogProps = {
  vendorId: string;
  vendorName: string;
  isAuthenticated: boolean;
  defaultContactName?: string;
  defaultContactEmail?: string;
  className?: string;
};

export function RequestQuoteDialog({
  vendorId,
  vendorName,
  isAuthenticated,
  defaultContactName,
  defaultContactEmail,
  className,
}: RequestQuoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [contactName, setContactName] = useState(defaultContactName ?? "");
  const [contactPreference, setContactPreference] = useState<ContactPreference>("email");
  const [contactEmail, setContactEmail] = useState(defaultContactEmail ?? "");
  const [contactPhone, setContactPhone] = useState("");
  const [message, setMessage] = useState("");

  if (!isAuthenticated) {
    return (
      <Button asChild size="lg" className={className} variant="default">
        <Link href="/entrar">Entrar para solicitar orçamento</Link>
      </Button>
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      try {
        await sendVendorInquiry({
          vendorId,
          contactName,
          contactPreference,
          contactEmail: contactPreference === "email" ? contactEmail.trim() : undefined,
          contactPhone: contactPreference !== "email" ? contactPhone.trim() : undefined,
          message,
        });
        setSent(true);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Não foi possível enviar sua solicitação.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          // Reset the confirmation once closed so it can be reused.
          setTimeout(() => setSent(false), 200);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" className={className}>
          Solicitar orçamento
        </Button>
      </DialogTrigger>
      <DialogContent>
        {sent ? (
          <>
            <DialogHeader>
              <DialogTitle>Solicitação enviada!</DialogTitle>
              <DialogDescription>
                {vendorName} vai receber sua mensagem e entrar em contato pelo{" "}
                {contactPreference === "email" ? "e-mail" : contactPreference === "whatsapp" ? "WhatsApp" : "telefone"}{" "}
                informado.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Fechar</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Solicitar orçamento a {vendorName}</DialogTitle>
              <DialogDescription>Conte um pouco sobre o que você precisa — o fornecedor responde direto pra você.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Seu nome</Label>
                <Input
                  id="contact-name"
                  required
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-preference">Como prefere ser contatado?</Label>
                <Select
                  value={contactPreference}
                  onValueChange={(value) => setContactPreference(value as ContactPreference)}
                >
                  <SelectTrigger id="contact-preference">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="phone">Telefone</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {contactPreference === "email" ? (
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Seu e-mail</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Seu {contactPreference === "whatsapp" ? "WhatsApp" : "telefone"}</Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    required
                    placeholder="(41) 99999-9999"
                    value={contactPhone}
                    onChange={(event) => setContactPhone(event.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  required
                  minLength={1}
                  maxLength={2000}
                  rows={4}
                  placeholder="Ex: gostaria de um orçamento para o pacote completo, minha colação é em março."
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </div>

              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Enviando..." : "Enviar solicitação"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
