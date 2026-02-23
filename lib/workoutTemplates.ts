
export interface ExerciseTemplate {
    name: string;
    sets: number;
    reps: number | string;
    weight?: number;
    restSeconds?: number;
}

export interface WorkoutTemplate {
    id: string;
    name: string;
    description: string;
    exercises: ExerciseTemplate[];
}

export const BUILT_IN_TEMPLATES: WorkoutTemplate[] = [
    {
        id: 'push-day',
        name: 'Push Day',
        description: 'Chest, shoulders, and triceps',
        exercises: [
            { name: 'Bench Press', sets: 4, reps: 8, weight: 135, restSeconds: 90 },
            { name: 'Overhead Press', sets: 3, reps: 10, weight: 95, restSeconds: 90 },
            { name: 'Incline Dumbbell Press', sets: 3, reps: 10, restSeconds: 60 },
            { name: 'Lateral Raises', sets: 3, reps: 15, restSeconds: 45 },
            { name: 'Tricep Extensions', sets: 3, reps: 12, restSeconds: 60 },
            { name: 'Cable Flys', sets: 3, reps: 12, restSeconds: 60 }
        ]
    },
    {
        id: 'pull-day',
        name: 'Pull Day',
        description: 'Back and biceps',
        exercises: [
            { name: 'Barbell Row', sets: 4, reps: 8, weight: 135, restSeconds: 90 },
            { name: 'Lat Pulldown', sets: 3, reps: 10, restSeconds: 60 },
            { name: 'Face Pulls', sets: 3, reps: 15, restSeconds: 45 },
            { name: 'Bicep Curls', sets: 3, reps: 12, restSeconds: 60 },
            { name: 'Pull-ups', sets: 3, reps: 8, restSeconds: 90 },
            { name: 'Hammer Curls', sets: 3, reps: 12, restSeconds: 60 }
        ]
    },
    {
        id: 'legs-day',
        name: 'Legs Day',
        description: 'Quads, hamstrings, and calves',
        exercises: [
            { name: 'Squat', sets: 4, reps: 6, weight: 185, restSeconds: 120 },
            { name: 'Romanian Deadlift', sets: 3, reps: 10, weight: 135, restSeconds: 90 },
            { name: 'Leg Press', sets: 3, reps: 12, restSeconds: 90 },
            { name: 'Leg Curls', sets: 3, reps: 12, restSeconds: 60 },
            { name: 'Calf Raises', sets: 4, reps: 15, restSeconds: 45 },
            { name: 'Lunges', sets: 3, reps: 10, restSeconds: 60 }
        ]
    },
    {
        id: 'upper-body',
        name: 'Upper Body',
        description: 'Full upper body workout',
        exercises: [
            { name: 'Bench Press', sets: 4, reps: 8, weight: 135, restSeconds: 90 },
            { name: 'Barbell Row', sets: 4, reps: 8, weight: 135, restSeconds: 90 },
            { name: 'Overhead Press', sets: 3, reps: 10, weight: 95, restSeconds: 90 },
            { name: 'Lat Pulldown', sets: 3, reps: 10, restSeconds: 60 },
            { name: 'Bicep Curls', sets: 3, reps: 12, restSeconds: 60 },
            { name: 'Tricep Extensions', sets: 3, reps: 12, restSeconds: 60 }
        ]
    },
    {
        id: 'lower-body',
        name: 'Lower Body',
        description: 'Full lower body workout',
        exercises: [
            { name: 'Squat', sets: 4, reps: 6, weight: 185, restSeconds: 120 },
            { name: 'Deadlift', sets: 3, reps: 5, weight: 225, restSeconds: 120 },
            { name: 'Leg Press', sets: 3, reps: 12, restSeconds: 90 },
            { name: 'Leg Curls', sets: 3, reps: 12, restSeconds: 60 },
            { name: 'Calf Raises', sets: 4, reps: 15, restSeconds: 45 },
            { name: 'Leg Extensions', sets: 3, reps: 15, restSeconds: 60 }
        ]
    },
    {
        id: 'full-body',
        name: 'Full Body',
        description: 'Complete full body routine',
        exercises: [
            { name: 'Squat', sets: 3, reps: 8, weight: 135, restSeconds: 120 },
            { name: 'Bench Press', sets: 3, reps: 8, weight: 135, restSeconds: 90 },
            { name: 'Barbell Row', sets: 3, reps: 8, weight: 135, restSeconds: 90 },
            { name: 'Overhead Press', sets: 3, reps: 10, weight: 95, restSeconds: 90 },
            { name: 'Lat Pulldown', sets: 3, reps: 10, restSeconds: 60 },
            { name: 'Plank', sets: 3, reps: 60, restSeconds: 60 }
        ]
    },
    {
        id: 'core',
        name: 'Core',
        description: 'Abs and core stability',
        exercises: [
            { name: 'Plank', sets: 3, reps: 60, restSeconds: 60 },
            { name: 'Leg Raises', sets: 3, reps: 15, restSeconds: 45 },
            { name: 'Russian Twists', sets: 3, reps: 20, restSeconds: 45 },
            { name: 'Mountain Climbers', sets: 3, reps: 30, restSeconds: 45 },
            { name: 'Bicycle Crunches', sets: 3, reps: 20, restSeconds: 45 }
        ]
    },
    {
        id: 'cardio',
        name: 'Cardio',
        description: 'High intensity cardio',
        exercises: [
            { name: 'Jumping Jacks', sets: 3, reps: 50, restSeconds: 30 },
            { name: 'Burpees', sets: 3, reps: 15, restSeconds: 60 },
            { name: 'Mountain Climbers', sets: 3, reps: 40, restSeconds: 30 },
            { name: 'High Knees', sets: 3, reps: 50, restSeconds: 30 }
        ]
    }
];
