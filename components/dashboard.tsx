"use client";

import {
  Bell,
  BookOpenCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Crown,
  Dumbbell,
  ExternalLink,
  Flame,
  ImagePlus,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MailCheck,
  MapPin,
  Menu,
  NotebookPen,
  Plus,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Trash2,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { createClient } from "@/lib/supabase/client";
import type {
  CompetitionEvent,
  DashboardInitialData,
  EmailPreferences,
  FreeNote,
  GamePlanDraft,
  Profile,
  TechniqueItem,
  TrainingEntry,
  TrainingSchedule,
  ReviewSchedule,
} from "@/lib/dashboard-data";

type Section = "overview" | "calendar" | "gameplan" | "notes" | "library" | "competitions";

const sectionLabels: Record<Section, string> = {
  overview: "Visão geral",
  calendar: "Calendário",
  gameplan: "Plano de jogo",
  notes: "Notas livres",
  library: "Biblioteca",
  competitions: "Competições",
};

const navGroups: { label: string; items: { id: Section; label: string; icon: typeof CalendarDays; pro?: boolean }[] }[] = [
  {
    label: "Meu judô",
    items: [
      { id: "overview", label: "Visão geral", icon: LayoutDashboard },
      { id: "calendar", label: "Calendário", icon: CalendarDays },
      { id: "gameplan", label: "Plano de jogo", icon: Swords },
      { id: "notes", label: "Notas livres", icon: NotebookPen },
    ],
  },
  {
    label: "Judo Calendar Pró",
    items: [
      { id: "library", label: "Biblioteca", icon: BookOpenCheck, pro: true },
      { id: "competitions", label: "Competições", icon: Trophy, pro: true },
    ],
  },
];

const weekdayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const weekdayShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const intensityValues = { Leve: "light", Moderado: "moderate", Forte: "hard" } as const;
const techniqueColors = [
  "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  "bg-stone-200 text-stone-700 dark:bg-white/10 dark:text-stone-300",
];

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fromDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function emptyDraft(date: string): TrainingEntry {
  return { id: null, date, title: "Treino de judô", learned: "", mistakes: "", nextFocus: "", intensity: "Moderado" };
}

function calendarCells(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const previousMonthDays = new Date(year, monthIndex, 0).getDate();

  return Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - firstWeekday + 1;
    if (dayNumber < 1) return { date: new Date(year, monthIndex - 1, previousMonthDays + dayNumber), current: false };
    if (dayNumber > daysInMonth) return { date: new Date(year, monthIndex + 1, dayNumber - daysInMonth), current: false };
    return { date: new Date(year, monthIndex, dayNumber), current: true };
  });
}

