import { createClient } from "@/lib/supabase/server";

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function dateValue(date: string, addDay = false) {
  const value = new Date(`${date}T12:00:00Z`);
  if (addDay) value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10).replaceAll("-", "");
}

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("competitions")
    .select("*")
    .gte("ends_on", new Date().toISOString().slice(0, 10))
    .order("starts_on");

  if (error) return new Response("Não foi possível gerar o calendário.", { status: 503 });

  const events = (data ?? []).map((event) => [
    "BEGIN:VEVENT",
    `UID:${event.id}@judocalendar.app`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`,
    `DTSTART;VALUE=DATE:${dateValue(event.starts_on)}`,
    `DTEND;VALUE=DATE:${dateValue(event.ends_on, true)}`,
    `SUMMARY:${escapeIcs(event.name)}`,
    `DESCRIPTION:${escapeIcs(`${event.description}\nFonte: ${event.source_url}`)}`,
    `LOCATION:${escapeIcs(event.place ?? "Local a confirmar")}`,
    `URL:${event.source_url}`,
    "END:VEVENT",
  ].join("\r\n"));

  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Judo Calendar//Calendario FPJUDO//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Judo Calendar - FPJUDO",
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  return new Response(calendar, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="judo-calendar-fpjudo.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
