import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Play, Pause, RotateCcw,
  Check, Timer, Dumbbell, Flame, Clock, Zap,
  Trophy, X, Volume2, VolumeX, Plus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Exercise } from '../types';
import { useWorkoutPlan } from '../hooks/useWorkoutPlan';
import { Database } from '../lib/database.types';
import RestTimer from '../components/RestTimer';
import { BUILT_IN_TEMPLATES, WorkoutTemplate } from '../lib/workoutTemplates';
import ForgeButton from '../components/ForgeButton';

type WorkoutDay = Database['public']['Tables']['workout_days']['Row'];
type PlanExercise = Database['public']['Tables']['plan_exercises']['Row'];

type WorkoutCategory = 'plan' | 'quick' | 'custom';

interface ExerciseProgress {
  exerciseId: string;
  completedSets: number;
  totalSets: number;
  weight?: number;
}

interface ActiveWorkout {
  dayId: string;
  dayName: string;
  exercises: ExerciseProgress[];
  startTime: number;
  currentExerciseIndex: number;
  templateExercises?: Omit<Exercise, 'id' | 'completedSets'>[];
}

const WorkoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { workoutPlan, loading: planLoading } = useWorkoutPlan();
  const { addExercise, exercises, completeExerciseSet, resetExercises, saveWorkoutSession, triggerAutoSave, addXp } = useApp();

  // View states
  const [category, setCategory] = useState<WorkoutCategory>('plan');
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [currentExerciseData, setCurrentExerciseData] = useState<PlanExercise | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Custom Workout states
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customWorkoutName, setCustomWorkoutName] = useState('My Custom Workout');
  const [customExercises, setCustomExercises] = useState<Omit<Exercise, 'id' | 'completedSets'>[]>([]);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseSets, setNewExerciseSets] = useState(3);
  const [newExerciseReps, setNewExerciseReps] = useState('10');

  // Get today's day number (1-7, where 1 is Monday)
  const todayDayNumber = new Date().getDay() || 7; // Convert Sunday from 0 to 7

  // Timer effect for active workout
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeWorkout && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - activeWorkout.startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeWorkout, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Start a workout from the plan
  const handleStartWorkout = (day: WorkoutDay, dayExercises: PlanExercise[]) => {
    // Initialize exercise progress
    const exerciseProgress: ExerciseProgress[] = dayExercises.map(ex => ({
      exerciseId: ex.id,
      completedSets: 0,
      totalSets: ex.sets,
      weight: undefined,
    }));

    // Reset and populate the app's exercise list
    resetExercises();
    dayExercises.forEach(ex => {
      addExercise({
        name: ex.exercise_name,
        sets: ex.sets,
        reps: parseInt(ex.reps.split('-')[0]) || 10,
        completedSets: 0,
        weight: undefined,
      });
    });

    setActiveWorkout({
      dayId: day.id,
      dayName: day.name,
      exercises: exerciseProgress,
      startTime: Date.now(),
      currentExerciseIndex: 0,
    });

    if (dayExercises.length > 0) {
      setCurrentExerciseData(dayExercises[0]);
    }

    setSelectedDay(null);
  };

  // Start a workout from a template (Quick or Custom)
  const handleStartTemplateWorkout = (name: string, templateExercises: Omit<Exercise, 'id' | 'completedSets'>[]) => {
    // Initialize exercise progress
    const exerciseProgress: ExerciseProgress[] = templateExercises.map((ex, index) => ({
      exerciseId: `temp-${index}`,
      completedSets: 0,
      totalSets: ex.sets,
      weight: ex.weight,
    }));

    // Reset and populate the app's exercise list
    resetExercises();
    templateExercises.forEach(ex => {
      addExercise({
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        completedSets: 0,
        weight: ex.weight,
      });
    });

    setActiveWorkout({
      dayId: 'quick-workout',
      dayName: name,
      exercises: exerciseProgress,
      startTime: Date.now(),
      currentExerciseIndex: 0,
      templateExercises,
    });

    if (templateExercises.length > 0) {
      // Mock PlanExercise for current exercise data
      setCurrentExerciseData({
        id: 'quick-ex-0',
        day_id: 'quick-workout',
        exercise_id: 'quick-ex-0',
        exercise_name: templateExercises[0].name,
        sets: templateExercises[0].sets,
        reps: String(templateExercises[0].reps),
        rest_seconds: 60,
        order_index: 0,
        notes: null,
        created_at: new Date().toISOString(),
      });
    }

    setIsCreatingCustom(false);
  };

  const handleAddCustomExercise = () => {
    if (!newExerciseName.trim()) return;
    setCustomExercises([...customExercises, {
      name: newExerciseName,
      sets: newExerciseSets,
      reps: newExerciseReps,
    }]);
    setNewExerciseName('');
    setIsAddingExercise(false);
  };

  // Handle completing a set
  const handleCompleteSet = () => {
    if (!currentExerciseData || !activeWorkout) return;

    // Update the app's exercise state
    const appExercise = exercises.find(e => e.name === currentExerciseData.exercise_name);
    if (appExercise) {
      completeExerciseSet(appExercise.id);
    }

    // Update local progress
    const updatedExercises = [...activeWorkout.exercises];
    const currentExProgress = updatedExercises[activeWorkout.currentExerciseIndex];
    if (currentExProgress) {
      currentExProgress.completedSets += 1;

      // Check if exercise is complete
      if (currentExProgress.completedSets >= currentExProgress.totalSets) {
        // Move to next exercise or show completion
        if (activeWorkout.currentExerciseIndex < updatedExercises.length - 1) {
          // Move to next exercise
          const nextIndex = activeWorkout.currentExerciseIndex + 1;
          setActiveWorkout({
            ...activeWorkout,
            exercises: updatedExercises,
            currentExerciseIndex: nextIndex,
          });

          // Get next exercise data
          let nextExercise: PlanExercise | null = null;
          if (activeWorkout.dayId === 'quick-workout' && activeWorkout.templateExercises) {
            const nextTemplateEx = activeWorkout.templateExercises[nextIndex];
            if (nextTemplateEx) {
              nextExercise = {
                id: `quick-ex-${nextIndex}`,
                day_id: 'quick-workout',
                exercise_id: `quick-ex-${nextIndex}`,
                exercise_name: nextTemplateEx.name,
                sets: nextTemplateEx.sets,
                reps: String(nextTemplateEx.reps),
                rest_seconds: 60,
                order_index: nextIndex,
                notes: null,
                created_at: new Date().toISOString(),
              };
            }
          } else {
            const dayWithExercises = workoutPlan?.days.find(d => d.id === activeWorkout.dayId);
            if (dayWithExercises && dayWithExercises.exercises[nextIndex]) {
              nextExercise = dayWithExercises.exercises[nextIndex];
            }
          }

          if (nextExercise) {
            setCurrentExerciseData(nextExercise);
          }
        } else {
          // Workout complete!
          handleFinishWorkout();
        }
      } else {
        // Show rest timer between sets
        setActiveWorkout({
          ...activeWorkout,
          exercises: updatedExercises,
        });
        setShowRestTimer(true);
      }
    }
  };

  // Handle finishing the workout
  const handleFinishWorkout = async () => {
    if (!activeWorkout) return;

    try {
      const duration = Math.floor((Date.now() - activeWorkout.startTime) / 60000);
      const completedExercises = exercises.filter(e => e.completedSets === e.sets);
      const totalXp = completedExercises.length * 25 + 50;

      await saveWorkoutSession({
        exercises: [...exercises],
        duration,
        totalXp,
        notes: `Completed: ${activeWorkout.dayName}`,
      });

      await triggerAutoSave();
      setShowCompletion(true);
    } catch (error) {
      console.error('Failed to save workout:', error);
    }
  };

  // Handle exit workout
  const handleExitWorkout = () => {
    setActiveWorkout(null);
    setCurrentExerciseData(null);
    setElapsedTime(0);
    resetExercises();
  };

  // Calculate workout stats
  const getWorkoutStats = () => {
    if (!activeWorkout) return { completed: 0, total: 0, percentage: 0 };

    const completed = activeWorkout.exercises.reduce((sum, ex) => sum + ex.completedSets, 0);
    const total = activeWorkout.exercises.reduce((sum, ex) => sum + ex.totalSets, 0);
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  };

  // Render completion screen
  if (showCompletion) {
    const stats = getWorkoutStats();
    return (
      <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-4 sm:p-6 text-white z-40">
        <div className="w-full max-w-md">
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <button
              onClick={() => {
                setShowCompletion(false);
                handleExitWorkout();
              }}
              className="p-2 hover:bg-zinc-800 rounded-full"
            >
              <X size={24} />
            </button>
          </div>

          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <Trophy size={48} className="text-black" />
          </div>

          <h1 className="text-3xl font-black uppercase mb-2">Workout Complete!</h1>
          <p className="text-zinc-400 mb-8">Great job! You crushed it.</p>

          <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-8">
            <div className="bg-zinc-900 rounded-2xl p-4 text-center">
              <Clock size={20} className="mx-auto mb-2 text-zinc-500" />
              <p className="text-2xl font-bold">{formatTime(elapsedTime)}</p>
              <p className="text-xs text-zinc-500 uppercase">Duration</p>
            </div>
            <div className="bg-zinc-900 rounded-2xl p-4 text-center">
              <Dumbbell size={20} className="mx-auto mb-2 text-zinc-500" />
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-xs text-zinc-500 uppercase">Sets</p>
            </div>
            <div className="bg-zinc-900 rounded-2xl p-4 text-center">
              <Zap size={20} className="mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">+{stats.completed * 10 + 50}</p>
              <p className="text-xs text-zinc-500 uppercase">XP</p>
            </div>
          </div>

          <button
            onClick={() => {
              setShowCompletion(false);
              handleExitWorkout();
            }}
            className="w-full max-w-sm bg-green-500 text-black py-3 sm:py-4 rounded-2xl font-black uppercase"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Render active exercise view
  if (activeWorkout && currentExerciseData) {
    const currentProgress = activeWorkout.exercises[activeWorkout.currentExerciseIndex];
    const isExerciseComplete = currentProgress && currentProgress.completedSets >= currentProgress.totalSets;
    const stats = getWorkoutStats();

    return (
      <div className="absolute inset-0 bg-black flex flex-col items-center p-4 sm:p-6 text-white z-40">
        <div className="w-full max-w-md h-full flex flex-col">
          {/* Header */}
          <header className="flex justify-between items-center py-4 sm:py-6 shrink-0">
            <button
              onClick={handleExitWorkout}
              className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-widest">{activeWorkout.dayName}</p>
              <p className="font-mono font-bold text-green-500">{formatTime(elapsedTime)}</p>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
            >
              {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </button>
          </header>

          {/* Progress bar */}
          <div className="px-6 mb-4">
            <div className="flex justify-between text-xs text-zinc-500 mb-2">
              <span>Progress</span>
              <span>{stats.completed}/{stats.total} sets</span>
            </div>
            <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>

          {/* Exercise info */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-32 h-32 bg-zinc-900 rounded-3xl flex items-center justify-center mb-6">
              <Dumbbell size={48} className="text-zinc-600" />
            </div>

            <h1 className="text-3xl font-black uppercase text-center mb-2">
              {currentExerciseData.exercise_name}
            </h1>
            <p className="text-zinc-400 mb-8">
              {currentExerciseData.sets} sets × {currentExerciseData.reps} reps
            </p>

            {/* Set indicators */}
            <div className="flex gap-3 mb-8">
              {Array.from({ length: currentExerciseData.sets }, (_, i) => {
                const isCompleted = currentProgress && i < currentProgress.completedSets;
                const isCurrent = currentProgress && i === currentProgress.completedSets;
                return (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-all ${isCompleted
                      ? 'bg-green-500 text-black'
                      : isCurrent
                        ? 'bg-zinc-800 border-2 border-green-500 text-white'
                        : 'bg-zinc-900 text-zinc-600'
                      }`}
                  >
                    {isCompleted ? <Check size={20} strokeWidth={3} /> : i + 1}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-6 pb-28 sm:pb-32 space-y-3">
            {!isExerciseComplete ? (
              <>
                <button
                  onClick={handleCompleteSet}
                  className="w-full bg-green-500 text-black py-5 rounded-2xl text-lg font-black uppercase tracking-wider hover:bg-green-400 active:scale-[0.98] transition-all shadow-lg shadow-green-500/20"
                >
                  Complete Set ({currentProgress?.completedSets || 0}/{currentExerciseData.sets})
                </button>
                <button
                  onClick={() => setShowRestTimer(true)}
                  className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all border border-zinc-800"
                >
                  <Timer size={20} />
                  Rest Timer ({currentExerciseData.rest_seconds}s)
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  if (activeWorkout.currentExerciseIndex < activeWorkout.exercises.length - 1) {
                    const nextIndex = activeWorkout.currentExerciseIndex + 1;
                    setActiveWorkout({
                      ...activeWorkout,
                      currentExerciseIndex: nextIndex,
                    });
                    let nextExercise: PlanExercise | null = null;
                    if (activeWorkout.dayId === 'quick-workout' && activeWorkout.templateExercises) {
                      const nextTemplateEx = activeWorkout.templateExercises[nextIndex];
                      if (nextTemplateEx) {
                        nextExercise = {
                          id: `quick-ex-${nextIndex}`,
                          day_id: 'quick-workout',
                          exercise_id: `quick-ex-${nextIndex}`,
                          exercise_name: nextTemplateEx.name,
                          sets: nextTemplateEx.sets,
                          reps: String(nextTemplateEx.reps),
                          rest_seconds: 60,
                          order_index: nextIndex,
                          notes: null,
                          created_at: new Date().toISOString(),
                        };
                      }
                    } else {
                      const dayWithExercises = workoutPlan?.days.find(d => d.id === activeWorkout.dayId);
                      if (dayWithExercises && dayWithExercises.exercises[nextIndex]) {
                        nextExercise = dayWithExercises.exercises[nextIndex];
                      }
                    }

                    if (nextExercise) {
                      setCurrentExerciseData(nextExercise);
                    }
                  } else {
                    handleFinishWorkout();
                  }
                }}
                className="w-full bg-white text-black py-5 rounded-2xl text-lg font-black uppercase tracking-wider hover:bg-zinc-200 active:scale-[0.98] transition-all"
              >
                {activeWorkout.currentExerciseIndex < activeWorkout.exercises.length - 1
                  ? 'Next Exercise'
                  : 'Finish Workout'}
              </button>
            )}
          </div>

          <RestTimer
            isOpen={showRestTimer}
            onClose={() => setShowRestTimer(false)}
            defaultDuration={currentExerciseData.rest_seconds}
          />
        </div>
      </div>
    );
  }

  // Render day detail view
  if (selectedDay) {
    const dayWithExercises = workoutPlan?.days.find(d => d.id === selectedDay.id);
    const exercises = dayWithExercises?.exercises || [];
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
    const estimatedDuration = exercises.length * 5 + totalSets * 1; // rough estimate

    return (
      <div className="absolute inset-0 bg-black flex flex-col items-center p-4 sm:p-6 text-white z-40">
        <div className="w-full max-w-md h-full flex flex-col">
          <header className="flex items-center py-4 sm:py-6 shrink-0">
            <button
              onClick={() => setSelectedDay(null)}
              className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="flex-1 text-center text-lg font-bold">{selectedDay.name}</h1>
            <div className="w-10" />
          </header>

          <div className="flex-1 overflow-y-auto px-6">
            {/* Hero section */}
            <div className="bg-gradient-to-br from-green-500/20 to-zinc-900 rounded-3xl p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center">
                  <Dumbbell size={32} className="text-green-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedDay.name}</h2>
                  <p className="text-zinc-400 text-sm">
                    {exercises.length} exercises • {totalSets} sets
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Clock size={16} />
                  <span>~{formatDuration(estimatedDuration)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Flame size={16} />
                  <span>~{estimatedDuration * 8} kcal</span>
                </div>
              </div>
            </div>

            {/* Exercise list */}
            <div className="space-y-3">
              {exercises.map((exercise, index) => (
                <div
                  key={exercise.id}
                  className="bg-zinc-900 rounded-2xl p-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-sm font-bold text-zinc-500">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">{exercise.exercise_name}</h3>
                    <p className="text-sm text-zinc-500">
                      {exercise.sets} sets × {exercise.reps} reps
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-zinc-600" />
                </div>
              ))}
            </div>
          </div>

          {/* Start button */}
          <div className="p-4 sm:p-6 pb-28 sm:pb-32 shrink-0">
            <button
              onClick={() => handleStartWorkout(selectedDay, exercises)}
              className="w-full bg-green-500 text-black py-4 sm:py-5 rounded-2xl text-base sm:text-lg font-black uppercase tracking-wider hover:bg-green-400 active:scale-[0.98] transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-3"
            >
              <Play size={20} className="sm:w-6 sm:h-6" />
              Start Workout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main workout page - list of workout days
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header */}
      <header className="p-6">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Workout</h1>
        <p className="text-zinc-500 text-sm">Choose your workout</p>
      </header>

      {/* Category tabs */}
      <div className="px-6 mb-6">
        <div className="flex bg-zinc-900 rounded-2xl p-1">
          {(['plan', 'quick', 'custom'] as WorkoutCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${category === cat
                ? 'bg-green-500 text-black'
                : 'text-zinc-500 hover:text-white'
                }`}
            >
              {cat === 'plan' ? 'My Plan' : cat === 'quick' ? 'Quick' : 'Custom'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-32">
        {planLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : category === 'plan' ? (
          workoutPlan ? (
            <div className="space-y-4">
              {/* Plan header */}
              <div className="bg-gradient-to-r from-green-500/10 to-transparent rounded-2xl p-4 mb-4">
                <h2 className="font-bold text-lg">{workoutPlan.plan.name}</h2>
                <p className="text-zinc-500 text-sm">{workoutPlan.plan.days_per_week} days per week</p>
              </div>

              {/* Workout days */}
              {workoutPlan.days.map((day) => {
                const isToday = day.day_number === todayDayNumber;
                const exerciseCount = day.exercises.length;
                const totalSets = day.exercises.reduce((sum, ex) => sum + ex.sets, 0);

                return (
                  <button
                    key={day.id}
                    onClick={() => !day.is_rest_day && setSelectedDay(day)}
                    disabled={day.is_rest_day}
                    className={`w-full text-left rounded-2xl p-5 transition-all ${day.is_rest_day
                      ? 'bg-zinc-900/50 opacity-50'
                      : isToday
                        ? 'bg-green-500/10 border border-green-500/30 hover:border-green-500/50'
                        : 'bg-zinc-900 hover:bg-zinc-800'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${day.is_rest_day
                        ? 'bg-zinc-800'
                        : isToday
                          ? 'bg-green-500'
                          : 'bg-zinc-800'
                        }`}>
                        {day.is_rest_day ? (
                          <span className="text-2xl">😴</span>
                        ) : (
                          <Dumbbell size={24} className={isToday ? 'text-black' : 'text-zinc-500'} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold">{day.name}</h3>
                          {isToday && (
                            <span className="text-[10px] font-black uppercase bg-green-500 text-black px-2 py-0.5 rounded-full">
                              Today
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-500">
                          {day.is_rest_day
                            ? 'Rest & Recovery'
                            : `${exerciseCount} exercises • ${totalSets} sets`}
                        </p>
                      </div>
                      {!day.is_rest_day && (
                        <ChevronRight size={20} className="text-zinc-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-zinc-900 rounded-[2rem] flex items-center justify-center mb-6">
                <Dumbbell size={32} className="text-zinc-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">No Workout Plan</h3>
              <p className="text-sm text-zinc-500 max-w-[250px] mb-6">
                Complete onboarding to get a personalized workout plan.
              </p>
              <button
                onClick={() => navigate('/onboarding')}
                className="bg-green-500 text-black px-6 py-3 rounded-xl font-bold"
              >
                Get Started
              </button>
            </div>
          )
        ) : category === 'quick' ? (
          <div className="space-y-4">
            {BUILT_IN_TEMPLATES.filter(t => ['full-body', 'upper-body', 'lower-body', 'core', 'cardio'].includes(t.id)).map((template) => (
              <button
                key={template.id}
                onClick={() => handleStartTemplateWorkout(template.name, template.exercises as any)}
                className="w-full bg-zinc-900 rounded-2xl p-5 flex items-center gap-4 hover:bg-zinc-800 transition-all border border-transparent active:border-green-500/50"
              >
                <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center">
                  <Dumbbell size={24} className="text-green-500" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold">{template.name}</h3>
                  <p className="text-sm text-zinc-500">{template.description}</p>
                </div>
                <ChevronRight size={20} className="text-zinc-600" />
              </button>
            ))}
          </div>
        ) : isCreatingCustom ? (
          <div className="space-y-6">
            <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
              <label className="block text-xs font-black uppercase text-zinc-500 mb-2">Workout Name</label>
              <input
                type="text"
                value={customWorkoutName}
                onChange={(e) => setCustomWorkoutName(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-green-500 transition-colors"
                placeholder="Enter workout name..."
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-black uppercase text-sm tracking-widest text-zinc-500">Exercises</h3>
                <span className="text-xs text-zinc-600">{customExercises.length} added</span>
              </div>

              {customExercises.map((ex, idx) => (
                <div key={idx} className="bg-zinc-900 rounded-2xl p-4 flex items-center justify-between border border-zinc-800">
                  <div>
                    <h4 className="font-bold">{ex.name}</h4>
                    <p className="text-sm text-zinc-500">{ex.sets} sets × {ex.reps} reps</p>
                  </div>
                  <button
                    onClick={() => setCustomExercises(customExercises.filter((_, i) => i !== idx))}
                    className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}

              {isAddingExercise ? (
                <div className="bg-zinc-900 rounded-3xl p-6 border-2 border-dashed border-zinc-800 animate-in fade-in slide-in-from-top-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-zinc-500 mb-2">Exercise Name</label>
                      <input
                        type="text"
                        autoFocus
                        value={newExerciseName}
                        onChange={(e) => setNewExerciseName(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-green-500 transition-colors"
                        placeholder="e.g. Bench Press"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black uppercase text-zinc-500 mb-2">Sets</label>
                        <input
                          type="number"
                          value={newExerciseSets}
                          onChange={(e) => setNewExerciseSets(parseInt(e.target.value) || 0)}
                          className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-green-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase text-zinc-500 mb-2">Reps</label>
                        <input
                          type="text"
                          value={newExerciseReps}
                          onChange={(e) => setNewExerciseReps(e.target.value)}
                          className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-green-500 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setIsAddingExercise(false)}
                        className="flex-1 py-3 text-zinc-500 font-bold uppercase text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddCustomExercise}
                        disabled={!newExerciseName.trim()}
                        className="flex-1 bg-white text-black py-3 rounded-xl font-black uppercase text-sm disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingExercise(true)}
                  className="w-full py-6 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-white hover:border-zinc-700 transition-all group"
                >
                  <Plus size={24} className="group-hover:scale-110 transition-transform" />
                  <span className="font-bold uppercase text-xs tracking-widest">Add Exercise</span>
                </button>
              )}
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={() => handleStartTemplateWorkout(customWorkoutName, customExercises)}
                disabled={customExercises.length === 0}
                className="w-full bg-green-500 text-black py-4 rounded-2xl font-black uppercase tracking-wider disabled:opacity-50 disabled:grayscale shadow-lg shadow-green-500/20"
              >
                Start Custom Workout
              </button>
              <button
                onClick={() => setIsCreatingCustom(false)}
                className="w-full py-4 text-zinc-500 font-bold uppercase text-sm"
              >
                Go Back
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-24 h-24 bg-zinc-900 rounded-[2.5rem] flex items-center justify-center mb-6 border border-zinc-800">
              <Dumbbell size={40} className="text-zinc-700" />
            </div>
            <h3 className="text-xl font-black uppercase mb-2">Custom Workouts</h3>
            <p className="text-zinc-500 max-w-[280px] mb-8">
              Design a session tailored to your goals. Add sets, reps, and exercises.
            </p>
            <button
              onClick={() => setIsCreatingCustom(true)}
              className="bg-green-500 text-black px-10 py-4 rounded-2xl font-black uppercase tracking-wider hover:scale-105 transition-transform"
            >
              Build Workout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutPage;
