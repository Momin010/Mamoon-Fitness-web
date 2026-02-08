
export interface Task {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  xpReward: number;
  createdAt?: number;
  completedAt?: number;
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  timestamp: number;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  barcode?: string;
  servingSize?: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  completedSets: number;
  weight?: number;
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  date: number;
  exercises: Exercise[];
  duration: number;
  totalXp: number;
  notes?: string;
}

export interface UserStats {
  xp: number;
  level: number;
  caloriesGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatsGoal: number;
  name: string;
  rank: number;
  email?: string;
  avatar?: string;
  joinedAt?: number;
}

export interface Friend {
  id: string;
  name: string;
  xp: number;
  level: number;
  tier: string;
  avatar: string;
  lastActive?: number;
}
