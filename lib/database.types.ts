
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          name: string
          avatar_url: string | null
          xp: number
          level: number
          rank: number
          calories_goal: number
          protein_goal: number
          carbs_goal: number
          fats_goal: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          name: string
          avatar_url?: string | null
          xp?: number
          level?: number
          rank?: number
          calories_goal?: number
          protein_goal?: number
          carbs_goal?: number
          fats_goal?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          name?: string
          avatar_url?: string | null
          xp?: number
          level?: number
          rank?: number
          calories_goal?: number
          protein_goal?: number
          carbs_goal?: number
          fats_goal?: number
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          due_date: string
          completed: boolean
          xp_reward: number
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          due_date?: string
          completed?: boolean
          xp_reward?: number
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          due_date?: string
          completed?: boolean
          xp_reward?: number
          created_at?: string
          completed_at?: string | null
        }
      }
      meals: {
        Row: {
          id: string
          user_id: string
          name: string
          calories: number
          protein: number
          carbs: number
          fats: number
          meal_type: string | null
          timestamp: string
          created_at: string
          barcode: string | null
          serving_size: number | null
          product_data: Json | null
          normalized_macros: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          calories: number
          protein?: number
          carbs?: number
          fats?: number
          meal_type?: string | null
          timestamp?: string
          created_at?: string
          barcode?: string | null
          serving_size?: number | null
          product_data?: Json | null
          normalized_macros?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          calories?: number
          protein?: number
          carbs?: number
          fats?: number
          meal_type?: string | null
          timestamp?: string
          created_at?: string
          barcode?: string | null
          serving_size?: number | null
          product_data?: Json | null
          normalized_macros?: Json | null
        }
      }
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          date: string
          duration: number
          total_xp: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          duration: number
          total_xp: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          duration?: number
          total_xp?: number
          notes?: string | null
          created_at?: string
        }
      }
      workout_exercises: {
        Row: {
          id: string
          workout_session_id: string
          user_id: string
          name: string
          sets: number
          reps: number
          completed_sets: number
          weight: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workout_session_id: string
          user_id: string
          name: string
          sets: number
          reps: number
          completed_sets?: number
          weight?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workout_session_id?: string
          user_id?: string
          name?: string
          sets?: number
          reps?: number
          completed_sets?: number
          weight?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      friends: {
        Row: {
          id: string
          user_id: string
          name: string
          xp: number
          level: number
          tier: string
          avatar_url: string | null
          last_active: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          xp?: number
          level?: number
          tier?: string
          avatar_url?: string | null
          last_active?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          xp?: number
          level?: number
          tier?: string
          avatar_url?: string | null
          last_active?: string | null
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          exercise_list: string[]
          daily_reset_hour: number
          notifications_enabled: boolean
          dark_mode: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise_list?: string[]
          daily_reset_hour?: number
          notifications_enabled?: boolean
          dark_mode?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise_list?: string[]
          daily_reset_hour?: number
          notifications_enabled?: boolean
          dark_mode?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          height_cm: number | null
          weight_kg: number | null
          age: number | null
          sex: string | null
          body_fat_percent: number | null
          goals: string[]
          activity_level: string | null
          diet_preferences: string[]
          experience_level: string | null
          bmr: number | null
          tdee: number | null
          target_calories: number | null
          target_protein_g: number | null
          target_carbs_g: number | null
          target_fats_g: number | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          height_cm?: number | null
          weight_kg?: number | null
          age?: number | null
          sex?: string | null
          body_fat_percent?: number | null
          goals?: string[]
          activity_level?: string | null
          diet_preferences?: string[]
          experience_level?: string | null
          bmr?: number | null
          tdee?: number | null
          target_calories?: number | null
          target_protein_g?: number | null
          target_carbs_g?: number | null
          target_fats_g?: number | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          height_cm?: number | null
          weight_kg?: number | null
          age?: number | null
          sex?: string | null
          body_fat_percent?: number | null
          goals?: string[]
          activity_level?: string | null
          diet_preferences?: string[]
          experience_level?: string | null
          bmr?: number | null
          tdee?: number | null
          target_calories?: number | null
          target_protein_g?: number | null
          target_carbs_g?: number | null
          target_fats_g?: number | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      workout_plans: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          experience_level: string | null
          days_per_week: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          experience_level?: string | null
          days_per_week?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          experience_level?: string | null
          days_per_week?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      workout_days: {
        Row: {
          id: string
          plan_id: string
          day_number: number
          name: string
          is_rest_day: boolean
          created_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          day_number: number
          name: string
          is_rest_day?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          plan_id?: string
          day_number?: number
          name?: string
          is_rest_day?: boolean
          created_at?: string
        }
      }
      plan_exercises: {
        Row: {
          id: string
          day_id: string
          exercise_id: string
          exercise_name: string
          sets: number
          reps: string
          rest_seconds: number
          order_index: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          day_id: string
          exercise_id: string
          exercise_name: string
          sets?: number
          reps?: string
          rest_seconds?: number
          order_index?: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          day_id?: string
          exercise_id?: string
          exercise_name?: string
          sets?: number
          reps?: string
          rest_seconds?: number
          order_index?: number
          notes?: string | null
          created_at?: string
        }
      }
      exercise_set_logs: {
        Row: {
          id: string
          workout_exercise_id: string
          set_number: number
          target_reps: string | null
          actual_reps: number | null
          weight_kg: number | null
          completed: boolean
          completed_at: string | null
        }
        Insert: {
          id?: string
          workout_exercise_id: string
          set_number: number
          target_reps?: string | null
          actual_reps?: number | null
          weight_kg?: number | null
          completed?: boolean
          completed_at?: string | null
        }
        Update: {
          id?: string
          workout_exercise_id?: string
          set_number?: number
          target_reps?: string | null
          actual_reps?: number | null
          weight_kg?: number | null
          completed?: boolean
          completed_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
