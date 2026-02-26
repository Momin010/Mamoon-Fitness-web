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
 * Enhanced workout split configurations by experience level
 */
const WORKOUT_CONFIGS: Record<ExperienceLevel, {
  daysPerWeek: number;
  splitType: 'full_body' | 'upper_lower' | 'push_pull_legs';
  minExercises: number;
  maxExercises: number;
}> = {
  beginner: {
    daysPerWeek: 3,
    splitType: 'full_body',
    minExercises: 4,
    maxExercises: 6
  },
  intermediate: {
    daysPerWeek: 4,
    splitType: 'upper_lower',
    minExercises: 5,
    maxExercises: 7
  },
  advanced: {
    daysPerWeek: 5,
    splitType: 'push_pull_legs',
    minExercises: 5,
    maxExercises: 8
  }
};

/**
 * Enhanced rest times in seconds based on goal
 */
const REST_TIMES: Record<string, number> = {
  strength: 180,      // 3 minutes
  build_muscle: 90,   // 1.5 minutes
  lose_fat: 60,       // 1 minute
  endurance: 45,      // 45 seconds
  default: 90         // 1.5 minutes
};

/**
 * Enhanced rep ranges based on goal
 */
const REP_RANGES: Record<string, string> = {
  strength: '4-6',
  build_muscle: '8-12',
  lose_fat: '12-15',
  endurance: '15-20',
  default: '8-12'
};

/**
 * Enhanced exercise categories for better organization
 */
const EXERCISE_CATEGORIES = {
  push: ['chest', 'shoulders', 'triceps'],
  pull: ['lats', 'middle back', 'biceps', 'traps'],
  legs: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
  core: ['abdominals', 'lower back']
};

/**
 * Enhanced get rest time based on goals with fallback
 */
function getRestTime(goals: FitnessGoal[]): number {
  if (!goals || goals.length === 0) return REST_TIMES.default;
  
  if (goals.includes('strength')) return REST_TIMES.strength;
  if (goals.includes('build_muscle')) return REST_TIMES.build_muscle;
  if (goals.includes('lose_fat')) return REST_TIMES.lose_fat;
  if (goals.includes('endurance')) return REST_TIMES.endurance;
  return REST_TIMES.default;
}

/**
 * Enhanced get rep range based on goals with fallback
 */
function getRepRange(goals: FitnessGoal[]): string {
  if (!goals || goals.length === 0) return REP_RANGES.default;
  
  if (goals.includes('strength')) return REP_RANGES.strength;
  if (goals.includes('build_muscle')) return REP_RANGES.build_muscle;
  if (goals.includes('lose_fat')) return REP_RANGES.lose_fat;
  if (goals.includes('endurance')) return REP_RANGES.endurance;
  return REP_RANGES.default;
}

/**
 * Enhanced select exercises for a workout with better error handling
 */
function selectExercises(
  options: {
    muscles: string[];
    level: ExperienceLevel;
    count: number;
    force?: 'push' | 'pull';
    preferCompound?: boolean;
    equipment?: string[];
  }
): WorkoutExercise[] {
  const { muscles, level, count, force, preferCompound = true, equipment } = options;
  
  try {
    // Validate inputs
    if (!muscles || muscles.length === 0) {
      console.warn('No muscles specified for exercise selection');
      return [];
    }
    
    if (count <= 0) {
      console.warn('Invalid exercise count:', count);
      return [];
    }
    
    // Get exercises filtered by level and muscle
    let exercises: Exercise[] = [];
    
    muscles.forEach(muscle => {
      try {
        const filtered = exerciseService.filter({
          level,
          muscle,
          force,
          equipment
        });
        exercises.push(...filtered);
      } catch (error) {
        console.error(`Error filtering exercises for muscle ${muscle}:`, error);
      }
    });

    // Remove duplicates
    const uniqueExercises = Array.from(
      new Map(exercises.map(e => [e.id, e])).values()
    );

    // Filter out exercises with missing required data
    const validExercises = uniqueExercises.filter(exercise =>
      exercise &&
      exercise.id &&
      exercise.name &&
      exercise.primaryMuscles &&
      exercise.primaryMuscles.length > 0
    );

    if (validExercises.length === 0) {
      console.warn('No valid exercises found for selection criteria');
      return [];
    }

    // Sort: compound exercises first if preferred
    if (preferCompound) {
      validExercises.sort((a, b) => {
        if (a.mechanic === 'compound' && b.mechanic !== 'compound') return -1;
        if (a.mechanic !== 'compound' && b.mechanic === 'compound') return 1;
        return 0;
      });
    }

    // Take the requested count, with fallback to available exercises
    const selectedCount = Math.min(count, validExercises.length);
    const selected = validExercises.slice(0, selectedCount);

    return selected.map(exercise => ({
      exercise,
      sets: 3,
      reps: '8-12',
      restSeconds: 90
    }));
  } catch (error) {
    console.error('Error in selectExercises:', error);
    return [];
  }
}

