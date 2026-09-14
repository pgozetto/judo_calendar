import { NextResponse } from "next/server";
import { fetchFpjudoCalendarSources } from "@/lib/fpjudo";

export async function GET() {
  try {
    const sources = await fetchFpjudoCalendarSources();
    return NextResponse.json({ source: "FPJUDO WordPress REST API", latest: sources[0] ?? null, history: sources });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao consultar a FPJUDO." }, { status: 502 });
  }
}
