import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingFlow } from '../components/onboarding';
import { OnboardingFormData, FitnessCalculations, WeeklyWorkout } from '../types/fitness';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { saveWorkoutPlan } from '../lib/workoutPlanService';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { updateUser } = useApp();

  const handleOnboardingComplete = async (
    data: OnboardingFormData,
    calculations: FitnessCalculations,
    workout: WeeklyWorkout
  ) => {
    try {
      // Get the current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        console.error('No authenticated user found');
        navigate('/auth');
        return;
      }

      // Save user profile to Supabase (detailed fitness profile)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: authUser.id,
          height_cm: data.height_cm,
          weight_kg: data.weight_kg,
          age: data.age,
          sex: data.sex,
          body_fat_percent: data.body_fat_percent,
          goals: data.goals,
          activity_level: data.activity_level,
          diet_preferences: data.diet_preferences,
          experience_level: data.experience_level,
          bmr: calculations.bmr,
          tdee: calculations.tdee,
          target_calories: calculations.targetCalories,
          target_protein_g: calculations.protein,
          target_carbs_g: calculations.carbs,
          target_fats_g: calculations.fats,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Error saving profile:', profileError);
        throw profileError;
      }

      // Update the main profiles table with the new goals (this is what the app uses)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          calories_goal: calculations.targetCalories,
          protein_goal: calculations.protein,
          carbs_goal: calculations.carbs,
          fats_goal: calculations.fats,
          updated_at: new Date().toISOString()
        })
        .eq('id', authUser.id);

      if (updateError) {
        console.error('Error updating profile goals:', updateError);
        // Don't throw, still continue
      }

      // Save workout plan to Supabase
      const savedPlan = await saveWorkoutPlan(authUser.id, workout, data.experience_level);
      if (savedPlan) {
        console.log('Workout plan saved successfully:', savedPlan.plan.name);
      } else {
        console.warn('Failed to save workout plan to database, storing locally');
        // Fallback to local storage
        localStorage.setItem('currentWorkoutPlan', JSON.stringify(workout));
      }

      // Force a page reload to ensure the app picks up the new goals
      // This ensures the profile is re-fetched from Supabase with updated values
      window.location.href = '/';
    } catch (error) {
      console.error('Onboarding error:', error);
      // Still navigate to home even if save fails
      navigate('/');
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <OnboardingFlow
        onComplete={handleOnboardingComplete}
        onSkip={handleSkip}
      />
    </div>
  );
};

export default OnboardingPage;
