
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MoreHorizontal, History, Plus, Trash2, Check, Timer, LayoutTemplate, Dumbbell } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Exercise } from '../types';
import RestTimer from '../components/RestTimer';
import ExerciseTemplates from '../components/ExerciseTemplates';
import { ForgeDropdown, ForgeSlider } from '../components';

const WorkoutPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    settings,
    addExercise,
    exercises,
    completeExerciseSet,
    updateExercise,
    deleteExercise,
    resetExercises,
    saveWorkoutSession,
    triggerAutoSave,
    addXp
  } = useApp();

  const [isActive, setIsActive] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseSets, setNewExerciseSets] = useState(3);
  const [newExerciseReps, setNewExerciseReps] = useState(10);
  const [newExerciseWeight, setNewExerciseWeight] = useState('');
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && workoutStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - workoutStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, workoutStartTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartWorkout = () => {
    setIsActive(true);
    setWorkoutStartTime(Date.now());
    resetExercises();
  };

  const handleFinishWorkout = async () => {
    if (!workoutStartTime) return;

    setIsFinishing(true);
    try {
      const duration = Math.floor((Date.now() - workoutStartTime) / 60000); // in minutes
      const completedExercises = exercises.filter(e => e.completedSets === e.sets);
      const totalXp = completedExercises.length * 25 + (completedExercises.length > 0 ? 50 : 0);

      // This now returns a Promise and handles its own cloud sync
      await saveWorkoutSession({
        exercises: [...exercises],
        duration,
        totalXp,
        notes: ''
      });

      // Explicitly trigger a global sync to ensure profile XP etc are updated
      // This satisfies the user's request for immediate save on finish
      await triggerAutoSave();

      setIsActive(false);
      setWorkoutStartTime(null);
      setElapsedTime(0);
      resetExercises();

      // Navigate to history to see the saved workout
      navigate('/workout/history');
    } catch (error) {
      console.error('Failed to finish workout:', error);
    } finally {
      setIsFinishing(false);
    }
  };

  const handleAddExercise = () => {
    if (newExerciseName.trim()) {
      addExercise({
        name: newExerciseName.trim(),
        sets: newExerciseSets,
        reps: newExerciseReps,
        completedSets: 0,
        weight: newExerciseWeight ? parseInt(newExerciseWeight) : undefined
      });
      setNewExerciseName('');
      setNewExerciseSets(3);
      setNewExerciseReps(10);
      setNewExerciseWeight('');
      setShowAddExercise(false);
    }
  };

  const handleApplyTemplate = (templateExercises: Omit<Exercise, 'id' | 'completedSets'>[]) => {
    templateExercises.forEach(ex => {
      addExercise({
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        completedSets: 0,
        weight: ex.weight
      });
    });
  };

  const handleCompleteSet = async () => {
    if (currentExercise) {
      completeExerciseSet(currentExercise.id);

      // Refresh current exercise data
      const updated = exercises.find(e => e.id === currentExercise.id);
      if (updated) {
        setCurrentExercise(updated);
      }
    }
  };

  const handleFinishExercise = () => {
    setCurrentExercise(null);
  };

  const allExercisesCompleted = exercises.length > 0 && exercises.every(e => e.completedSets === e.sets);
  const completedCount = exercises.filter(e => e.completedSets === e.sets).length;

  // Auto-start workout if not active to skip landing screen
  useEffect(() => {
    if (!isActive) {
      handleStartWorkout();
    }
  }, [isActive]);

  if (currentExercise) {
    const isComplete = currentExercise.completedSets === currentExercise.sets;

    return (
      <div className="flex flex-col min-h-screen p-6 bg-black text-white pb-32">
        <header className="flex justify-between items-center mb-8">
          <button
            onClick={() => setCurrentExercise(null)}
            className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Active Exercise</p>
          </div>
          <button className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
            <MoreHorizontal size={24} />
          </button>
        </header>

        <h1 className="text-3xl font-black uppercase mb-2 italic">{currentExercise.name}</h1>
        {currentExercise.weight && (
          <p className="text-zinc-400 mb-8">{currentExercise.weight} lbs</p>
        )}

        <div className="space-y-3 mb-8">
          {Array.from({ length: currentExercise.sets }, (_, i) => i + 1).map((set) => {
            const isCompleted = set <= currentExercise.completedSets;
            return (
              <div
                key={set}
                className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${isCompleted
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-zinc-900 border-zinc-800'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCompleted ? 'bg-green-500 text-black' : 'bg-zinc-800'
                    }`}>
                    {isCompleted ? <Check size={16} strokeWidth={3} /> : <span className="text-xs font-bold">{set}</span>}
                  </div>
                  <span className={`text-sm font-black uppercase tracking-wider ${isCompleted ? 'text-green-500' : 'text-zinc-500'
                    }`}>
                    Set {set}
                  </span>
                </div>
                <span className={`text-sm font-black ${isCompleted ? 'text-green-500' : 'text-zinc-600'}`}>
                  {isCompleted ? `${currentExercise.reps} REPS` : `${currentExercise.reps} REPS`}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-auto space-y-3">
          {!isComplete ? (
            <>
              <button
                onClick={handleCompleteSet}
                className="w-full bg-green-500 text-black py-5 rounded-2xl text-lg font-black uppercase tracking-wider hover:bg-green-400 active:scale-[0.98] transition-all shadow-lg shadow-green-500/20"
              >
                Log Set (+10 XP)
              </button>
              <button
                onClick={() => setShowRestTimer(true)}
                className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 active:scale-[0.98] transition-all border border-zinc-800"
              >
                <Timer size={20} />
                Rest Timer
              </button>
            </>
          ) : (
            <button
              onClick={handleFinishExercise}
              className="w-full bg-white text-black py-5 rounded-2xl text-lg font-black uppercase tracking-wider hover:bg-zinc-200 active:scale-[0.98] transition-all"
            >
              Finish Exercise (+25 XP)
            </button>
          )}
        </div>

        <RestTimer
          isOpen={showRestTimer}
          onClose={() => setShowRestTimer(false)}
          defaultDuration={60}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-6 bg-black text-white pb-32">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Workout</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Live Session</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Duration</span>
            <span className="font-mono font-bold text-green-500 text-xl">{formatTime(elapsedTime)}</span>
          </div>
        </div>
      </header>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Session Progress</span>
          <span className="text-green-500 font-bold text-xs">{completedCount}/{exercises.length} Exercises</span>
        </div>
        <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${exercises.length > 0 ? (completedCount / exercises.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="space-y-4 mb-4 flex-1 overflow-y-auto hide-scrollbar">
        {exercises.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 opacity-40">
            <div className="w-20 h-20 bg-zinc-900 rounded-[2rem] flex items-center justify-center mb-6">
              <Dumbbell size={32} className="text-zinc-600" />
            </div>
            <h3 className="text-lg font-bold mb-1">Empty Forge</h3>
            <p className="text-xs text-zinc-500 max-w-[200px]">Add exercises or use a template to begin your session.</p>
          </div>
        ) : (
          exercises.map((ex) => {
            const isComplete = ex.completedSets === ex.sets;
            return (
              <div
                key={ex.id}
                onClick={() => !isComplete && setCurrentExercise(ex)}
                className={`p-5 rounded-3xl border transition-all ${isComplete
                  ? 'bg-green-500/5 border-green-500/20 opacity-40 scale-[0.98]'
                  : 'bg-zinc-900 border-zinc-800 hover:border-green-500/50 cursor-pointer active:scale-[0.97]'
                  }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className={`font-black uppercase tracking-tight ${isComplete ? 'text-green-500' : 'text-white'}`}>{ex.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        {ex.sets} Sets × {ex.reps} Reps
                      </p>
                      {ex.weight && (
                        <span className="w-1 h-1 rounded-full bg-zinc-800" />
                      )}
                      {ex.weight && (
                        <p className="text-[10px] font-bold text-green-500/70 uppercase tracking-widest">
                          {ex.weight} LBS
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`text-xs font-black ${isComplete ? 'text-green-500' : 'text-zinc-700'}`}>
                        {ex.completedSets}/{ex.sets}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteExercise(ex.id);
                      }}
                      className="p-2 text-zinc-700 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center justify-center gap-2 py-4 bg-zinc-900 text-zinc-400 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all border border-zinc-800"
          >
            <LayoutTemplate size={16} />
            Template
          </button>
          <button
            onClick={() => setShowAddExercise(true)}
            className="flex items-center justify-center gap-2 py-4 bg-zinc-900 text-green-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-green-500/10 transition-all border border-green-500/20"
          >
            <Plus size={16} />
            Add Move
          </button>
        </div>

        {showAddExercise && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-4 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Pick Your Poison</h4>
            <ForgeDropdown
              options={settings.exerciseList.map(ex => ({ value: ex, label: ex }))}
              value={newExerciseName}
              onChange={setNewExerciseName}
              placeholder="Search exercise..."
              searchable
              size="md"
            />
            <div className="space-y-6 pt-2">
              <ForgeSlider
                label="Target Sets"
                value={newExerciseSets}
                onChange={setNewExerciseSets}
                min={1}
                max={10}
                step={1}
                size="sm"
                color="green"
              />
              <ForgeSlider
                label="Target Reps"
                value={newExerciseReps}
                onChange={setNewExerciseReps}
                min={1}
                max={50}
                step={1}
                size="sm"
                color="blue"
              />
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Weight (LBS)</label>
                <input
                  type="number"
                  value={newExerciseWeight}
                  onChange={(e) => setNewExerciseWeight(e.target.value)}
                  placeholder="0"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none transition-all"
                  min="0"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAddExercise(false)}
                className="flex-1 py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExercise}
                disabled={!newExerciseName}
                className="flex-1 py-4 bg-green-500 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-400 transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
              >
                Add To Set
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/workout/history')}
            className="p-5 bg-zinc-900 text-zinc-400 rounded-2xl hover:text-white transition-all border border-zinc-800"
          >
            <History size={20} />
          </button>
          <button
            onClick={() => setShowRestTimer(true)}
            className="p-5 bg-zinc-900 text-zinc-400 rounded-2xl hover:text-white transition-all border border-zinc-800"
          >
            <Timer size={20} />
          </button>
          <button
            onClick={allExercisesCompleted ? handleFinishWorkout : undefined}
            disabled={isFinishing}
            className={`flex-1 py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] ${allExercisesCompleted
              ? 'bg-white text-black hover:bg-zinc-200'
              : 'bg-zinc-900 text-zinc-700 border border-zinc-800 cursor-not-allowed'
              } ${isFinishing ? 'opacity-50 cursor-wait' : ''}`}
          >
            {isFinishing ? 'Syncing...' : 'Finish Session'}
          </button>
        </div>
      </div>

      <RestTimer
        isOpen={showRestTimer}
        onClose={() => setShowRestTimer(false)}
        defaultDuration={60}
      />

      <ExerciseTemplates
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleApplyTemplate}
      />
    </div>
  );
};

export default WorkoutPage;
