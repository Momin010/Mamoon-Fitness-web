
import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, X, Bell } from 'lucide-react';
import { useWorkoutReminders } from '../hooks/useNotifications';

interface RestTimerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDuration?: number; // in seconds
}

const PRESET_DURATIONS = [
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '2m', value: 120 },
  { label: '3m', value: 180 },
  { label: '5m', value: 300 }
];

export const RestTimer: React.FC<RestTimerProps> = ({ 
  isOpen, 
  onClose, 
  defaultDuration = 60 
}) => {
  const [duration, setDuration] = useState(defaultDuration);
  const [timeLeft, setTimeLeft] = useState(defaultDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const { setRestTimer } = useWorkoutReminders();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            if (showNotification) {
              setRestTimer(0); // Trigger notification immediately
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, showNotification, setRestTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    if (showNotification) {
      setRestTimer(timeLeft);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration);
  };

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
    setTimeLeft(newDuration);
    setIsRunning(false);
  };

  const progress = ((duration - timeLeft) / duration) * 100;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6">
      <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Rest Timer</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Timer Display */}
        <div className="relative w-48 h-48 mx-auto mb-6">
          {/* Progress Ring */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#27272a"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#22c55e"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          
          {/* Time Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-5xl font-black ${timeLeft <= 10 ? 'text-red-500' : 'text-white'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-6">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="p-4 bg-green-500 text-black rounded-full hover:bg-green-400 transition-colors"
            >
              <Play size={24} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="p-4 bg-yellow-500 text-black rounded-full hover:bg-yellow-400 transition-colors"
            >
              <Pause size={24} fill="currentColor" />
            </button>
          )}
          
          <button
            onClick={handleReset}
            className="p-4 bg-zinc-800 text-white rounded-full hover:bg-zinc-700 transition-colors"
          >
            <RotateCcw size={24} />
          </button>
        </div>

        {/* Notification Toggle */}
        <button
          onClick={() => setShowNotification(!showNotification)}
          className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg mb-6 transition-colors ${
            showNotification ? 'bg-green-500/20 text-green-500' : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          <Bell size={18} />
          <span className="text-sm font-medium">
            {showNotification ? 'Notification On' : 'Notification Off'}
          </span>
        </button>

        {/* Preset Durations */}
        <div className="grid grid-cols-3 gap-2">
          {PRESET_DURATIONS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleDurationChange(preset.value)}
              className={`py-3 rounded-lg font-bold text-sm transition-colors ${
                duration === preset.value
                  ? 'bg-green-500 text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RestTimer;
