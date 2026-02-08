
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, TrendingUp, Settings, Plus, BarChart3 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { useApp } from '../context/AppContext';
import { AnalyticsDashboard } from '../components/analytics';

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, friends, workoutHistory, meals } = useApp();
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Calculate XP progress data from workout history
  const progressData = useMemo(() => {
    const last7Workouts = workoutHistory.slice(0, 7).reverse();
    return last7Workouts.map((workout, idx) => ({
      name: `W${idx + 1}`,
      value: workout.totalXp
    }));
  }, [workoutHistory]);

  // Calculate user's tier based on level
  const getUserTier = (level: number): string => {
    if (level >= 80) return 'LEGENDARY';
    if (level >= 60) return 'ELITE';
    if (level >= 40) return 'MASTER';
    if (level >= 20) return 'VETERAN';
    return 'NOVICE';
  };

  const userTier = getUserTier(user.level);
  const xpToNextLevel = (user.level * 1000) - (user.xp % 1000);

  // Build leaderboard with real friends from settings
  const allStandings = useMemo(() => {
    const standings = [
      ...friends,
      { 
        id: 'me', 
        name: user.name, 
        xp: user.xp, 
        level: user.level, 
        tier: userTier, 
        avatar: user.avatar || '' 
      }
    ].sort((a, b) => b.xp - a.xp);
    return standings;
  }, [friends, user, userTier]);

  const myRank = allStandings.findIndex(f => f.id === 'me') + 1;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'LEGENDARY': return 'text-yellow-400';
      case 'ELITE': return 'text-purple-400';
      case 'MASTER': return 'text-blue-400';
      case 'VETERAN': return 'text-green-400';
      default: return 'text-zinc-400';
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-zinc-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-zinc-700';
  };

  // Calculate weekly XP gain
  const weeklyXpGain = useMemo(() => {
    const lastWeek = workoutHistory
      .filter(w => w.date > Date.now() - 7 * 24 * 60 * 60 * 1000)
      .reduce((sum, w) => sum + w.totalXp, 0);
    return lastWeek;
  }, [workoutHistory]);

  return (
    <div className="flex flex-col min-h-screen p-6 bg-black text-white">
      <header className="flex justify-between items-center mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <span className="text-zinc-500 uppercase text-xs font-black tracking-widest">Progress</span>
        <button 
          onClick={() => navigate('/settings')}
          className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
        >
          <Settings size={20} />
        </button>
      </header>

      <div className="text-center mb-8">
        <h1 className="text-6xl font-black tracking-tighter mb-2">Level {user.level}</h1>
        <p className={`uppercase text-xs font-bold tracking-widest ${getTierColor(userTier)}`}>
          {userTier} Tier • {xpToNextLevel.toLocaleString()} XP to next
        </p>
      </div>

      {/* Analytics Toggle */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
            showAnalytics
              ? 'bg-green-500 text-black'
              : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <BarChart3 size={18} />
          {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
        </button>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
          <AnalyticsDashboard 
            workoutHistory={workoutHistory}
            meals={meals}
            user={user}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-zinc-900 rounded-xl text-center">
          <p className="text-3xl font-black text-green-500">{user.xp.toLocaleString()}</p>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Total XP</p>
        </div>
        <div className="p-4 bg-zinc-900 rounded-xl text-center">
          <p className="text-3xl font-black text-blue-500">+{weeklyXpGain}</p>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">This Week</p>
        </div>
      </div>

      {progressData.length > 0 && (
        <>
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-zinc-500 uppercase text-[10px] font-black tracking-widest">XP Gain</p>
              <h2 className="text-2xl font-black tracking-tighter">Recent Workouts</h2>
            </div>
          </div>

          <div className="h-40 w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#22c55e" 
                  strokeWidth={3} 
                  dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#22c55e' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-between px-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-2">
              {progressData.map((d, i) => (
                <span key={i} className={i === progressData.length - 1 ? 'text-green-500' : ''}>
                  {d.name}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black tracking-tighter uppercase">Leaderboard</h2>
          <div className="flex items-center gap-2">
            <span className="text-green-500 uppercase text-[10px] font-black tracking-widest">
              Rank #{myRank}
            </span>
            <button
              onClick={() => navigate('/settings')}
              className="p-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {allStandings.length === 1 ? (
          <div className="text-center py-12 text-zinc-500">
            <p>No friends added yet</p>
            <p className="text-sm mb-4">Add friends in settings to compete!</p>
            <button
              onClick={() => navigate('/settings')}
              className="px-4 py-2 bg-green-500 text-black rounded-lg font-bold text-sm hover:bg-green-400 transition-colors"
            >
              Add Friends
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {allStandings.map((friend, idx) => (
              <div 
                key={friend.id} 
                className={`flex items-center gap-4 p-4 rounded-xl ${
                  friend.id === 'me' ? 'bg-zinc-900 border border-green-500/30' : 'bg-zinc-900/50'
                }`}
              >
                <span className={`w-6 font-black text-lg ${getRankColor(idx + 1)}`}>
                  {(idx + 1).toString().padStart(2, '0')}
                </span>
                <div className="relative">
                  {friend.avatar ? (
                    <img 
                      src={friend.avatar} 
                      className="w-12 h-12 rounded-full border-2 border-zinc-800" 
                      alt={friend.name} 
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-black font-black text-xs">
                      YOU
                    </div>
                  )}
                  {idx < 3 && (
                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-yellow-400 text-black' : 
                      idx === 1 ? 'bg-zinc-300 text-black' : 
                      'bg-amber-600 text-white'
                    }`}>
                      {idx + 1}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm">{friend.name}</h3>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${getTierColor(friend.tier)}`}>
                    {friend.tier}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm">{friend.xp.toLocaleString()} XP</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    LVL {friend.level}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