/**
 * Enhanced generate beginner full body workout with better exercise selection
 */
function generateBeginnerWorkout(goals: FitnessGoal[]): WorkoutDay[] {
  try {
    const restTime = getRestTime(goals);
    const repRange = getRepRange(goals);
    
    // Get beginner exercises with error handling
    let beginnerExercises: Exercise[] = [];
    try {
      beginnerExercises = exerciseService.getByLevel('beginner');
    } catch (error) {
      console.error('Error getting beginner exercises:', error);
      // Fallback to empty array - will be handled below
      beginnerExercises = [];
    }
    
    if (beginnerExercises.length === 0) {
      console.warn('No beginner exercises available, creating fallback workout');
      return createFallbackWorkout('beginner', goals);
    }
    
    // Enhanced exercise categorization with better error handling
    const pushExercises = beginnerExercises
      .filter(e => e && e.force === 'push' && e.primaryMuscles &&
        e.primaryMuscles.some(m => ['chest', 'shoulders'].includes(m)))
      .slice(0, 6);
    
    const pullExercises = beginnerExercises
      .filter(e => e && e.force === 'pull' && e.primaryMuscles &&
        e.primaryMuscles.some(m => ['lats', 'middle back', 'biceps'].includes(m)))
      .slice(0, 6);
    
    const legExercises = beginnerExercises
      .filter(e => e && e.primaryMuscles &&
        e.primaryMuscles.some(m => ['quadriceps', 'hamstrings', 'glutes'].includes(m)))
      .slice(0, 6);
    
    const coreExercises = beginnerExercises
      .filter(e => e && e.primaryMuscles && e.primaryMuscles.includes('abdominals'))
      .slice(0, 6);

    // Ensure we have enough exercises
    if (pushExercises.length < 2 || pullExercises.length < 2 || legExercises.length < 2) {
      console.warn('Insufficient exercises for beginner workout, creating fallback');
      return createFallbackWorkout('beginner', goals);
    }

    const createWorkoutExercise = (exercise: Exercise): WorkoutExercise => ({
      exercise,
      sets: 3,
      reps: repRange,
      restSeconds: restTime
    });

    // Enhanced workout structure with exercise availability checks
    const day1: WorkoutDay = {
      day: 1,
      name: 'Full Body A',
      isRestDay: false,
      exercises: [
        pushExercises[0] ? createWorkoutExercise(pushExercises[0]) : null, // Chest push
        pullExercises[0] ? createWorkoutExercise(pullExercises[0]) : null, // Back pull
        legExercises[0] ? createWorkoutExercise(legExercises[0]) : null,  // Quads
        pushExercises[1] ? createWorkoutExercise(pushExercises[1]) : null, // Shoulders
        legExercises[1] ? createWorkoutExercise(legExercises[1]) : null,  // Hamstrings/glutes
        coreExercises[0] ? createWorkoutExercise(coreExercises[0]) : null, // Core
      ].filter((e): e is WorkoutExercise => e !== null)
    };

    const day2: WorkoutDay = {
      day: 2,
      name: 'Rest',
      isRestDay: true,
      exercises: []
    };

    const day3: WorkoutDay = {
      day: 3,
      name: 'Full Body B',
      isRestDay: false,
      exercises: [
        legExercises[2] ? createWorkoutExercise(legExercises[2]) : createWorkoutExercise(legExercises[0]),
        pushExercises[2] ? createWorkoutExercise(pushExercises[2]) : createWorkoutExercise(pushExercises[0]),
        pullExercises[1] ? createWorkoutExercise(pullExercises[1]) : createWorkoutExercise(pullExercises[0]),
        legExercises[3] ? createWorkoutExercise(legExercises[3]) : createWorkoutExercise(legExercises[1]),
        pushExercises[3] ? createWorkoutExercise(pushExercises[3]) : createWorkoutExercise(pushExercises[1]),
        coreExercises[1] ? createWorkoutExercise(coreExercises[1]) : createWorkoutExercise(coreExercises[0]),
      ].filter((e): e is WorkoutExercise => e !== null)
    };

    const day4: WorkoutDay = {
      day: 4,
      name: 'Rest',
      isRestDay: true,
      exercises: []
    };

    const day5: WorkoutDay = {
      day: 5,
      name: 'Full Body C',
      isRestDay: false,
      exercises: [
        pullExercises[2] ? createWorkoutExercise(pullExercises[2]) : createWorkoutExercise(pullExercises[0]),
        pushExercises[4] ? createWorkoutExercise(pushExercises[4]) : createWorkoutExercise(pushExercises[0]),
        legExercises[4] ? createWorkoutExercise(legExercises[4]) : createWorkoutExercise(legExercises[0]),
        pullExercises[3] ? createWorkoutExercise(pullExercises[3]) : createWorkoutExercise(pullExercises[1]),
        legExercises[5] ? createWorkoutExercise(legExercises[5]) : createWorkoutExercise(legExercises[1]),
        coreExercises[2] ? createWorkoutExercise(coreExercises[2]) : createWorkoutExercise(coreExercises[0]),
      ].filter((e): e is WorkoutExercise => e !== null)
    };

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
  } catch (error) {
    console.error('Error generating beginner workout:', error);
    return createFallbackWorkout('beginner', goals);
  }
}

