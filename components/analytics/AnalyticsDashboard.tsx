
import React, { useState } from 'react';
import { TrendingUp, Dumbbell, Utensils, BarChart3, ChevronDown } from 'lucide-react';
import { XPTrendsChart } from './XPTrendsChart';
import { WorkoutConsistency } from './WorkoutConsistency';
import { MacroTrendsChart } from './MacroTrendsChart';
import { WorkoutSession, Meal, UserStats } from '../../types';

type ViewMode = 'weekly' | 'monthly';
type TabType = 'xp' | 'consistency' | 'macros';
type MacroType = 'calories' | 'protein' | 'carbs' | 'fats' | 'all';

interface AnalyticsDashboardProps {
  workoutHistory: WorkoutSession[];
  meals: Meal[];
  user: UserStats;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  workoutHistory,
  meals,
  user,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('xp');
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [macroType, setMacroType] = useState<MacroType>('all');

  const tabs = [
    { id: 'xp' as TabType, label: 'XP Trends', icon: TrendingUp },
    { id: 'consistency' as TabType, label: 'Consistency', icon: Dumbbell },
    { id: 'macros' as TabType, label: 'Macros', icon: Utensils },
  ];

  const macroOptions: { value: MacroType; label: string }[] = [
    { value: 'all', label: 'All Macros' },
    { value: 'calories', label: 'Calories' },
    { value: 'protein', label: 'Protein' },
    { value: 'carbs', label: 'Carbs' },
    { value: 'fats', label: 'Fats' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'xp':
        return <XPTrendsChart workoutHistory={workoutHistory} viewMode={viewMode} />;
      case 'consistency':
        return <WorkoutConsistency workoutHistory={workoutHistory} viewMode={viewMode} />;
      case 'macros':
        return (
          <MacroTrendsChart 
            meals={meals} 
            viewMode={viewMode} 
            macroType={macroType}
            goals={{
              calories: user.caloriesGoal,
              protein: user.proteinGoal,
              carbs: user.carbsGoal,
              fats: user.fatsGoal,
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-green-500" />
          <h2 className="text-lg font-black tracking-tighter">Analytics</h2>
        </div>
        <div className="flex bg-zinc-900 rounded-lg p-1">
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
              viewMode === 'weekly'
                ? 'bg-green-500 text-black'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
              viewMode === 'monthly'
                ? 'bg-green-500 text-black'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'bg-zinc-900/50 text-zinc-500 hover:bg-zinc-800/50'
              }`}
            >
              <Icon size={16} className={activeTab === tab.id ? 'text-green-500' : ''} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Macro Type Selector (only for macros tab) */}
      {activeTab === 'macros' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">View:</span>
          <div className="relative">
            <select
              value={macroType}
              onChange={(e) => setMacroType(e.target.value as MacroType)}
              className="appearance-none bg-zinc-900 text-white text-xs font-bold py-2 pl-3 pr-8 rounded-lg border border-zinc-800 focus:outline-none focus:border-green-500 cursor-pointer"
            >
              {macroOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-zinc-900/30 rounded-xl p-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
