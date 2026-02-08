
import { useCallback, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useSupabase } from '../context/SupabaseContext';
import { Task, Meal, WorkoutSession, Exercise, Friend } from '../types';

// Profile sync
export const useProfileSync = () => {
  const { user } = useSupabase();

  const fetchProfile = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    return data;
  }, [user]);

  const updateProfile = useCallback(async (updates: Partial<{
    name: string;
    email: string;
    avatar_url: string;
    xp: number;
    level: number;
    rank: number;
    calories_goal: number;
    protein_goal: number;
    carbs_goal: number;
    fats_goal: number;
  }>) => {
    if (!user || !isSupabaseConfigured()) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    
    return { error };
  }, [user]);

  return { fetchProfile, updateProfile };
};

// Tasks sync
export const useTasksSync = () => {
  const { user } = useSupabase();
  const subscriptionRef = useRef<any>(null);

  const fetchTasks = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
    
    return data.map((t): Task => ({
      id: t.id,
      title: t.title,
      dueDate: t.due_date,
      completed: t.completed,
      xpReward: t.xp_reward,
      createdAt: new Date(t.created_at).getTime(),
      completedAt: t.completed_at ? new Date(t.completed_at).getTime() : undefined
    }));
  }, [user]);

  const createTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt'>) => {
    if (!user || !isSupabaseConfigured()) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: task.title,
        due_date: task.dueDate,
        completed: task.completed,
        xp_reward: task.xpReward,
        completed_at: task.completedAt ? new Date(task.completedAt).toISOString() : null
      });
    
    return { error };
  }, [user]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    if (!user || !isSupabaseConfigured()) return { error: new Error('Not authenticated') };
    
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
    if (updates.xpReward !== undefined) dbUpdates.xp_reward = updates.xpReward;
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt ? new Date(updates.completedAt).toISOString() : null;
    
    const { error } = await supabase
      .from('tasks')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id);
    
    return { error };
  }, [user]);

  const deleteTask = useCallback(async (id: string) => {
    if (!user || !isSupabaseConfigured()) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    return { error };
  }, [user]);

  const subscribeToTasks = useCallback((onChange: () => void) => {
    if (!user || !isSupabaseConfigured()) return () => {};
    
    subscriptionRef.current = supabase
      .channel('tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          onChange();
        }
      )
      .subscribe();
    
    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [user]);

  return { fetchTasks, createTask, updateTask, deleteTask, subscribeToTasks };
};

// Meals sync
export const useMealsSync = () => {
  const { user } = useSupabase();

  const fetchMeals = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Error fetching meals:', error);
      return [];
    }
    
    return data.map((m): Meal => ({
      id: m.id,
      name: m.name,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fats: m.fats,
      mealType: m.meal_type as any,
      timestamp: new Date(m.timestamp).getTime()
    }));
  }, [user]);

  const createMeal = useCallback(async (meal: Omit<Meal, 'id' | 'timestamp'>) => {
    if (!user || !isSupabaseConfigured()) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('meals')
      .insert({
        user_id: user.id,
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
        meal_type: meal.mealType,
        timestamp: new Date().toISOString()
      });
    
    return { error };
  }, [user]);

  const deleteMeal = useCallback(async (id: string) => {
    if (!user || !isSupabaseConfigured()) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    return { error };
  }, [user]);

  return { fetchMeals, createMeal, deleteMeal };
};

