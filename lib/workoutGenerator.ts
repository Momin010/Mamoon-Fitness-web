import { 
  Exercise, 
  ExperienceLevel, 
  FitnessGoal,
  WorkoutDay,
  WorkoutExercise,
  WeeklyWorkout,
  OnboardingFormData
} from '../types/fitness';
import { exerciseService } from './exerciseService';

/**
 * Workout split configurations by experience level
 */
const WORKOUT_CONFIGS: Record<ExperienceLevel, {
  daysPerWeek: number;
  splitType: 'full_body' | 'upper_lower' | 'push_pull_legs';
}> = {
  beginner: {
    daysPerWeek: 3,
    splitType: 'full_body'
  },
  intermediate: {
    daysPerWeek: 4,
    splitType: 'upper_lower'
  },
  advanced: {
    daysPerWeek: 5,
    splitType: 'push_pull_legs'
  }
};

/**
 * Rest times in seconds based on goal
 */
const REST_TIMES: Record<string, number> = {
  strength: 180,      // 3 minutes
  build_muscle: 90,   // 1.5 minutes
  lose_fat: 60,       // 1 minute
  endurance: 45,      // 45 seconds
  default: 90         // 1.5 minutes
};

/**
 * Rep ranges based on goal
 */
const REP_RANGES: Record<string, string> = {
  strength: '4-6',
  build_muscle: '8-12',
  lose_fat: '12-15',
  endurance: '15-20',
  default: '8-12'
};

/**
 * Get rest time based on goals
 */
function getRestTime(goals: FitnessGoal[]): number {
  if (goals.includes('strength')) return REST_TIMES.strength;
  if (goals.includes('build_muscle')) return REST_TIMES.build_muscle;
  if (goals.includes('lose_fat')) return REST_TIMES.lose_fat;
  if (goals.includes('endurance')) return REST_TIMES.endurance;
  return REST_TIMES.default;
}

/**
 * Get rep range based on goals
 */
function getRepRange(goals: FitnessGoal[]): string {
  if (goals.includes('strength')) return REP_RANGES.strength;
  if (goals.includes('build_muscle')) return REP_RANGES.build_muscle;
  if (goals.includes('lose_fat')) return REP_RANGES.lose_fat;
  if (goals.includes('endurance')) return REP_RANGES.endurance;
  return REP_RANGES.default;
}

/**
 * Select exercises for a workout, prioritizing compound movements
 */
function selectExercises(
  options: {
    muscles: string[];
    level: ExperienceLevel;
    count: number;
    force?: 'push' | 'pull';
    preferCompound?: boolean;
  }
): WorkoutExercise[] {
  const { muscles, level, count, force, preferCompound = true } = options;
  
  // Get exercises filtered by level and muscle
  let exercises: Exercise[] = [];
  
  muscles.forEach(muscle => {
    const filtered = exerciseService.filter({
      level,
      muscle,
      force
    });
    exercises.push(...filtered);
  });

  // Remove duplicates
  const uniqueExercises = Array.from(
    new Map(exercises.map(e => [e.id, e])).values()
  );

  // Sort: compound exercises first if preferred
  if (preferCompound) {
    uniqueExercises.sort((a, b) => {
      if (a.mechanic === 'compound' && b.mechanic !== 'compound') return -1;
      if (a.mechanic !== 'compound' && b.mechanic === 'compound') return 1;
      return 0;
    });
  }

  // Take the requested count
  const selected = uniqueExercises.slice(0, count);

  return selected.map(exercise => ({
    exercise,
    sets: 3,
    reps: '8-12',
    restSeconds: 90
  }));
}

/**
 * Generate a beginner full body workout
 */
