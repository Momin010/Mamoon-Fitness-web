import React from 'react';
import { Flame, Dumbbell, Scale, Heart, Zap, Activity } from 'lucide-react';
import { FitnessGoal } from '../../types/fitness';

interface GoalsStepProps {
  selectedGoals: FitnessGoal[];
  onUpdate: (goals: FitnessGoal[]) => void;
}

const GOALS: { id: FitnessGoal; label: string; description: string; icon: React.ReactNode; color: string }[] = [
  {
    id: 'lose_fat',
    label: 'Lose Fat',
    description: 'Reduce body fat while preserving muscle',
    icon: <Flame size={24} />,
    color: 'text-orange-500'
  },
  {
    id: 'build_muscle',
    label: 'Build Muscle',
    description: 'Gain muscle mass and strength',
    icon: <Dumbbell size={24} />,
    color: 'text-blue-500'
  },
  {
    id: 'maintain',
    label: 'Maintain Weight',
    description: 'Keep current physique',
    icon: <Scale size={24} />,
    color: 'text-green-500'
  },
  {
    id: 'endurance',
    label: 'Improve Endurance',
    description: 'Better cardio & stamina',
    icon: <Heart size={24} />,
    color: 'text-red-500'
  },
  {
    id: 'strength',
    label: 'Increase Strength',
    description: 'Lift heavier weights',
    icon: <Zap size={24} />,
    color: 'text-yellow-500'
  },
  {
    id: 'general_health',
    label: 'General Health',
    description: 'Overall wellness & fitness',
    icon: <Activity size={24} />,
    color: 'text-purple-500'
  }
];

const GoalsStep: React.FC<GoalsStepProps> = ({ selectedGoals, onUpdate }) => {
  const toggleGoal = (goalId: FitnessGoal) => {
    if (selectedGoals.includes(goalId)) {
      onUpdate(selectedGoals.filter(g => g !== goalId));
    } else {
      onUpdate([...selectedGoals, goalId]);
    }
  };

  return (
    <div className="flex flex-col p-6">
      <h2 className="text-2xl font-bold mb-2">Your Goals</h2>
      <p className="text-zinc-400 mb-8">Select all that apply to you</p>

      <div className="space-y-3">
        {GOALS.map((goal) => {
          const isSelected = selectedGoals.includes(goal.id);
          return (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${
                isSelected
                  ? 'bg-green-500/20 border-2 border-green-500'
                  : 'bg-zinc-900 border-2 border-transparent hover:border-zinc-700'
              }`}
            >
              <div className={`p-3 rounded-xl ${isSelected ? 'bg-green-500/30' : 'bg-zinc-800'} ${isSelected ? 'text-green-500' : goal.color}`}>
                {goal.icon}
              </div>
              <div className="flex-1 text-left">
                <p className={`font-bold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                  {goal.label}
                </p>
                <p className="text-zinc-500 text-sm">{goal.description}</p>
              </div>
              {isSelected && (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-black text-sm font-bold">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedGoals.length > 0 && (
        <p className="text-center text-zinc-500 text-sm mt-6">
          {selectedGoals.length} goal{selectedGoals.length > 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
};

export default GoalsStep;
