"use client";

import { useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendAssistantMessage, type ChatMessage } from "@/lib/ai/send-message";
import { cn } from "@/lib/utils";

type AssistantChatProps = {
  eventId: string;
  initialMessages: ChatMessage[];
};

export function AssistantChat({ eventId, initialMessages }: AssistantChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pendingText = input.trim();
    if (!pendingText) return;

    setErrorMessage(null);
    setInput("");
    setMessages((current) => [
      ...current,
      { id: `optimistic-${Date.now()}`, role: "user", content: pendingText },
    ]);

    startTransition(async () => {
      try {
        const updated = await sendAssistantMessage(eventId, pendingText);
        setMessages(updated);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Não foi possível enviar sua mensagem.");
      }
    });
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Pergunte algo como &ldquo;o que falta fazer essa semana?&rdquo; ou &ldquo;não vou usar anel de
            formatura, pode cancelar essa tarefa&rdquo;.
          </p>
        ) : null}
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "max-w-[85%] rounded-lg px-3 py-2 text-sm",
              message.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {message.content}
          </div>
        ))}
        {isPending ? <p className="text-sm text-muted-foreground">Pensando...</p> : null}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Pergunte ao assistente..."
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending || !input.trim()}>
          Enviar
        </Button>
      </form>
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
    </div>
  );
}
