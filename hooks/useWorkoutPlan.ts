import { useState, useEffect, useCallback } from 'react';
import { getActiveWorkoutPlan, WorkoutPlanWithDetails } from '../lib/workoutPlanService';
import { supabase } from '../lib/supabase';

export function useWorkoutPlan() {
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlanWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setWorkoutPlan(null);
        setLoading(false);
        return;
      }

      const plan = await getActiveWorkoutPlan(user.id);
      setWorkoutPlan(plan);
      setError(null);
    } catch (err) {
      console.error('Error fetching workout plan:', err);
      setError('Failed to load workout plan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  return {
    workoutPlan,
    loading,
    error,
    refetch: fetchPlan
  };
}
