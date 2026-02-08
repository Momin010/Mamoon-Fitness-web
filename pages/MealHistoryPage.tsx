
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, Trash2, ChevronLeft as ChevronLeftIcon, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Meal } from '../types';

const MealHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { allMeals, deleteMeal, user } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const mealsByDate = useMemo(() => {
    const grouped = new Map<string, Meal[]>();
    allMeals.forEach(meal => {
      const date = new Date(meal.timestamp).toDateString();
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(meal);
    });
    return grouped;
  }, [allMeals]);

  const selectedDateMeals = useMemo(() => {
    return mealsByDate.get(selectedDate.toDateString()) || [];
  }, [mealsByDate, selectedDate]);

  const selectedDateStats = useMemo(() => {
    return selectedDateMeals.reduce((acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fats: acc.fats + meal.fats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  }, [selectedDateMeals]);

  const sortedDates = useMemo(() => {
    return Array.from(mealsByDate.keys()).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  }, [mealsByDate]);

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const getMealTypeIcon = (type?: string) => {
    switch (type) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      case 'snack': return '🍿';
      default: return '🍽️';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <header className="flex items-center gap-4 p-6 border-b border-zinc-800">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Meal History</h1>
      </header>

      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
          >
            <ChevronLeftIcon size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-zinc-400" />
            <span className="font-medium">{formatDate(selectedDate)}</span>
          </div>
          <button 
            onClick={() => changeDate(1)}
            className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-zinc-900 rounded-lg">
            <p className="text-2xl font-black text-white">{selectedDateStats.calories}</p>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Cals</p>
          </div>
          <div className="text-center p-3 bg-zinc-900 rounded-lg">
            <p className="text-2xl font-black text-blue-400">{selectedDateStats.protein}g</p>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Protein</p>
          </div>
          <div className="text-center p-3 bg-zinc-900 rounded-lg">
            <p className="text-2xl font-black text-yellow-400">{selectedDateStats.carbs}g</p>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Carbs</p>
          </div>
          <div className="text-center p-3 bg-zinc-900 rounded-lg">
            <p className="text-2xl font-black text-red-400">{selectedDateStats.fats}g</p>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Fats</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-zinc-900/50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-400">Goal Progress</span>
            <span className={`text-sm font-bold ${
              selectedDateStats.calories <= user.caloriesGoal ? 'text-green-500' : 'text-red-400'
            }`}>
              {Math.round((selectedDateStats.calories / user.caloriesGoal) * 100)}%
            </span>
          </div>
          <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                selectedDateStats.calories <= user.caloriesGoal ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, (selectedDateStats.calories / user.caloriesGoal) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {selectedDateMeals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500 text-lg">No meals logged for this day</p>
            <button
              onClick={() => navigate('/macros/add')}
              className="mt-4 text-green-500 font-medium hover:underline"
            >
              Log a meal
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDateMeals
              .sort((a, b) => b.timestamp - a.timestamp)
              .map(meal => (
                <div key={meal.id} className="p-4 bg-zinc-900 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getMealTypeIcon(meal.mealType)}</span>
                      <div>
                        <h3 className="font-medium">{meal.name}</h3>
                        <p className="text-sm text-zinc-400">
                          {new Date(meal.timestamp).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                          {meal.mealType && ` • ${meal.mealType}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteMeal(meal.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-3 flex gap-4 text-sm">
                    <span className="text-zinc-400">{meal.calories} cal</span>
                    <span className="text-blue-400">{meal.protein}g P</span>
                    <span className="text-yellow-400">{meal.carbs}g C</span>
                    <span className="text-red-400">{meal.fats}g F</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {sortedDates.length > 0 && (
        <div className="p-6 border-t border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Previous Days</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {sortedDates.slice(0, 14).map(dateStr => {
              const date = new Date(dateStr);
              const dayMeals = mealsByDate.get(dateStr) || [];
              const dayCalories = dayMeals.reduce((sum, m) => sum + m.calories, 0);
              const isSelected = dateStr === selectedDate.toDateString();

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-shrink-0 p-3 rounded-lg text-center min-w-[70px] transition-colors ${
                    isSelected ? 'bg-green-500 text-black' : 'bg-zinc-900 hover:bg-zinc-800'
                  }`}
                >
                  <p className="text-xs uppercase">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                  <p className="text-lg font-bold">{date.getDate()}</p>
                  <p className={`text-xs ${isSelected ? 'text-black/70' : 'text-zinc-500'}`}>
                    {dayCalories}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MealHistoryPage;
