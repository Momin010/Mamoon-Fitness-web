import { supabase } from './supabase';
import { Database } from './database.types';
import { WeeklyWorkout } from '../types/fitness';

type WorkoutPlan = Database['public']['Tables']['workout_plans']['Row'];
type WorkoutPlanInsert = Database['public']['Tables']['workout_plans']['Insert'];
type WorkoutDayDB = Database['public']['Tables']['workout_days']['Row'];
type WorkoutDayInsert = Database['public']['Tables']['workout_days']['Insert'];
type PlanExercise = Database['public']['Tables']['plan_exercises']['Row'];
type PlanExerciseInsert = Database['public']['Tables']['plan_exercises']['Insert'];

export interface WorkoutPlanWithDetails {
  plan: WorkoutPlan;
  days: (WorkoutDayDB & { exercises: PlanExercise[] })[];
}

/**
 * Save a generated workout plan to the database
 */
export async function saveWorkoutPlan(
  userId: string,
  workout: WeeklyWorkout,
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
): Promise<WorkoutPlanWithDetails | null> {
  try {
    // First, deactivate any existing active plans
    await supabase
      .from('workout_plans' as any)
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    // Create the new workout plan
    const planData: WorkoutPlanInsert = {
      user_id: userId,
      name: `${experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)} Workout Plan`,
      description: `${workout.days.length}-day per week workout plan`,
      experience_level: experienceLevel,
      days_per_week: workout.days.filter(d => !d.isRestDay).length,
      is_active: true,
    };

    const { data: plan, error: planError } = await supabase
      .from('workout_plans' as any)
      .insert(planData as any)
      .select()
      .single();

    if (planError || !plan) {
      console.error('Error creating workout plan:', planError);
      return null;
    }

    const typedPlan = plan as WorkoutPlan;

    // Create workout days and exercises
    const daysWithExercises: (WorkoutDayDB & { exercises: PlanExercise[] })[] = [];

    for (const day of workout.days) {
      // Create the day
      const dayData: WorkoutDayInsert = {
        plan_id: typedPlan.id,
        day_number: day.day,
        name: day.name,
        is_rest_day: day.isRestDay,
      };

      const { data: dayRecord, error: dayError } = await supabase
        .from('workout_days' as any)
        .insert(dayData as any)
        .select()
        .single();

      if (dayError || !dayRecord) {
        console.error('Error creating workout day:', dayError);
        continue;
      }

      const typedDay = dayRecord as WorkoutDayDB;

      // Create exercises for this day
      const exerciseInserts: PlanExerciseInsert[] = day.exercises.map((exerciseItem, index) => ({
        day_id: typedDay.id,
        exercise_id: exerciseItem.exercise.id,
        exercise_name: exerciseItem.exercise.name,
        sets: exerciseItem.sets,
        reps: exerciseItem.reps,
        rest_seconds: exerciseItem.restSeconds,
        order_index: index,
        notes: exerciseItem.exercise.instructions?.slice(0, 2).join(' ') || null,
      }));

      if (exerciseInserts.length > 0) {
        const { data: exercises, error: exercisesError } = await supabase
          .from('plan_exercises' as any)
          .insert(exerciseInserts as any)
          .select();

        if (exercisesError) {
          console.error('Error creating exercises:', exercisesError);
        }

        daysWithExercises.push({
          ...typedDay,
          exercises: (exercises || []) as PlanExercise[],
        });
      } else {
        daysWithExercises.push({
          ...typedDay,
          exercises: [],
        });
      }
    }

    return {
      plan: typedPlan,
      days: daysWithExercises,
    };
  } catch (error) {
    console.error('Error saving workout plan:', error);
    return null;
  }
}

/**
 * Get the active workout plan for a user
 */
export async function getActiveWorkoutPlan(userId: string): Promise<WorkoutPlanWithDetails | null> {
  try {
    // Get the active plan
    const { data: plan, error: planError } = await supabase
      .from('workout_plans' as any)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return null;
    }

    const typedPlan = plan as WorkoutPlan;

    // Get the days
    const { data: days, error: daysError } = await supabase
      .from('workout_days' as any)
      .select('*')
      .eq('plan_id', typedPlan.id)
      .order('day_number');

    if (daysError || !days) {
      return { plan: typedPlan, days: [] };
    }

    const typedDays = days as WorkoutDayDB[];

    // Get exercises for each day
    const daysWithExercises = await Promise.all(
      typedDays.map(async (day) => {
        const { data: exercises } = await supabase
          .from('plan_exercises' as any)
          .select('*')
          .eq('day_id', day.id)
          .order('order_index');

        return {
          ...day,
          exercises: (exercises || []) as PlanExercise[],
        };
      })
    );

    return {
      plan: typedPlan,
      days: daysWithExercises,
    };
  } catch (error) {
    console.error('Error getting workout plan:', error);
    return null;
  }
}

/**
 * Get all workout plans for a user
 */
export async function getUserWorkoutPlans(userId: string): Promise<WorkoutPlan[]> {
  try {
    const { data, error } = await supabase
      .from('workout_plans' as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting workout plans:', error);
      return [];
    }

    return (data || []) as WorkoutPlan[];
  } catch (error) {
    console.error('Error getting workout plans:', error);
    return [];
  }
}

/**
 * Delete a workout plan
 */
export async function deleteWorkoutPlan(planId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('workout_plans' as any)
      .delete()
      .eq('id', planId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting workout plan:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting workout plan:', error);
    return false;
  }
}

/**
 * Activate a workout plan
 */
export async function activateWorkoutPlan(planId: string, userId: string): Promise<boolean> {
  try {
    // Deactivate all plans first
    await (supabase as any)
      .from('workout_plans')
      .update({ is_active: false })
      .eq('user_id', userId);

    // Activate the selected plan
    const { error } = await (supabase as any)
      .from('workout_plans')
      .update({ is_active: true })
      .eq('id', planId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error activating workout plan:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error activating workout plan:', error);
    return false;
  }
}
