
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, ComposedChart, Legend } from 'recharts';
import { Meal } from '../../types';

type ViewMode = 'weekly' | 'monthly';
type MacroType = 'calories' | 'protein' | 'carbs' | 'fats' | 'all';

interface MacroTrendsChartProps {
  meals: Meal[];
  viewMode: ViewMode;
  macroType?: MacroType;
  goals?: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

interface MacroDataPoint {
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatsGoal: number;
  date: number;
}

export const MacroTrendsChart: React.FC<MacroTrendsChartProps> = ({ 
  meals, 
  viewMode, 
  macroType = 'all',
  goals = { calories: 2500, protein: 150, carbs: 250, fats: 70 }
}) => {
  const chartData = useMemo<MacroDataPoint[]>(() => {
    if (meals.length === 0) return [];

    const now = Date.now();
    const dataMap = new Map<string, { 
      calories: number; 
      protein: number; 
      carbs: number; 
      fats: number;
      timestamp: number;
    }>();

    if (viewMode === 'weekly') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000);
        const key = date.toLocaleDateString('en-US', { weekday: 'short' });
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        dataMap.set(key, { 
          calories: 0, 
          protein: 0, 
          carbs: 0, 
          fats: 0,
          timestamp: startOfDay 
        });
      }

      meals.forEach(meal => {
        const mealDate = new Date(meal.timestamp);
        const key = mealDate.toLocaleDateString('en-US', { weekday: 'short' });
        if (dataMap.has(key)) {
          const existing = dataMap.get(key)!;
          existing.calories += meal.calories;
          existing.protein += meal.protein;
          existing.carbs += meal.carbs;
          existing.fats += meal.fats;
        }
      });
    } else {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekStart = now - (i * 7 + 6) * 24 * 60 * 60 * 1000;
        const key = `W${4 - i}`;
        dataMap.set(key, { 
          calories: 0, 
          protein: 0, 
          carbs: 0, 
          fats: 0,
          timestamp: weekStart 
        });
      }

