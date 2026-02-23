import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSupabase } from '../context/SupabaseContext';

interface UserProfile {
  id: string;
  onboarding_completed: boolean;
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
  sex: string | null;
  goals: string[];
  activity_level: string | null;
  diet_preferences: string[];
  experience_level: string | null;
  bmr: number | null;
  tdee: number | null;
  target_calories: number | null;
  target_protein_g: number | null;
  target_carbs_g: number | null;
  target_fats_g: number | null;
}

interface UseOnboardingReturn {
  isLoading: boolean;
  needsOnboarding: boolean;
  profile: UserProfile | null;
  checkOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
}

export function useOnboarding(): UseOnboardingReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { user, isConfigured } = useSupabase();
  const navigate = useNavigate();

  const checkOnboarding = useCallback(async () => {
    if (!isConfigured || !user) {
      setIsLoading(false);
      setNeedsOnboarding(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // Profile doesn't exist, needs onboarding
        if (error.code === 'PGRST116') {
          setNeedsOnboarding(true);
          setProfile(null);
        } else {
          console.error('Error checking onboarding:', error);
          setNeedsOnboarding(false);
        }
      } else {
        setProfile(data);
        setNeedsOnboarding(!data?.onboarding_completed);
      }
    } catch (error) {
      console.error('Error checking onboarding:', error);
      setNeedsOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  }, [user, isConfigured]);

  const skipOnboarding = useCallback(async () => {
    if (!user) return;
    
    try {
      // Create a minimal profile to mark onboarding as skipped
      await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      
      setNeedsOnboarding(false);
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  }, [user]);

  useEffect(() => {
    checkOnboarding();
  }, [checkOnboarding]);

  // Auto-redirect to onboarding if needed
  useEffect(() => {
    if (!isLoading && needsOnboarding) {
      navigate('/onboarding');
    }
  }, [isLoading, needsOnboarding, navigate]);

  return {
    isLoading,
    needsOnboarding,
    profile,
    checkOnboarding,
    skipOnboarding
  };
}
