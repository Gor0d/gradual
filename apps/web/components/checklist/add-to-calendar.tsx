"use client";

import { CalendarPlus, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
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
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" asChild>
        <a href={buildGoogleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
          <CalendarPlus /> Google Calendar
        </a>
      </Button>
      <Button variant="ghost" size="sm" onClick={downloadIcs}>
        <Download /> .ics
      </Button>
    </div>
  );
}