      meals.forEach(meal => {
        const mealDate = meal.timestamp;
        for (let i = 3; i >= 0; i--) {
          const weekStart = now - (i * 7 + 6) * 24 * 60 * 60 * 1000;
          const weekEnd = now - (i * 7) * 24 * 60 * 60 * 1000;
          if (mealDate >= weekStart && mealDate <= weekEnd) {
            const key = `W${4 - i}`;
            const existing = dataMap.get(key)!;
            existing.calories += meal.calories;
            existing.protein += meal.protein;
            existing.carbs += meal.carbs;
            existing.fats += meal.fats;
            break;
          }
        }
      });
    }

    // Convert to array with goals
    const sortedEntries = Array.from(dataMap.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    return sortedEntries.map(([label, data]) => ({
      label,
      calories: Math.round(data.calories),
      protein: Math.round(data.protein),
      carbs: Math.round(data.carbs),
      fats: Math.round(data.fats),
      calorieGoal: goals.calories,
      proteinGoal: goals.protein,
      carbsGoal: goals.carbs,
      fatsGoal: goals.fats,
      date: data.timestamp,
    }));
  }, [meals, viewMode, goals]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const avgCalories = Math.round(chartData.reduce((sum, d) => sum + d.calories, 0) / chartData.length);
    const avgProtein = Math.round(chartData.reduce((sum, d) => sum + d.protein, 0) / chartData.length);
    const avgCarbs = Math.round(chartData.reduce((sum, d) => sum + d.carbs, 0) / chartData.length);
    const avgFats = Math.round(chartData.reduce((sum, d) => sum + d.fats, 0) / chartData.length);

    const calorieAdherence = Math.round((avgCalories / goals.calories) * 100);
    const proteinAdherence = Math.round((avgProtein / goals.protein) * 100);

    return {
      avgCalories,
      avgProtein,
      avgCarbs,
      avgFats,
      calorieAdherence,
      proteinAdherence,
    };
  }, [chartData, goals]);

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-zinc-500">
        <p className="text-sm">No meal data available</p>
      </div>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 10, left: 0, bottom: 0 },
    };

    switch (macroType) {
      case 'calories':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 10 }}
              width={45}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#18181b', 
                border: '1px solid #27272a', 
                borderRadius: '8px',
                padding: '8px 12px'
              }}
              itemStyle={{ color: '#fff', fontSize: '12px' }}
              formatter={(value: number) => [`${value.toLocaleString()} kcal`, '']}
            />
            <Bar dataKey="calories" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="calorieGoal" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} dot={false} />
          </ComposedChart>
        );

      case 'protein':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 10 }}
              width={40}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#18181b', 
                border: '1px solid #27272a', 
                borderRadius: '8px',
                padding: '8px 12px'
              }}
              itemStyle={{ color: '#fff', fontSize: '12px' }}
              formatter={(value: number) => [`${value}g`, '']}
            />
            <Bar dataKey="protein" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="proteinGoal" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} dot={false} />
          </ComposedChart>
        );

      case 'carbs':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 10 }}
              width={40}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#18181b', 
                border: '1px solid #27272a', 
                borderRadius: '8px',
                padding: '8px 12px'
              }}
              itemStyle={{ color: '#fff', fontSize: '12px' }}
              formatter={(value: number) => [`${value}g`, '']}
            />
            <Bar dataKey="carbs" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="carbsGoal" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} dot={false} />
          </ComposedChart>
        );

      case 'fats':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 10 }}
              width={40}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#18181b', 
                border: '1px solid #27272a', 
                borderRadius: '8px',
                padding: '8px 12px'
              }}
              itemStyle={{ color: '#fff', fontSize: '12px' }}
              formatter={(value: number) => [`${value}g`, '']}
            />
            <Bar dataKey="fats" fill="#f97316" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="fatsGoal" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} dot={false} />
          </ComposedChart>
        );

      default: // 'all' - stacked macros
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 10 }}
              width={40}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#18181b', 
                border: '1px solid #27272a', 
                borderRadius: '8px',
                padding: '8px 12px'
              }}
              itemStyle={{ color: '#fff', fontSize: '12px' }}
              formatter={(value: number, name: string) => [`${value}g`, name.charAt(0).toUpperCase() + name.slice(1)]}
            />
            <Legend 
              wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
              iconType="circle"
            />
            <Bar dataKey="protein" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="carbs" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
            <Bar dataKey="fats" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2 bg-zinc-900/50 rounded-lg text-center">
            <p className="text-sm font-black text-amber-500">{stats.avgCalories}</p>
            <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Avg Cal</p>
          </div>
          <div className="p-2 bg-zinc-900/50 rounded-lg text-center">
            <p className="text-sm font-black text-blue-500">{stats.avgProtein}g</p>
            <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Avg Pro</p>
          </div>
          <div className="p-2 bg-zinc-900/50 rounded-lg text-center">
            <p className="text-sm font-black text-green-500">{stats.avgCarbs}g</p>
            <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Avg Carb</p>
          </div>
          <div className="p-2 bg-zinc-900/50 rounded-lg text-center">
            <p className="text-sm font-black text-orange-500">{stats.avgFats}g</p>
            <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Avg Fat</p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Goal Adherence */}
      {stats && (
        <div className="flex gap-4 justify-center">
          <div className="text-center">
            <p className="text-xs font-black text-zinc-400">Calorie Goal</p>
            <p className={`text-sm font-black ${stats.calorieAdherence >= 90 && stats.calorieAdherence <= 110 ? 'text-green-500' : 'text-yellow-500'}`}>
              {stats.calorieAdherence}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-black text-zinc-400">Protein Goal</p>
            <p className={`text-sm font-black ${stats.proteinAdherence >= 90 ? 'text-green-500' : stats.proteinAdherence >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
              {stats.proteinAdherence}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MacroTrendsChart;
