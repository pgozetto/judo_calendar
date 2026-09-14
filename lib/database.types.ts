export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Timestamps & {
          id: string;
          username: string;
          display_name: string;
          email: string;
          avatar_url: string | null;
          timezone: string;
          onboarding_completed: boolean;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          email: string;
          avatar_url?: string | null;
          timezone?: string;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      training_records: {
        Row: Timestamps & {
          id: string;
          user_id: string;
          training_date: string;
          title: string;
          learned: string;
          mistakes: string;
          next_focus: string;
          intensity: Database["public"]["Enums"]["training_intensity"];
        };
        Insert: {
          id?: string;
          user_id: string;
          training_date: string;
          title?: string;
          learned?: string;
          mistakes?: string;
          next_focus?: string;
          intensity?: Database["public"]["Enums"]["training_intensity"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["training_records"]["Insert"]>;
        Relationships: [];
      };
      game_plans: {
        Row: Timestamps & {
          id: string;
          user_id: string;
          objective: string;
          grip: string;
          first_attack: string;
          combination: string;
          groundwork: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          objective?: string;
          grip?: string;
          first_attack?: string;
          combination?: string;
          groundwork?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["game_plans"]["Insert"]>;
        Relationships: [];
      };
      free_notes: {
        Row: Timestamps & {
          id: string;
          user_id: string;
          title: string;
          content: string;
          category: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content?: string;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["free_notes"]["Insert"]>;
        Relationships: [];
      };
      training_schedules: {
        Row: Timestamps & {
          user_id: string;
          weekdays: number[];
          local_time: string;
          reminder_minutes_before: number;
          enabled: boolean;
        };
        Insert: {
          user_id: string;
          weekdays?: number[];
          local_time?: string;
          reminder_minutes_before?: number;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["training_schedules"]["Insert"]>;
        Relationships: [];
      };
      review_schedules: {
        Row: Timestamps & {
          user_id: string;
          weekday: number;
          local_time: string;
          enabled: boolean;
        };
        Insert: {
          user_id: string;
          weekday?: number;
          local_time?: string;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["review_schedules"]["Insert"]>;
        Relationships: [];
      };
      email_preferences: {
        Row: Timestamps & {
          user_id: string;
          product_emails: boolean;
          training_reminders: boolean;
          weekly_review: boolean;
          competition_alerts: boolean;
          offers: boolean;
        };
        Insert: {
          user_id: string;
          product_emails?: boolean;
          training_reminders?: boolean;
          weekly_review?: boolean;
          competition_alerts?: boolean;
          offers?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["email_preferences"]["Insert"]>;
        Relationships: [];
      };
      federation_sources: {
        Row: Timestamps & {
          id: string;
          provider: string;
          external_id: string;
          title: string;
          version: string | null;
          source_url: string;
          published_at: string | null;
          last_seen_at: string;
        };
        Insert: {
          id?: string;
          provider: string;
          external_id: string;
          title: string;
          version?: string | null;
          source_url: string;
          published_at?: string | null;
          last_seen_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["federation_sources"]["Insert"]>;
        Relationships: [];
      };
      competitions: {
        Row: Timestamps & {
          id: string;
          slug: string;
          name: string;
          starts_on: string;
          ends_on: string;
          place: string | null;
          status: string;
          description: string;
          categories: string;
          federation: string;
          source_url: string;
          source_label: string;
          source_checked_at: string | null;
          published: boolean;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      competition_alerts: {
        Row: Timestamps & {
          id: string;
          user_id: string;
          competition_id: string;
          days_before: number[];
          enabled: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          competition_id: string;
          days_before?: number[];
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["competition_alerts"]["Insert"]>;
        Relationships: [];
      };
      techniques: {
        Row: Timestamps & {
          id: string;
          slug: string;
          name: string;
          classification: string;
          description: string;
          is_pro: boolean;
          sort_order: number;
          published: boolean;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      user_techniques: {
        Row: Timestamps & {
          id: string;
          user_id: string;
          technique_id: string | null;
          custom_name: string | null;
          notes: string;
          media_url: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          technique_id?: string | null;
          custom_name?: string | null;
          notes?: string;
          media_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_techniques"]["Insert"]>;
        Relationships: [];
      };
      subscription_plans: {
        Row: Timestamps & {
          id: string;
          name: string;
          description: string;
          price_cents: number;
          currency: string;
          interval: string;
          pro_access: boolean;
          active: boolean;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      subscriptions: {
        Row: Timestamps & {
          id: string;
          user_id: string;
          plan_id: string;
          provider: Database["public"]["Enums"]["payment_provider"] | null;
          provider_subscription_id: string | null;
          provider_payment_id: string | null;
          status: Database["public"]["Enums"]["subscription_status"];
          current_period_start: string | null;
          current_period_end: string | null;
          lifetime_access: boolean;
          cancel_at_period_end: boolean;
          metadata: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          provider?: Database["public"]["Enums"]["payment_provider"] | null;
          provider_subscription_id?: string | null;
          provider_payment_id?: string | null;
          status?: Database["public"]["Enums"]["subscription_status"];
          current_period_start?: string | null;
          current_period_end?: string | null;
          lifetime_access?: boolean;
          cancel_at_period_end?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
        Relationships: [];
      };
      payment_events: {
        Row: {
          id: string;
          provider: Database["public"]["Enums"]["payment_provider"];
          provider_event_id: string;
          event_type: string;
          payload: Json;
          processed_at: string | null;
          processing_error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          provider: Database["public"]["Enums"]["payment_provider"];
          provider_event_id: string;
          event_type: string;
          payload: Json;
          processed_at?: string | null;
          processing_error?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payment_events"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          kind: string;
          href: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          kind?: string;
          href?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      email_deliveries: {
        Row: Timestamps & {
          id: string;
          user_id: string;
          kind: string;
          dedupe_key: string;
          recipient: string;
          provider_message_id: string | null;
          status: Database["public"]["Enums"]["delivery_status"];
          attempts: number;
          last_error: string | null;
          scheduled_for: string;
          sent_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: string;
          dedupe_key: string;
          recipient: string;
          provider_message_id?: string | null;
          status?: Database["public"]["Enums"]["delivery_status"];
          attempts?: number;
          last_error?: string | null;
          scheduled_for: string;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["email_deliveries"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      ensure_user_workspace: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_username_available: {
        Args: { candidate: string };
        Returns: boolean;
      };
    };
    Enums: {
      training_intensity: "light" | "moderate" | "hard";
      subscription_status: "free" | "pending" | "authorized" | "paused" | "cancelled" | "expired" | "payment_failed";
      payment_provider: "mercado_pago";
      delivery_status: "pending" | "sent" | "failed" | "skipped";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TrainingRecord = Tables<"training_records">;
export type GamePlan = Tables<"game_plans">;
export type FreeNote = Tables<"free_notes">;
