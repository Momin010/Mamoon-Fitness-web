// Exercise types from free-exercise-db
export type ExerciseLevel = 'beginner' | 'intermediate' | 'advanced';
export type ExerciseForce = 'push' | 'pull' | null;
export type ExerciseMechanic = 'compound' | 'isolation' | null;
export type ExerciseCategory = 'strength' | 'cardio' | 'stretching' | 'olympic_weightlifting' | 'plyometrics';

export interface Exercise {
  id: string;
  name: string;
  force: ExerciseForce;
  level: ExerciseLevel;
  mechanic: ExerciseMechanic;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: ExerciseCategory;
  images: string[];
}

// User profile types
export type Sex = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type FitnessGoal = 
  | 'lose_fat' 
  | 'build_muscle' 
  | 'maintain' 
  | 'endurance' 
  | 'strength' 
  | 'general_health';

export type DietPreference = 
  | 'high_protein' 
  | 'balanced' 
  | 'low_carb' 
  | 'keto' 
  | 'vegetarian' 
  | 'vegan' 
  | 'halal' 
  | 'no_preference';

export interface UserProfile {
  id?: string;
  // Body Metrics
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
  sex: Sex | null;
  body_fat_percent: number | null;
  
  // Fitness Goals
  goals: FitnessGoal[];
  
  // Activity Level
  activity_level: ActivityLevel | null;
  
  // Nutrition Preferences
  diet_preferences: DietPreference[];
  
  // Workout Experience
  experience_level: ExperienceLevel | null;
  
  // Calculated Values
  bmr: number | null;
  tdee: number | null;
  target_calories: number | null;
  target_protein_g: number | null;
  target_carbs_g: number | null;
  target_fats_g: number | null;
  
  // Onboarding Status
  onboarding_completed: boolean;
}

// Form data for onboarding (before saving)
export interface OnboardingFormData {
  height_cm: number;
  weight_kg: number;
  age: number;
  sex: Sex;
  body_fat_percent: number | null;
  goals: FitnessGoal[];
  activity_level: ActivityLevel;
  diet_preferences: DietPreference[];
  experience_level: ExperienceLevel;
}

// Workout types
export interface WorkoutExercise {
  exercise: Exercise;
  sets: number;
  reps: string; // e.g., "8-12" or "12-15" or "30 seconds"
  restSeconds: number;
  notes?: string;
}

export interface WorkoutDay {
  day: number;
  name: string; // e.g., "Full Body A", "Push Day", "Rest"
  isRestDay: boolean;
  exercises: WorkoutExercise[];
}

export interface WeeklyWorkout {
  userId?: string;
  weekNumber: number;
  days: WorkoutDay[];
  createdAt: Date;
}

// Calculated fitness values
export interface FitnessCalculations {
  bmr: number;
  tdee: number;
  targetCalories: number;
  protein: number;
  carbs: number;
  fats: number;
}
