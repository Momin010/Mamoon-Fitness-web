import React from 'react';
import { Sprout, TrendingUp, Flame } from 'lucide-react';
import { ExperienceLevel } from '../../types/fitness';

interface ExperienceStepProps {
  selectedLevel: ExperienceLevel | null;
  onUpdate: (level: ExperienceLevel) => void;
}

const EXPERIENCE_LEVELS: { id: ExperienceLevel; label: string; description: string; icon: React.ReactNode; details: string }[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    description: 'New to working out',
    icon: <Sprout size={24} />,
    details: '0-6 months of training'
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    description: 'Some gym experience',
    icon: <TrendingUp size={24} />,
    details: '6 months - 2 years of training'
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Experienced lifter',
    icon: <Flame size={24} />,
    details: '2+ years of consistent training'
  }
];

const ExperienceStep: React.FC<ExperienceStepProps> = ({ selectedLevel, onUpdate }) => {
  return (
    <div className="flex flex-col p-6">
      <h2 className="text-2xl font-bold mb-2">Workout Experience</h2>
      <p className="text-zinc-400 mb-8">How experienced are you with working out?</p>

      <div className="space-y-4">
        {EXPERIENCE_LEVELS.map((level) => {
          const isSelected = selectedLevel === level.id;
          return (
            <button
              key={level.id}
              onClick={() => onUpdate(level.id)}
              className={`w-full p-5 rounded-xl flex items-center gap-4 transition-all ${
                isSelected
                  ? 'bg-green-500/20 border-2 border-green-500'
                  : 'bg-zinc-900 border-2 border-transparent hover:border-zinc-700'
              }`}
            >
              <div className={`p-3 rounded-xl ${isSelected ? 'bg-green-500/30 text-green-500' : 'bg-zinc-800 text-zinc-400'}`}>
                {level.icon}
              </div>
              <div className="flex-1 text-left">
                <p className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                  {level.label}
                </p>
                <p className="text-zinc-400 text-sm">{level.description}</p>
                <p className="text-zinc-600 text-xs mt-1">{level.details}</p>
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
        This determines your workout split and exercise complexity
      </p>
    </div>
  );
};

export default ExperienceStep;
