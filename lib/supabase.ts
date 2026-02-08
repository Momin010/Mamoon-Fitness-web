
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = (import.meta as any).env?.VITE_PUBLIC_SUPABASE_URL || process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Cloud sync will be disabled.');
}

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey;
};