function generateBeginnerWorkout(goals: FitnessGoal[]): WorkoutDay[] {
  const restTime = getRestTime(goals);
  const repRange = getRepRange(goals);
  
  // Get beginner exercises
  const beginnerExercises = exerciseService.getByLevel('beginner');
  
  // Push exercises (chest, shoulders, triceps)
  const pushExercises = beginnerExercises
    .filter(e => e.force === 'push' && ['chest', 'shoulders'].some(m => e.primaryMuscles.includes(m)))
    .slice(0, 6);
  
  // Pull exercises (back, biceps)
  const pullExercises = beginnerExercises
    .filter(e => e.force === 'pull' && ['lats', 'middle back', 'biceps'].some(m => e.primaryMuscles.includes(m)))
    .slice(0, 6);
  
  // Leg exercises
  const legExercises = beginnerExercises
    .filter(e => ['quadriceps', 'hamstrings', 'glutes'].some(m => e.primaryMuscles.includes(m)))
    .slice(0, 6);
  
  // Core exercises
  const coreExercises = beginnerExercises
    .filter(e => e.primaryMuscles.includes('abdominals'))
    .slice(0, 6);

  const createWorkoutExercise = (exercise: Exercise): WorkoutExercise => ({
    exercise,
    sets: 3,
    reps: repRange,
    restSeconds: restTime
  });

  // Day 1: Full Body A
  const day1: WorkoutDay = {
    day: 1,
    name: 'Full Body A',
    isRestDay: false,
    exercises: [
      createWorkoutExercise(pushExercises[0]), // Chest push
      createWorkoutExercise(pullExercises[0]), // Back pull
      createWorkoutExercise(legExercises[0]),  // Quads
      createWorkoutExercise(pushExercises[1]), // Shoulders
      createWorkoutExercise(legExercises[1]),  // Hamstrings/glutes
      createWorkoutExercise(coreExercises[0]), // Core
    ].filter(e => e.exercise !== undefined)
  };

  // Day 2: Rest
  const day2: WorkoutDay = {
    day: 2,
    name: 'Rest',
    isRestDay: true,
    exercises: []
  };

  // Day 3: Full Body B
  const day3: WorkoutDay = {
    day: 3,
    name: 'Full Body B',
    isRestDay: false,
    exercises: [
      createWorkoutExercise(legExercises[2] || legExercises[0]), // Different leg
      createWorkoutExercise(pushExercises[2] || pushExercises[0]), // Different push
      createWorkoutExercise(pullExercises[1] || pullExercises[0]), // Different pull
      createWorkoutExercise(legExercises[3] || legExercises[1]), // Different leg
      createWorkoutExercise(pushExercises[3] || pushExercises[1]), // Different push
      createWorkoutExercise(coreExercises[1] || coreExercises[0]), // Different core
    ].filter(e => e.exercise !== undefined)
  };

  // Day 4: Rest
  const day4: WorkoutDay = {
    day: 4,
    name: 'Rest',
    isRestDay: true,
    exercises: []
  };

  // Day 5: Full Body C
  const day5: WorkoutDay = {
    day: 5,
    name: 'Full Body C',
    isRestDay: false,
    exercises: [
      createWorkoutExercise(pullExercises[2] || pullExercises[0]),
      createWorkoutExercise(pushExercises[4] || pushExercises[0]),
      createWorkoutExercise(legExercises[4] || legExercises[0]),
      createWorkoutExercise(pullExercises[3] || pullExercises[1]),
      createWorkoutExercise(legExercises[5] || legExercises[1]),
      createWorkoutExercise(coreExercises[2] || coreExercises[0]),
    ].filter(e => e.exercise !== undefined)
  };

  // Days 6-7: Rest
  const day6: WorkoutDay = {
    day: 6,
    name: 'Rest',
    isRestDay: true,
    exercises: []
  };

  const day7: WorkoutDay = {
    day: 7,
    name: 'Rest',
    isRestDay: true,
    exercises: []
  };

  return [day1, day2, day3, day4, day5, day6, day7];
}

/**
 * Generate an intermediate upper/lower split
 */
