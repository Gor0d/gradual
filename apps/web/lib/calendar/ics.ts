export type CalendarEventInput = {
  title: string;
  description?: string | null;
  /** ISO date or date-time — only the date portion is used. Tasks and the
   * event date are calendar days here, not scheduled times (the schema has
   * no time-of-day field for either), so every export is an all-day event. */
  date: string;
  location?: string | null;
};

function toIcsDate(dateIso: string): string {
  return dateIso.slice(0, 10).replaceAll("-", "");
}

// All-day VEVENTs use an exclusive DTEND, so a single-day event ends the day after it starts.
function dayAfter(dateIso: string): string {
  const date = new Date(`${dateIso.slice(0, 10)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

function escapeIcsText(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll(";", "\\;").replaceAll(",", "\\,").replaceAll("\n", "\\n");
}

export function buildIcsFile(event: CalendarEventInput, uid: string): string {
  const dtStamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gradual//Checklist//PT",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}@gradual`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;VALUE=DATE:${toIcsDate(event.date)}`,
    `DTEND;VALUE=DATE:${dayAfter(event.date)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    event.description ? `DESCRIPTION:${escapeIcsText(event.description)}` : null,
    event.location ? `LOCATION:${escapeIcsText(event.location)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => line !== null);
  return lines.join("\r\n");
}

export function buildGoogleCalendarUrl(event: CalendarEventInput): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toIcsDate(event.date)}/${dayAfter(event.date)}`,
  });
  if (event.description) params.set("details", event.description);
  if (event.location) params.set("location", event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