/**
 * Enhanced generate intermediate upper/lower split with better error handling
 */
function generateIntermediateWorkout(goals: FitnessGoal[]): WorkoutDay[] {
  try {
    const restTime = getRestTime(goals);
    const repRange = getRepRange(goals);
    
    let intermediateExercises: Exercise[] = [];
    let beginnerExercises: Exercise[] = [];
    
    try {
      intermediateExercises = exerciseService.getByLevel('intermediate');
      beginnerExercises = exerciseService.getByLevel('beginner');
    } catch (error) {
      console.error('Error getting exercises for intermediate workout:', error);
      return createFallbackWorkout('intermediate', goals);
    }
    
    // Combine intermediate and beginner for more options
    const allExercises = [...intermediateExercises, ...beginnerExercises];
    
    if (allExercises.length === 0) {
      console.warn('No exercises available for intermediate workout');
      return createFallbackWorkout('intermediate', goals);
    }

    const createWorkoutExercise = (exercise: Exercise): WorkoutExercise => ({
      exercise,
      sets: 3,
      reps: repRange,
      restSeconds: restTime
    });

    // Enhanced upper body exercise selection
    const upperPush = allExercises
      .filter(e => e && e.force === 'push' && e.primaryMuscles &&
        e.primaryMuscles.some(m => ['chest', 'shoulders', 'triceps'].includes(m)))
      .slice(0, 8);
    
    const upperPull = allExercises
      .filter(e => e && e.force === 'pull' && e.primaryMuscles &&
        e.primaryMuscles.some(m => ['lats', 'middle back', 'biceps', 'traps'].includes(m)))
      .slice(0, 8);

    const lowerExercises = allExercises
      .filter(e => e && e.primaryMuscles &&
        e.primaryMuscles.some(m => ['quadriceps', 'hamstrings', 'glutes', 'calves'].includes(m)))
      .slice(0, 10);

    // Ensure minimum exercise requirements
    if (upperPush.length < 2 || upperPull.length < 2 || lowerExercises.length < 2) {
      console.warn('Insufficient exercises for intermediate workout');
      return createFallbackWorkout('intermediate', goals);
    }

    const day1: WorkoutDay = {
      day: 1,
      name: 'Upper Body A',
      isRestDay: false,
      exercises: [
        upperPush[0] ? createWorkoutExercise(upperPush[0]) : null,
        upperPull[0] ? createWorkoutExercise(upperPull[0]) : null,
        upperPush[1] ? createWorkoutExercise(upperPush[1]) : null,
        upperPull[1] ? createWorkoutExercise(upperPull[1]) : null,
        upperPush[2] ? createWorkoutExercise(upperPush[2]) : null,
        upperPull[2] ? createWorkoutExercise(upperPull[2]) : null,
      ].filter((e): e is WorkoutExercise => e !== null)
    };

    const day2: WorkoutDay = {
      day: 2,
      name: 'Lower Body A',
      isRestDay: false,
      exercises: [
        lowerExercises[0] ? createWorkoutExercise(lowerExercises[0]) : null,
        lowerExercises[1] ? createWorkoutExercise(lowerExercises[1]) : null,
        lowerExercises[2] ? createWorkoutExercise(lowerExercises[2]) : null,
        lowerExercises[3] ? createWorkoutExercise(lowerExercises[3]) : null,
        lowerExercises[4] ? createWorkoutExercise(lowerExercises[4]) : null,
      ].filter((e): e is WorkoutExercise => e !== null)
    };

    const day3: WorkoutDay = {
      day: 3,
      name: 'Rest',
      isRestDay: true,
      exercises: []
    };

    const day4: WorkoutDay = {
      day: 4,
      name: 'Upper Body B',
      isRestDay: false,
      exercises: [
        upperPull[3] || upperPull[0] ? createWorkoutExercise(upperPull[3] || upperPull[0]) : null,
        upperPush[3] || upperPush[0] ? createWorkoutExercise(upperPush[3] || upperPush[0]) : null,
        upperPull[4] || upperPull[1] ? createWorkoutExercise(upperPull[4] || upperPull[1]) : null,
        upperPush[4] || upperPush[1] ? createWorkoutExercise(upperPush[4] || upperPush[1]) : null,
        upperPull[5] || upperPull[2] ? createWorkoutExercise(upperPull[5] || upperPull[2]) : null,
        upperPush[5] || upperPush[2] ? createWorkoutExercise(upperPush[5] || upperPush[2]) : null,
      ].filter((e): e is WorkoutExercise => e !== null)
    };

    const day5: WorkoutDay = {
      day: 5,
      name: 'Lower Body B',
      isRestDay: false,
      exercises: [
        lowerExercises[5] || lowerExercises[0] ? createWorkoutExercise(lowerExercises[5] || lowerExercises[0]) : null,
        lowerExercises[6] || lowerExercises[1] ? createWorkoutExercise(lowerExercises[6] || lowerExercises[1]) : null,
        lowerExercises[7] || lowerExercises[2] ? createWorkoutExercise(lowerExercises[7] || lowerExercises[2]) : null,
        lowerExercises[8] || lowerExercises[3] ? createWorkoutExercise(lowerExercises[8] || lowerExercises[3]) : null,
        lowerExercises[9] || lowerExercises[4] ? createWorkoutExercise(lowerExercises[9] || lowerExercises[4]) : null,
      ].filter((e): e is WorkoutExercise => e !== null)
    };

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
  } catch (error) {
    console.error('Error generating intermediate workout:', error);
    return createFallbackWorkout('intermediate', goals);
  }
}

