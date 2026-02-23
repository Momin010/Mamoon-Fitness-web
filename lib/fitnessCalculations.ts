import { 
  Sex, 
  ActivityLevel, 
  FitnessGoal, 
  DietPreference,
  OnboardingFormData,
  FitnessCalculations 
} from '../types/fitness';

/**
 * Activity multipliers for TDEE calculation
 */
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,      // Desk job, little exercise
  light: 1.375,        // Light exercise 1-3 days/week
  moderate: 1.55,      // Moderate exercise 3-5 days/week
  active: 1.725,       // Hard exercise 6-7 days/week
  athlete: 1.9         // Very hard exercise, physical job
};

/**
 * Goal-based calorie adjustments (multiplier of TDEE)
 */
const GOAL_ADJUSTMENTS: Record<FitnessGoal, number> = {
  lose_fat: 0.8,       // -20% deficit
  build_muscle: 1.15,  // +15% surplus
  maintain: 1.0,       // Maintenance
  endurance: 1.1,      // +10% for endurance training
  strength: 1.1,       // +10% for strength training
  general_health: 1.0  // Maintenance
};

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor formula
 * Most accurate formula for general population
 */
export function calculateBMR(
  weight: number,  // in kg
  height: number,  // in cm
  age: number,
  sex: Sex
): number {
  // Base calculation
  const base = 10 * weight + 6.25 * height - 5 * age;
  
  // Sex adjustment
  if (sex === 'male') {
    return Math.round(base + 5);
  } else {
    return Math.round(base - 161);
  }
}

/**
 * Calculate Total Daily Energy Expenditure
 * TDEE = BMR × Activity Multiplier
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  return Math.round(bmr * multiplier);
}

/**
 * Calculate target calories based on goals
 * Adjusts TDEE based on primary fitness goal
 */
export function calculateTargetCalories(
  tdee: number, 
  goals: FitnessGoal[]
): number {
  if (goals.length === 0) {
    return tdee; // Default to maintenance
  }

  // Find the most aggressive adjustment
  // Priority: lose_fat > build_muscle > others
  let adjustment = 1.0;
  
  if (goals.includes('lose_fat')) {
    adjustment = GOAL_ADJUSTMENTS.lose_fat;
  } else if (goals.includes('build_muscle')) {
    adjustment = GOAL_ADJUSTMENTS.build_muscle;
  } else {
    // Use the first goal's adjustment
    adjustment = GOAL_ADJUSTMENTS[goals[0]];
  }

  return Math.round(tdee * adjustment);
}

/**
 * Calculate macronutrient targets
 * Returns grams per day for protein, carbs, and fats
 */
export function calculateMacros(
  calories: number,
  weight: number,  // in kg
  goals: FitnessGoal[],
  dietPreferences: DietPreference[]
): { protein: number; carbs: number; fats: number } {
  // Default ratios (balanced diet)
  let proteinPerKg = 1.6;  // g protein per kg body weight
  let carbsPercent = 0.45; // 45% of calories from carbs
  let fatsPercent = 0.25;  // 25% of calories from fats

  // Adjust based on goals
  if (goals.includes('build_muscle')) {
    proteinPerKg = 2.0;
    carbsPercent = 0.50;
    fatsPercent = 0.25;
  } else if (goals.includes('lose_fat')) {
    proteinPerKg = 2.2;  // Higher protein to preserve muscle
    carbsPercent = 0.30;
    fatsPercent = 0.35;
  } else if (goals.includes('strength')) {
    proteinPerKg = 1.8;
    carbsPercent = 0.45;
    fatsPercent = 0.30;
  } else if (goals.includes('endurance')) {
    proteinPerKg = 1.4;
    carbsPercent = 0.55;
    fatsPercent = 0.25;
  }

  // Adjust based on diet preferences
  if (dietPreferences.includes('keto')) {
    proteinPerKg = 1.8;
    carbsPercent = 0.05;   // Very low carbs
    fatsPercent = 0.70;    // High fats
  } else if (dietPreferences.includes('low_carb')) {
    proteinPerKg = 2.0;
    carbsPercent = 0.20;
    fatsPercent = 0.45;
  } else if (dietPreferences.includes('high_protein')) {
    proteinPerKg = 2.2;
    carbsPercent = 0.40;
    fatsPercent = 0.25;
  }

  // Calculate grams
  // Protein: based on body weight
  const protein = Math.round(weight * proteinPerKg);
  
  // Fats: 1g fat = 9 calories
  const fats = Math.round((calories * fatsPercent) / 9);
  
  // Carbs: remaining calories, 1g carb = 4 calories
  const proteinCalories = protein * 4;
  const fatsCalories = fats * 9;
  const remainingCalories = calories - proteinCalories - fatsCalories;
  const carbs = Math.max(0, Math.round(remainingCalories / 4));

  return { protein, carbs, fats };
}

/**
 * Calculate all fitness values from onboarding data
 */
export function calculateAllValues(data: OnboardingFormData): FitnessCalculations {
  // Validate required fields
  if (!data.weight_kg || !data.height_cm || !data.age || !data.sex || !data.activity_level) {
    throw new Error('Missing required fields for calculation');
  }

  // Calculate BMR
  const bmr = calculateBMR(data.weight_kg, data.height_cm, data.age, data.sex);

  // Calculate TDEE
  const tdee = calculateTDEE(bmr, data.activity_level);

  // Calculate target calories
  const targetCalories = calculateTargetCalories(tdee, data.goals);

  // Calculate macros
  const { protein, carbs, fats } = calculateMacros(
    targetCalories,
    data.weight_kg,
    data.goals,
    data.diet_preferences
  );

  return {
    bmr,
    tdee,
    targetCalories,
    protein,
    carbs,
    fats
  };
}

/**
 * Get activity level description
 */
export function getActivityDescription(level: ActivityLevel): string {
  const descriptions: Record<ActivityLevel, string> = {
    sedentary: 'Desk job with little to no exercise',
    light: 'Light exercise 1-3 days per week',
    moderate: 'Moderate exercise 3-5 days per week',
    active: 'Hard exercise 6-7 days per week',
    athlete: 'Very intense exercise, physical job, or athlete'
  };
  return descriptions[level];
}

/**
 * Get goal description
 */
export function getGoalDescription(goal: FitnessGoal): string {
  const descriptions: Record<FitnessGoal, string> = {
    lose_fat: 'Reduce body fat while preserving muscle',
    build_muscle: 'Gain muscle mass and strength',
    maintain: 'Maintain current weight and physique',
    endurance: 'Improve cardiovascular fitness',
    strength: 'Increase maximum strength',
    general_health: 'Improve overall health and wellness'
  };
  return descriptions[goal];
}

/**
 * Get BMI category
 */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

/**
 * Calculate BMI
 */
export function calculateBMI(weight: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weight / (heightM * heightM)) * 10) / 10;
}

/**
 * Estimate body fat (if not provided) using BMI-based formula
 * Note: This is a rough estimate, not as accurate as actual measurements
 */
export function estimateBodyFat(
  bmi: number, 
  age: number, 
  sex: Sex
): number {
  // Using a modified BMI-based formula
  // This is an estimate and not very accurate
  if (sex === 'male') {
    return Math.round((1.20 * bmi + 0.23 * age - 16.2) * 10) / 10;
  } else {
    return Math.round((1.20 * bmi + 0.23 * age - 5.4) * 10) / 10;
  }
}
