
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface SupabaseContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured] = useState(() => isSupabaseConfigured());

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [isConfigured]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isConfigured) return { error: new Error('Supabase not configured') };
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  }, [isConfigured]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    if (!isConfigured) return { error: new Error('Supabase not configured') };
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    });
    return { error };
  }, [isConfigured]);

  const signOut = useCallback(async () => {
    if (!isConfigured) return;
    await supabase.auth.signOut();
  }, [isConfigured]);

  const resetPassword = useCallback(async (email: string) => {
    if (!isConfigured) return { error: new Error('Supabase not configured') };
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    return { error };
  }, [isConfigured]);

  const value = {
    user,
    session,
    isLoading,
    isConfigured,
    signIn,
    signUp,
    signOut,
    resetPassword
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};
