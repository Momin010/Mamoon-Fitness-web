
import React, { useMemo } from 'react';
import { WorkoutSession } from '../../types';

type ViewMode = 'weekly' | 'monthly';

interface WorkoutConsistencyProps {
  workoutHistory: WorkoutSession[];
  viewMode: ViewMode;
}

interface DayData {
  date: Date;
  workoutCount: number;
  totalXp: number;
  isToday: boolean;
}

export const WorkoutConsistency: React.FC<WorkoutConsistencyProps> = ({ workoutHistory, viewMode }) => {
  const { calendarData, stats } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let daysToShow: number;
    let startDate: Date;
    
    if (viewMode === 'weekly') {
      // Show last 28 days (4 weeks)
      daysToShow = 28;
      startDate = new Date(today.getTime() - (daysToShow - 1) * 24 * 60 * 60 * 1000);
    } else {
      // Show last 12 weeks
      daysToShow = 84; // 12 weeks
      startDate = new Date(today.getTime() - (daysToShow - 1) * 24 * 60 * 60 * 1000);
    }

    // Create map of workout data by date
    const workoutMap = new Map<string, { count: number; xp: number }>();
    
    workoutHistory.forEach(workout => {
      const workoutDate = new Date(workout.date);
      const dateKey = new Date(workoutDate.getFullYear(), workoutDate.getMonth(), workoutDate.getDate()).toISOString().split('T')[0];
      
      const existing = workoutMap.get(dateKey) || { count: 0, xp: 0 };
      existing.count += 1;
      existing.xp += workout.totalXp;
      workoutMap.set(dateKey, existing);
    });

    // Generate calendar data
    const calendarData: DayData[] = [];
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      const workoutData = workoutMap.get(dateKey) || { count: 0, xp: 0 };
      
      calendarData.push({
        date,
        workoutCount: workoutData.count,
        totalXp: workoutData.xp,
        isToday: date.getTime() === today.getTime(),
      });
    }

    // Calculate stats
    const activeDays = calendarData.filter(d => d.workoutCount > 0).length;
    const totalWorkouts = calendarData.reduce((sum, d) => sum + d.workoutCount, 0);
    const currentStreak = calculateStreak(calendarData);
    const longestStreak = calculateLongestStreak([...calendarData].reverse());

    return {
      calendarData,
      stats: {
        activeDays,
        totalWorkouts,
        currentStreak,
        longestStreak,
        consistencyRate: Math.round((activeDays / daysToShow) * 100),
      },
    };
  }, [workoutHistory, viewMode]);

  const getIntensityColor = (count: number): string => {
    if (count === 0) return 'bg-zinc-900';
    if (count === 1) return 'bg-green-900/50';
    if (count === 2) return 'bg-green-700/50';
    return 'bg-green-500';
  };

  // Group by weeks for display
  const weeks = useMemo(() => {
    const result: DayData[][] = [];
    for (let i = 0; i < calendarData.length; i += 7) {
      result.push(calendarData.slice(i, i + 7));
    }
    return result;
  }, [calendarData]);

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-2 bg-zinc-900/50 rounded-lg text-center">
          <p className="text-lg font-black text-green-500">{stats.activeDays}</p>
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Active</p>
        </div>
        <div className="p-2 bg-zinc-900/50 rounded-lg text-center">
          <p className="text-lg font-black text-blue-500">{stats.currentStreak}</p>
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Streak</p>
        </div>
        <div className="p-2 bg-zinc-900/50 rounded-lg text-center">
          <p className="text-lg font-black text-purple-500">{stats.longestStreak}</p>
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Best</p>
        </div>
        <div className="p-2 bg-zinc-900/50 rounded-lg text-center">
          <p className="text-lg font-black text-yellow-500">{stats.consistencyRate}%</p>
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Rate</p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="p-4 bg-zinc-900/30 rounded-xl">
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-2">
            {dayLabels.map((label, i) => (
              <div key={i} className="w-4 h-4 flex items-center justify-center">
                <span className="text-[8px] text-zinc-600 font-bold">{label}</span>
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="flex gap-1 flex-1 overflow-x-auto">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}-${day.date.getTime()}`}
                    className={`
                      w-4 h-4 rounded-sm ${getIntensityColor(day.workoutCount)}
                      ${day.isToday ? 'ring-1 ring-white' : ''}
                      transition-all duration-200
                    `}
                    title={`${day.date.toLocaleDateString()}: ${day.workoutCount} workout${day.workoutCount !== 1 ? 's' : ''}${day.totalXp > 0 ? ` (${day.totalXp} XP)` : ''}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-3">
          <span className="text-[9px] text-zinc-500">Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-zinc-900" />
            <div className="w-3 h-3 rounded-sm bg-green-900/50" />
            <div className="w-3 h-3 rounded-sm bg-green-700/50" />
            <div className="w-3 h-3 rounded-sm bg-green-500" />
          </div>
          <span className="text-[9px] text-zinc-500">More</span>
        </div>
      </div>
    </div>
  );
};

// Helper functions
function calculateStreak(days: DayData[]): number {
  let streak = 0;
  // Start from today and go backwards
  const reversedDays = [...days].reverse();
  
  for (const day of reversedDays) {
    if (day.workoutCount > 0) {
      streak++;
    } else if (!day.isToday) {
      // Only break if it's not today (allow for rest days on today)
      break;
    }
  }
  
  return streak;
}

function calculateLongestStreak(days: DayData[]): number {
  let currentStreak = 0;
  let maxStreak = 0;
  
  for (const day of days) {
    if (day.workoutCount > 0) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  
  return maxStreak;
}

export default WorkoutConsistency;