// Workouts sync
export const useWorkoutsSync = () => {
  const { user } = useSupabase();

  const fetchWorkouts = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) return [];
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    
    if (sessionsError) {
      console.error('Error fetching workouts:', sessionsError);
      return [];
    }
    
    const workouts: WorkoutSession[] = [];
    
    for (const session of sessions || []) {
      const { data: exercises } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('workout_session_id', session.id);
      
      workouts.push({
        id: session.id,
        date: new Date(session.date).getTime(),
        duration: session.duration,
        totalXp: session.total_xp,
        notes: session.notes || undefined,
        exercises: (exercises || []).map((e): Exercise => ({
          id: e.id,
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          completedSets: e.completed_sets,
          weight: e.weight || undefined,
          notes: e.notes || undefined
        }))
      });
    }
    
    return workouts;
  }, [user]);

  const createWorkout = useCallback(async (workout: Omit<WorkoutSession, 'id' | 'date'>) => {
    if (!user || !isSupabaseConfigured()) return { error: new Error('Not authenticated') };
    
    // Create session first
    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: user.id,
        duration: workout.duration,
        total_xp: workout.totalXp,
        notes: workout.notes
      })
      .select()
      .single();
    
    if (sessionError || !session) {
      return { error: sessionError || new Error('Failed to create workout') };
    }
    
    // Create exercises
    if (workout.exercises.length > 0) {
      const { error: exercisesError } = await supabase
        .from('workout_exercises')
        .insert(
          workout.exercises.map(e => ({
            workout_session_id: session.id,
            user_id: user.id,
            name: e.name,
            sets: e.sets,
            reps: e.reps,
            completed_sets: e.completedSets,
            weight: e.weight,
            notes: e.notes
          }))
        );
      
      if (exercisesError) {
        return { error: exercisesError };
      }
    }
    
    return { error: null };
  }, [user]);

  const deleteWorkout = useCallback(async (id: string) => {
    if (!user || !isSupabaseConfigured()) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('workout_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    return { error };
  }, [user]);

  return { fetchWorkouts, createWorkout, deleteWorkout };
};

// Friends sync
export const useFriendsSync = () => {
  const { user } = useSupabase();

  const fetchFriends = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', user.id)
      .order('xp', { ascending: false });
    
    if (error) {
      console.error('Error fetching friends:', error);
      return [];
    }
    
    return data.map((f): Friend => ({
      id: f.id,
      name: f.name,
      xp: f.xp,
      level: f.level,
      tier: f.tier,
      avatar: f.avatar_url || '',
      lastActive: f.last_active ? new Date(f.last_active).getTime() : undefined
    }));
  }, [user]);

  const createFriend = useCallback(async (friend: Omit<Friend, 'id'>) => {
    if (!user || !isSupabaseConfigured()) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('friends')
      .insert({
        user_id: user.id,
        name: friend.name,
        xp: friend.xp,
        level: friend.level,
        tier: friend.tier,
        avatar_url: friend.avatar,
        last_active: friend.lastActive ? new Date(friend.lastActive).toISOString() : null
      });
    
    return { error };
  }, [user]);

  const updateFriend = useCallback(async (id: string, updates: Partial<Friend>) => {
    if (!user || !isSupabaseConfigured()) return { error: new Error('Not authenticated') };
    
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.xp !== undefined) dbUpdates.xp = updates.xp;
    if (updates.level !== undefined) dbUpdates.level = updates.level;
    if (updates.tier !== undefined) dbUpdates.tier = updates.tier;
    if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar;
    if (updates.lastActive !== undefined) dbUpdates.last_active = updates.lastActive ? new Date(updates.lastActive).toISOString() : null;
    
    const { error } = await supabase
      .from('friends')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id);
    
    return { error };
  }, [user]);

  const deleteFriend = useCallback(async (id: string) => {
    if (!user || !isSupabaseConfigured()) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    return { error };
  }, [user]);

  return { fetchFriends, createFriend, updateFriend, deleteFriend };
};

// Settings sync
export const useSettingsSync = () => {
  const { user } = useSupabase();

  const fetchSettings = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching settings:', error);
      return null;
    }
    
    return {
      exerciseList: data.exercise_list,
      dailyResetHour: data.daily_reset_hour,
      notificationsEnabled: data.notifications_enabled,
      darkMode: data.dark_mode
    };
  }, [user]);

  const updateSettings = useCallback(async (updates: Partial<{
    exerciseList: string[];
    dailyResetHour: number;
    notificationsEnabled: boolean;
    darkMode: boolean;
  }>) => {
    if (!user || !isSupabaseConfigured()) return { error: new Error('Not authenticated') };
    
    const dbUpdates: any = {};
    if (updates.exerciseList !== undefined) dbUpdates.exercise_list = updates.exerciseList;
    if (updates.dailyResetHour !== undefined) dbUpdates.daily_reset_hour = updates.dailyResetHour;
    if (updates.notificationsEnabled !== undefined) dbUpdates.notifications_enabled = updates.notificationsEnabled;
    if (updates.darkMode !== undefined) dbUpdates.dark_mode = updates.darkMode;
    dbUpdates.updated_at = new Date().toISOString();
    
    const { error } = await supabase
      .from('user_settings')
      .update(dbUpdates)
      .eq('user_id', user.id);
    
    return { error };
  }, [user]);

  return { fetchSettings, updateSettings };
};