function generateIntermediateWorkout(goals: FitnessGoal[]): WorkoutDay[] {
  const restTime = getRestTime(goals);
  const repRange = getRepRange(goals);
  
  const intermediateExercises = exerciseService.getByLevel('intermediate');
  const beginnerExercises = exerciseService.getByLevel('beginner');
  
  // Combine intermediate and beginner for more options
  const allExercises = [...intermediateExercises, ...beginnerExercises];

  const createWorkoutExercise = (exercise: Exercise): WorkoutExercise => ({
    exercise,
    sets: 3,
    reps: repRange,
    restSeconds: restTime
  });

  // Upper body exercises
  const upperPush = allExercises
    .filter(e => e.force === 'push' && ['chest', 'shoulders', 'triceps'].some(m => e.primaryMuscles.includes(m)))
    .slice(0, 8);
  
  const upperPull = allExercises
    .filter(e => e.force === 'pull' && ['lats', 'middle back', 'biceps', 'traps'].some(m => e.primaryMuscles.includes(m)))
    .slice(0, 8);

  // Lower body exercises
  const lowerExercises = allExercises
    .filter(e => ['quadriceps', 'hamstrings', 'glutes', 'calves'].some(m => e.primaryMuscles.includes(m)))
    .slice(0, 10);

  // Day 1: Upper A
  const day1: WorkoutDay = {
    day: 1,
    name: 'Upper Body A',
    isRestDay: false,
    exercises: [
      createWorkoutExercise(upperPush[0]),
      createWorkoutExercise(upperPull[0]),
      createWorkoutExercise(upperPush[1]),
      createWorkoutExercise(upperPull[1]),
      createWorkoutExercise(upperPush[2]),
      createWorkoutExercise(upperPull[2]),
    ].filter(e => e.exercise !== undefined)
  };

  // Day 2: Lower A
  const day2: WorkoutDay = {
    day: 2,
    name: 'Lower Body A',
    isRestDay: false,
    exercises: [
      createWorkoutExercise(lowerExercises[0]),
      createWorkoutExercise(lowerExercises[1]),
      createWorkoutExercise(lowerExercises[2]),
      createWorkoutExercise(lowerExercises[3]),
      createWorkoutExercise(lowerExercises[4]),
    ].filter(e => e.exercise !== undefined)
  };

  // Day 3: Rest
  const day3: WorkoutDay = {
    day: 3,
    name: 'Rest',
    isRestDay: true,
    exercises: []
  };

  // Day 4: Upper B
  const day4: WorkoutDay = {
    day: 4,
    name: 'Upper Body B',
    isRestDay: false,
    exercises: [
      createWorkoutExercise(upperPull[3] || upperPull[0]),
      createWorkoutExercise(upperPush[3] || upperPush[0]),
      createWorkoutExercise(upperPull[4] || upperPull[1]),
      createWorkoutExercise(upperPush[4] || upperPush[1]),
      createWorkoutExercise(upperPull[5] || upperPull[2]),
      createWorkoutExercise(upperPush[5] || upperPush[2]),
    ].filter(e => e.exercise !== undefined)
  };

  // Day 5: Lower B
  const day5: WorkoutDay = {
    day: 5,
    name: 'Lower Body B',
    isRestDay: false,
    exercises: [
      createWorkoutExercise(lowerExercises[5] || lowerExercises[0]),
      createWorkoutExercise(lowerExercises[6] || lowerExercises[1]),
      createWorkoutExercise(lowerExercises[7] || lowerExercises[2]),
      createWorkoutExercise(lowerExercises[8] || lowerExercises[3]),
      createWorkoutExercise(lowerExercises[9] || lowerExercises[4]),
    ].filter(e => e.exercise !== undefined)
  };

  // Days 6-7: Rest
  const day6: WorkoutDay = {
    day: 6,
    name: 'Rest',
    isRestDay: true,
    exercises: []
  };

  const day7: WorkoutDay = {
    day: 7,
    name: 'Rest',
    isRestDay: true,
    exercises: []
  };

  return [day1, day2, day3, day4, day5, day6, day7];
}

/**
 * Generate an advanced push/pull/legs split
 */
