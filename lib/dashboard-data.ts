export type TrainingEntry = {
  id: string | null;
  date: string;
  title: string;
  learned: string;
  mistakes: string;
  nextFocus: string;
  intensity: "Leve" | "Moderado" | "Forte";
};

export type FreeNote = {
  id: string;
  title: string;
  content: string;
  category: string;
  updatedAt: string;
};

export type TrainingSchedule = { days: number[]; time: string };
export type ReviewSchedule = { day: number; time: string };
export type Profile = { displayName: string; username: string; email: string; photo: string | null };
export type EmailPreferences = {
  productEmails: boolean;
  trainingReminders: boolean;
  weeklyReview: boolean;
  competitionAlerts: boolean;
  offers: boolean;
};

export type CompetitionEvent = {
  id: string;
  dateStart: string;
  dateEnd: string;
  day: string;
  month: string;
  dateLabel: string;
  name: string;
  place: string;
  status: string;
  description: string;
  categories: string;
  sourceUrl: string;
  sourceLabel: string;
  sourceCheckedAt: string | null;
};

export type GamePlanDraft = {
  objective: string;
  grip: string;
  firstAttack: string;
  combination: string;
  groundwork: string;
};

export type TechniqueItem = {
  id: string;
  name: string;
  group: string;
  description: string;
  isPro: boolean;
};

export type DashboardInitialData = {
  userId: string;
  profile: Profile;
  entries: TrainingEntry[];
  gamePlan: GamePlanDraft;
  notes: FreeNote[];
  trainingSchedule: TrainingSchedule;
  reviewSchedule: ReviewSchedule;
  emailPreferences: EmailPreferences;
  competitions: CompetitionEvent[];
  competitionAlertIds: string[];
  techniques: TechniqueItem[];
  plan: { id: string; name: string; proAccess: boolean };
};

export function formatRelativeUpdate(value: string) {
  const elapsed = Date.now() - new Date(value).getTime();
  if (elapsed < 60_000) return "Agora";
  if (elapsed < 3_600_000) return `Há ${Math.max(1, Math.floor(elapsed / 60_000))} min`;
  if (elapsed < 86_400_000) return `Há ${Math.floor(elapsed / 3_600_000)} h`;
  if (elapsed < 172_800_000) return "Ontem";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value));
}
