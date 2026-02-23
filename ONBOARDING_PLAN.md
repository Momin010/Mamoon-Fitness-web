# Fitness App Onboarding & Personalization Plan

## Overview
Add a multi-step onboarding flow for new users that collects their fitness data, then use scientific formulas + open exercise database to generate personalized workout and nutrition recommendations.

---

## Phase 1: Database Schema (Supabase)

### New Table: `user_profiles`
```sql
create table user_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    -- Body Metrics
    height_cm integer,
    weight_kg decimal(5,2),
    age integer,
    sex text check (sex in ('male', 'female', 'other')),
    body_fat_percent decimal(4,1),
    
    -- Fitness Goals (array for multi-select)
    goals text[], -- 'lose_fat', 'build_muscle', 'maintain', 'endurance', 'strength', 'general_health'
    
    -- Activity Level
    activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'athlete')),
    
    -- Nutrition Preferences (array for multi-select)
    diet_preferences text[], -- 'high_protein', 'balanced', 'low_carb', 'keto', 'vegetarian', 'vegan', 'halal'
    
    -- Workout Experience
    experience_level text check (experience_level in ('beginner', 'intermediate', 'advanced')),
    
    -- Calculated Values (auto-computed after onboarding)
    bmr integer,                    -- Basal Metabolic Rate
    tdee integer,                   -- Total Daily Energy Expenditure
    target_calories integer,        -- Goal-adjusted calories
    target_protein_g integer,       -- Daily protein target
    target_carbs_g integer,         -- Daily carbs target
    target_fats_g integer,          -- Daily fats target
    
    -- Onboarding Status
    onboarding_completed boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

---

## Phase 2: Multi-Step Onboarding UI

### Step 1: Welcome Screen
- Brief explanation of what the app does
- "Let's personalize your fitness journey"
- Single "Get Started" button

### Step 2: Body Metrics
- Height (cm) - slider or input
- Weight (kg) - slider or input
- Age - input or date picker
- Sex - radio buttons (Male/Female/Other)
- Body Fat % (optional) - input with "Skip" option

### Step 3: Fitness Goals (Multi-Select)
Cards with icons that can be toggled:
- 🔥 Lose Fat
- 💪 Build Muscle
- ⚖️ Maintain Weight
- 🏃 Improve Endurance
- 🏋️ Increase Strength
- ❤️ General Health

### Step 4: Activity Level (Radio Cards)
- 🛋️ **Sedentary** - Desk job, little exercise
- 🚶 **Lightly Active** - Light exercise 1-3 days/week
- 🏃 **Moderately Active** - Moderate exercise 3-5 days/week
- 💪 **Very Active** - Hard exercise 6-7 days/week
- 🏆 **Athlete** - Very hard exercise, physical job

### Step 5: Nutrition Preferences (Multi-Select)
- 🥩 High Protein
- ⚖️ Balanced Diet
- 🥖 Low Carb
- 🥑 Keto
- 🥬 Vegetarian
- 🌱 Vegan
- ☪️ Halal Only
- ❓ No Preference

### Step 6: Workout Experience
- 🌱 **Beginner** - New to working out
- 📈 **Intermediate** - 6 months - 2 years experience
- 🔥 **Advanced** - 2+ years experience

### Step 7: Summary & Generate Plan
- Show all selected options
- "Generate My Plan" button
- Loading animation while calculating

---

## Phase 3: Calculation Engine

### A. Calorie Calculations (Mifflin-St Jeor Formula)

```typescript
// Basal Metabolic Rate
function calculateBMR(weight: number, height: number, age: number, sex: 'male' | 'female'): number {
  if (sex === 'male') {
    return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  } else {
    return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
  }
}

// Activity Multipliers
const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9
};

// TDEE (Total Daily Energy Expenditure)
function calculateTDEE(bmr: number, activityLevel: string): number {
  return Math.round(bmr * activityMultipliers[activityLevel]);
}