function generateAdvancedWorkout(goals: FitnessGoal[]): WorkoutDay[] {
  const restTime = getRestTime(goals);
  const repRange = getRepRange(goals);
  
  const advancedExercises = exerciseService.getByLevel('advanced');
  const intermediateExercises = exerciseService.getByLevel('intermediate');
  const allExercises = [...advancedExercises, ...intermediateExercises];

  const createWorkoutExercise = (exercise: Exercise, sets: number = 3): WorkoutExercise => ({
    exercise,
    sets,
    reps: repRange,
    restSeconds: restTime
  });

  // Push muscles: chest, shoulders, triceps
  const pushExercises = allExercises
    .filter(e => e.force === 'push')
    .slice(0, 12);

  // Pull muscles: back, biceps, rear delts
  const pullExercises = allExercises
    .filter(e => e.force === 'pull')
    .slice(0, 12);

  // Leg muscles
  const legExercises = allExercises
    .filter(e => ['quadriceps', 'hamstrings', 'glutes', 'calves'].some(m => e.primaryMuscles.includes(m)))
    .slice(0, 12);

  // Day 1: Push
  const day1: WorkoutDay = {
    day: 1,
    name: 'Push Day',
    isRestDay: false,
    exercises: [
      createWorkoutExercise(pushExercises[0], 4), // Compound
      createWorkoutExercise(pushExercises[1], 3),
      createWorkoutExercise(pushExercises[2], 3),
      createWorkoutExercise(pushExercises[3], 3),
      createWorkoutExercise(pushExercises[4], 3),
    ].filter(e => e.exercise !== undefined)
  };

  // Day 2: Pull
  const day2: WorkoutDay = {
    day: 2,
    name: 'Pull Day',
    isRestDay: false,
    exercises: [
      createWorkoutExercise(pullExercises[0], 4),
      createWorkoutExercise(pullExercises[1], 3),
      createWorkoutExercise(pullExercises[2], 3),
      createWorkoutExercise(pullExercises[3], 3),
      createWorkoutExercise(pullExercises[4], 3),
    ].filter(e => e.exercise !== undefined)
  };

  // Day 3: Legs
  const day3: WorkoutDay = {
    day: 3,
    name: 'Leg Day',
    isRestDay: false,
    exercises: [
      createWorkoutExercise(legExercises[0], 4),
      createWorkoutExercise(legExercises[1], 3),
      createWorkoutExercise(legExercises[2], 3),
      createWorkoutExercise(legExercises[3], 3),
      createWorkoutExercise(legExercises[4], 3),
    ].filter(e => e.exercise !== undefined)
  };

  // Day 4: Rest
  const day4: WorkoutDay = {
    day: 4,
    name: 'Rest',
    isRestDay: true,
    exercises: []
  };

  // Day 5: Upper (Push + Pull)
  const day5: WorkoutDay = {
    day: 5,
    name: 'Upper Body',
    isRestDay: false,
    exercises: [
      createWorkoutExercise(pushExercises[5] || pushExercises[0]),
      createWorkoutExercise(pullExercises[5] || pullExercises[0]),
      createWorkoutExercise(pushExercises[6] || pushExercises[1]),
      createWorkoutExercise(pullExercises[6] || pullExercises[1]),
      createWorkoutExercise(pushExercises[7] || pushExercises[2]),
    ].filter(e => e.exercise !== undefined)
  };

  // Day 6: Lower
  const day6: WorkoutDay = {
    day: 6,
    name: 'Lower Body',
    isRestDay: false,
    exercises: [
      createWorkoutExercise(legExercises[5] || legExercises[0]),
      createWorkoutExercise(legExercises[6] || legExercises[1]),
      createWorkoutExercise(legExercises[7] || legExercises[2]),
      createWorkoutExercise(legExercises[8] || legExercises[3]),
      createWorkoutExercise(legExercises[9] || legExercises[4]),
    ].filter(e => e.exercise !== undefined)
  };

  // Day 7: Rest
  const day7: WorkoutDay = {
    day: 7,
    name: 'Rest',
    isRestDay: true,
    exercises: []
  };

  return [day1, day2, day3, day4, day5, day6, day7];
}

/**
 * Generate a weekly workout plan based on user profile
 */
export function generateWeeklyWorkout(data: OnboardingFormData): WeeklyWorkout {
  let days: WorkoutDay[];

  switch (data.experience_level) {
    case 'beginner':
      days = generateBeginnerWorkout(data.goals);
      break;
    case 'intermediate':
      days = generateIntermediateWorkout(data.goals);
      break;
    case 'advanced':
      days = generateAdvancedWorkout(data.goals);
      break;
    default:
      days = generateBeginnerWorkout(data.goals);
  }

  return {
    weekNumber: 1,
    days,
    createdAt: new Date()
  };
}

/**
 * Get workout summary text
 */
export function getWorkoutSummary(workout: WeeklyWorkout): string {
  const workoutDays = workout.days.filter(d => !d.isRestDay).length;
  const totalExercises = workout.days.reduce(
    (sum, day) => sum + day.exercises.length, 
    0
  );
  
  return `${workoutDays} days/week, ${totalExercises} total exercises`;
}
