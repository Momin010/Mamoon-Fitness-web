
import React, { createContext, useContext, useCallback, useMemo, useEffect, useState } from 'react';
import { Task, Meal, Exercise, UserStats, Friend, WorkoutSession } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useSupabase } from './SupabaseContext';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  useProfileSync,
  useTasksSync,
  useMealsSync,
  useWorkoutsSync,
  useFriendsSync,
  useSettingsSync
} from '../hooks/useSupabaseSync';
import { useAutoSave } from '../hooks/useAutoSave';

interface AppState {
  user: UserStats;
  tasks: Task[];
  meals: Meal[];
  exercises: Exercise[];
  friends: Friend[];
  workoutHistory: WorkoutSession[];
  settings: AppSettings;
  isSyncing: boolean;
  lastSync: number | null;
  lastAutoSave: number | null;
}

interface AppSettings {
  exerciseList: string[];
  dailyResetHour: number;
  notificationsEnabled: boolean;
  darkMode: boolean;
}

interface AppContextType extends AppState {
  allMeals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;

  // User actions
  addXp: (amount: number) => Promise<void>;
  updateUser: (updates: Partial<UserStats>) => void;
  resetUser: () => void;

  // Task actions
  toggleTask: (id: string) => Promise<void>;
  addTask: (title: string, dueDate?: string, xpReward?: number) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;

  // Meal actions
  addMeal: (meal: Omit<Meal, 'id' | 'timestamp'>) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  getMealsByDate: (date: Date) => Meal[];

  // Exercise actions
  addExercise: (exercise: Omit<Exercise, 'id'>) => void;
  updateExercise: (id: string, updates: Partial<Exercise>) => void;
  deleteExercise: (id: string) => void;
  completeExerciseSet: (id: string) => void;
  resetExercises: () => void;

  // Workout history
  saveWorkoutSession: (session: Omit<WorkoutSession, 'id' | 'date'>) => Promise<void>;
  getWorkoutHistory: () => WorkoutSession[];
  deleteWorkoutSession: (id: string) => Promise<void>;

  // Friends
  addFriend: (friend: Omit<Friend, 'id'>) => Promise<void>;
  removeFriend: (id: string) => Promise<void>;
  updateFriendXp: (id: string, xp: number) => Promise<void>;

  // Settings
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  resetAllData: () => void;

  // Sync
  syncWithCloud: () => Promise<void>;
  triggerAutoSave: () => Promise<void>;
}

const defaultUser: UserStats = {
  xp: 0,
  level: 1,
  caloriesGoal: 2500,
  proteinGoal: 150,
  carbsGoal: 250,
  fatsGoal: 70,
  name: 'New User',
  rank: 1
};

