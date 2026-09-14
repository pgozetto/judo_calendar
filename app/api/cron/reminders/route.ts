import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

type LocalClock = { date: string; weekday: number; minutes: number };

function localClock(date: Date, timezone: string): LocalClock {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const weekdays: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    date: `${value.year}-${value.month}-${value.day}`,
    weekday: weekdays[value.weekday],
    minutes: Number(value.hour) * 60 + Number(value.minute),
  };
}

function minutesFromTime(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function withinWindow(now: number, target: number) {
  return now >= target && now < target + 15;
}

function htmlLayout(title: string, content: string) {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f2ed;font-family:Arial,sans-serif;color:#1c1917"><div style="max-width:560px;margin:0 auto;padding:32px 16px"><div style="background:#1c1917;color:white;border-radius:18px;padding:24px"><div style="font-size:12px;font-weight:800;color:#f59e0b;letter-spacing:.1em">JUDO CALENDAR</div><h1 style="font-size:26px;margin:14px 0 0">${title}</h1></div><div style="background:white;border-radius:18px;padding:24px;margin-top:12px;line-height:1.6">${content}<p style="font-size:12px;color:#78716c;margin-top:24px">Você pode ajustar estes avisos nas configurações da sua conta.</p></div></div></body></html>`;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!resendKey || !from) return NextResponse.json({ error: "Resend não configurado." }, { status: 503 });

  const admin = createAdminClient();
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 86_400_000).toISOString().slice(0, 10);
  const [profilesResult, preferencesResult, trainingSchedulesResult, reviewSchedulesResult, gamePlansResult, recordsResult, subscriptionsResult, alertsResult, competitionsResult] = await Promise.all([
    admin.from("profiles").select("*"),
    admin.from("email_preferences").select("*"),
    admin.from("training_schedules").select("*"),
    admin.from("review_schedules").select("*"),
    admin.from("game_plans").select("*"),
    admin.from("training_records").select("*").gte("training_date", weekAgo),
    admin.from("subscriptions").select("*"),
    admin.from("competition_alerts").select("*"),
    admin.from("competitions").select("*"),
  ]);

  const failures = [profilesResult, preferencesResult, trainingSchedulesResult, reviewSchedulesResult, gamePlansResult, recordsResult, subscriptionsResult, alertsResult, competitionsResult].filter((result) => result.error);
  if (failures.length) return NextResponse.json({ error: "Falha ao carregar os lembretes." }, { status: 500 });

  const preferences = new Map((preferencesResult.data ?? []).map((item) => [item.user_id, item]));
  const trainingSchedules = new Map((trainingSchedulesResult.data ?? []).map((item) => [item.user_id, item]));
  const reviewSchedules = new Map((reviewSchedulesResult.data ?? []).map((item) => [item.user_id, item]));
  const gamePlans = new Map((gamePlansResult.data ?? []).map((item) => [item.user_id, item]));
  const subscriptions = new Map((subscriptionsResult.data ?? []).map((item) => [item.user_id, item]));
  const competitions = new Map((competitionsResult.data ?? []).map((item) => [item.id, item]));
  const sent: string[] = [];

  async function send(userId: string, recipient: string, kind: string, dedupeKey: string, subject: string, html: string) {
    const { data: delivery, error } = await admin.from("email_deliveries").insert({ user_id: userId, kind, dedupe_key: dedupeKey, recipient, scheduled_for: today.toISOString() }).select("id").maybeSingle();
    if (error?.code === "23505") return;
    if (error || !delivery) throw error ?? new Error("Falha ao reservar envio.");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [recipient], subject, html }),
    });
    const result = await response.json().catch(() => ({})) as { id?: string; message?: string };
    await admin.from("email_deliveries").update(response.ok
      ? { status: "sent", provider_message_id: result.id ?? null, sent_at: new Date().toISOString(), attempts: 1 }
      : { status: "failed", last_error: result.message ?? "Falha no Resend", attempts: 1 }
    ).eq("id", delivery.id);
    if (response.ok) sent.push(dedupeKey);
  }

  for (const profile of profilesResult.data ?? []) {
    const clock = localClock(today, profile.timezone);
    const prefs = preferences.get(profile.id);
    const plan = subscriptions.get(profile.id);
    const hasPro = plan?.status === "authorized" && (plan.plan_id === "pro_monthly" || plan.lifetime_access);
    const schedule = trainingSchedules.get(profile.id);
    const gamePlan = gamePlans.get(profile.id);

    if (prefs?.training_reminders && schedule?.enabled) {
      const trainingMinutes = minutesFromTime(schedule.local_time);
      const rawReminderMinutes = trainingMinutes - schedule.reminder_minutes_before;
      const reminderMinutes = (rawReminderMinutes + 1440) % 1440;
      const trainingDay = rawReminderMinutes < 0 ? (clock.weekday + 1) % 7 : clock.weekday;
      if (schedule.weekdays.includes(trainingDay) && withinWindow(clock.minutes, reminderMinutes)) {
        const content = `<p>Olá, <strong>${profile.display_name}</strong>. Seu treino está chegando.</p><p><strong>Objetivo:</strong> ${gamePlan?.objective || "defina seu foco antes de subir no tatame"}</p><p><strong>Primeiro ataque:</strong> ${gamePlan?.first_attack || "revise seu plano de jogo"}</p>`;
        await send(profile.id, profile.email, "training_reminder", `training:${profile.id}:${clock.date}:${trainingDay}`, "Seu próximo treino de judô", htmlLayout("Leve seu plano ao tatame", content));
      }
    }

    const review = reviewSchedules.get(profile.id);
    if (hasPro && prefs?.weekly_review && review?.enabled && review.weekday === clock.weekday && withinWindow(clock.minutes, minutesFromTime(review.local_time))) {
      const records = (recordsResult.data ?? []).filter((record) => record.user_id === profile.id);
      const focuses = records.map((record) => record.next_focus).filter(Boolean).slice(0, 3);
      const content = `<p>Você registrou <strong>${records.length} treino${records.length === 1 ? "" : "s"}</strong> nos últimos 7 dias.</p>${focuses.length ? `<p><strong>Próximos focos:</strong></p><ul>${focuses.map((focus) => `<li>${focus}</li>`).join("")}</ul>` : "<p>Registre o próximo treino para construir seu histórico.</p>"}`;
      await send(profile.id, profile.email, "weekly_review", `review:${profile.id}:${clock.date}`, "Sua revisão semanal de judô", htmlLayout("Sua semana no tatame", content));
    }

    if (hasPro && prefs?.competition_alerts && withinWindow(clock.minutes, 9 * 60)) {
      const userAlerts = (alertsResult.data ?? []).filter((alert) => alert.user_id === profile.id && alert.enabled);
      for (const alert of userAlerts) {
        const competition = competitions.get(alert.competition_id);
        if (!competition) continue;
        const days = Math.round((new Date(`${competition.starts_on}T12:00:00Z`).getTime() - new Date(`${clock.date}T12:00:00Z`).getTime()) / 86_400_000);
        if (!alert.days_before.includes(days)) continue;
        const content = `<p>Faltam <strong>${days} dia${days === 1 ? "" : "s"}</strong> para <strong>${competition.name}</strong>.</p><p>${competition.place ?? "Local ainda não informado"}</p><p><a href="${competition.source_url}">Abrir a fonte oficial da FPJUDO</a></p>`;
        await send(profile.id, profile.email, "competition_alert", `competition:${profile.id}:${competition.id}:${days}`, `Faltam ${days} dias: ${competition.name}`, htmlLayout("Competição no radar", content));
      }
    }
  }

  return NextResponse.json({ ok: true, sent: sent.length });
}
