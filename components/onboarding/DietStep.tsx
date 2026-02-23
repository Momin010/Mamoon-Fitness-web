import React from 'react';
import { Beef, Scale, Wheat, Apple, Salad, Leaf, Moon, HelpCircle } from 'lucide-react';
import { DietPreference } from '../../types/fitness';

interface DietStepProps {
  selectedPreferences: DietPreference[];
  onUpdate: (preferences: DietPreference[]) => void;
}

const DIET_PREFERENCES: { id: DietPreference; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'high_protein',
    label: 'High Protein',
    description: 'Focus on protein-rich foods',
    icon: <Beef size={24} />
  },
  {
    id: 'balanced',
    label: 'Balanced Diet',
    description: 'Mix of all food groups',
    icon: <Scale size={24} />
  },
  {
    id: 'low_carb',
    label: 'Low Carb',
    description: 'Reduce carbohydrate intake',
    icon: <Wheat size={24} />
  },
  {
    id: 'keto',
    label: 'Keto',
    description: 'Very low carb, high fat',
    icon: <Apple size={24} />
  },
  {
    id: 'vegetarian',
    label: 'Vegetarian',
    description: 'No meat, but dairy & eggs OK',
    icon: <Salad size={24} />
  },
  {
    id: 'vegan',
    label: 'Vegan',
    description: 'No animal products',
    icon: <Leaf size={24} />
  },
  {
    id: 'halal',
    label: 'Halal Only',
    description: 'Halal-certified foods only',
    icon: <Moon size={24} />
  },
  {
    id: 'no_preference',
    label: 'No Preference',
    description: "I'll eat anything",
    icon: <HelpCircle size={24} />
  }
];

const DietStep: React.FC<DietStepProps> = ({ selectedPreferences, onUpdate }) => {
  const togglePreference = (prefId: DietPreference) => {
    // If selecting "no_preference", clear others
    if (prefId === 'no_preference') {
      if (selectedPreferences.includes('no_preference')) {
        onUpdate([]);
      } else {
        onUpdate(['no_preference']);
      }
      return;
    }

    // If selecting anything else, remove "no_preference"
    let newPrefs = selectedPreferences.filter(p => p !== 'no_preference');
    
    if (newPrefs.includes(prefId)) {
      onUpdate(newPrefs.filter(p => p !== prefId));
    } else {
      onUpdate([...newPrefs, prefId]);
    }
  };

  return (
    <div className="flex flex-col p-6">
      <h2 className="text-2xl font-bold mb-2">Nutrition Preferences</h2>
      <p className="text-zinc-400 mb-8">Select all that apply to your diet</p>

      <div className="space-y-3">
        {DIET_PREFERENCES.map((pref) => {
          const isSelected = selectedPreferences.includes(pref.id);
          return (
            <button
              key={pref.id}
              onClick={() => togglePreference(pref.id)}
              className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${
                isSelected
                  ? 'bg-green-500/20 border-2 border-green-500'
                  : 'bg-zinc-900 border-2 border-transparent hover:border-zinc-700'
              }`}
            >
              <div className={`p-3 rounded-xl ${isSelected ? 'bg-green-500/30 text-green-500' : 'bg-zinc-800 text-zinc-400'}`}>
                {pref.icon}
              </div>
              <div className="flex-1 text-left">
                <p className={`font-bold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                  {pref.label}
                </p>
                <p className="text-zinc-500 text-sm">{pref.description}</p>
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

      {selectedPreferences.length > 0 && (
        <p className="text-center text-zinc-500 text-sm mt-6">
          {selectedPreferences.length} preference{selectedPreferences.length > 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
};

export default DietStep;