/**
 * Enhanced generate advanced push/pull/legs split with better error handling
 */
function generateAdvancedWorkout(goals: FitnessGoal[]): WorkoutDay[] {
  try {
    const restTime = getRestTime(goals);
    const repRange = getRepRange(goals);
    
    let advancedExercises: Exercise[] = [];
    let intermediateExercises: Exercise[] = [];
    
    try {
      advancedExercises = exerciseService.getByLevel('advanced');
      intermediateExercises = exerciseService.getByLevel('intermediate');
    } catch (error) {
      console.error('Error getting exercises for advanced workout:', error);
      return createFallbackWorkout('advanced', goals);
    }
    
    const allExercises = [...advancedExercises, ...intermediateExercises];
    
    if (allExercises.length === 0) {
      console.warn('No exercises available for advanced workout');
      return createFallbackWorkout('advanced', goals);
    }

    const createWorkoutExercise = (exercise: Exercise, sets: number = 3): WorkoutExercise => ({
      exercise,
      sets,
      reps: repRange,
      restSeconds: restTime
    });

    // Enhanced push/pull/leg exercise categorization
    const pushExercises = allExercises
      .filter(e => e && e.force === 'push')
      .slice(0, 12);

    const pullExercises = allExercises
      .filter(e => e && e.force === 'pull')
      .slice(0, 12);

    const legExercises = allExercises
      .filter(e => e && e.primaryMuscles &&
        e.primaryMuscles.some(m => ['quadriceps', 'hamstrings', 'glutes', 'calves'].includes(m)))
      .slice(0, 12);

    // Ensure minimum exercise requirements
    if (pushExercises.length < 3 || pullExercises.length < 3 || legExercises.length < 3) {
      console.warn('Insufficient exercises for advanced workout');
      return createFallbackWorkout('advanced', goals);
    }

    const day1: WorkoutDay = {
      day: 1,
      name: 'Push Day',
      isRestDay: false,
      exercises: [
        pushExercises[0] ? createWorkoutExercise(pushExercises[0], 4) : null, // Compound
        pushExercises[1] ? createWorkoutExercise(pushExercises[1], 3) : null,
        pushExercises[2] ? createWorkoutExercise(pushExercises[2], 3) : null,
        pushExercises[3] ? createWorkoutExercise(pushExercises[3], 3) : null,
        pushExercises[4] ? createWorkoutExercise(pushExercises[4], 3) : null,
      ].filter((e): e is WorkoutExercise => e !== null)
    };

    const day2: WorkoutDay = {
      day: 2,
      name: 'Pull Day',
      isRestDay: false,
      exercises: [
        pullExercises[0] ? createWorkoutExercise(pullExercises[0], 4) : null,
        pullExercises[1] ? createWorkoutExercise(pullExercises[1], 3) : null,
        pullExercises[2] ? createWorkoutExercise(pullExercises[2], 3) : null,
        pullExercises[3] ? createWorkoutExercise(pullExercises[3], 3) : null,
        pullExercises[4] ? createWorkoutExercise(pullExercises[4], 3) : null,
      ].filter((e): e is WorkoutExercise => e !== null)
    };

    const day3: WorkoutDay = {
      day: 3,
      name: 'Leg Day',
      isRestDay: false,
      exercises: [
        legExercises[0] ? createWorkoutExercise(legExercises[0], 4) : null,
        legExercises[1] ? createWorkoutExercise(legExercises[1], 3) : null,
        legExercises[2] ? createWorkoutExercise(legExercises[2], 3) : null,
        legExercises[3] ? createWorkoutExercise(legExercises[3], 3) : null,
        legExercises[4] ? createWorkoutExercise(legExercises[4], 3) : null,
      ].filter((e): e is WorkoutExercise => e !== null)
    };

    const day4: WorkoutDay = {
      day: 4,
      name: 'Rest',
      isRestDay: true,
      exercises: []
    };

    const day5: WorkoutDay = {
      day: 5,
      name: 'Upper Body',
      isRestDay: false,
      exercises: [
        pushExercises[5] || pushExercises[0] ? createWorkoutExercise(pushExercises[5] || pushExercises[0]) : null,
        pullExercises[5] || pullExercises[0] ? createWorkoutExercise(pullExercises[5] || pullExercises[0]) : null,
        pushExercises[6] || pushExercises[1] ? createWorkoutExercise(pushExercises[6] || pushExercises[1]) : null,
        pullExercises[6] || pullExercises[1] ? createWorkoutExercise(pullExercises[6] || pullExercises[1]) : null,
        pushExercises[7] || pushExercises[2] ? createWorkoutExercise(pushExercises[7] || pushExercises[2]) : null,
      ].filter((e): e is WorkoutExercise => e !== null)
    };

    const day6: WorkoutDay = {
      day: 6,
      name: 'Lower Body',
      isRestDay: false,
      exercises: [
        legExercises[5] || legExercises[0] ? createWorkoutExercise(legExercises[5] || legExercises[0]) : null,
        legExercises[6] || legExercises[1] ? createWorkoutExercise(legExercises[6] || legExercises[1]) : null,
        legExercises[7] || legExercises[2] ? createWorkoutExercise(legExercises[7] || legExercises[2]) : null,
        legExercises[8] || legExercises[3] ? createWorkoutExercise(legExercises[8] || legExercises[3]) : null,
        legExercises[9] || legExercises[4] ? createWorkoutExercise(legExercises[9] || legExercises[4]) : null,
      ].filter((e): e is WorkoutExercise => e !== null)
    };

    const day7: WorkoutDay = {
      day: 7,
      name: 'Rest',
      isRestDay: true,
      exercises: []
    };

    return [day1, day2, day3, day4, day5, day6, day7];
  } catch (error) {
    console.error('Error generating advanced workout:', error);
    return createFallbackWorkout('advanced', goals);
  }
}