// Goal Adjustments
const goalAdjustments = {
  lose_fat: 0.8,        // -20%
  build_muscle: 1.15,   // +15%
  maintain: 1.0,        // 0%
  endurance: 1.1,       // +10%
  strength: 1.1,        // +10%
  general_health: 1.0   // 0%
};

// Target Calories
function calculateTargetCalories(tdee: number, goals: string[]): number {
  // Use the most aggressive goal adjustment
  const adjustment = goals.reduce((min, goal) => {
    const adj = goalAdjustments[goal] || 1.0;
    return Math.min(min, adj);
  }, 1.5);
  
  return Math.round(tdee * adjustment);
}
```

### B. Macro Calculations

```typescript
function calculateMacros(calories: number, weight: number, goals: string[]): {
  protein: number;
  carbs: number;
  fats: number;
} {
  let proteinRatio = 1.6; // g per kg body weight
  let carbsPercent = 0.45;
  let fatsPercent = 0.25;
  
  if (goals.includes('build_muscle')) {
    proteinRatio = 2.0;
    carbsPercent = 0.50;
    fatsPercent = 0.25;
  } else if (goals.includes('lose_fat')) {
    proteinRatio = 2.2;
    carbsPercent = 0.30;
    fatsPercent = 0.35;
  } else if (goals.includes('keto')) {
    proteinRatio = 1.8;
    carbsPercent = 0.05;
    fatsPercent = 0.70;
  }
  
  const protein = Math.round(weight * proteinRatio);
  const fats = Math.round((calories * fatsPercent) / 9);
  const carbs = Math.round((calories * carbsPercent) / 4);
  
  return { protein, carbs, fats };
}
```

---

## Phase 4: Exercise Database Integration

### Source: free-exercise-db (GitHub)
- URL: https://github.com/yuhonas/free-exercise-db
- License: Unlicense (Public Domain)
- Contains: 800+ exercises with images
- Format: JSON

### Implementation Steps:
1. Download `dist/exercises.json` from the repo
2. Store in `lib/data/exercises.json`
3. Create exercise service to filter/query exercises

### Exercise Data Structure:
```typescript
interface Exercise {
  id: string;
  name: string;
  force: 'push' | 'pull' | null;
  level: 'beginner' | 'intermediate' | 'advanced';
  mechanic: 'compound' | 'isolation' | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: 'strength' | 'cardio' | 'stretching' | 'olympic_weightlifting' | 'plyometrics';
  images: string[];
}
```

### Exercise Service:
```typescript
// lib/exerciseService.ts
class ExerciseService {
  private exercises: Exercise[];
  
  constructor(exercisesData: Exercise[]) {
    this.exercises = exercisesData;
  }
  
  // Filter by experience level
  getByLevel(level: string): Exercise[] {
    return this.exercises.filter(e => e.level === level);
  }
  
  // Filter by muscle group
  getByMuscle(muscle: string): Exercise[] {
    return this.exercises.filter(e => 
      e.primaryMuscles.includes(muscle) || 
      e.secondaryMuscles.includes(muscle)
    );
  }
  
  // Filter by equipment (bodyweight for beginners)
  getByEquipment(equipment: string): Exercise[] {
    return this.exercises.filter(e => e.equipment === equipment);
  }
  
