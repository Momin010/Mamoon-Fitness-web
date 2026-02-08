
import React, { useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { WorkoutSession } from '../../types';

type ViewMode = 'weekly' | 'monthly';

interface XPTrendsChartProps {
  workoutHistory: WorkoutSession[];
  viewMode: ViewMode;
}

interface ChartDataPoint {
  label: string;
  xp: number;
  cumulativeXp: number;
  workoutCount: number;
  date: number;
}

export const XPTrendsChart: React.FC<XPTrendsChartProps> = ({ workoutHistory, viewMode }) => {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (workoutHistory.length === 0) return [];

    const now = Date.now();
    const dataMap = new Map<string, { xp: number; count: number; timestamp: number }>();

    if (viewMode === 'weekly') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000);
        const key = date.toLocaleDateString('en-US', { weekday: 'short' });
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        dataMap.set(key, { xp: 0, count: 0, timestamp: startOfDay });
      }

      workoutHistory.forEach(workout => {
        const workoutDate = new Date(workout.date);
        const key = workoutDate.toLocaleDateString('en-US', { weekday: 'short' });
        if (dataMap.has(key)) {
          const existing = dataMap.get(key)!;
          existing.xp += workout.totalXp;
          existing.count += 1;
        }
      });
    } else {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekStart = now - (i * 7 + 6) * 24 * 60 * 60 * 1000;
        const weekEnd = now - (i * 7) * 24 * 60 * 60 * 1000;
        const key = `W${4 - i}`;
        dataMap.set(key, { xp: 0, count: 0, timestamp: weekStart });
      }

      workoutHistory.forEach(workout => {
        const workoutDate = workout.date;
        for (let i = 3; i >= 0; i--) {
          const weekStart = now - (i * 7 + 6) * 24 * 60 * 60 * 1000;
          const weekEnd = now - (i * 7) * 24 * 60 * 60 * 1000;
          if (workoutDate >= weekStart && workoutDate <= weekEnd) {
            const key = `W${4 - i}`;
            const existing = dataMap.get(key)!;
            existing.xp += workout.totalXp;
            existing.count += 1;
            break;
          }
        }
      });
    }

    // Calculate cumulative XP
    let cumulativeXp = 0;
    const sortedEntries = Array.from(dataMap.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    return sortedEntries.map(([label, data]) => {
      cumulativeXp += data.xp;
      return {
        label,
        xp: data.xp,
        cumulativeXp,
        workoutCount: data.count,
        date: data.timestamp,
      };
    });
  }, [workoutHistory, viewMode]);

  const totalXp = chartData.reduce((sum, d) => sum + d.xp, 0);
  const avgXp = chartData.length > 0 ? Math.round(totalXp / chartData.length) : 0;
  const bestDay = chartData.reduce((max, d) => d.xp > max.xp ? d : max, chartData[0] || { xp: 0, label: '-' });

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-zinc-500">
        <p className="text-sm">No workout data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-zinc-900/50 rounded-lg text-center">
          <p className="text-lg font-black text-green-500">{totalXp.toLocaleString()}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Total XP</p>
        </div>
        <div className="p-3 bg-zinc-900/50 rounded-lg text-center">
          <p className="text-lg font-black text-blue-500">{avgXp.toLocaleString()}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Avg/Period</p>
        </div>
        <div className="p-3 bg-zinc-900/50 rounded-lg text-center">
          <p className="text-lg font-black text-yellow-500">{bestDay.label}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Best Day</p>
        </div>
      </div>

      {/* XP Trend Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
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
              labelStyle={{ color: '#71717a', fontSize: '10px', marginBottom: '4px' }}
              formatter={(value: number, name: string) => {
                if (name === 'xp') return [`${value.toLocaleString()} XP`, 'XP Gained'];
                return [value.toLocaleString(), name];
              }}
            />
            <Area
              type="monotone"
              dataKey="xp"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#xpGradient)"
              dot={{ fill: '#22c55e', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default XPTrendsChart;