/**
 * Enhanced fallback workout generator for when exercise service fails
 */
function createFallbackWorkout(level: ExperienceLevel, goals: FitnessGoal[]): WorkoutDay[] {
  console.warn(`Creating fallback workout for ${level} level`);
  
  const restTime = getRestTime(goals);
  const repRange = getRepRange(goals);
  
  // Fallback exercises that should always be available
  const fallbackExercises = {
    push: [
      { name: 'Push-ups', sets: 3, reps: repRange },
      { name: 'Pike Push-ups', sets: 3, reps: repRange },
      { name: 'Tricep Dips', sets: 3, reps: repRange }
    ],
    pull: [
      { name: 'Pull-ups', sets: 3, reps: repRange },
      { name: 'Inverted Rows', sets: 3, reps: repRange },
      { name: 'Bicep Curls (Bodyweight)', sets: 3, reps: repRange }
    ],
    legs: [
      { name: 'Squats', sets: 3, reps: repRange },
      { name: 'Lunges', sets: 3, reps: repRange },
      { name: 'Calf Raises', sets: 3, reps: repRange }
    ],
    core: [
      { name: 'Plank', sets: 3, reps: '30-60s' },
      { name: 'Crunches', sets: 3, reps: repRange },
      { name: 'Leg Raises', sets: 3, reps: repRange }
    ]
  };
  
  const createFallbackExercise = (exercise: any): WorkoutExercise => ({
    exercise: {
      id: `fallback-${exercise.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: exercise.name,
      primaryMuscles: ['general'],
      secondaryMuscles: [],
      force: 'push',
      level: 'beginner',
      mechanic: 'compound',
      equipment: 'body',
      category: 'strength'
    },
    sets: exercise.sets,
    reps: exercise.reps,
    restSeconds: restTime
  });
  
  // Create workout based on level
  switch (level) {
    case 'beginner':
      return [
        {
          day: 1,
          name: 'Full Body A',
          isRestDay: false,
          exercises: [
            createFallbackExercise(fallbackExercises.push[0]),
            createFallbackExercise(fallbackExercises.pull[0]),
            createFallbackExercise(fallbackExercises.legs[0]),
            createFallbackExercise(fallbackExercises.core[0])
          ]
        },
        { day: 2, name: 'Rest', isRestDay: true, exercises: [] },
        {
          day: 3,
          name: 'Full Body B',
          isRestDay: false,
          exercises: [
            createFallbackExercise(fallbackExercises.legs[1]),
            createFallbackExercise(fallbackExercises.push[1]),
            createFallbackExercise(fallbackExercises.pull[1]),
            createFallbackExercise(fallbackExercises.core[1])
          ]
        },
        { day: 4, name: 'Rest', isRestDay: true, exercises: [] },
        {
          day: 5,
          name: 'Full Body C',
          isRestDay: false,
          exercises: [
            createFallbackExercise(fallbackExercises.pull[2]),
            createFallbackExercise(fallbackExercises.push[2]),
            createFallbackExercise(fallbackExercises.legs[2]),
            createFallbackExercise(fallbackExercises.core[2])
          ]
        },
        { day: 6, name: 'Rest', isRestDay: true, exercises: [] },
        { day: 7, name: 'Rest', isRestDay: true, exercises: [] }
      ];
      
    case 'intermediate':
      return [
        {
          day: 1,
          name: 'Upper Body A',
          isRestDay: false,
          exercises: [
            createFallbackExercise(fallbackExercises.push[0]),
            createFallbackExercise(fallbackExercises.pull[0]),
            createFallbackExercise(fallbackExercises.push[1])
          ]
        },
        {
          day: 2,
          name: 'Lower Body A',
          isRestDay: false,
          exercises: [
            createFallbackExercise(fallbackExercises.legs[0]),
            createFallbackExercise(fallbackExercises.legs[1]),
            createFallbackExercise(fallbackExercises.legs[2])
          ]
        },
        { day: 3, name: 'Rest', isRestDay: true, exercises: [] },
        {
          day: 4,
          name: 'Upper Body B',
          isRestDay: false,
          exercises: [
            createFallbackExercise(fallbackExercises.pull[1]),
            createFallbackExercise(fallbackExercises.push[2]),
            createFallbackExercise(fallbackExercises.pull[2])
          ]
        },
        {
          day: 5,
          name: 'Lower Body B',
          isRestDay: false,
          exercises: [
            createFallbackExercise(fallbackExercises.legs[1]),
            createFallbackExercise(fallbackExercises.legs[2]),
            createFallbackExercise(fallbackExercises.core[0])
          ]
        },
        { day: 6, name: 'Rest', isRestDay: true, exercises: [] },
        { day: 7, name: 'Rest', isRestDay: true, exercises: [] }
      ];
      
    case 'advanced':
      return [
        {
          day: 1,
          name: 'Push Day',
          isRestDay: false,
          exercises: [
            createFallbackExercise(fallbackExercises.push[0]),
            createFallbackExercise(fallbackExercises.push[1]),
            createFallbackExercise(fallbackExercises.push[2])
          ]
        },
        {
          day: 2,
          name: 'Pull Day',
          isRestDay: false,
          exercises: [
            createFallbackExercise(fallbackExercises.pull[0]),
            createFallbackExercise(fallbackExercises.pull[1]),
            createFallbackExercise(fallbackExercises.pull[2])
          ]
        },
        {
          day: 3,
          name: 'Leg Day',
          isRestDay: false,
          exercises: [
            createFallbackExercise(fallbackExercises.legs[0]),
            createFallbackExercise(fallbackExercises.legs[1]),
            createFallbackExercise(fallbackExercises.legs[2])
          ]
        },
        { day: 4, name: 'Rest', isRestDay: true, exercises: [] },
        {
          day: 5,
          name: 'Upper Body',
          isRestDay: false,
          exercises: [
            createFallbackExercise(fallbackExercises.push[1]),
            createFallbackExercise(fallbackExercises.pull[1]),
            createFallbackExercise(fallbackExercises.push[2])
          ]
        },
        {
          day: 6,
          name: 'Lower Body',
          isRestDay: false,
          exercises: [
            createFallbackExercise(fallbackExercises.legs[1]),
            createFallbackExercise(fallbackExercises.legs[2]),
            createFallbackExercise(fallbackExercises.core[0])
          ]
        },
        { day: 7, name: 'Rest', isRestDay: true, exercises: [] }
      ];
      
    default:
      return createFallbackWorkout('beginner', goals);
  }
}

/**
 * Enhanced generate a weekly workout plan based on user profile with better error handling
 */
export function generateWeeklyWorkout(data: OnboardingFormData): WeeklyWorkout {
  try {
    // Validate input data
    if (!data || !data.experience_level) {
      console.warn('Invalid onboarding data, using beginner as fallback');
      data = { ...data, experience_level: 'beginner' };
    }
    
    if (!data.goals || data.goals.length === 0) {
      console.warn('No goals specified, using default goals');
      data = { ...data, goals: ['build_muscle'] };
    }
    
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
        console.warn(`Unknown experience level: ${data.experience_level}, using beginner`);
        days = generateBeginnerWorkout(data.goals);
    }

    // Validate generated workout
    if (!days || days.length === 0) {
      console.error('Failed to generate workout days');
      days = createFallbackWorkout('beginner', data.goals);
    }
    
    // Ensure all days have valid structure
    days = days.map((day, index) => {
      if (!day || typeof day.day !== 'number') {
        console.warn(`Invalid day at index ${index}, creating fallback`);
        return {
          day: index + 1,
          name: 'Rest',
          isRestDay: true,
          exercises: []
        };
      }
      
      // Ensure exercises array exists
      if (!day.exercises) {
        day.exercises = [];
      }
      
      // Filter out invalid exercises
      day.exercises = day.exercises.filter(exercise =>
        exercise &&
        exercise.exercise &&
        exercise.exercise.id &&
        exercise.exercise.name
      );
      
      return day;
    });

    return {
      weekNumber: 1,
      days,
      createdAt: new Date(),
      userId: data.userId // Add user ID if available
    };
  } catch (error) {
    console.error('Error generating weekly workout:', error);
    // Ultimate fallback
    return {
      weekNumber: 1,
      days: createFallbackWorkout('beginner', ['build_muscle']),
      createdAt: new Date()
    };
  }
}

/**
 * Enhanced get workout summary text with better formatting
 */
export function getWorkoutSummary(workout: WeeklyWorkout): string {
  if (!workout || !workout.days) {
    return 'No workout data available';
  }
  
  try {
    const workoutDays = workout.days.filter(d => d && !d.isRestDay).length;
    const totalExercises = workout.days.reduce(
      (sum, day) => {
        if (!day || !day.exercises) return sum;
        return sum + day.exercises.filter(e => e && e.exercise).length;
      },
      0
    );
    
    const avgExercisesPerDay = workoutDays > 0 ? Math.round(totalExercises / workoutDays) : 0;
    
    return `${workoutDays} days/week, ${totalExercises} total exercises (${avgExercisesPerDay} avg/day)`;
  } catch (error) {
    console.error('Error generating workout summary:', error);
    return 'Workout summary unavailable';
  }
}

/**
 * Enhanced workout validation function
 */
export function validateWorkout(workout: WeeklyWorkout): boolean {
  if (!workout || !workout.days || !Array.isArray(workout.days)) {
    console.error('Invalid workout structure');
    return false;
  }
  
  if (workout.days.length !== 7) {
    console.error('Workout must have exactly 7 days');
    return false;
  }
  
  // Check for valid day numbers
  const dayNumbers = workout.days.map(day => day?.day).filter(Boolean);
  if (dayNumbers.length !== 7 || !dayNumbers.every((num, index) => num === index + 1)) {
    console.error('Invalid day numbering');
    return false;
  }
  
  // Check for at least one workout day
  const workoutDays = workout.days.filter(day => day && !day.isRestDay && day.exercises && day.exercises.length > 0);
  if (workoutDays.length === 0) {
    console.error('No workout days found');
    return false;
  }
  
  // Check exercise validity
  for (const day of workoutDays) {
    for (const exercise of day.exercises) {
      if (!exercise || !exercise.exercise || !exercise.exercise.id || !exercise.exercise.name) {
        console.error('Invalid exercise found in workout');
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Enhanced workout difficulty calculator
 */
export function calculateWorkoutDifficulty(workout: WeeklyWorkout): 'easy' | 'moderate' | 'hard' | 'extreme' {
  if (!workout || !workout.days) return 'moderate';
  
  try {
    const workoutDays = workout.days.filter(d => d && !d.isRestDay);
    const totalExercises = workout.days.reduce(
      (sum, day) => {
        if (!day || !day.exercises) return sum;
        return sum + day.exercises.filter(e => e && e.exercise).length;
      },
      0
    );
    
    const totalSets = workout.days.reduce(
      (sum, day) => {
        if (!day || !day.exercises) return sum;
        return sum + day.exercises.reduce((daySum, exercise) => {
          return daySum + (exercise?.sets || 0);
        }, 0);
      },
      0
    );
    
    // Calculate difficulty based on multiple factors
    const exercisesPerDay = workoutDays.length > 0 ? totalExercises / workoutDays.length : 0;
    const setsPerExercise = totalExercises > 0 ? totalSets / totalExercises : 0;
    const workoutDaysPerWeek = workoutDays.length;
    
    let difficulty = 0;
    
    // Factor in exercises per day
    if (exercisesPerDay >= 8) difficulty += 3;
    else if (exercisesPerDay >= 6) difficulty += 2;
    else if (exercisesPerDay >= 4) difficulty += 1;
    
    // Factor in sets per exercise
    if (setsPerExercise >= 5) difficulty += 2;
    else if (setsPerExercise >= 4) difficulty += 1;
    
    // Factor in workout days per week
    if (workoutDaysPerWeek >= 6) difficulty += 3;
    else if (workoutDaysPerWeek >= 5) difficulty += 2;
    else if (workoutDaysPerWeek >= 4) difficulty += 1;
    
    // Return difficulty level
    if (difficulty >= 7) return 'extreme';
    if (difficulty >= 5) return 'hard';
    if (difficulty >= 3) return 'moderate';
    return 'easy';
  } catch (error) {
    console.error('Error calculating workout difficulty:', error);
    return 'moderate';
  }
}
