import React, { useState } from 'react';
import { Ruler, Scale, Calendar, User } from 'lucide-react';
import { OnboardingFormData, Sex } from '../../types/fitness';

interface BodyMetricsStepProps {
  data: OnboardingFormData;
  onUpdate: (updates: Partial<OnboardingFormData>) => void;
}

const BodyMetricsStep: React.FC<BodyMetricsStepProps> = ({ data, onUpdate }) => {
  const [localHeight, setLocalHeight] = useState(data.height_cm.toString());
  const [localWeight, setLocalWeight] = useState(data.weight_kg.toString());
  const [localAge, setLocalAge] = useState(data.age.toString());

  const handleHeightChange = (value: string) => {
    setLocalHeight(value);
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      onUpdate({ height_cm: num });
    }
  };

  const handleWeightChange = (value: string) => {
    setLocalWeight(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      onUpdate({ weight_kg: num });
    }
  };

  const handleAgeChange = (value: string) => {
    setLocalAge(value);
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      onUpdate({ age: num });
    }
  };

  const handleSexChange = (sex: Sex) => {
    onUpdate({ sex });
  };

  return (
    <div className="flex flex-col p-6">
      <h2 className="text-2xl font-bold mb-2">Body Metrics</h2>
      <p className="text-zinc-400 mb-8">This helps us calculate your calorie needs</p>

      <div className="space-y-6">
        {/* Height */}
        <div>
          <label className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
            <Ruler size={16} />
            Height (cm)
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={localHeight}
            onChange={(e) => handleHeightChange(e.target.value)}
            placeholder="170"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-2xl font-bold text-center focus:border-green-500 focus:outline-none transition-colors"
          />
          <div className="flex justify-between mt-2 text-xs text-zinc-500">
            <span>140 cm</span>
            <span>220 cm</span>
          </div>
          <input
            type="range"
            min="140"
            max="220"
            value={data.height_cm}
            onChange={(e) => {
              setLocalHeight(e.target.value);
              onUpdate({ height_cm: parseInt(e.target.value) });
            }}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
        </div>

        {/* Weight */}
        <div>
          <label className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
            <Scale size={16} />
            Weight (kg)
          </label>
          <input
            type="number"
            inputMode="decimal"
            value={localWeight}
            onChange={(e) => handleWeightChange(e.target.value)}
            placeholder="70"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-2xl font-bold text-center focus:border-green-500 focus:outline-none transition-colors"
          />
          <div className="flex justify-between mt-2 text-xs text-zinc-500">
            <span>30 kg</span>
            <span>200 kg</span>
          </div>
          <input
            type="range"
            min="30"
            max="200"
            value={data.weight_kg}
            onChange={(e) => {
              setLocalWeight(e.target.value);
              onUpdate({ weight_kg: parseFloat(e.target.value) });
            }}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
        </div>

        {/* Age */}
        <div>
          <label className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
            <Calendar size={16} />
            Age
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={localAge}
            onChange={(e) => handleAgeChange(e.target.value)}
            placeholder="25"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-2xl font-bold text-center focus:border-green-500 focus:outline-none transition-colors"
          />
          <div className="flex justify-between mt-2 text-xs text-zinc-500">
            <span>13</span>
            <span>100</span>
          </div>
          <input
            type="range"
            min="13"
            max="100"
            value={data.age}
            onChange={(e) => {
              setLocalAge(e.target.value);
              onUpdate({ age: parseInt(e.target.value) });
            }}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
        </div>

        {/* Sex */}
        <div>
          <label className="flex items-center gap-2 text-zinc-400 text-sm mb-3">
            <User size={16} />
            Sex
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['male', 'female', 'other'] as Sex[]).map((sex) => (
              <button
                key={sex}
                onClick={() => handleSexChange(sex)}
                className={`py-4 rounded-xl font-medium capitalize transition-all ${
                  data.sex === sex
                    ? 'bg-green-500 text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                {sex}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BodyMetricsStep;
