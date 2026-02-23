import React, { useMemo } from 'react';
import { Loader2, Check, Ruler, Scale, Calendar, User, Target, Activity, Utensils, Dumbbell } from 'lucide-react';
import { OnboardingFormData, FitnessCalculations } from '../../types/fitness';
import { calculateAllValues } from '../../lib/fitnessCalculations';
import { generateWeeklyWorkout, getWorkoutSummary } from '../../lib/workoutGenerator';

interface SummaryStepProps {
  data: OnboardingFormData;
  onComplete: () => void;
  isSubmitting: boolean;
}

const SummaryStep: React.FC<SummaryStepProps> = ({ data, onComplete, isSubmitting }) => {
  const calculations = useMemo(() => {
    try {
      return calculateAllValues(data);
    } catch {
      return null;
    }
  }, [data]);

  const workoutSummary = useMemo(() => {
    try {
      const workout = generateWeeklyWorkout(data);
      return getWorkoutSummary(workout);
    } catch {
      return null;
    }
  }, [data]);

  const getGoalLabel = (goal: string) => {
    const labels: Record<string, string> = {
      lose_fat: 'Lose Fat',
      build_muscle: 'Build Muscle',
      maintain: 'Maintain',
      endurance: 'Endurance',
      strength: 'Strength',
      general_health: 'General Health'
    };
    return labels[goal] || goal;
  };

  const getActivityLabel = (level: string) => {
    const labels: Record<string, string> = {
      sedentary: 'Sedentary',
      light: 'Lightly Active',
      moderate: 'Moderately Active',
      active: 'Very Active',
      athlete: 'Athlete'
    };
    return labels[level] || level;
  };

  const getExperienceLabel = (level: string) => {
    const labels: Record<string, string> = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced'
    };
    return labels[level] || level;
  };

  const getDietLabel = (pref: string) => {
    const labels: Record<string, string> = {
      high_protein: 'High Protein',
      balanced: 'Balanced',
      low_carb: 'Low Carb',
      keto: 'Keto',
      vegetarian: 'Vegetarian',
      vegan: 'Vegan',
      halal: 'Halal',
      no_preference: 'No Preference'
    };
    return labels[pref] || pref;
  };

  return (
    <div className="flex flex-col p-6">
      <h2 className="text-2xl font-bold mb-2">Your Plan</h2>
      <p className="text-zinc-400 mb-6">Here's your personalized fitness plan</p>

      {/* Calculated Stats */}
      {calculations && (
        <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-2xl p-5 mb-6 border border-green-500/30">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Target size={20} className="text-green-500" />
            Daily Targets
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/30 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-500">{calculations.targetCalories}</p>
              <p className="text-zinc-400 text-sm">Calories</p>
            </div>
            <div className="bg-black/30 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-500">{calculations.protein}g</p>
              <p className="text-zinc-400 text-sm">Protein</p>
            </div>
            <div className="bg-black/30 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-yellow-500">{calculations.carbs}g</p>
              <p className="text-zinc-400 text-sm">Carbs</p>
            </div>
            <div className="bg-black/30 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-purple-500">{calculations.fats}g</p>
              <p className="text-zinc-400 text-sm">Fats</p>
            </div>
          </div>
        </div>
      )}

      {/* Workout Plan */}
      {workoutSummary && (
        <div className="bg-zinc-900 rounded-2xl p-5 mb-6 border border-zinc-800">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <Dumbbell size={20} className="text-green-500" />
            Workout Plan
          </h3>
          <p className="text-zinc-400">{workoutSummary}</p>
        </div>
      )}

      {/* Summary Details */}
      <div className="space-y-3">
        {/* Body Metrics */}
        <div className="bg-zinc-900 rounded-xl p-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <Ruler size={16} className="mx-auto text-zinc-500 mb-1" />
              <p className="font-bold">{data.height_cm} cm</p>
              <p className="text-zinc-500 text-xs">Height</p>
            </div>
            <div>
              <Scale size={16} className="mx-auto text-zinc-500 mb-1" />
              <p className="font-bold">{data.weight_kg} kg</p>
              <p className="text-zinc-500 text-xs">Weight</p>
            </div>
            <div>
              <Calendar size={16} className="mx-auto text-zinc-500 mb-1" />
              <p className="font-bold">{data.age}</p>
              <p className="text-zinc-500 text-xs">Age</p>
            </div>
            <div>
              <User size={16} className="mx-auto text-zinc-500 mb-1" />
              <p className="font-bold capitalize">{data.sex}</p>
              <p className="text-zinc-500 text-xs">Sex</p>
            </div>
          </div>
        </div>

        {/* Goals */}
        <div className="bg-zinc-900 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-zinc-500" />
            <span className="text-zinc-500 text-sm">Goals</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.goals.map(goal => (
              <span key={goal} className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm">
                {getGoalLabel(goal)}
              </span>
            ))}
          </div>
        </div>

        {/* Activity & Experience */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={16} className="text-zinc-500" />
              <span className="text-zinc-500 text-sm">Activity</span>
            </div>
            <p className="font-medium">{getActivityLabel(data.activity_level)}</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell size={16} className="text-zinc-500" />
              <span className="text-zinc-500 text-sm">Experience</span>
            </div>
            <p className="font-medium">{getExperienceLabel(data.experience_level)}</p>
          </div>
        </div>

        {/* Diet */}
        <div className="bg-zinc-900 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Utensils size={16} className="text-zinc-500" />
            <span className="text-zinc-500 text-sm">Diet Preferences</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.diet_preferences.map(pref => (
              <span key={pref} className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full text-sm">
                {getDietLabel(pref)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Complete Button */}
      <div className="mt-6">
        <button
          onClick={onComplete}
          disabled={isSubmitting}
          className="w-full py-4 bg-green-500 text-black rounded-xl font-bold uppercase tracking-widest hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Creating Your Plan...
            </>
          ) : (
            <>
              <Check size={20} />
              Start My Journey
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SummaryStep;
