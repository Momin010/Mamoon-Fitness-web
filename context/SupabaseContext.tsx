
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  refreshSession: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured] = useState(() => isSupabaseConfigured());
  const authSubscriptionRef = useRef<any>(null);

  // Enhanced session refresh with error handling
  const refreshSession = useCallback(async () => {
    if (!isConfigured) return;
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session refresh error:', error);
        setSession(null);
        setUser(null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      setSession(null);
      setUser(null);
    }
  }, [isConfigured]);

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    // Get initial session with enhanced error handling
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Initial session error:', error);
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Failed to get initial session:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Enhanced auth state change listener with better error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      try {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle specific auth events
        switch (event) {
          case 'SIGNED_IN':
            console.log('User signed in successfully');
            break;
          case 'SIGNED_OUT':
            console.log('User signed out');
            break;
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed');
            break;
          case 'USER_UPDATED':
            console.log('User updated');
            break;
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setSession(null);
        setUser(null);
      }
    });

    authSubscriptionRef.current = subscription;

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  // Enhanced sign in with better error handling and validation
  const signIn = useCallback(async (email: string, password: string) => {
    if (!isConfigured) {
      return { error: new Error('Supabase not configured') };
    }
    
    if (!email || !password) {
      return { error: new Error('Email and password are required') };
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });
      
      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }
      
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
      }
      
      return { error: null };
    } catch (error) {
      console.error('Sign in failed:', error);
      return { error: error instanceof Error ? error : new Error('Sign in failed') };
    }
  }, [isConfigured]);

  // Enhanced sign up with better error handling and validation
  const signUp = useCallback(async (email: string, password: string, name: string) => {
    if (!isConfigured) {
      return { error: new Error('Supabase not configured') };
    }
    
    if (!email || !password || !name) {
      return { error: new Error('Email, password, and name are required') };
    }
    
    if (password.length < 6) {
      return { error: new Error('Password must be at least 6 characters long') };
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim()
          }
        }
      });
      
      if (error) {
        console.error('Sign up error:', error);
        return { error };
      }
      
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
      }
      
      return { error: null };
    } catch (error) {
      console.error('Sign up failed:', error);
      return { error: error instanceof Error ? error : new Error('Sign up failed') };
    }
  }, [isConfigured]);

  // Enhanced sign out with better error handling
  const signOut = useCallback(async () => {
    if (!isConfigured) return;
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      
      // Clear local state immediately
      setSession(null);
      setUser(null);
      
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out failed:', error);
      // Still clear local state on error to prevent stuck sessions
      setSession(null);
      setUser(null);
      throw error;
    }
  }, [isConfigured]);

  // Enhanced password reset with better error handling
  const resetPassword = useCallback(async (email: string) => {
    if (!isConfigured) {
      return { error: new Error('Supabase not configured') };
    }
    
    if (!email || !email.includes('@')) {
      return { error: new Error('Please enter a valid email address') };
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        console.error('Password reset error:', error);
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      console.error('Password reset failed:', error);
      return { error: error instanceof Error ? error : new Error('Password reset failed') };
    }
  }, [isConfigured]);

  const value = {
    user,
    session,
    isLoading,
    isConfigured,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshSession
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