function calculateTrainingStreak(entries: TrainingEntry[], schedule: TrainingSchedule, todayKey: string) {
  if (schedule.days.length === 0) return 0;
  const recordedDates = new Set(entries.map((entry) => entry.date));
  const cursor = fromDateKey(todayKey);
  let streak = 0;

  for (let index = 0; index < 370; index += 1) {
    const key = toDateKey(cursor);
    const scheduled = schedule.days.includes(cursor.getDay());
    const recorded = recordedDates.has(key);

    // A sessão de hoje ainda pode ser registrada; ela só conta como falta depois que o dia passa.
    if (scheduled && !(index === 0 && !recorded)) {
      if (!recorded) break;
      streak += 1;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function nextTrainingLabel(schedule: TrainingSchedule, todayKey: string) {
  const cursor = fromDateKey(todayKey);
  for (let index = 0; index < 8; index += 1) {
    if (schedule.days.includes(cursor.getDay())) {
      const prefix = index === 0 ? "Hoje" : weekdayNames[cursor.getDay()];
      return `${prefix}, ${schedule.time.replace(":", "h")}`;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return "Rotina não configurada";
}

function ProfileAvatar({ profile, large = false }: { profile: Profile; large?: boolean }) {
  const initials = profile.displayName.split(" ").filter(Boolean).slice(0, 2).map((name) => name[0]).join("").toUpperCase() || "PG";
  if (profile.photo) return <span role="img" aria-label="Foto do perfil" className={`${large ? "size-20 rounded-2xl" : "size-9 rounded-xl"} shrink-0 bg-cover bg-center shadow-sm`} style={{ backgroundImage: `url(${profile.photo})` }} />;
  return <span className={`${large ? "size-20 rounded-2xl text-xl" : "size-9 rounded-xl text-xs"} grid shrink-0 place-items-center bg-red-100 font-black text-red-800 dark:bg-amber-500/12 dark:text-amber-300`} aria-label={`Avatar ${initials}`}>{initials}</span>;
}

export function Dashboard({ initialData }: { initialData: DashboardInitialData }) {
  const supabase = createClient();
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [entries, setEntries] = useState<TrainingEntry[]>(initialData.entries);
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [draft, setDraft] = useState<TrainingEntry>(() => emptyDraft(toDateKey(new Date())));
  const [editorOpen, setEditorOpen] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [gamePlan, setGamePlan] = useState<GamePlanDraft>(initialData.gamePlan);
  const [notes, setNotes] = useState<FreeNote[]>(initialData.notes);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<FreeNote | null>(null);
  const [trainingSchedule, setTrainingSchedule] = useState<TrainingSchedule>(initialData.trainingSchedule);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [reviewSchedule, setReviewSchedule] = useState<ReviewSchedule>(initialData.reviewSchedule);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<CompetitionEvent | null>(null);
  const [competitionAlertIds, setCompetitionAlertIds] = useState(initialData.competitionAlertIds);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profile, setProfile] = useState<Profile>(initialData.profile);
  const [emailPreferences, setEmailPreferences] = useState<EmailPreferences>(initialData.emailPreferences);

  const monthCells = useMemo(() => calendarCells(calendarMonth), [calendarMonth]);
  const todayKey = toDateKey(new Date());
  const recentEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  function chooseSection(next: Section) {
    setSection(next);
    setSidebarOpen(false);
  }

  function openTrainingEditor(dateKey = todayKey) {
    const existing = entries.find((entry) => entry.date === dateKey);
    setSelectedDate(dateKey);
    setDraft(existing ? { ...existing } : emptyDraft(dateKey));
    setEditorOpen(true);
  }

  async function saveTraining(event: FormEvent) {
    event.preventDefault();
    const { data, error } = await supabase.from("training_records").upsert({
      user_id: initialData.userId,
      training_date: draft.date,
      title: draft.title.trim(),
      learned: draft.learned.trim(),
      mistakes: draft.mistakes.trim(),
      next_focus: draft.nextFocus.trim(),
      intensity: intensityValues[draft.intensity],
    }, { onConflict: "user_id,training_date" }).select("*").single();

    if (error || !data) {
      flashSaved("Não foi possível salvar o treino");
      return;
    }

    const saved: TrainingEntry = { ...draft, id: data.id };
    setEntries((current) => [...current.filter((entry) => entry.date !== draft.date), saved]);
    setEditorOpen(false);
    flashSaved("Treino registrado com sucesso");
  }

  async function deleteTraining() {
    const { error } = await supabase.from("training_records").delete().eq("user_id", initialData.userId).eq("training_date", selectedDate);
    if (error) {
      flashSaved("Não foi possível remover o registro");
      return;
    }
    setEntries((current) => current.filter((entry) => entry.date !== selectedDate));
    setEditorOpen(false);
    flashSaved("Registro removido");
  }

  function flashSaved(message: string) {
    setSavedMessage(message);
    window.setTimeout(() => setSavedMessage(""), 2600);
  }

  async function saveGamePlan(event: FormEvent) {
    event.preventDefault();
    const { error } = await supabase.from("game_plans").upsert({
      user_id: initialData.userId,
      objective: gamePlan.objective,
      grip: gamePlan.grip,
      first_attack: gamePlan.firstAttack,
      combination: gamePlan.combination,
      groundwork: gamePlan.groundwork,
      is_active: true,
    }, { onConflict: "user_id" });
    flashSaved(error ? "Não foi possível salvar o plano" : "Plano de jogo salvo");
  }

  function openNewNote() {
    setEditingNote(null);
    setNoteModalOpen(true);
  }

  function openEditNote(note: FreeNote) {
    setEditingNote(note);
    setNoteModalOpen(true);
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = {
      user_id: initialData.userId,
      title: String(form.get("title")).trim(),
      content: String(form.get("content")).trim(),
      category: String(form.get("category")),
    };
    const query = editingNote
      ? supabase.from("free_notes").update(values).eq("id", editingNote.id).eq("user_id", initialData.userId)
      : supabase.from("free_notes").insert(values);
    const { data, error } = await query.select("*").single();
    if (error || !data) {
      flashSaved("Não foi possível salvar a nota");
      return;
    }
    const next: FreeNote = { id: data.id, title: data.title, content: data.content, category: data.category, updatedAt: "Agora" };
    setNotes((current) => editingNote ? current.map((note) => note.id === editingNote.id ? next : note) : [next, ...current]);
    setNoteModalOpen(false);
    setEditingNote(null);
    flashSaved(editingNote ? "Nota atualizada" : "Nota criada");
  }

  async function deleteNote() {
    if (!editingNote) return;
    const { error } = await supabase.from("free_notes").delete().eq("id", editingNote.id).eq("user_id", initialData.userId);
    if (error) {
      flashSaved("Não foi possível excluir a nota");
      return;
    }
    setNotes((current) => current.filter((note) => note.id !== editingNote.id));
    setNoteModalOpen(false);
    setEditingNote(null);
    flashSaved("Nota excluída");
  }

  async function saveTrainingSchedule(schedule: TrainingSchedule) {
    const { error } = await supabase.from("training_schedules").upsert({ user_id: initialData.userId, weekdays: schedule.days, local_time: schedule.time }, { onConflict: "user_id" });
    if (error) {
      flashSaved("Não foi possível salvar a rotina");
      return;
    }
    setTrainingSchedule(schedule);
    setScheduleOpen(false);
    flashSaved("Dias de treino atualizados");
  }

  async function saveReviewSchedule(schedule: ReviewSchedule) {
    const { error } = await supabase.from("review_schedules").upsert({ user_id: initialData.userId, weekday: schedule.day, local_time: schedule.time }, { onConflict: "user_id" });
    if (error) {
      flashSaved("Não foi possível salvar a revisão");
      return;
    }
    setReviewSchedule(schedule);
    setReviewOpen(false);
    flashSaved("Revisão semanal atualizada");
  }

  async function saveProfile(next: Profile) {
    let avatarUrl = next.photo;
    if (avatarUrl?.startsWith("data:")) {
      const blob = await fetch(avatarUrl).then((response) => response.blob());
      const extension = blob.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
      const path = `${initialData.userId}/avatar-${Date.now()}.${extension}`;
      const upload = await supabase.storage.from("avatars").upload(path, blob, { contentType: blob.type, upsert: false });
      if (upload.error) {
        flashSaved("Não foi possível enviar a foto");
        return;
      }
      avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    }

    if (next.username !== profile.username) {
      const { data: available } = await supabase.rpc("is_username_available", { candidate: next.username });
      if (!available) {
        flashSaved("Este nome de usuário já está em uso");
        return;
      }
    }

    const { error } = await supabase.from("profiles").update({
      display_name: next.displayName.trim(),
      username: next.username,
      avatar_url: avatarUrl,
    }).eq("id", initialData.userId);
    if (error) {
      flashSaved("Não foi possível atualizar o perfil");
      return;
    }

    if (next.email !== profile.email) {
      const emailUpdate = await supabase.auth.updateUser({ email: next.email });
      if (emailUpdate.error) {
        flashSaved("Perfil salvo, mas o novo e-mail não pôde ser confirmado");
        setProfile({ ...next, email: profile.email, photo: avatarUrl });
        return;
      }
      flashSaved("Confirme a troca de e-mail pelas mensagens recebidas");
    } else {
      flashSaved("Perfil atualizado");
    }
    setProfile({ ...next, photo: avatarUrl });
  }

  async function savePreferences(next: EmailPreferences) {
    const { error } = await supabase.from("email_preferences").upsert({
      user_id: initialData.userId,
      product_emails: next.productEmails,
      training_reminders: next.trainingReminders,
      weekly_review: next.weeklyReview,
      competition_alerts: next.competitionAlerts,
      offers: next.offers,
    }, { onConflict: "user_id" });
    if (!error) setEmailPreferences(next);
    flashSaved(error ? "Não foi possível salvar as preferências" : "Preferências salvas");
  }

  async function toggleCompetitionAlert(competitionId: string) {
    const enabled = competitionAlertIds.includes(competitionId);
    const query = enabled
      ? supabase.from("competition_alerts").delete().eq("user_id", initialData.userId).eq("competition_id", competitionId)
      : supabase.from("competition_alerts").upsert({ user_id: initialData.userId, competition_id: competitionId, enabled: true }, { onConflict: "user_id,competition_id" });
    const { error } = await query;
    if (error) {
      flashSaved("Não foi possível alterar o alerta");
      return;
    }
    setCompetitionAlertIds((current) => enabled ? current.filter((id) => id !== competitionId) : [...current, competitionId]);
    flashSaved(enabled ? "Alerta de competição removido" : "Alertas da competição ativados");
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword, current_password: currentPassword });
    return error ? "Não foi possível alterar. Confira sua senha atual." : "Senha atualizada com segurança.";
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/entrar");
    router.refresh();
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f2ed] text-stone-950 dark:bg-[#100e0c] dark:text-stone-50">
      <aside className={`fixed inset-y-0 left-0 z-50 w-[272px] border-r border-stone-200 bg-[#fbfaf7] transition-transform duration-300 dark:border-white/8 dark:bg-[#171310] lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col px-4 py-5">
          <div className="flex items-center justify-between px-2"><Brand href="/app" /><button onClick={() => setSidebarOpen(false)} className="grid size-9 place-items-center rounded-lg hover:bg-stone-100 dark:hover:bg-white/5 lg:hidden" aria-label="Fechar menu"><X className="size-5" /></button></div>
          <nav className="app-scrollbar mt-9 flex-1 overflow-y-auto">
            {navGroups.map((group) => (
              <div key={group.label} className="mb-7">
                <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[.15em] text-stone-400 dark:text-stone-500">{group.label}</p>
                <div className="space-y-1">
                  {group.items.map(({ id, label, icon: Icon, pro }) => (
                    <button key={id} onClick={() => chooseSection(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${section === id ? "bg-red-50 text-red-800 dark:bg-amber-500/10 dark:text-amber-300" : "text-stone-600 hover:bg-stone-100 hover:text-stone-950 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-100"}`}>
                      <Icon className="size-[18px] shrink-0" /><span>{label}</span>{pro && <span className="ml-auto rounded-md bg-amber-100 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">Pró</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className="rounded-2xl bg-stone-950 p-4 text-white dark:bg-[#2a2118]">
            <div className="flex items-center gap-2 text-amber-300"><Crown className="size-4" /><span className="text-[10px] font-black uppercase tracking-wider">{initialData.plan.proAccess ? "Seu plano está ativo" : "Libere todo o dojo"}</span></div>
            <p className="mt-2 text-xs leading-5 text-stone-300">{initialData.plan.proAccess ? "Biblioteca, competições e revisões disponíveis." : "Vídeos, biblioteca e revisão semanal."}</p>
            <Link href={initialData.plan.proAccess ? "/assinar" : "/#planos"} className="mt-3 block rounded-lg bg-red-600 px-3 py-2 text-center text-xs font-extrabold transition hover:bg-red-500 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400">{initialData.plan.proAccess ? "Gerenciar plano" : "Conhecer o Pró"}</Link>
          </div>
          <button type="button" onClick={() => setSettingsOpen(true)} className="group mt-3 flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-stone-100 dark:hover:bg-white/5" aria-label="Abrir configurações da conta">
            <ProfileAvatar profile={profile} />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{profile.displayName}</p><p className="truncate text-[11px] text-stone-400">Plano {initialData.plan.name}</p></div>
            <Settings className="size-4 text-stone-400 transition group-hover:rotate-45 group-hover:text-red-700 dark:group-hover:text-amber-400" />
          </button>
        </div>
      </aside>
      {sidebarOpen && <button className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Fechar menu" />}

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-stone-200/80 bg-[#f4f2ed]/88 px-4 backdrop-blur-xl sm:px-7 dark:border-white/8 dark:bg-[#100e0c]/85">
          <div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="grid size-10 place-items-center rounded-xl border border-stone-200 bg-white dark:border-white/8 dark:bg-white/5 lg:hidden" aria-label="Abrir menu"><Menu className="size-5" /></button><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-stone-400 lg:hidden">Meu dojo</p><h1 className="text-base font-black tracking-[-.02em] sm:text-lg">{sectionLabels[section]}</h1></div></div>
          <div className="flex items-center gap-2">
            <button className="relative grid size-10 place-items-center rounded-xl border border-stone-200 bg-white text-stone-500 transition hover:text-red-700 dark:border-white/8 dark:bg-white/5 dark:text-stone-300 dark:hover:text-amber-300" aria-label="Avisos"><Bell className="size-[18px]" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-red-600 dark:bg-amber-400" /></button>
            <ThemeToggle />
            <button onClick={() => openTrainingEditor()} className="ml-1 hidden items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-red-800 sm:flex dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400"><Plus className="size-4" /> Registrar treino</button>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-6 sm:px-7 sm:pt-8 lg:pb-10">
          {section === "overview" && <Overview entries={recentEntries} todayKey={todayKey} trainingSchedule={trainingSchedule} reviewSchedule={reviewSchedule} onRegister={openTrainingEditor} onOpenCalendar={() => chooseSection("calendar")} onOpenPlan={() => chooseSection("gameplan")} onEditSchedule={() => setScheduleOpen(true)} onEditReview={() => setReviewOpen(true)} />}
          {section === "calendar" && <CalendarView cells={monthCells} month={calendarMonth} entries={entries} todayKey={todayKey} onMonthChange={setCalendarMonth} onSelect={openTrainingEditor} />}
          {section === "gameplan" && <GamePlanView gamePlan={gamePlan} setGamePlan={setGamePlan} trainingSchedule={trainingSchedule} onEditSchedule={() => setScheduleOpen(true)} onSave={saveGamePlan} />}
          {section === "notes" && <NotesView notes={notes} onNew={openNewNote} onEdit={openEditNote} />}
          {section === "library" && <LibraryView techniques={initialData.techniques} proAccess={initialData.plan.proAccess} />}
          {section === "competitions" && <CompetitionsView events={initialData.competitions} todayKey={todayKey} onSelect={setSelectedCompetition} />}
        </div>
      </div>

      <div className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-2xl border border-stone-200 bg-white/95 p-1.5 shadow-[0_12px_40px_rgba(28,20,15,.18)] backdrop-blur-xl dark:border-white/10 dark:bg-[#211c18]/95 lg:hidden">
        {[{id:"overview" as Section,icon:LayoutDashboard,label:"Início"},{id:"calendar" as Section,icon:CalendarDays,label:"Treinos"},{id:"gameplan" as Section,icon:Swords,label:"Plano"},{id:"notes" as Section,icon:NotebookPen,label:"Notas"}].map(({id,icon:Icon,label})=><button key={id} onClick={() => chooseSection(id)} className={`flex min-w-14 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[9px] font-extrabold ${section===id?"bg-red-50 text-red-700 dark:bg-amber-500/10 dark:text-amber-300":"text-stone-400"}`}><Icon className="size-[18px]" />{label}</button>)}
        <button onClick={() => openTrainingEditor()} className="grid size-11 place-items-center rounded-xl bg-red-700 text-white shadow-lg dark:bg-amber-500 dark:text-stone-950" aria-label="Registrar treino"><Plus className="size-5" /></button>
      </div>

      {editorOpen && <TrainingEditor draft={draft} setDraft={setDraft} exists={entries.some(entry => entry.date === selectedDate)} onClose={() => setEditorOpen(false)} onSave={saveTraining} onDelete={deleteTraining} />}
      {noteModalOpen && <NoteModal note={editingNote} onClose={() => { setNoteModalOpen(false); setEditingNote(null); }} onSave={saveNote} onDelete={deleteNote} />}
      {scheduleOpen && <TrainingScheduleModal schedule={trainingSchedule} onClose={() => setScheduleOpen(false)} onSave={saveTrainingSchedule} />}
      {reviewOpen && <ReviewScheduleModal schedule={reviewSchedule} onClose={() => setReviewOpen(false)} onSave={saveReviewSchedule} />}
      {selectedCompetition && <CompetitionModal event={selectedCompetition} alertEnabled={competitionAlertIds.includes(selectedCompetition.id)} onToggleAlert={() => toggleCompetitionAlert(selectedCompetition.id)} onClose={() => setSelectedCompetition(null)} />}
      {settingsOpen && <SettingsPanel profile={profile} preferences={emailPreferences} onClose={() => setSettingsOpen(false)} onSaveProfile={saveProfile} onSavePreferences={savePreferences} onPasswordChange={changePassword} onSignOut={signOut} />}
      {savedMessage && <div className="fixed bottom-24 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-xl bg-stone-950 px-4 py-3 text-sm font-bold text-white shadow-2xl dark:bg-amber-500 dark:text-stone-950 lg:bottom-7"><Check className="size-4" />{savedMessage}</div>}
    </main>
  );
}

function Overview({ entries, todayKey, trainingSchedule, reviewSchedule, onRegister, onOpenCalendar, onOpenPlan, onEditSchedule, onEditReview }: { entries: TrainingEntry[]; todayKey: string; trainingSchedule: TrainingSchedule; reviewSchedule: ReviewSchedule; onRegister: (date?: string) => void; onOpenCalendar: () => void; onOpenPlan: () => void; onEditSchedule: () => void; onEditReview: () => void }) {
  const today = fromDateKey(todayKey);
  const weekCount = entries.filter((entry) => {
    const diff = today.getTime() - fromDateKey(entry.date).getTime();
    return diff >= 0 && diff <= 7 * 86400000;
  }).length;
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = fromDateKey(todayKey);
    date.setDate(date.getDate() - date.getDay() + index);
    return date;
  });
  const streak = calculateTrainingStreak(entries, trainingSchedule, todayKey);
  const scheduleSummary = trainingSchedule.days.map((day) => weekdayShort[day]).join(", ").toLowerCase();
  const reviewTime = reviewSchedule.time.replace(":", "h");

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-black uppercase tracking-[.14em] text-red-700 dark:text-amber-400">{new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(today)}</p><h2 className="mt-2 text-3xl font-black tracking-[-.045em] sm:text-4xl">Oss, Pedro! <span aria-hidden="true">🥋</span></h2><p className="mt-2 text-sm text-stone-500 dark:text-stone-400">O que você vai levar do último treino para o próximo?</p></div>
        <button onClick={() => onRegister()} className="flex items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-extrabold text-white sm:hidden dark:bg-amber-500 dark:text-stone-950"><Plus className="size-4" /> Registrar treino</button>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <MetricCard icon={Dumbbell} value={String(entries.length)} label="treinos registrados" detail={`${weekCount} nesta semana`} tone="red" />
        <MetricCard icon={Flame} value={String(streak)} label={streak === 1 ? "treino em sequência" : "treinos em sequência"} detail={trainingSchedule.days.length ? `Rotina: ${scheduleSummary} · editar` : "Escolha seus dias de treino"} tone="amber" onClick={onEditSchedule} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.8fr]">
        <section className="rounded-[24px] border border-stone-200 bg-white p-5 sm:p-6 dark:border-white/8 dark:bg-white/[.035]">
          <div className="flex items-center justify-between"><div><h3 className="text-lg font-black tracking-tight">Sua semana no tatame</h3><p className="mt-1 text-xs text-stone-400">Clique em um dia para fazer uma anotação</p></div><button onClick={onOpenCalendar} className="text-xs font-extrabold text-red-700 hover:underline dark:text-amber-400">Ver calendário</button></div>
          <div className="mt-6 grid grid-cols-7 gap-1.5 sm:gap-3">
            {weekDays.map((date) => {
              const key = toDateKey(date); const trained = entries.some(entry => entry.date === key); const isToday = key === todayKey;
              return <button key={key} onClick={() => onRegister(key)} className={`group flex min-w-0 flex-col items-center gap-2 rounded-xl border py-3 transition sm:py-4 ${isToday?"border-red-300 bg-red-50 dark:border-amber-500/30 dark:bg-amber-500/8":"border-stone-100 hover:border-red-200 hover:bg-stone-50 dark:border-white/7 dark:hover:border-amber-500/20 dark:hover:bg-white/5"}`}><span className="text-[9px] font-black uppercase text-stone-400 sm:text-[10px]">{new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date).replace(".", "")}</span><span className={`grid size-8 place-items-center rounded-lg text-sm font-black ${isToday?"bg-red-700 text-white dark:bg-amber-500 dark:text-stone-950":""}`}>{date.getDate()}</span><span className={`size-1.5 rounded-full ${trained?"bg-emerald-500":"bg-stone-200 dark:bg-stone-700"}`} /></button>;
            })}
          </div>
          <div className="mt-6 border-t border-stone-100 pt-5 dark:border-white/8">
            <div className="flex items-center justify-between"><h4 className="text-sm font-extrabold">Registros recentes</h4><span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Últimos treinos</span></div>
            <div className="mt-3 divide-y divide-stone-100 dark:divide-white/7">
              {entries.slice(0, 3).map(entry => <button key={entry.date} onClick={() => onRegister(entry.date)} className="group flex w-full items-center gap-3 py-3 text-left"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-50 text-sm font-black text-red-700 dark:bg-amber-500/10 dark:text-amber-300">{fromDateKey(entry.date).getDate()}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{entry.title}</p><p className="mt-0.5 truncate text-xs text-stone-400">Foco: {entry.nextFocus}</p></div><span className="hidden rounded-md bg-stone-100 px-2 py-1 text-[9px] font-bold text-stone-500 sm:block dark:bg-white/5 dark:text-stone-400">{entry.intensity}</span><ChevronRight className="size-4 text-stone-300 transition-transform group-hover:translate-x-1" /></button>)}
            </div>
          </div>
        </section>

        <div className="space-y-5">
          <section className="relative overflow-hidden rounded-[24px] bg-stone-950 p-6 text-white dark:bg-[#2a2118]">
            <div className="absolute right-0 top-0 size-48 translate-x-1/3 -translate-y-1/3 rounded-full bg-red-600/25 blur-3xl dark:bg-amber-500/15" />
            <div className="relative"><div className="flex items-center gap-2 text-red-400 dark:text-amber-400"><Zap className="size-4" /><span className="text-[10px] font-black uppercase tracking-[.15em]">Próximo foco</span></div><h3 className="mt-4 text-2xl font-black tracking-[-.035em]">Pegada alta → Uchi-mata</h3><p className="mt-3 text-sm leading-6 text-stone-400">Controle a manga, quebre a postura e mantenha o kuzushi durante toda a entrada.</p><div className="mt-6 flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-bold text-stone-400"><Clock3 className="size-4" /> {nextTrainingLabel(trainingSchedule, todayKey)}</span><button onClick={onOpenPlan} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-extrabold hover:bg-white/15">Abrir plano</button></div></div>
          </section>
          <button onClick={onEditReview} className="group w-full rounded-[24px] border border-stone-200 bg-white p-5 text-left transition hover:border-red-200 hover:shadow-sm dark:border-white/8 dark:bg-white/[.035] dark:hover:border-amber-500/20">
            <div className="flex items-center justify-between"><h3 className="text-sm font-black">Revisão semanal</h3><span className="rounded-md bg-amber-100 px-2 py-1 text-[9px] font-black text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">PRÓ</span></div>
            <div className="mt-4 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-stone-100 dark:bg-white/5"><Sparkles className="size-5 text-red-700 dark:text-amber-400" /></span><div className="min-w-0 flex-1"><p className="text-sm font-extrabold">{weekdayNames[reviewSchedule.day]}, às {reviewTime}</p><p className="mt-0.5 text-xs text-stone-400">Resumo e focos por e-mail · editar</p></div><ChevronRight className="size-4 text-stone-300 transition group-hover:translate-x-1" /></div>
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, value, label, detail, tone, onClick }: { icon: typeof Dumbbell; value: string; label: string; detail: string; tone: "red" | "amber" | "stone"; onClick?: () => void }) {
  const tones = { red: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300", amber: "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300", stone: "bg-stone-100 text-stone-700 dark:bg-white/8 dark:text-stone-200" };
  const content = <><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}><Icon className="size-5" /></span><div className="min-w-0 flex-1"><p><span className="text-2xl font-black tracking-tight">{value}</span> <span className="text-xs font-bold text-stone-500 dark:text-stone-400">{label}</span></p><p className="mt-1 truncate text-[10px] font-semibold text-stone-400">{detail}</p></div>{onClick && <ChevronRight className="size-4 shrink-0 text-stone-300" />}</>;
  const classes = "flex w-full items-center gap-4 rounded-[20px] border border-stone-200 bg-white p-4 text-left transition sm:p-5 dark:border-white/8 dark:bg-white/[.035]";
  return onClick ? <button onClick={onClick} className={`${classes} hover:border-red-200 hover:shadow-sm dark:hover:border-amber-500/20`}>{content}</button> : <div className={classes}>{content}</div>;
}

function CalendarView({ cells, month, entries, todayKey, onMonthChange, onSelect }: { cells: ReturnType<typeof calendarCells>; month: Date; entries: TrainingEntry[]; todayKey: string; onMonthChange: (date: Date) => void; onSelect: (key: string) => void }) {
  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(month);
  function shiftMonth(amount: number) { onMonthChange(new Date(month.getFullYear(), month.getMonth() + amount, 1)); }
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[.14em] text-red-700 dark:text-amber-400">Diário de treino</p><h2 className="mt-2 text-3xl font-black tracking-[-.045em] sm:text-4xl">Cada dia conta.</h2><p className="mt-2 text-sm text-stone-500 dark:text-stone-400">Selecione uma data para registrar ou rever seu treino.</p></div><button onClick={() => onSelect(todayKey)} className="flex items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-extrabold text-white dark:bg-amber-500 dark:text-stone-950"><Plus className="size-4" /> Registrar hoje</button></div>
      <section className="mt-7 overflow-hidden rounded-[24px] border border-stone-200 bg-white dark:border-white/8 dark:bg-white/[.035]">
        <div className="flex items-center justify-between border-b border-stone-100 p-4 sm:p-6 dark:border-white/8"><button onClick={() => shiftMonth(-1)} className="grid size-10 place-items-center rounded-xl border border-stone-200 hover:bg-stone-50 dark:border-white/10 dark:hover:bg-white/5" aria-label="Mês anterior"><ChevronLeft className="size-5" /></button><div className="text-center"><h3 className="text-lg font-black capitalize sm:text-xl">{monthLabel}</h3><button onClick={() => onMonthChange(new Date())} className="mt-1 text-[10px] font-black uppercase tracking-wider text-red-700 dark:text-amber-400">Voltar para hoje</button></div><button onClick={() => shiftMonth(1)} className="grid size-10 place-items-center rounded-xl border border-stone-200 hover:bg-stone-50 dark:border-white/10 dark:hover:bg-white/5" aria-label="Próximo mês"><ChevronRight className="size-5" /></button></div>
        <div className="grid grid-cols-7 border-b border-stone-100 dark:border-white/8">{["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(day=><div key={day} className="py-3 text-center text-[9px] font-black uppercase tracking-wider text-stone-400 sm:text-[11px]">{day}</div>)}</div>
        <div className="grid grid-cols-7">
          {cells.map(({date,current}) => { const key=toDateKey(date); const entry=entries.find(item=>item.date===key); const today=key===todayKey; return <button key={key} onClick={()=>onSelect(key)} className={`group relative min-h-[72px] border-b border-r border-stone-100 p-1.5 text-left transition hover:bg-red-50/60 sm:min-h-[112px] sm:p-3 dark:border-white/7 dark:hover:bg-amber-500/[.05] ${!current?"bg-stone-50/60 text-stone-300 dark:bg-white/[.015] dark:text-stone-600":""}`}><span className={`grid size-7 place-items-center rounded-lg text-xs font-bold sm:size-8 sm:text-sm ${today?"bg-red-700 text-white dark:bg-amber-500 dark:text-stone-950":""}`}>{date.getDate()}</span>{entry&&<div className="mt-1 sm:mt-2"><span className="mx-auto block size-1.5 rounded-full bg-red-600 sm:hidden dark:bg-amber-400" /><div className="hidden rounded-lg border border-red-100 bg-red-50 px-2 py-1.5 sm:block dark:border-amber-500/15 dark:bg-amber-500/[.06]"><p className="truncate text-[10px] font-black text-red-800 dark:text-amber-300">{entry.title}</p><p className="mt-0.5 truncate text-[9px] text-stone-400">{entry.intensity}</p></div></div>}<Plus className="absolute bottom-2 right-2 hidden size-3.5 text-red-600 opacity-0 transition group-hover:opacity-100 sm:block dark:text-amber-400" /></button>; })}
        </div>
      </section>
      <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-stone-400"><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-red-600 dark:bg-amber-400" /> Treino registrado</span><span className="flex items-center gap-2"><i className="size-2 rounded-full border border-stone-300" /> Sem registro</span></div>
    </div>
  );
}

function GamePlanView({ gamePlan, setGamePlan, trainingSchedule, onEditSchedule, onSave }: { gamePlan: GamePlanDraft; setGamePlan: React.Dispatch<React.SetStateAction<GamePlanDraft>>; trainingSchedule: TrainingSchedule; onEditSchedule: () => void; onSave: (event: FormEvent) => void }) {
  const fields = [
    { key: "objective" as const, label: "Objetivo principal", hint: "O que você quer impor na luta?", icon: Target },
    { key: "grip" as const, label: "Pegada inicial", hint: "Como pretende construir seu kumi-kata?", icon: Swords },
    { key: "firstAttack" as const, label: "Ataque principal", hint: "Sua primeira opção de projeção", icon: Zap },
    { key: "combination" as const, label: "Combinação e reação", hint: "O que fazer quando o adversário defender?", icon: Dumbbell },
    { key: "groundwork" as const, label: "Continuação no solo", hint: "Como conectar a projeção ao ne-waza?", icon: CircleUserRound },
  ];
  const scheduleLabel = trainingSchedule.days.length ? trainingSchedule.days.map((day) => weekdayShort[day]).join(", ") : "Nenhum dia escolhido";
  return <div><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[.14em] text-red-700 dark:text-amber-400">Estratégia pessoal</p><h2 className="mt-2 text-3xl font-black tracking-[-.045em] sm:text-4xl">Seu judô, com intenção.</h2><p className="mt-2 text-sm text-stone-500 dark:text-stone-400">Monte uma sequência simples para consultar antes do treino ou competição.</p></div><span className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><span className="size-1.5 rounded-full bg-emerald-500" /> Plano ativo</span></div>
    <div className="mt-7 grid gap-5 xl:grid-cols-[1.35fr_.65fr]"><form onSubmit={onSave} className="rounded-[24px] border border-stone-200 bg-white p-5 sm:p-7 dark:border-white/8 dark:bg-white/[.035]"><div className="space-y-6">{fields.map(({key,label,hint,icon:Icon},index)=><label key={key} className="grid gap-3 sm:grid-cols-[54px_1fr]"><span className="grid size-12 place-items-center rounded-xl bg-stone-100 text-stone-600 dark:bg-white/6 dark:text-stone-300"><Icon className="size-5" /></span><span><span className="flex items-center gap-2 text-sm font-black"><i className="grid size-5 place-items-center rounded-full bg-red-700 text-[9px] not-italic text-white dark:bg-amber-500 dark:text-stone-950">{index+1}</i>{label}</span><span className="mt-1 block text-[11px] text-stone-400">{hint}</span><textarea value={gamePlan[key]} onChange={e=>setGamePlan({...gamePlan,[key]:e.target.value})} rows={index===0?2:3} className="mt-2 w-full resize-none rounded-xl border border-stone-200 bg-stone-50 p-3.5 text-sm leading-6 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:border-white/8 dark:bg-black/10 dark:focus:border-amber-500 dark:focus:ring-amber-500/10" /></span></label>)}</div><div className="mt-7 flex justify-end border-t border-stone-100 pt-5 dark:border-white/8"><button className="flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-extrabold text-white dark:bg-amber-500 dark:text-stone-950"><Save className="size-4" /> Salvar plano de jogo</button></div></form>
      <aside className="space-y-5"><div className="relative overflow-hidden rounded-[24px] bg-stone-950 p-6 text-white dark:bg-[#2a2118]"><div className="absolute -right-8 -top-8 size-36 rounded-full bg-red-600/25 blur-2xl dark:bg-amber-500/15" /><p className="relative text-[10px] font-black uppercase tracking-[.15em] text-red-400 dark:text-amber-400">Rotina pré-treino</p><h3 className="relative mt-3 text-xl font-black">Leve o plano ao tatame.</h3><p className="relative mt-3 text-sm leading-6 text-stone-400">Escolha quando você treina. Esses dias definem o lembrete e sua sequência.</p><button type="button" onClick={onEditSchedule} className="relative mt-5 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-red-400/50 hover:bg-white/10 dark:hover:border-amber-400/40"><div><p className="text-xs font-bold">{scheduleLabel}</p><p className="mt-1 text-[10px] text-stone-500">Às {trainingSchedule.time.replace(":", "h")} · editar dias</p></div><ChevronRight className="size-4 text-stone-400" /></button></div><div className="rounded-[24px] border border-stone-200 bg-white p-5 dark:border-white/8 dark:bg-white/[.035]"><p className="text-sm font-black">Checklist rápido</p><div className="mt-4 space-y-3">{["Impor minha pegada","Atacar em movimento","Continuar no ne-waza"].map(item=><label key={item} className="flex items-center gap-3 text-xs font-semibold text-stone-600 dark:text-stone-300"><input type="checkbox" className="size-4 accent-red-700 dark:accent-amber-500" />{item}</label>)}</div></div></aside>
    </div></div>;
}

function NotesView({ notes, onNew, onEdit }: { notes: FreeNote[]; onNew: () => void; onEdit: (note: FreeNote) => void }) {
  const [query, setQuery] = useState("");
  const filteredNotes = notes.filter((note) => `${note.title} ${note.content} ${note.category}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")));

  return <div><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[.14em] text-red-700 dark:text-amber-400">Freenotes</p><h2 className="mt-2 text-3xl font-black tracking-[-.045em] sm:text-4xl">Tudo que merece ser lembrado.</h2><p className="mt-2 text-sm text-stone-500 dark:text-stone-400">Clique em qualquer nota para editar seu conteúdo ou categoria.</p></div><button onClick={onNew} className="flex items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-extrabold text-white dark:bg-amber-500 dark:text-stone-950"><Plus className="size-4" /> Nova nota</button></div><div className="mt-7 flex items-center gap-3"><div className="relative max-w-sm flex-1"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nas notas..." className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-red-400 dark:border-white/8 dark:bg-white/[.035] dark:focus:border-amber-500" /></div></div><div className="mt-5 grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredNotes.map((note,index)=><button type="button" key={note.id} onClick={() => onEdit(note)} className={`group rounded-[20px] border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${index===0?"border-red-200 bg-red-50/60 dark:border-amber-500/20 dark:bg-amber-500/[.05]":"border-stone-200 bg-white dark:border-white/8 dark:bg-white/[.035]"}`}><div className="flex items-center justify-between"><span className="rounded-md bg-white px-2 py-1 text-[9px] font-black uppercase tracking-wider text-red-700 shadow-sm dark:bg-white/8 dark:text-amber-300">{note.category}</span><span className="flex items-center gap-1 text-[9px] font-bold text-stone-400 opacity-0 transition group-hover:opacity-100"><NotebookPen className="size-3.5" /> Editar</span></div><h3 className="mt-5 text-lg font-black tracking-tight">{note.title}</h3><p className="mt-3 whitespace-pre-line text-sm leading-6 text-stone-600 dark:text-stone-400">{note.content}</p><div className="mt-6 flex items-center justify-between border-t border-stone-200/70 pt-3 text-[10px] text-stone-400 dark:border-white/8"><span>Editado {note.updatedAt.toLowerCase()}</span><ChevronRight className="size-3.5 transition group-hover:translate-x-1" /></div></button>)}</div>{filteredNotes.length===0&&<div className="mt-5 rounded-[20px] border border-dashed border-stone-300 py-14 text-center dark:border-white/10"><Search className="mx-auto size-6 text-stone-300" /><p className="mt-3 text-sm font-bold text-stone-500">Nenhuma nota encontrada</p></div>}</div>;
}

function LibraryView({ techniques, proAccess }: { techniques: TechniqueItem[]; proAccess: boolean }) {
  return <div><div><div className="flex items-center gap-2"><p className="text-xs font-black uppercase tracking-[.14em] text-red-700 dark:text-amber-400">Modelos técnicos</p><span className="rounded-md bg-amber-100 px-2 py-1 text-[8px] font-black text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">PRÓ</span></div><h2 className="mt-2 text-3xl font-black tracking-[-.045em] sm:text-4xl">Biblioteca de golpes.</h2><p className="mt-2 text-sm text-stone-500 dark:text-stone-400">Comece com uma estrutura pronta e acrescente os detalhes ensinados no seu dojo.</p></div><div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{techniques.map((technique,index)=>{const locked=technique.isPro&&!proAccess; return <article key={technique.id} className={`relative overflow-hidden rounded-[20px] border border-stone-200 bg-white p-5 dark:border-white/8 dark:bg-white/[.035] ${locked?"opacity-70":""}`}><div className="flex items-start justify-between"><span className={`rounded-lg px-2.5 py-1.5 text-[10px] font-black ${techniqueColors[index%techniqueColors.length]}`}>{technique.group}</span>{locked&&<LockKeyhole className="size-4 text-stone-300" />}</div><div className="mt-10 flex items-end justify-between"><div><p className="text-xl font-black">{technique.name}</p><p className="mt-1 text-xs text-stone-400">{locked?"Disponível no Pró":technique.description}</p></div><span className="grid size-10 place-items-center rounded-xl bg-stone-100 text-stone-500 dark:bg-white/6 dark:text-stone-300"><ChevronRight className="size-4" /></span></div></article>})}</div>{!proAccess&&<Paywall title="Seu caderno técnico, já organizado." text="Desbloqueie modelos de golpes, adicione vídeos e construa uma biblioteca com os detalhes do seu próprio judô." />}</div>;
}

function CompetitionsView({ events, todayKey, onSelect }: { events: CompetitionEvent[]; todayKey: string; onSelect: (event: CompetitionEvent) => void }) {
  const nextEvent = events[0];
  if (!nextEvent) return <div className="rounded-[24px] border border-dashed border-stone-300 py-16 text-center dark:border-white/10"><Trophy className="mx-auto size-7 text-stone-300" /><h2 className="mt-4 text-xl font-black">Nenhuma competição futura cadastrada</h2><p className="mt-2 text-sm text-stone-400">A próxima sincronização do calendário oficial atualizará esta área.</p></div>;
  const daysUntil = Math.max(0, Math.ceil((fromDateKey(nextEvent.dateStart).getTime() - fromDateKey(todayKey).getTime()) / 86400000));

  return <div><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="flex items-center gap-2"><p className="text-xs font-black uppercase tracking-[.14em] text-red-700 dark:text-amber-400">Calendário FPJUDO</p><span className="rounded-md bg-amber-100 px-2 py-1 text-[8px] font-black text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">PRÓ</span></div><h2 className="mt-2 text-3xl font-black tracking-[-.045em] sm:text-4xl">Competições no radar.</h2><p className="mt-2 text-sm text-stone-500 dark:text-stone-400">Datas conferidas no calendário oficial mais recente da Federação.</p></div><div className="flex flex-wrap gap-2"><a href="/api/calendar/competitions.ics" className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-extrabold transition hover:border-red-200 dark:border-white/10 dark:bg-white/5 dark:hover:border-amber-500/20"><CalendarDays className="size-4" /> Exportar calendário</a><a href={nextEvent.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-extrabold transition hover:border-red-200 dark:border-white/10 dark:bg-white/5 dark:hover:border-amber-500/20"><ExternalLink className="size-4" /> Fonte oficial</a></div></div><div className="mt-7 grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><section className="overflow-hidden rounded-[24px] border border-stone-200 bg-white dark:border-white/8 dark:bg-white/[.035]"><div className="flex items-center justify-between border-b border-stone-100 p-5 dark:border-white/8"><h3 className="font-black">Próximos eventos</h3><span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Fonte oficial FPJUDO</span></div><div className="divide-y divide-stone-100 p-2 dark:divide-white/7">{events.map((event,index)=><button type="button" key={event.id} onClick={() => onSelect(event)} className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-stone-50 sm:gap-4 sm:p-4 dark:hover:bg-white/5"><span className={`grid h-14 w-16 shrink-0 place-items-center rounded-xl text-center ${index===0?"bg-red-700 text-white dark:bg-amber-500 dark:text-stone-950":"bg-stone-100 dark:bg-white/6"}`}><span><b className="block text-base leading-4">{event.day}</b><small className="text-[9px] font-black">{event.month}</small></span></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{event.name}</p><p className="mt-1 truncate text-xs text-stone-400">{event.place}</p></div><span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-black text-emerald-700 sm:block dark:bg-emerald-500/10 dark:text-emerald-300">{event.status}</span><ChevronRight className="size-4 shrink-0 text-stone-300 transition group-hover:translate-x-1" /></button>)}</div></section><button type="button" onClick={() => onSelect(nextEvent)} className="group relative min-h-80 overflow-hidden rounded-[24px] bg-stone-950 p-6 text-left text-white dark:bg-[#2a2118]"><div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,.30),transparent_48%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(217,163,55,.24),transparent_48%)]" /><div className="relative flex h-full flex-col"><Trophy className="size-8 text-red-400 dark:text-amber-400" /><p className="mt-auto text-[10px] font-black uppercase tracking-[.15em] text-red-400 dark:text-amber-400">Próximo no calendário</p><h3 className="mt-3 text-3xl font-black tracking-[-.04em]">{nextEvent.name}</h3><p className="mt-2 text-sm text-stone-400">{daysUntil === 0 ? "Acontece hoje" : `Faltam ${daysUntil} dias`}</p><div className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"><span className="text-xs font-bold">Ver informações oficiais</span><ChevronRight className="size-4 transition group-hover:translate-x-1" /></div></div></button></div><Paywall title="Nunca mais perca uma data importante." text="Ative o calendário FPJUDO, receba alertas e conecte seu plano de jogo à próxima competição." /></div>;
}

function Paywall({title,text}:{title:string;text:string}) { return <section className="mt-5 flex flex-col items-start justify-between gap-5 rounded-[22px] border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:p-6 dark:border-amber-500/15 dark:bg-amber-500/[.05]"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-400 text-stone-950"><Crown className="size-5" /></span><div><h3 className="font-black">{title}</h3><p className="mt-1 max-w-2xl text-sm leading-6 text-stone-600 dark:text-stone-400">{text}</p></div></div><Link href="/#planos" className="w-full shrink-0 rounded-xl bg-stone-950 px-5 py-3 text-center text-sm font-extrabold text-white sm:w-auto dark:bg-amber-500 dark:text-stone-950">Ver planos</Link></section> }

function TrainingEditor({ draft, setDraft, exists, onClose, onSave, onDelete }: { draft: TrainingEntry; setDraft: (draft: TrainingEntry) => void; exists: boolean; onClose: () => void; onSave: (event: FormEvent) => void; onDelete: () => void }) {
  const date = fromDateKey(draft.date);
  return <div className="fixed inset-0 z-[60] flex justify-end bg-black/35 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="training-title"><button className="absolute inset-0" onClick={onClose} aria-label="Fechar registro" /><div className="app-scrollbar relative h-full w-full max-w-[560px] overflow-y-auto bg-[#fbfaf7] p-5 shadow-2xl sm:p-7 dark:bg-[#171310]"><div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-[.14em] text-red-700 dark:text-amber-400">Diário de treino</p><h2 id="training-title" className="mt-2 text-2xl font-black tracking-tight">{exists?"Rever treino":"Novo registro"}</h2><p className="mt-1 text-sm capitalize text-stone-400">{new Intl.DateTimeFormat("pt-BR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}).format(date)}</p></div><button onClick={onClose} className="grid size-10 place-items-center rounded-xl border border-stone-200 bg-white dark:border-white/8 dark:bg-white/5" aria-label="Fechar"><X className="size-5" /></button></div><form onSubmit={onSave} className="mt-7 space-y-5"><label className="block"><span className="mb-2 block text-sm font-black">Tipo de treino</span><input required value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} className="h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm outline-none focus:border-red-400 dark:border-white/8 dark:bg-white/5 dark:focus:border-amber-500" /></label><div><span className="mb-2 block text-sm font-black">Intensidade</span><div className="grid grid-cols-3 gap-2">{(["Leve","Moderado","Forte"] as const).map(level=><button key={level} type="button" onClick={()=>setDraft({...draft,intensity:level})} className={`rounded-xl border px-3 py-3 text-xs font-extrabold ${draft.intensity===level?"border-red-600 bg-red-50 text-red-700 dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-300":"border-stone-200 bg-white text-stone-500 dark:border-white/8 dark:bg-white/5"}`}>{level}</button>)}</div></div><TrainingField label="O que aprendi?" hint="Técnicas, conceitos ou detalhes novos" value={draft.learned} onChange={value=>setDraft({...draft,learned:value})} /><TrainingField label="Onde errei?" hint="Seja específico, mas não se julgue" value={draft.mistakes} onChange={value=>setDraft({...draft,mistakes:value})} /><TrainingField label="Foco para o próximo treino" hint="Escolha uma ação clara e simples" value={draft.nextFocus} onChange={value=>setDraft({...draft,nextFocus:value})} /><div><div className="flex items-center justify-between"><span className="text-sm font-black">Mídias</span><span className="rounded-md bg-amber-100 px-2 py-1 text-[8px] font-black text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">PRÓ</span></div><button type="button" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50 py-5 text-xs font-bold text-stone-400 dark:border-white/10 dark:bg-white/[.025]"><ImagePlus className="size-5" /> Adicionar vídeo ou imagem</button></div><div className="flex items-center justify-between gap-3 border-t border-stone-200 pt-5 dark:border-white/8">{exists?<button type="button" onClick={onDelete} className="grid size-11 place-items-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10" aria-label="Excluir registro"><Trash2 className="size-4" /></button>:<span />}<div className="flex gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-bold dark:border-white/10">Cancelar</button><button className="flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-extrabold text-white dark:bg-amber-500 dark:text-stone-950"><Save className="size-4" /> Salvar treino</button></div></div></form></div></div>;
}

function TrainingField({label,hint,value,onChange}:{label:string;hint:string;value:string;onChange:(value:string)=>void}) { return <label className="block"><span className="text-sm font-black">{label}</span><span className="mt-1 block text-[11px] text-stone-400">{hint}</span><textarea required value={value} onChange={e=>onChange(e.target.value)} rows={4} className="mt-2 w-full resize-none rounded-xl border border-stone-200 bg-white p-4 text-sm leading-6 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:border-white/8 dark:bg-white/5 dark:focus:border-amber-500 dark:focus:ring-amber-500/10" /></label> }

function NoteModal({ note, onClose, onSave, onDelete }: { note: FreeNote | null; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void; onDelete: () => void }) {
  const editing = Boolean(note);
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="note-modal-title"><button className="absolute inset-0" onClick={onClose} aria-label="Fechar" /><form onSubmit={onSave} className="relative w-full max-w-lg rounded-[24px] bg-[#fbfaf7] p-5 shadow-2xl sm:p-7 dark:bg-[#211c18]"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.14em] text-red-700 dark:text-amber-400">Freenote</p><h2 id="note-modal-title" className="mt-1 text-2xl font-black">{editing ? "Editar nota" : "Nova nota"}</h2></div><button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-xl border border-stone-200 dark:border-white/10" aria-label="Fechar"><X className="size-5" /></button></div><div className="mt-6 space-y-4"><label className="block"><span className="mb-2 block text-sm font-black">Título</span><input name="title" required autoFocus defaultValue={note?.title} placeholder="Ex.: Ajustes na pegada" className="h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm outline-none focus:border-red-400 dark:border-white/8 dark:bg-white/5 dark:focus:border-amber-500" /></label><label className="block"><span className="mb-2 block text-sm font-black">Categoria</span><select name="category" defaultValue={note?.category ?? "Técnica"} className="h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm outline-none focus:border-red-400 dark:border-white/8 dark:bg-[#2a2521] dark:focus:border-amber-500"><option>Técnica</option><option>Meta</option><option>Insight</option><option>Competição</option><option>Outro</option></select></label><label className="block"><span className="mb-2 block text-sm font-black">Anotação</span><textarea name="content" required rows={7} defaultValue={note?.content} placeholder="Escreva livremente..." className="w-full resize-none rounded-xl border border-stone-200 bg-white p-4 text-sm leading-6 outline-none focus:border-red-400 dark:border-white/8 dark:bg-white/5 dark:focus:border-amber-500" /></label></div><div className="mt-5 flex items-center justify-between gap-3">{editing ? <button type="button" onClick={onDelete} className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10"><Trash2 className="size-4" /> Excluir</button> : <span />}<div className="flex gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-bold dark:border-white/10">Cancelar</button><button className="flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-extrabold text-white dark:bg-amber-500 dark:text-stone-950"><Save className="size-4" /> {editing ? "Salvar alterações" : "Criar nota"}</button></div></div></form></div>;
}

function TrainingScheduleModal({ schedule, onClose, onSave }: { schedule: TrainingSchedule; onClose: () => void; onSave: (schedule: TrainingSchedule) => void }) {
  const [days, setDays] = useState(schedule.days);
  const [time, setTime] = useState(schedule.time);
  function toggleDay(day: number) { setDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort()); }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); onSave({ days, time: String(form.get("training-time")) }); }

  return <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="schedule-title"><button className="absolute inset-0" onClick={onClose} aria-label="Fechar" /><form onSubmit={submit} className="relative w-full max-w-xl rounded-[24px] bg-[#fbfaf7] p-5 shadow-2xl sm:p-7 dark:bg-[#211c18]"><div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-[.14em] text-red-700 dark:text-amber-400">Minha rotina</p><h2 id="schedule-title" className="mt-1 text-2xl font-black">Dias de treino</h2><p className="mt-2 max-w-md text-sm leading-6 text-stone-500 dark:text-stone-400">A sequência aumenta quando você registra os treinos agendados. Se um dia programado passar sem registro, ela volta a zero.</p></div><button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-xl border border-stone-200 dark:border-white/10" aria-label="Fechar"><X className="size-5" /></button></div><div className="mt-7"><p className="text-sm font-black">Em quais dias você treina?</p><div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">{weekdayShort.map((name, day)=><button key={name} type="button" onClick={() => toggleDay(day)} className={`rounded-xl border px-2 py-3 text-xs font-extrabold transition ${days.includes(day)?"border-red-700 bg-red-700 text-white dark:border-amber-500 dark:bg-amber-500 dark:text-stone-950":"border-stone-200 bg-white text-stone-500 dark:border-white/8 dark:bg-white/5 dark:text-stone-300"}`}>{name}</button>)}</div></div><label className="mt-6 block"><span className="mb-2 block text-sm font-black">Horário do treino</span><input name="training-time" type="time" required value={time} onChange={(event) => setTime(event.target.value)} className="h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm outline-none focus:border-red-400 dark:border-white/8 dark:bg-white/5 dark:focus:border-amber-500" /></label><div className="mt-6 rounded-xl bg-stone-100 p-4 text-xs leading-5 text-stone-600 dark:bg-white/5 dark:text-stone-400"><b className="text-stone-900 dark:text-stone-100">Como a sequência funciona:</b> apenas os dias escolhidos entram na conta. Treinos extras ficam salvos normalmente, mas não alteram a sequência programada.</div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-bold dark:border-white/10">Cancelar</button><button className="flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-extrabold text-white dark:bg-amber-500 dark:text-stone-950"><Save className="size-4" /> Salvar rotina</button></div></form></div>;
}

function ReviewScheduleModal({ schedule, onClose, onSave }: { schedule: ReviewSchedule; onClose: () => void; onSave: (schedule: ReviewSchedule) => void }) {
  const [day, setDay] = useState(schedule.day);
  const [time, setTime] = useState(schedule.time);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); onSave({ day: Number(form.get("review-day")), time: String(form.get("review-time")) }); }

  return <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="review-title"><button className="absolute inset-0" onClick={onClose} aria-label="Fechar" /><form onSubmit={submit} className="relative w-full max-w-md rounded-[24px] bg-[#fbfaf7] p-5 shadow-2xl sm:p-7 dark:bg-[#211c18]"><div className="flex items-center justify-between"><div><div className="flex items-center gap-2"><p className="text-xs font-black uppercase tracking-[.14em] text-red-700 dark:text-amber-400">Revisão semanal</p><span className="rounded-md bg-amber-100 px-2 py-1 text-[8px] font-black text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">PRÓ</span></div><h2 id="review-title" className="mt-2 text-2xl font-black">Quando quer receber?</h2></div><button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-xl border border-stone-200 dark:border-white/10" aria-label="Fechar"><X className="size-5" /></button></div><div className="mt-7 grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-black">Dia da semana</span><select name="review-day" value={day} onChange={(event) => setDay(Number(event.target.value))} className="h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm outline-none focus:border-red-400 dark:border-white/8 dark:bg-[#2a2521] dark:focus:border-amber-500">{weekdayNames.map((name,index)=><option value={index} key={name}>{name}</option>)}</select></label><label><span className="mb-2 block text-sm font-black">Horário</span><input name="review-time" type="time" required value={time} onChange={(event) => setTime(event.target.value)} className="h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm outline-none focus:border-red-400 dark:border-white/8 dark:bg-white/5 dark:focus:border-amber-500" /></label></div><div className="mt-6 flex items-center gap-3 rounded-xl bg-amber-50 p-4 dark:bg-amber-500/[.06]"><MailCheck className="size-5 shrink-0 text-amber-700 dark:text-amber-300" /><p className="text-xs leading-5 text-stone-600 dark:text-stone-400">O resumo será enviado por e-mail no dia e horário escolhidos quando o sistema de e-mails for conectado.</p></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-bold dark:border-white/10">Cancelar</button><button className="rounded-xl bg-red-700 px-5 py-3 text-sm font-extrabold text-white dark:bg-amber-500 dark:text-stone-950">Salvar horário</button></div></form></div>;
}

function CompetitionModal({ event, alertEnabled, onToggleAlert, onClose }: { event: CompetitionEvent; alertEnabled: boolean; onToggleAlert: () => void; onClose: () => void }) {
  const checkedLabel = event.sourceCheckedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(event.sourceCheckedAt)) : "data não informada";
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-black/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="competition-title"><button className="absolute inset-0" onClick={onClose} aria-label="Fechar" /><div className="relative w-full max-w-xl overflow-hidden rounded-[26px] bg-[#fbfaf7] shadow-2xl dark:bg-[#211c18]"><div className="relative bg-stone-950 p-6 text-white sm:p-7 dark:bg-[#2a2118]"><div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,.30),transparent_48%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(217,163,55,.22),transparent_48%)]" /><div className="relative"><div className="flex items-start justify-between gap-4"><span className="rounded-lg bg-red-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider dark:bg-amber-500 dark:text-stone-950">FPJUDO</span><button onClick={onClose} className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5" aria-label="Fechar"><X className="size-5" /></button></div><p className="mt-8 text-xs font-black uppercase tracking-[.14em] text-red-400 dark:text-amber-400">{event.dateLabel}</p><h2 id="competition-title" className="mt-2 text-3xl font-black tracking-[-.04em]">{event.name}</h2></div></div><div className="p-6 sm:p-7"><div className="space-y-4"><div className="flex items-start gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-red-700 dark:text-amber-400" /><div><p className="text-xs font-black uppercase tracking-wider text-stone-400">Local</p><p className="mt-1 text-sm font-bold">{event.place}</p></div></div><div className="flex items-start gap-3"><Trophy className="mt-0.5 size-5 shrink-0 text-red-700 dark:text-amber-400" /><div><p className="text-xs font-black uppercase tracking-wider text-stone-400">Categorias</p><p className="mt-1 text-sm font-bold">{event.categories}</p></div></div></div><p className="mt-6 rounded-xl bg-stone-100 p-4 text-sm leading-6 text-stone-600 dark:bg-white/5 dark:text-stone-400">{event.description}</p><div className="mt-6 border-t border-stone-200 pt-5 dark:border-white/8"><p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Fonte conferida em {checkedLabel}</p><p className="mt-1 text-xs text-stone-400">{event.sourceLabel}. A própria Federação informa que o calendário pode sofrer alterações.</p><div className="mt-4 grid gap-2 sm:grid-cols-2"><button type="button" onClick={onToggleAlert} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold ${alertEnabled?"border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300":"border border-stone-200 bg-white dark:border-white/10 dark:bg-white/5"}`}><Bell className="size-4" /> {alertEnabled?"Alertas ativados":"Ativar alertas"}</button><a href={event.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-3 text-sm font-extrabold text-white dark:bg-amber-500 dark:text-stone-950"><ExternalLink className="size-4" /> Fonte oficial</a></div></div></div></div></div>;
}

function SettingsPanel({ profile, preferences, onClose, onSaveProfile, onSavePreferences, onPasswordChange, onSignOut }: { profile: Profile; preferences: EmailPreferences; onClose: () => void; onSaveProfile: (profile: Profile) => Promise<void>; onSavePreferences: (preferences: EmailPreferences) => Promise<void>; onPasswordChange: (currentPassword: string, newPassword: string) => Promise<string>; onSignOut: () => Promise<void> }) {
  const [tab, setTab] = useState<"profile" | "security" | "preferences">("profile");
  const [draftProfile, setDraftProfile] = useState(profile);
  const [draftPreferences, setDraftPreferences] = useState(preferences);
  const [fileError, setFileError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  function handlePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setFileError("Escolha um arquivo de imagem."); return; }
    if (file.size > 5 * 1024 * 1024) { setFileError("A foto deve ter no máximo 5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setDraftProfile((current) => ({ ...current, photo: String(reader.result) })); setFileError(""); };
    reader.readAsDataURL(file);
  }

  function submitProfile(event: FormEvent) {
    event.preventDefault();
    onSaveProfile(draftProfile);
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get("current-password"));
    const nextPassword = String(form.get("new-password"));
    const confirmation = String(form.get("confirm-password"));
    if (nextPassword.length < 8) { setPasswordMessage("A nova senha precisa ter pelo menos 8 caracteres."); return; }
    if (nextPassword !== confirmation) { setPasswordMessage("As duas senhas não são iguais."); return; }
    setPasswordMessage("Atualizando...");
    const result = await onPasswordChange(currentPassword, nextPassword);
    setPasswordMessage(result);
    if (result.startsWith("Senha atualizada")) event.currentTarget.reset();
  }

  return <div className="fixed inset-0 z-[60] flex justify-end bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="settings-title"><button className="absolute inset-0" onClick={onClose} aria-label="Fechar configurações" /><section className="app-scrollbar relative h-full w-full max-w-[680px] overflow-y-auto bg-[#fbfaf7] shadow-2xl dark:bg-[#171310]"><header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-[#fbfaf7]/95 px-5 py-5 backdrop-blur-xl sm:px-7 dark:border-white/8 dark:bg-[#171310]/95"><div><p className="text-[10px] font-black uppercase tracking-[.15em] text-red-700 dark:text-amber-400">Minha conta</p><h2 id="settings-title" className="mt-1 text-2xl font-black tracking-tight">Configurações</h2></div><button onClick={onClose} className="grid size-10 place-items-center rounded-xl border border-stone-200 bg-white dark:border-white/8 dark:bg-white/5" aria-label="Fechar"><X className="size-5" /></button></header><div className="p-5 sm:p-7"><nav className="grid grid-cols-3 gap-1 rounded-xl bg-stone-100 p-1 dark:bg-white/5" aria-label="Seções das configurações">{[{id:"profile" as const,label:"Perfil",icon:CircleUserRound},{id:"security" as const,label:"Segurança",icon:ShieldCheck},{id:"preferences" as const,label:"E-mails",icon:MailCheck}].map(({id,label,icon:Icon})=><button key={id} type="button" onClick={() => setTab(id)} className={`flex items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-xs font-extrabold transition ${tab===id?"bg-white text-red-700 shadow-sm dark:bg-[#2a2521] dark:text-amber-300":"text-stone-500 dark:text-stone-400"}`}><Icon className="size-4" /><span className="hidden sm:inline">{label}</span></button>)}</nav>

        {tab === "profile" && <form onSubmit={submitProfile} className="mt-7"><div className="flex flex-col gap-5 rounded-[20px] border border-stone-200 bg-white p-5 sm:flex-row sm:items-center dark:border-white/8 dark:bg-white/[.035]"><ProfileAvatar profile={draftProfile} large /><div className="flex-1"><h3 className="text-sm font-black">Foto do perfil</h3><p className="mt-1 text-xs leading-5 text-stone-400">JPG, PNG ou WEBP de até 5 MB.</p><div className="mt-3 flex flex-wrap gap-2"><label className="cursor-pointer rounded-lg bg-red-700 px-3 py-2 text-xs font-extrabold text-white dark:bg-amber-500 dark:text-stone-950"><input type="file" accept="image/*" onChange={handlePhoto} className="sr-only" />Escolher foto</label>{draftProfile.photo&&<button type="button" onClick={() => setDraftProfile((current) => ({ ...current, photo: null }))} className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-bold dark:border-white/10">Remover</button>}</div>{fileError&&<p className="mt-2 text-xs font-bold text-red-600">{fileError}</p>}</div></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><SettingsField label="Nome exibido" value={draftProfile.displayName} onChange={(value) => setDraftProfile({...draftProfile,displayName:value})} placeholder="Seu nome" /><SettingsField label="Nome de usuário" value={draftProfile.username} onChange={(value) => setDraftProfile({...draftProfile,username:value.replace(/\s/g,"").toLowerCase()})} placeholder="seuusuario" prefix="@" /><div className="sm:col-span-2"><SettingsField label="E-mail" value={draftProfile.email} onChange={(value) => setDraftProfile({...draftProfile,email:value})} placeholder="seuemail@exemplo.com" type="email" /></div></div><div className="mt-7 flex justify-end border-t border-stone-200 pt-5 dark:border-white/8"><button className="flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-extrabold text-white dark:bg-amber-500 dark:text-stone-950"><Save className="size-4" /> Salvar perfil</button></div></form>}

        {tab === "security" && <div className="mt-7 space-y-5"><section className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/15 dark:bg-emerald-500/[.05]"><div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><ShieldCheck className="size-5" /></span><div><div className="flex items-center gap-2"><h3 className="text-sm font-black">Conta protegida pelo Supabase</h3><span className="rounded-full bg-emerald-100 px-2 py-1 text-[8px] font-black uppercase text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">Ativo</span></div><p className="mt-1 max-w-md text-xs leading-5 text-stone-500 dark:text-stone-400">Sessão segura em cookies, confirmação por e-mail e dados isolados por usuário com Row Level Security.</p></div></div></section><form onSubmit={submitPassword} className="rounded-[20px] border border-stone-200 bg-white p-5 dark:border-white/8 dark:bg-white/[.035]"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-stone-100 text-stone-500 dark:bg-white/6"><KeyRound className="size-5" /></span><div><h3 className="text-sm font-black">Alterar senha</h3><p className="mt-1 text-xs text-stone-400">Use pelo menos 8 caracteres.</p></div></div><div className="mt-5 space-y-4"><PasswordField name="current-password" label="Senha atual" /><div className="grid gap-4 sm:grid-cols-2"><PasswordField name="new-password" label="Nova senha" /><PasswordField name="confirm-password" label="Confirmar nova senha" /></div></div>{passwordMessage&&<p className={`mt-4 text-xs font-bold ${passwordMessage.startsWith("Senha atualizada")?"text-emerald-700 dark:text-emerald-300":"text-red-600"}`}>{passwordMessage}</p>}<div className="mt-5 flex justify-end"><button disabled={passwordMessage==="Atualizando..."} className="rounded-xl bg-stone-950 px-5 py-3 text-xs font-extrabold text-white disabled:opacity-60 dark:bg-amber-500 dark:text-stone-950">Atualizar senha</button></div></form><section className="rounded-[20px] border border-stone-200 bg-white p-5 dark:border-white/8 dark:bg-white/[.035]"><h3 className="text-sm font-black">Sessão atual</h3><div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-stone-50 p-4 dark:bg-white/[.025]"><div><p className="text-xs font-extrabold">Este dispositivo</p><p className="mt-1 text-[10px] text-stone-400">Ativo agora · sessão do navegador</p></div><span className="size-2 rounded-full bg-emerald-500" /></div><button type="button" onClick={onSignOut} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-xs font-extrabold text-red-700 hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10"><LogOut className="size-4" /> Sair da conta</button></section></div>}

        {tab === "preferences" && <div className="mt-7"><div className="rounded-[20px] border border-stone-200 bg-white p-5 dark:border-white/8 dark:bg-white/[.035]"><h3 className="text-sm font-black">Preferências de e-mail</h3><p className="mt-1 text-xs leading-5 text-stone-400">Escolha o que deseja receber do Judo Calendar.</p><div className="mt-5 divide-y divide-stone-100 dark:divide-white/7"><PreferenceToggle title="E-mails do produto" description="Avisos importantes sobre sua conta e o funcionamento do app." checked={draftPreferences.productEmails} onChange={(checked) => setDraftPreferences({...draftPreferences,productEmails:checked})} /><PreferenceToggle title="Lembretes pré-treino" description="Receba seu plano de jogo antes dos dias programados." checked={draftPreferences.trainingReminders} onChange={(checked) => setDraftPreferences({...draftPreferences,trainingReminders:checked})} /><PreferenceToggle title="Revisão semanal" description="Resumo dos registros, erros recorrentes e próximos focos." checked={draftPreferences.weeklyReview} onChange={(checked) => setDraftPreferences({...draftPreferences,weeklyReview:checked})} /><PreferenceToggle title="Alertas de competições" description="Avisos das competições que você marcou para acompanhar." checked={draftPreferences.competitionAlerts} onChange={(checked) => setDraftPreferences({...draftPreferences,competitionAlerts:checked})} /><PreferenceToggle title="Ofertas e novidades" description="Promoções, lançamentos e condições especiais dos planos." checked={draftPreferences.offers} onChange={(checked) => setDraftPreferences({...draftPreferences,offers:checked})} /></div></div><div className="mt-5 rounded-xl bg-stone-100 p-4 text-xs leading-5 text-stone-500 dark:bg-white/5 dark:text-stone-400">Mensagens essenciais de segurança, recuperação de conta e cobrança continuarão ativas mesmo que os demais e-mails sejam desabilitados.</div><div className="mt-6 flex justify-end"><button type="button" onClick={() => onSavePreferences(draftPreferences)} className="flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-extrabold text-white dark:bg-amber-500 dark:text-stone-950"><Save className="size-4" /> Salvar preferências</button></div></div>}
      </div></section></div>;
}

function SettingsField({ label, value, onChange, placeholder, prefix, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; prefix?: string; type?: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-black">{label}</span><span className="relative block">{prefix&&<span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">{prefix}</span>}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`h-12 w-full rounded-xl border border-stone-200 bg-white pr-4 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:border-white/8 dark:bg-white/5 dark:focus:border-amber-500 dark:focus:ring-amber-500/10 ${prefix?"pl-8":"pl-4"}`} /></span></label>;
}

function PasswordField({ name, label }: { name: string; label: string }) {
  return <label className="block"><span className="mb-2 block text-xs font-extrabold">{label}</span><input name={name} type="password" required autoComplete={name === "current-password" ? "current-password" : "new-password"} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 text-sm outline-none focus:border-red-400 dark:border-white/8 dark:bg-black/10 dark:focus:border-amber-500" /></label>;
}

function PreferenceToggle({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <div className="flex items-center justify-between gap-5 py-4"><div><p className="text-sm font-extrabold">{title}</p><p className="mt-1 max-w-sm text-xs leading-5 text-stone-400">{description}</p></div><button type="button" role="switch" aria-checked={checked} aria-label={title} onClick={() => onChange(!checked)} className={`h-7 w-12 shrink-0 rounded-full p-1 transition ${checked?"bg-red-700 dark:bg-amber-500":"bg-stone-300 dark:bg-stone-700"}`}><span className={`block size-5 rounded-full bg-white shadow-sm transition-transform ${checked?"translate-x-5":"translate-x-0"}`} /></button></div>;
}
