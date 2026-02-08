
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, Clock, Trophy, Trash2, Dumbbell } from 'lucide-react';
import { useApp } from '../context/AppContext';

const WorkoutHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { workoutHistory, deleteWorkoutSession, user } = useApp();

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const totalStats = workoutHistory.reduce((acc, session) => ({
    workouts: acc.workouts + 1,
    duration: acc.duration + session.duration,
    xp: acc.xp + session.totalXp,
    exercises: acc.exercises + session.exercises.length
  }), { workouts: 0, duration: 0, xp: 0, exercises: 0 });

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <header className="flex items-center gap-4 p-6 border-b border-zinc-800">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Workout History</h1>
      </header>

      <div className="p-6 border-b border-zinc-800">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-zinc-900 rounded-lg text-center">
            <p className="text-3xl font-black text-green-500">{totalStats.workouts}</p>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Total Workouts</p>
          </div>
          <div className="p-4 bg-zinc-900 rounded-lg text-center">
            <p className="text-3xl font-black text-blue-500">{Math.round(totalStats.duration / 60)}h</p>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Total Time</p>
          </div>
          <div className="p-4 bg-zinc-900 rounded-lg text-center">
            <p className="text-3xl font-black text-yellow-500">{totalStats.xp.toLocaleString()}</p>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">XP Earned</p>
          </div>
          <div className="p-4 bg-zinc-900 rounded-lg text-center">
            <p className="text-3xl font-black text-purple-500">{totalStats.exercises}</p>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Exercises</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {workoutHistory.length === 0 ? (
          <div className="text-center py-12">
            <Dumbbell size={48} className="mx-auto text-zinc-600 mb-4" />
            <p className="text-zinc-500 text-lg">No workouts logged yet</p>
            <button
              onClick={() => navigate('/workout')}
              className="mt-4 text-green-500 font-medium hover:underline"
            >
              Start a workout
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {workoutHistory.map(session => (
              <div key={session.id} className="p-4 bg-zinc-900 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Trophy size={20} className="text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">Workout #{session.id.slice(-4)}</h3>
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Calendar size={12} />
                        <span>{formatDate(session.date)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteWorkoutSession(session.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-sm mb-3">
                  <div className="flex items-center gap-1 text-zinc-400">
                    <Clock size={14} />
                    <span>{formatDuration(session.duration)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Trophy size={14} />
                    <span>+{session.totalXp} XP</span>
                  </div>
                  <div className="text-zinc-400">
                    {session.exercises.length} exercises
                  </div>
                </div>

                <div className="space-y-1">
                  {session.exercises.map((exercise, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm py-1 border-t border-zinc-800">
                      <span className="text-zinc-300">{exercise.name}</span>
                      <span className="text-zinc-500">
                        {exercise.completedSets}/{exercise.sets} sets × {exercise.reps} reps
                        {exercise.weight && ` @ ${exercise.weight}lbs`}
                      </span>
                    </div>
                  ))}
                </div>

                {session.notes && (
                  <p className="mt-3 text-sm text-zinc-500 italic">"{session.notes}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutHistoryPage;
