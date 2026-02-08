
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
