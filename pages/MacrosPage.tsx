
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, History, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useApp } from '../context/AppContext';

const MacrosPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, meals, totalCalories, totalProtein, totalCarbs, totalFats } = useApp();
  
  const remaining = user.caloriesGoal - totalCalories;
  const isOverCalories = remaining < 0;
  
  const getProgressColor = (current: number, goal: number) => {
    const ratio = current / goal;
    if (ratio < 0.5) return 'text-zinc-400';
    if (ratio < 0.8) return 'text-yellow-400';
    if (ratio <= 1) return 'text-green-500';
    return 'text-red-400';
  };

  const getProgressBarColor = (current: number, goal: number) => {
    const ratio = current / goal;
    if (ratio < 0.5) return 'bg-zinc-600';
    if (ratio < 0.8) return 'bg-yellow-500';
    if (ratio <= 1) return 'bg-green-500';
    return 'bg-red-500';
  };

  const getStatus = () => {
    if (isOverCalories) return { text: 'Over Budget', color: 'text-red-400', icon: TrendingUp };
    if (remaining < 300) return { text: 'Almost There', color: 'text-yellow-400', icon: TrendingUp };
    if (remaining > 800) return { text: 'On Track', color: 'text-green-500', icon: Minus };
    return { text: 'Good Progress', color: 'text-green-400', icon: TrendingDown };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  const macroData = [
    { name: 'Protein', current: totalProtein, goal: user.proteinGoal, unit: 'g', color: 'bg-blue-500' },
    { name: 'Carbs', current: totalCarbs, goal: user.carbsGoal, unit: 'g', color: 'bg-yellow-500' },
    { name: 'Fats', current: totalFats, goal: user.fatsGoal, unit: 'g', color: 'bg-red-500' },
  ];

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <div className="flex flex-col min-h-screen p-6 bg-black text-white">
      <header className="flex justify-between items-center mb-12">
        <button 
          onClick={() => navigate('/macros/history')}
          className="p-3 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors"
        >
          <History size={20} />
        </button>
        <span className="text-zinc-500 uppercase text-xs font-bold tracking-[0.2em]">{today}</span>
        <button 
          onClick={() => navigate('/settings')}
          className="p-3 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors"
        >
          <Calendar size={20} />
        </button>
      </header>

      <div className="text-center mb-12">
        <h1 className={`text-8xl font-black tracking-tighter leading-none mb-2 ${isOverCalories ? 'text-red-500' : ''}`}>
          {Math.abs(remaining).toLocaleString()}
        </h1>
        <p className="text-zinc-500 uppercase text-xs font-bold tracking-[0.2em] mb-6">
          {isOverCalories ? 'Calories Over' : 'Calories Remaining'}
        </p>
        <div className="flex items-center justify-center gap-2">
          <div className={`w-2 h-2 rounded-full shadow-sm ${status.color.replace('text-', 'bg-')}`}></div>
          <span className={`font-bold text-xs uppercase tracking-widest ${status.color} flex items-center gap-1`}>
            <StatusIcon size={12} />
            {status.text}
          </span>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-zinc-400 text-sm">Daily Progress</span>
          <span className="text-sm font-bold">
            <span className={getProgressColor(totalCalories, user.caloriesGoal)}>{totalCalories}</span>
            <span className="text-zinc-500"> / {user.caloriesGoal}</span>
          </span>
        </div>
        <div className="h-3 bg-zinc-900 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${getProgressBarColor(totalCalories, user.caloriesGoal)}`}
            style={{ width: `${Math.min(100, (totalCalories / user.caloriesGoal) * 100)}%` }}
          />
        </div>
      </div>

      <div className="space-y-6 mb-12">
        {macroData.map((macro) => {
          const progress = Math.min(100, (macro.current / macro.goal) * 100);
          const isOver = macro.current > macro.goal;
          
          return (
            <div key={macro.name} className="space-y-2">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${macro.color}`} />
                  <h3 className="text-lg font-bold">{macro.name}</h3>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-black ${isOver ? 'text-red-400' : ''}`}>
                    {macro.current}
                  </span>
                  <span className="text-zinc-500 text-sm ml-1">/ {macro.goal}{macro.unit}</span>
                </div>
              </div>
              <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${isOver ? 'bg-red-500' : macro.color}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {meals.length > 0 && (
        <div className="flex-1 mb-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Today's Meals</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {meals.slice(0, 5).map((meal) => (
              <div key={meal.id} className="flex justify-between items-center p-3 bg-zinc-900 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{meal.name}</p>
                  {meal.mealType && (
                    <p className="text-xs text-zinc-500 capitalize">{meal.mealType}</p>
                  )}
                </div>
                <span className="text-sm font-bold">{meal.calories} cal</span>
              </div>
            ))}
            {meals.length > 5 && (
              <button
                onClick={() => navigate('/macros/history')}
                className="w-full py-2 text-center text-sm text-zinc-500 hover:text-white transition-colors"
              >
                + {meals.length - 5} more meals
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-auto pb-10 space-y-3">
        <button 
          onClick={() => navigate('/macros/add')}
          className="w-full bg-white text-black py-5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 active:scale-[0.98] transition-all"
        >
          <Plus size={24} />
          Add Meal (+50 XP)
        </button>
        <button 
          onClick={() => navigate('/macros/history')}
          className="w-full bg-zinc-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 active:scale-[0.98] transition-all"
        >
          <History size={20} />
          View History
        </button>
      </div>
    </div>
  );
};

export default MacrosPage;