  // Get workout split for user
  generateWorkoutSplit(userProfile: UserProfile): WeeklyWorkout {
    // Logic to create personalized weekly workout
  }
}
```

---

## Phase 5: Workout Plan Generation

### Weekly Split Based on Experience:

**Beginner (3 days/week):**
- Day 1: Full Body A
- Day 2: Rest
- Day 3: Full Body B
- Day 4: Rest
- Day 5: Full Body C
- Day 6-7: Rest

**Intermediate (4 days/week):**
- Day 1: Upper Body
- Day 2: Lower Body
- Day 3: Rest
- Day 4: Push
- Day 5: Pull
- Day 6-7: Rest

**Advanced (5-6 days/week):**
- Day 1: Chest & Triceps
- Day 2: Back & Biceps
- Day 3: Legs & Shoulders
- Day 4: Rest
- Day 5: Upper Body
- Day 6: Lower Body
- Day 7: Rest

### Exercise Selection Logic:
1. Filter by user's experience level
2. Prioritize compound movements for main lifts
3. Add isolation exercises for accessory work
4. Consider available equipment (bodyweight vs gym)
5. Balance push/pull movements

---

## Phase 6: Implementation Order

### Step 1: Database Setup
- [ ] Create `user_profiles` table in Supabase
- [ ] Add RLS policies
- [ ] Test with Supabase client

### Step 2: Exercise Data
- [ ] Download exercises.json from free-exercise-db
- [ ] Create `lib/data/exercises.json`
- [ ] Create `lib/exerciseService.ts`
- [ ] Add TypeScript types for exercises

### Step 3: Calculation Engine
- [ ] Create `lib/fitnessCalculations.ts`
- [ ] Implement BMR calculation
- [ ] Implement TDEE calculation
- [ ] Implement macro calculation
- [ ] Add unit tests

### Step 4: Onboarding UI Components
- [ ] Create `components/onboarding/OnboardingFlow.tsx`
- [ ] Create `components/onboarding/WelcomeStep.tsx`
- [ ] Create `components/onboarding/BodyMetricsStep.tsx`
- [ ] Create `components/onboarding/GoalsStep.tsx`
- [ ] Create `components/onboarding/ActivityStep.tsx`
- [ ] Create `components/onboarding/DietStep.tsx`
- [ ] Create `components/onboarding/ExperienceStep.tsx`
- [ ] Create `components/onboarding/SummaryStep.tsx`

### Step 5: Integration
- [ ] Add onboarding check in `App.tsx` or `_layout.tsx`
- [ ] Redirect new users to onboarding
- [ ] Save profile to Supabase after completion
- [ ] Calculate and store TDEE/macros

### Step 6: Dashboard Updates
- [ ] Show personalized calorie/macro targets
- [ ] Display recommended workout plan
- [ ] Add "Edit Profile" option in settings

---

## Phase 7: Future Enhancements (Not Now)

- AI-generated meal plans using local model
- Progress tracking with chart visualizations
- Workout plan periodization (change every 4-6 weeks)
- Recovery recommendations based on workout intensity
- Integration with wearable devices

---

## File Structure After Implementation

```
lib/
├── data/
│   └── exercises.json          # 800+ exercises from free-exercise-db
├── exerciseService.ts          # Exercise filtering/querying
├── fitnessCalculations.ts      # BMR, TDEE, macro calculations
└── workoutGenerator.ts         # Workout plan generation

components/
├── onboarding/
│   ├── OnboardingFlow.tsx      # Main onboarding container
│   ├── WelcomeStep.tsx         # Step 1
│   ├── BodyMetricsStep.tsx     # Step 2
│   ├── GoalsStep.tsx           # Step 3
│   ├── ActivityStep.tsx        # Step 4
│   ├── DietStep.tsx            # Step 5
│   ├── ExperienceStep.tsx      # Step 6
│   └── SummaryStep.tsx         # Step 7
└── ...

pages/
└── OnboardingPage.tsx          # New onboarding page
```

---

## Estimated Effort

| Task | Time |
|------|------|
| Database schema & migration | 30 min |
| Exercise data integration | 1 hour |
| Calculation engine | 2 hours |
| Onboarding UI (7 steps) | 4-5 hours |
| Integration & testing | 2 hours |
| **Total** | **~10 hours** |

---

## Notes

- All calculations happen client-side (no API needed)
- Exercise database is bundled with app (offline-capable)
- No external AI model required for MVP
- Can add AI enhancements later
