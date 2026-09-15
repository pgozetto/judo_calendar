import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeUpdate, type CompetitionEvent, type DashboardInitialData } from "@/lib/dashboard-data";
import type { Tables } from "@/lib/database.types";

export const metadata: Metadata = { title: "Meu dojo" };

const intensityLabels = { light: "Leve", moderate: "Moderado", hard: "Forte" } as const;

function formatCompetition(event: Tables<"competitions">): CompetitionEvent {
  const start = new Date(`${event.starts_on}T12:00:00`);
  const end = new Date(`${event.ends_on}T12:00:00`);
  const month = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(start).replace(".", "").toUpperCase();
  const sameDay = event.starts_on === event.ends_on;
  const dateLabel = sameDay
    ? new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(start)
    : `${new Intl.DateTimeFormat("pt-BR", { day: "numeric" }).format(start)} a ${new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(end)}`;

  return {
    id: event.id,
    dateStart: event.starts_on,
    dateEnd: event.ends_on,
    day: sameDay ? String(start.getDate()) : `${start.getDate()}–${end.getDate()}`,
    month,
    dateLabel,
    name: event.name,
    place: event.place ?? "Local ainda não informado",
    status: event.status === "details_published" ? "Detalhes publicados" : "Calendário oficial",
    description: event.description,
    categories: event.categories,
    sourceUrl: event.source_url,
    sourceLabel: event.source_label,
    sourceCheckedAt: event.source_checked_at,
  };
}

export default async function AppPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/entrar?next=/app");

  const [
    profileResult,
    entriesResult,
    gamePlanResult,
    notesResult,
    trainingScheduleResult,
    reviewScheduleResult,
    preferencesResult,
    competitionsResult,
    alertsResult,
    techniquesResult,
    subscriptionResult,
    notificationsResult,
    plansResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("training_records").select("*").eq("user_id", userId).order("training_date", { ascending: false }),
    supabase.from("game_plans").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("free_notes").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
    supabase.from("training_schedules").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("review_schedules").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("email_preferences").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("competitions").select("*").gte("ends_on", new Date().toISOString().slice(0, 10)).order("starts_on"),
    supabase.from("competition_alerts").select("competition_id").eq("user_id", userId).eq("enabled", true),
    supabase.from("techniques").select("*").order("sort_order"),
    supabase.from("subscriptions").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("notifications").select("id,title,body,kind,href,read_at,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    supabase.from("subscription_plans").select("*").eq("active", true).order("price_cents"),
  ]);

  const profile = profileResult.data;
  if (!profile) {
    const { data: workspaceReady, error: workspaceError } = await supabase.rpc("ensure_user_workspace");
    if (!workspaceError && workspaceReady) redirect("/app");

    redirect("/entrar?erro=Sua conta foi autenticada, mas o perfil ainda não foi preparado. A atualização do banco precisa ser aplicada.");
  }

  const planId = subscriptionResult.data?.plan_id ?? "free";
  const planData = (plansResult.data ?? []).find((plan) => plan.id === planId);
  const gamePlan = gamePlanResult.data;
  const trainingSchedule = trainingScheduleResult.data;
  const reviewSchedule = reviewScheduleResult.data;
  const preferences = preferencesResult.data;

  const initialData: DashboardInitialData = {
    userId,
    profile: {
      displayName: profile.display_name,
      username: profile.username,
      email: profile.email,
      photo: profile.avatar_url,
    },
    entries: (entriesResult.data ?? []).map((entry) => ({
      id: entry.id,
      date: entry.training_date,
      title: entry.title,
      learned: entry.learned,
      mistakes: entry.mistakes,
      nextFocus: entry.next_focus,
      intensity: intensityLabels[entry.intensity],
    })),
    gamePlan: {
      objective: gamePlan?.objective ?? "",
      grip: gamePlan?.grip ?? "",
      firstAttack: gamePlan?.first_attack ?? "",
      combination: gamePlan?.combination ?? "",
      groundwork: gamePlan?.groundwork ?? "",
    },
    notes: (notesResult.data ?? []).map((note) => ({
      id: note.id,
      title: note.title,
      content: note.content,
      category: note.category,
      updatedAt: formatRelativeUpdate(note.updated_at),
    })),
    trainingSchedule: { days: trainingSchedule?.weekdays ?? [1, 3, 5], time: trainingSchedule?.local_time.slice(0, 5) ?? "18:30" },
    reviewSchedule: { day: reviewSchedule?.weekday ?? 0, time: reviewSchedule?.local_time.slice(0, 5) ?? "19:00" },
    emailPreferences: {
      productEmails: preferences?.product_emails ?? true,
      trainingReminders: preferences?.training_reminders ?? true,
      weeklyReview: preferences?.weekly_review ?? true,
      competitionAlerts: preferences?.competition_alerts ?? true,
      offers: preferences?.offers ?? false,
    },
    competitions: (competitionsResult.data ?? []).map(formatCompetition),
    competitionAlertIds: (alertsResult.data ?? []).map((alert) => alert.competition_id),
    techniques: (techniquesResult.data ?? []).map((technique) => ({
      id: technique.id,
      name: technique.name,
      group: technique.classification,
      description: technique.description,
      isPro: technique.is_pro,
    })),
    notifications: (notificationsResult.data ?? []).map((notification) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      kind: notification.kind,
      href: notification.href,
      createdAt: notification.created_at,
      readAt: notification.read_at,
    })),
    plan: { id: planData?.id ?? "free", name: planData?.name ?? "Gratuito", proAccess: planData?.pro_access ?? false },
  };

  return <Dashboard initialData={initialData} />;
}
