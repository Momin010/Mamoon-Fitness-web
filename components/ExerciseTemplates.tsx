
import React from 'react';
import { Dumbbell, Plus, X, Copy } from 'lucide-react';
import { Exercise } from '../types';

interface Template {
  id: string;
  name: string;
  description: string;
  exercises: Omit<Exercise, 'id' | 'completedSets'>[];
}

import { BUILT_IN_TEMPLATES } from '../lib/workoutTemplates';


interface ExerciseTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (exercises: Omit<Exercise, 'id' | 'completedSets'>[]) => void;
}

export const ExerciseTemplates: React.FC<ExerciseTemplatesProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">Workout Templates</h2>
            <p className="text-sm text-zinc-400">Choose a pre-built routine</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {BUILT_IN_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="p-4 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors cursor-pointer group"
              onClick={() => {
                onSelectTemplate(template.exercises);
                onClose();
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Dumbbell size={20} className="text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-bold group-hover:text-green-400 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-zinc-400">{template.description}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {template.exercises.length} exercises
                    </p>
                  </div>
                </div>
                <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus size={20} className="text-green-500" />
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-zinc-700">
                <div className="flex flex-wrap gap-2">
                  {template.exercises.slice(0, 4).map((ex, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-zinc-900 px-2 py-1 rounded text-zinc-400"
                    >
                      {ex.name}
                    </span>
                  ))}
                  {template.exercises.length > 4 && (
                    <span className="text-xs bg-zinc-900 px-2 py-1 rounded text-zinc-400">
                      +{template.exercises.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="w-full py-3 border border-zinc-700 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseTemplates;
