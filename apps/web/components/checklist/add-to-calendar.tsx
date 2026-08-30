"use client";

import { CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { buildGoogleCalendarUrl, buildIcsFile, type CalendarEventInput } from "@/lib/calendar/ics";

type AddToCalendarProps = {
  id: string;
  event: CalendarEventInput;
};

/**
 * One-way export only (Google link + downloadable .ics) — no OAuth, no
 * stored tokens, no background sync. A tarefa editada depois no Gradual não
 * atualiza o evento já exportado; two-way sync fica pra quando (se) isso for
 * um problema real pros usuários.
 */
export function AddToCalendar({ id, event }: AddToCalendarProps) {
  function downloadIcs() {
    const ics = buildIcsFile(event, id);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.title.replace(/[^\w-]+/g, "-").toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Adicionar ao calendário">
          <CalendarPlus />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={buildGoogleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={downloadIcs}>Baixar .ics</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
