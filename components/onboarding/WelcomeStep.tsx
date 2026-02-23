import React from 'react';
import { Dumbbell, Target, Utensils, TrendingUp, Sparkles } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  return (
    <div className="flex flex-col flex-1 p-6">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-3xl flex items-center justify-center mb-6">
          <Dumbbell size={40} className="text-green-500" />
        </div>
        
        <h1 className="text-3xl font-bold mb-3">Welcome to LockIn</h1>
        <p className="text-zinc-400 text-lg mb-8">
          Let's personalize your fitness journey
        </p>

        {/* Features */}
        <div className="w-full max-w-sm space-y-4 mb-8">
          <div className="flex items-center gap-4 p-4 bg-zinc-900 rounded-xl">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Target size={24} className="text-green-500" />
            </div>
            <div className="text-left">
              <p className="font-medium">Personalized Goals</p>
              <p className="text-zinc-500 text-sm">Custom targets based on your body</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-zinc-900 rounded-xl">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Utensils size={24} className="text-blue-500" />
            </div>
            <div className="text-left">
              <p className="font-medium">Smart Nutrition</p>
              <p className="text-zinc-500 text-sm">Macro targets & meal tracking</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-zinc-900 rounded-xl">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingUp size={24} className="text-purple-500" />
            </div>
            <div className="text-left">
              <p className="font-medium">Workout Plans</p>
              <p className="text-zinc-500 text-sm">AI-generated exercise routines</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-zinc-500 text-sm mb-8">
          <Sparkles size={16} className="text-yellow-500" />
          <span>Takes only 2 minutes</span>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={onNext}
        className="w-full py-4 bg-green-500 text-black rounded-xl font-bold uppercase tracking-widest hover:bg-green-400 active:scale-[0.98] transition-all"
      >
        Get Started
      </button>
    </div>
  );
};

export default WelcomeStep;