const defaultSettings: AppSettings = {
  exerciseList: [
    'Bench Press',
    'Overhead Press',
    'Lat Pulldown',
    'Barbell Row',
    'Tricep Extensions',
    'Lateral Raises',
    'Face Pulls',
    'Squat',
    'Deadlift',
    'Leg Press',
    'Bicep Curls',
    'Plank',
    'Push-ups',
    'Pull-ups'
  ],
  dailyResetHour: 0,
  notificationsEnabled: true,
  darkMode: true
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser } = useSupabase();
  const isCloudEnabled = isSupabaseConfigured() && !!authUser;

  // Sync hooks
  const { fetchProfile, updateProfile } = useProfileSync();
  const { fetchTasks, createTask, updateTask: updateTaskDb, deleteTask: deleteTaskDb } = useTasksSync();
  const { fetchMeals, createMeal, deleteMeal: deleteMealDb } = useMealsSync();
  const { fetchWorkouts, createWorkout, deleteWorkout: deleteWorkoutDb } = useWorkoutsSync();
  const { fetchFriends, createFriend, updateFriend: updateFriendDb, deleteFriend: deleteFriendDb } = useFriendsSync();
  const { fetchSettings, updateSettings: updateSettingsDb } = useSettingsSync();

  // Local state with persistence
  const [user, setUser, resetUserStorage] = useLocalStorage<UserStats>('forge-user', defaultUser);
  const [tasks, setTasks, resetTasksStorage] = useLocalStorage<Task[]>('forge-tasks', []);
  const [meals, setMeals, resetMealsStorage] = useLocalStorage<Meal[]>('forge-meals', []);
  const [exercises, setExercises, resetExercisesStorage] = useLocalStorage<Exercise[]>('forge-exercises', []);
  const [friends, setFriends, resetFriendsStorage] = useLocalStorage<Friend[]>('forge-friends', []);
  const [workoutHistory, setWorkoutHistory, resetWorkoutHistoryStorage] = useLocalStorage<WorkoutSession[]>('forge-workout-history', []);
  const [settings, setSettings, resetSettingsStorage] = useLocalStorage<AppSettings>('forge-settings', defaultSettings);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useLocalStorage<number | null>('forge-last-sync', null);
  const [lastAutoSave, setLastAutoSave] = useState<number | null>(null);

  // Auto-save hook
  const { performSave: triggerAutoSave } = useAutoSave({
    user,
    tasks,
    meals,
    workoutHistory,
    friends,
    settings
  }, 3); // Auto-save every 3 minutes

  // Clear local data when user changes (prevents data leakage between users)
  useEffect(() => {
    if (authUser?.id) {
      // Always clear localStorage first to prevent seeing previous user's data
      resetUserStorage();
      resetTasksStorage();
      resetMealsStorage();
      resetExercisesStorage();
      resetFriendsStorage();
      resetWorkoutHistoryStorage();
      resetSettingsStorage();
      setLastSync(null);
    }
  }, [authUser?.id]);

  // Initial sync from cloud when user logs in
  useEffect(() => {
    if (isCloudEnabled && authUser) {
      syncFromCloud();
    }
  }, [isCloudEnabled, authUser?.id]);

  // Sync data from cloud
  const syncFromCloud = async () => {
    if (!isCloudEnabled) return;

    setIsSyncing(true);
    try {
      // Fetch profile
      const profile = await fetchProfile() as any;
      if (profile) {
        setUser({
          xp: profile.xp,
          level: profile.level,
          caloriesGoal: profile.calories_goal,
          proteinGoal: profile.protein_goal,
          carbsGoal: profile.carbs_goal,
          fatsGoal: profile.fats_goal,
          name: profile.name,
          rank: profile.rank,
          email: profile.email || undefined,
          avatar: profile.avatar_url || undefined
        });
      }

      // Fetch tasks - ALWAYS set (even if empty) to ensure old data is cleared
      const cloudTasks = await fetchTasks();
      setTasks(cloudTasks);

      // Fetch meals - ALWAYS set (even if empty) to ensure old data is cleared
      const cloudMeals = await fetchMeals();
      setMeals(cloudMeals);

      // Fetch workouts - ALWAYS set (even if empty) to ensure old data is cleared
      const cloudWorkouts = await fetchWorkouts();
      setWorkoutHistory(cloudWorkouts);

      // Fetch friends - ALWAYS set (even if empty) to ensure old data is cleared
      const cloudFriends = await fetchFriends();
      setFriends(cloudFriends);

      // Fetch settings - ALWAYS set (even if null) to ensure old data is cleared
      const cloudSettings = await fetchSettings();
      if (cloudSettings) {
        setSettings(cloudSettings);
      } else {
        setSettings(defaultSettings);
      }

      const now = Date.now();
      setLastSync(now);
      setLastAutoSave(now);
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Manual sync trigger
  const syncWithCloud = async () => {
    await syncFromCloud();
  };

  // User actions with cloud sync
  const addXp = useCallback(async (amount: number) => {
    let currentXp = 0;
    let currentLevel = 1;

    setUser(prev => {
      const newXp = prev.xp + amount;
      const newLevel = Math.floor(newXp / 1000) + 1;
      currentXp = newXp;
      currentLevel = newLevel;
      return { ...prev, xp: newXp, level: newLevel };
    });

    // Sync to cloud
    if (isCloudEnabled) {
      await updateProfile({ xp: currentXp, level: currentLevel });
    }
  }, [setUser, isCloudEnabled, updateProfile]);

  const updateUser = useCallback((updates: Partial<UserStats>) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };

      // Sync to cloud
      if (isCloudEnabled) {
        updateProfile({
          name: updates.name,
          email: updates.email,
          avatar_url: updates.avatar,
          calories_goal: updates.caloriesGoal,
          protein_goal: updates.proteinGoal,
          carbs_goal: updates.carbsGoal,
          fats_goal: updates.fatsGoal,
          rank: updates.rank
        });
      }

      return updated;
    });
  }, [setUser, isCloudEnabled, updateProfile]);

  const resetUser = useCallback(() => {
    resetUserStorage();
  }, [resetUserStorage]);

  // Task actions with cloud sync
  const toggleTask = useCallback(async (id: string) => {
    let updatedTask: Task | null = null;

    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const newCompleted = !t.completed;
        const updated = {
          ...t,
          completed: newCompleted,
          completedAt: newCompleted ? Date.now() : undefined
        };
        updatedTask = updated;
        return updated;
      }
      return t;
    }));

    if (updatedTask && (updatedTask as any).completed) {
      await addXp((updatedTask as any).xpReward);
    }

    // Sync to cloud
    if (isCloudEnabled && updatedTask) {
      await updateTaskDb(id, updatedTask);
    }
  }, [setTasks, addXp, isCloudEnabled, updateTaskDb]);

  const addTask = useCallback(async (title: string, dueDate: string = 'TODAY', xpReward: number = 100) => {
    const newTask: Task = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: title.trim(),
      dueDate,
      completed: false,
      xpReward,
      createdAt: Date.now()
    };
    setTasks(prev => [newTask, ...prev]);

    // Sync to cloud
    if (isCloudEnabled) {
      await createTask(newTask);
    }
  }, [setTasks, isCloudEnabled, createTask]);

  const deleteTask = useCallback(async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));

    // Sync to cloud
    if (isCloudEnabled) {
      await deleteTaskDb(id);
    }
  }, [setTasks, isCloudEnabled, deleteTaskDb]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    let updatedTask: Task | null = null;
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, ...updates };
        updatedTask = updated;
        return updated;
      }
      return t;
    }));

    // Sync to cloud
    if (isCloudEnabled && updatedTask) {
      await updateTaskDb(id, updatedTask);
    }
  }, [setTasks, isCloudEnabled, updateTaskDb]);

  // Meal actions with cloud sync
  const addMeal = useCallback(async (meal: Omit<Meal, 'id' | 'timestamp'>) => {
    const newMeal: Meal = {
      ...meal,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now()
    };
    setMeals(prev => [newMeal, ...prev]);
    await addXp(50);

    // Sync to cloud
    if (isCloudEnabled) {
      await createMeal(newMeal);
    }
  }, [setMeals, addXp, isCloudEnabled, createMeal]);

  const deleteMeal = useCallback(async (id: string) => {
    setMeals(prev => prev.filter(m => m.id !== id));

    // Sync to cloud
    if (isCloudEnabled) {
      await deleteMealDb(id);
    }
  }, [setMeals, isCloudEnabled, deleteMealDb]);

  const getMealsByDate = useCallback((date: Date) => {
    const startOfDay = new Date(date).setHours(0, 0, 0, 0);
    const endOfDay = new Date(date).setHours(23, 59, 59, 999);
    return meals.filter(m => m.timestamp >= startOfDay && m.timestamp <= endOfDay);
  }, [meals]);

  // Exercise actions (local only - not synced)
  const addExercise = useCallback((exercise: Omit<Exercise, 'id'>) => {
    const newExercise: Exercise = {
      ...exercise,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    };
    setExercises(prev => [...prev, newExercise]);
  }, [setExercises]);

  const updateExercise = useCallback((id: string, updates: Partial<Exercise>) => {
    setExercises(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, [setExercises]);

  const deleteExercise = useCallback((id: string) => {
    setExercises(prev => prev.filter(e => e.id !== id));
  }, [setExercises]);

  const completeExerciseSet = useCallback((id: string) => {
    setExercises(prev => prev.map(e => {
      if (e.id === id && e.completedSets < e.sets) {
        const newCompletedSets = e.completedSets + 1;
        if (newCompletedSets === e.sets) {
          addXp(25);
        }
        return { ...e, completedSets: newCompletedSets };
      }
      return e;
    }));
  }, [setExercises, addXp]);

  const resetExercises = useCallback(() => {
    setExercises([]);
  }, [setExercises]);

  // Workout history with cloud sync
  const saveWorkoutSession = useCallback(async (session: Omit<WorkoutSession, 'id' | 'date'>) => {
    const newSession: WorkoutSession = {
      ...session,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      date: Date.now()
    };
    setWorkoutHistory(prev => [newSession, ...prev]);
    await addXp(session.totalXp);

    // Sync to cloud
    if (isCloudEnabled) {
      await createWorkout(newSession);
      // Force a global save of current profile state just to be safe
      await triggerAutoSave();
    }
  }, [setWorkoutHistory, addXp, isCloudEnabled, createWorkout, triggerAutoSave]);

  const getWorkoutHistory = useCallback(() => {
    return workoutHistory;
  }, [workoutHistory]);

  const deleteWorkoutSession = useCallback(async (id: string) => {
    setWorkoutHistory(prev => prev.filter(s => s.id !== id));

    // Sync to cloud
    if (isCloudEnabled) {
      await deleteWorkoutDb(id);
    }
  }, [setWorkoutHistory, isCloudEnabled, deleteWorkoutDb]);

  // Friends with cloud sync
  const addFriend = useCallback(async (friend: Omit<Friend, 'id'>) => {
    const newFriend: Friend = {
      ...friend,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    };
    setFriends(prev => [...prev, newFriend]);

    // Sync to cloud
    if (isCloudEnabled) {
      await createFriend(newFriend);
    }
  }, [setFriends, isCloudEnabled, createFriend]);

  const removeFriend = useCallback(async (id: string) => {
    setFriends(prev => prev.filter(f => f.id !== id));

    // Sync to cloud
    if (isCloudEnabled) {
      await deleteFriendDb(id);
    }
  }, [setFriends, isCloudEnabled, deleteFriendDb]);

  const updateFriendXp = useCallback(async (id: string, xp: number) => {
    let updatedFriend: Friend | null = null;
    setFriends(prev => prev.map(f => {
      if (f.id === id) {
        const newLevel = Math.floor(xp / 1000) + 1;
        const updated = { ...f, xp, level: newLevel };
        updatedFriend = updated;
        return updated;
      }
      return f;
    }));

    // Sync to cloud
    if (isCloudEnabled && updatedFriend) {
      await updateFriendDb(id, updatedFriend);
    }
  }, [setFriends, isCloudEnabled, updateFriendDb]);

  // Settings with cloud sync
  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...updates };
      return updated;
    });

    // Sync to cloud
    if (isCloudEnabled) {
      await updateSettingsDb(updates);
    }
  }, [setSettings, isCloudEnabled, updateSettingsDb]);

  const resetAllData = useCallback(() => {
    resetUserStorage();
    resetTasksStorage();
    resetMealsStorage();
    resetExercisesStorage();
    resetFriendsStorage();
    resetWorkoutHistoryStorage();
    resetSettingsStorage();
    setLastSync(null);
  }, [resetUserStorage, resetTasksStorage, resetMealsStorage, resetExercisesStorage, resetFriendsStorage, resetWorkoutHistoryStorage, resetSettingsStorage, setLastSync]);

  // Derived values
  const todaysMeals = useMemo(() => {
    const today = new Date();
    return getMealsByDate(today);
  }, [getMealsByDate, meals]);

  const totalCalories = useMemo(() => todaysMeals.reduce((acc, m) => acc + m.calories, 0), [todaysMeals]);
  const totalProtein = useMemo(() => todaysMeals.reduce((acc, m) => acc + m.protein, 0), [todaysMeals]);
  const totalCarbs = useMemo(() => todaysMeals.reduce((acc, m) => acc + m.carbs, 0), [todaysMeals]);
  const totalFats = useMemo(() => todaysMeals.reduce((acc, m) => acc + m.fats, 0), [todaysMeals]);

  const value = useMemo(() => ({
    user,
    tasks,
    meals: todaysMeals,
    allMeals: meals,
    exercises,
    friends,
    workoutHistory,
    settings,
    isSyncing,
    lastSync,
    lastAutoSave,
    addXp,
    updateUser,
    resetUser,
    toggleTask,
    addTask,
    deleteTask,
    updateTask,
    addMeal,
    deleteMeal,
    getMealsByDate,
    addExercise,
    updateExercise,
    deleteExercise,
    completeExerciseSet,
    resetExercises,
    saveWorkoutSession,
    getWorkoutHistory,
    deleteWorkoutSession,
    addFriend,
    removeFriend,
    updateFriendXp,
    updateSettings,
    resetAllData,
    syncWithCloud,
    triggerAutoSave,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFats
  }), [
    user, tasks, todaysMeals, meals, exercises, friends, workoutHistory, settings, isSyncing, lastSync, lastAutoSave,
    addXp, updateUser, resetUser, toggleTask, addTask, deleteTask, updateTask,
    addMeal, deleteMeal, getMealsByDate, addExercise, updateExercise, deleteExercise,
    completeExerciseSet, resetExercises, saveWorkoutSession, getWorkoutHistory,
    deleteWorkoutSession, addFriend, removeFriend, updateFriendXp, updateSettings,
    resetAllData, syncWithCloud, triggerAutoSave, totalCalories, totalProtein, totalCarbs, totalFats
  ]);

  return (
    <AppContext.Provider value={value as AppContextType}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
