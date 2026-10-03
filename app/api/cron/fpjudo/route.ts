import { NextResponse, type NextRequest } from "next/server";
import { fetchFpjudoCalendarSources } from "@/lib/fpjudo";
import { hasBearerSecret } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!hasBearerSecret(request, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const sources = await fetchFpjudoCalendarSources();
    const admin = createAdminClient();
    const { error } = await admin.from("federation_sources").upsert(sources.map((source) => ({
      provider: "fpjudo",
      external_id: source.externalId,
      title: source.title,
      version: source.version,
      source_url: source.url,
      published_at: source.publishedAt,
      last_seen_at: new Date().toISOString(),
    })), { onConflict: "provider,external_id" });
    if (error) throw error;
    return NextResponse.json({ ok: true, latest: sources[0] ?? null, found: sources.length });
  } catch (error) {
    console.error("Falha na sincronização da FPJUDO", error);
    return NextResponse.json({ error: "Falha na sincronização." }, { status: 502 });
  }
}
