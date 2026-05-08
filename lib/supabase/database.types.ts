export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Plan = "free" | "paid";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          plan: Plan;
          daily_calorie_goal: number;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          plan?: Plan;
          daily_calorie_goal?: number;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          plan?: Plan;
          daily_calorie_goal?: number;
        };
        Relationships: [];
      };
      meals: {
        Row: {
          id: string;
          user_id: string;
          eaten_at: string;
          total_calories: number;
          protein: number;
          fat: number;
          carbs: number;
          ai_confidence: number;
          memo: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          eaten_at: string;
          total_calories: number;
          protein: number;
          fat: number;
          carbs: number;
          ai_confidence: number;
          memo?: string | null;
        };
        Update: {
          eaten_at?: string;
          total_calories?: number;
          protein?: number;
          fat?: number;
          carbs?: number;
          ai_confidence?: number;
          memo?: string | null;
        };
        Relationships: [];
      };
      meal_items: {
        Row: {
          id: string;
          meal_id: string;
          name: string;
          estimated_amount: string;
          calories: number;
          protein: number;
          fat: number;
          carbs: number;
          confidence: number;
        };
        Insert: {
          meal_id: string;
          name: string;
          estimated_amount: string;
          calories: number;
          protein: number;
          fat: number;
          carbs: number;
          confidence: number;
        };
        Update: {
          name?: string;
          estimated_amount?: string;
          calories?: number;
          protein?: number;
          fat?: number;
          carbs?: number;
          confidence?: number;
        };
        Relationships: [];
      };
      ai_analysis_logs: {
        Row: {
          id: string;
          user_id: string;
          analyzed_at: string;
          model: string;
          success: boolean;
        };
        Insert: {
          user_id: string;
          analyzed_at?: string;
          model: string;
          success: boolean;
        };
        Update: {
          success?: boolean;
        };
        Relationships: [];
      };
      meal_suggestion_logs: {
        Row: {
          id: string;
          user_id: string;
          suggested_at: string;
          model: string;
          context: "eat_out" | "cook" | "convenience";
          meal_slot: "breakfast" | "lunch" | "dinner";
          success: boolean;
        };
        Insert: {
          user_id: string;
          suggested_at?: string;
          model: string;
          context: "eat_out" | "cook" | "convenience";
          meal_slot: "breakfast" | "lunch" | "dinner";
          success?: boolean;
        };
        Update: {
          success?: boolean;
        };
        Relationships: [];
      };
      meal_reminder_settings: {
        Row: {
          user_id: string;
          meal_type:
            | "breakfast"
            | "morning_snack"
            | "lunch"
            | "afternoon_snack"
            | "dinner"
            | "night_snack"
            | "supplement_1"
            | "supplement_2";
          notify_time: string;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          meal_type:
            | "breakfast"
            | "morning_snack"
            | "lunch"
            | "afternoon_snack"
            | "dinner"
            | "night_snack"
            | "supplement_1"
            | "supplement_2";
          notify_time: string;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          notify_time?: string;
          enabled?: boolean;
        };
        Relationships: [];
      };
      meal_reminder_logs: {
        Row: {
          user_id: string;
          meal_type:
            | "breakfast"
            | "morning_snack"
            | "lunch"
            | "afternoon_snack"
            | "dinner"
            | "night_snack"
            | "supplement_1"
            | "supplement_2";
          target_date: string;
          first_sent_at: string | null;
          followup_sent_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          meal_type:
            | "breakfast"
            | "morning_snack"
            | "lunch"
            | "afternoon_snack"
            | "dinner"
            | "night_snack"
            | "supplement_1"
            | "supplement_2";
          target_date: string;
          first_sent_at?: string | null;
          followup_sent_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          first_sent_at?: string | null;
          followup_sent_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string;
          category: "support" | "billing" | "bug" | "privacy" | "other";
          message: string;
          status: "new" | "in_progress" | "closed";
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          name: string;
          email: string;
          category: "support" | "billing" | "bug" | "privacy" | "other";
          message: string;
          status?: "new" | "in_progress" | "closed";
          created_at?: string;
        };
        Update: {
          status?: "new" | "in_progress" | "closed";
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      soft_delete_my_account: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      current_profile_active: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      claim_ai_analysis_slot: {
        Args: {
          p_user_id: string;
          p_model: string;
          p_daily_limit: number;
          p_day_start: string;
          /** 排他的終端（翌 JST 日 00:00）。`analyzed_at < p_day_end` */
          p_day_end: string;
        };
        Returns: {
          log_id: string;
          used: number;
          daily_limit: number;
        }[];
      };
      claim_meal_suggestion_slot: {
        Args: {
          p_user_id: string;
          p_model: string;
          p_context: string;
          p_meal_slot: string;
          p_daily_limit: number;
          p_day_start: string;
          /** 排他的終端（翌 JST 00:00）。`suggested_at < p_day_end` */
          p_day_end: string;
        };
        Returns: {
          log_id: string;
          used: number;
          daily_limit: number;
        }[];
      };
      create_meal_with_items: {
        Args: {
          p_user_id: string;
          p_eaten_at: string;
          p_total_calories: number;
          p_protein: number;
          p_fat: number;
          p_carbs: number;
          p_ai_confidence: number;
          p_memo: string | null;
          p_items: Json;
        };
        Returns: string;
      };
      get_daily_meal_summary: {
        Args: {
          p_start: string;
          /** 排他的終端（翌 JST 日 00:00 に相当する timestamptz）。`eaten_at < p_end` */
          p_end: string;
        };
        Returns: {
          meal_count: number;
          calories: number;
          protein: number;
          fat: number;
          carbs: number;
        }[];
      };
    };
    Enums: {
      plan_type: Plan;
    };
    CompositeTypes: Record<string, never>;
  };
};
