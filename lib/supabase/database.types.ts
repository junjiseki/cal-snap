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
        };
        Insert: {
          id: string;
          plan?: Plan;
          daily_calorie_goal?: number;
          created_at?: string;
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
    };
    Views: Record<string, never>;
    Functions: {
      claim_ai_analysis_slot: {
        Args: {
          p_user_id: string;
          p_model: string;
          p_daily_limit: number;
          p_day_start: string;
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
    };
    Enums: {
      plan_type: Plan;
    };
    CompositeTypes: Record<string, never>;
  };
};
