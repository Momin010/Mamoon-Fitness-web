
import { useEffect, useRef, useCallback } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { supabase } from '../lib/supabase';

interface AutoSaveState {
  user: any;
  tasks: any[];
  meals: any[];
  workoutHistory: any[];
  friends: any[];
  settings: any;
}

export const useAutoSave = (state: AutoSaveState, intervalMinutes: number = 3) => {
  const { user: authUser } = useSupabase();
  const lastSaveRef = useRef<number>(Date.now());
  const pendingChangesRef = useRef<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isCloudEnabled = isSupabaseConfigured() && !!authUser;

  // Mark that changes have occurred
  const markChanges = useCallback(() => {
    pendingChangesRef.current = true;
  }, []);

  // Perform the actual save
  const performSave = useCallback(async () => {
    if (!isCloudEnabled || !pendingChangesRef.current) return;

    try {
      console.log('[AutoSave] Saving to cloud...');
      
      // Save profile
      if (state.user) {
        await supabase.from('profiles').upsert({
          id: authUser!.id,
          name: state.user.name,
          email: state.user.email,
          avatar_url: state.user.avatar,
          xp: state.user.xp,
          level: state.user.level,
          rank: state.user.rank,
          calories_goal: state.user.caloriesGoal,
          protein_goal: state.user.proteinGoal,
          carbs_goal: state.user.carbsGoal,
          fats_goal: state.user.fatsGoal,
          updated_at: new Date().toISOString()
        });
      }

      // Save settings
      if (state.settings) {
        await supabase.from('user_settings').upsert({
          user_id: authUser!.id,
          exercise_list: state.settings.exerciseList,
          daily_reset_hour: state.settings.dailyResetHour,
          notifications_enabled: state.settings.notificationsEnabled,
          dark_mode: state.settings.darkMode,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      }

      pendingChangesRef.current = false;
      lastSaveRef.current = Date.now();
      console.log('[AutoSave] Save complete');
    } catch (error) {
      console.error('[AutoSave] Save failed:', error);
    }
  }, [isCloudEnabled, authUser, state]);

  // Auto-save interval
  useEffect(() => {
    if (!isCloudEnabled) return;

    const intervalMs = intervalMinutes * 60 * 1000;
    
    const intervalId = setInterval(() => {
      performSave();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [isCloudEnabled, intervalMinutes, performSave]);

  // Save on page unload
  useEffect(() => {
    if (!isCloudEnabled) return;

    const handleBeforeUnload = () => {
      if (pendingChangesRef.current) {
        // Use sendBeacon for reliable unload saving
        const data = JSON.stringify({
          user: state.user,
          settings: state.settings
        });
        navigator.sendBeacon?.('/api/save', data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isCloudEnabled, state]);

  // Debounced save when changes occur
  useEffect(() => {
    if (!isCloudEnabled) return;

    // Mark changes whenever state updates
    pendingChangesRef.current = true;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for immediate save after changes stop
    saveTimeoutRef.current = setTimeout(() => {
      if (pendingChangesRef.current) {
        performSave();
      }
    }, 5000); // 5 second debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isCloudEnabled, state.user, state.settings, performSave]);

  return { markChanges, performSave, lastSave: lastSaveRef.current };
};

// Hook to track unsaved changes warning
export const useUnsavedChangesWarning = (hasUnsavedChanges: boolean) => {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
};
