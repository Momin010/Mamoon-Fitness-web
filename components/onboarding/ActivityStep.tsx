import React from 'react';
import { Armchair, Footprints, Bike, PersonStanding, Trophy } from 'lucide-react';
import { ActivityLevel } from '../../types/fitness';

interface ActivityStepProps {
  selectedLevel: ActivityLevel | null;
  onUpdate: (level: ActivityLevel) => void;
}

const ACTIVITY_LEVELS: { id: ActivityLevel; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'sedentary',
    label: 'Sedentary',
    description: 'Desk job, little to no exercise',
    icon: <Armchair size={24} />
  },
  {
    id: 'light',
    label: 'Lightly Active',
    description: 'Light exercise 1-3 days/week',
    icon: <Footprints size={24} />
  },
  {
    id: 'moderate',
    label: 'Moderately Active',
    description: 'Moderate exercise 3-5 days/week',
    icon: <Bike size={24} />
  },
  {
    id: 'active',
    label: 'Very Active',
    description: 'Hard exercise 6-7 days/week',
    icon: <PersonStanding size={24} />
  },
  {
    id: 'athlete',
    label: 'Athlete',
    description: 'Very intense exercise or physical job',
    icon: <Trophy size={24} />
  }
];

const ActivityStep: React.FC<ActivityStepProps> = ({ selectedLevel, onUpdate }) => {
  return (
    <div className="flex flex-col p-6">
      <h2 className="text-2xl font-bold mb-2">Activity Level</h2>
      <p className="text-zinc-400 mb-8">How active are you on a typical day?</p>

      <div className="space-y-3">
        {ACTIVITY_LEVELS.map((level) => {
          const isSelected = selectedLevel === level.id;
          return (
            <button
              key={level.id}
              onClick={() => onUpdate(level.id)}
              className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${
                isSelected
                  ? 'bg-green-500/20 border-2 border-green-500'
                  : 'bg-zinc-900 border-2 border-transparent hover:border-zinc-700'
              }`}
            >
              <div className={`p-3 rounded-xl ${isSelected ? 'bg-green-500/30 text-green-500' : 'bg-zinc-800 text-zinc-400'}`}>
                {level.icon}
              </div>
              <div className="flex-1 text-left">
                <p className={`font-bold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                  {level.label}
                </p>
                <p className="text-zinc-500 text-sm">{level.description}</p>
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

      <p className="text-center text-zinc-600 text-xs mt-6">
        This affects your daily calorie calculation
      </p>
    </div>
  );
};

export default ActivityStep;
