import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { OnboardingFormData, FitnessCalculations, WeeklyWorkout } from '../../types/fitness';
import { calculateAllValues } from '../../lib/fitnessCalculations';
import { generateWeeklyWorkout } from '../../lib/workoutGenerator';
import WelcomeStep from './WelcomeStep';
import BodyMetricsStep from './BodyMetricsStep';
import GoalsStep from './GoalsStep';
import ActivityStep from './ActivityStep';
import DietStep from './DietStep';
import ExperienceStep from './ExperienceStep';
import SummaryStep from './SummaryStep';

const TOTAL_STEPS = 7;

interface OnboardingFlowProps {
  onComplete: (data: OnboardingFormData, calculations: FitnessCalculations, workout: WeeklyWorkout) => void;
  onSkip?: () => void;
}

const initialFormData: OnboardingFormData = {
  height_cm: 170,
  weight_kg: 70,
  age: 25,
  sex: 'male',
  body_fat_percent: null,
  goals: [],
  activity_level: 'moderate',
  diet_preferences: [],
  experience_level: 'beginner'
};

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = useCallback((updates: Partial<OnboardingFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1: // Body Metrics
        return formData.height_cm > 0 && formData.weight_kg > 0 && formData.age > 0 && formData.sex;
      case 2: // Goals
        return formData.goals.length > 0;
      case 3: // Activity
        return !!formData.activity_level;
      case 4: // Diet
        return formData.diet_preferences.length > 0;
      case 5: // Experience
        return !!formData.experience_level;
      default:
        return true;
    }
  }, [currentStep, formData]);

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const calculations = calculateAllValues(formData);
      const workout = generateWeeklyWorkout(formData);
      onComplete(formData, calculations, workout);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onComplete]);

  const getStepTitle = () => {
    switch (currentStep) {
      case 0: return 'Welcome';
      case 1: return 'Body Metrics';
      case 2: return 'Your Goals';
      case 3: return 'Activity Level';
      case 4: return 'Nutrition';
      case 5: return 'Experience';
      case 6: return 'Your Plan';
      default: return '';
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={handleNext} />;
      case 1:
        return (
          <BodyMetricsStep
            data={formData}
            onUpdate={updateFormData}
          />
        );
      case 2:
        return (
          <GoalsStep
            selectedGoals={formData.goals}
            onUpdate={(goals) => updateFormData({ goals })}
          />
        );
      case 3:
        return (
          <ActivityStep
            selectedLevel={formData.activity_level}
            onUpdate={(activity_level) => updateFormData({ activity_level })}
          />
        );
      case 4:
        return (
          <DietStep
            selectedPreferences={formData.diet_preferences}
            onUpdate={(diet_preferences) => updateFormData({ diet_preferences })}
          />
        );
      case 5:
        return (
          <ExperienceStep
            selectedLevel={formData.experience_level}
            onUpdate={(experience_level) => updateFormData({ experience_level })}
          />
        );
      case 6:
        return (
          <SummaryStep
            data={formData}
            onComplete={handleComplete}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      {currentStep > 0 && (
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 shrink-0">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="flex-1 mx-4">
            {/* Progress bar */}
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${((currentStep) / (TOTAL_STEPS - 1)) * 100}%` }}
              />
            </div>
            <p className="text-center text-zinc-500 text-xs mt-2">{getStepTitle()}</p>
          </div>
          
          {onSkip && (
            <button
              onClick={onSkip}
              className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"
            >
              <X size={24} />
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {renderStep()}
      </div>

      {/* Footer with Next/Back buttons */}
      {currentStep > 0 && currentStep < TOTAL_STEPS - 1 && (
        <div className="p-4 border-t border-zinc-800 shrink-0">
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="w-full py-4 bg-green-500 text-black rounded-xl font-bold uppercase tracking-widest hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
};

export default OnboardingFlow;
