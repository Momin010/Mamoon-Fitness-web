
import React, { useState } from 'react';
import { Search, Menu, Check, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const TasksPage: React.FC = () => {
  const { tasks, toggleTask, addTask, deleteTask } = useApp();
  const [view, setView] = useState<'home' | 'list'>('home');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [touched, setTouched] = useState(false);

  const filteredActive = tasks.filter(t => !t.completed && t.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredCompleted = tasks.filter(t => t.completed && t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const validateTask = (title: string): string => {
    if (!title.trim()) return 'Task title is required';
    if (title.trim().length < 2) return 'Title must be at least 2 characters';
    if (title.trim().length > 100) return 'Title must be less than 100 characters';
    if (tasks.some(t => t.title.toLowerCase() === title.trim().toLowerCase() && !t.completed)) {
      return 'This task already exists';
    }
    return '';
  };

  const handleAddTask = () => {
    setTouched(true);
    const validationError = validateTask(newTaskTitle);

    if (validationError) {
      setError(validationError);
      return;
    }

    addTask(newTaskTitle.trim());
    setNewTaskTitle('');
    setError('');
    setTouched(false);
  };

  const handleInputChange = (value: string) => {
    setNewTaskTitle(value);
    if (touched) {
      setError(validateTask(value));
    }
  };

  const completionPercentage = tasks.length > 0
    ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
    : 0;

  if (view === 'home') {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white pb-32">
        <header className="p-8 flex justify-center relative">
          <span className="text-zinc-600 uppercase text-[10px] font-black tracking-[0.5em] italic">Current Ops</span>
          <button
            onClick={() => setView('list')}
            className="absolute right-8 top-8 p-3 bg-zinc-900/50 hover:bg-zinc-900 rounded-2xl transition-all border border-zinc-800"
          >
            <Menu size={20} />
          </button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center -mt-20">
          <div className="relative group">
            <div className="absolute inset-0 bg-green-500/10 blur-[100px] group-hover:bg-green-500/20 transition-all"></div>
            <h1 className="relative text-[14rem] font-black leading-none mb-0 tracking-tighter italic">
              {(tasks.filter(t => !t.completed).length).toString().padStart(2, '0')}
            </h1>
            {tasks.length > 0 && (
              <div className="absolute -top-4 -right-4 bg-green-500 text-black text-[10px] font-black px-3 py-1.5 rounded-lg shadow-lg shadow-green-500/20">
                {completionPercentage}%
              </div>
            )}
          </div>
          <p className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.8em] mt-4 ml-4">Tasks Remaining</p>

          {tasks.length > 0 && (
            <div className="mt-12 w-64 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-1000"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          )}
        </div>

        <div className="p-8 space-y-4">
          <button
            onClick={() => setView('list')}
            className="w-full bg-white text-black py-6 font-black uppercase tracking-[0.2em] text-xs hover:bg-zinc-200 active:scale-95 transition-all rounded-3xl"
          >
            Initiate Protocol
          </button>
          <button
            onClick={() => setView('list')}
            className="w-full border border-zinc-800 text-zinc-600 py-5 font-black uppercase tracking-[0.2em] text-[10px] hover:border-zinc-700 hover:text-white transition-all rounded-3xl"
          >
            Tactical Overview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-8 bg-black text-white pb-32">
      <header className="flex justify-between items-center mb-10">
        <button
          onClick={() => setView('home')}
          className="p-3 bg-zinc-900/50 hover:bg-zinc-900 rounded-2xl transition-all border border-zinc-800"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-black uppercase tracking-tighter italic">Forge <span className="text-green-500">Tasks</span></h1>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={`p-3 rounded-2xl transition-all border ${showSearch ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-zinc-900/50 border-zinc-800 text-white'}`}
        >
          <Search size={20} />
        </button>
      </header>

      {showSearch && (
        <div className="mb-8 animate-in slide-in-from-top-4 duration-300">
          <input
            autoFocus
            type="text"
            placeholder="Search objectives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-sm font-bold placeholder:text-zinc-700 focus:border-green-500 outline-none transition-all"
          />
        </div>
      )}

      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest italic">Active Directives</p>
          <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">{filteredActive.length} Target{filteredActive.length !== 1 ? 's' : ''}</span>
        </div>

        {filteredActive.length === 0 ? (
          <div className="text-center py-20 opacity-30 flex flex-col items-center">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4">
              <Check size={28} className="text-zinc-600" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest">{searchQuery ? 'No matching objectives' : 'Area Clear'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActive.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-5 p-5 bg-zinc-900/50 border border-zinc-900 rounded-3xl group hover:border-green-500/30 transition-all active:scale-[0.98]"
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className="w-8 h-8 bg-black border-2 border-zinc-800 rounded-xl flex items-center justify-center hover:border-green-500 transition-all"
                >
                  {task.completed && <Check size={16} strokeWidth={3} className="text-green-500" />}
                </button>
                <div className="flex-1">
                  <h3 className="font-black text-sm uppercase tracking-tight text-white">{task.title}</h3>
                  <p className="text-[10px] font-bold text-green-500/50 uppercase tracking-widest mt-1">+{task.xpReward} XP Reward</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <span className="text-zinc-700 text-[9px] font-black uppercase tracking-widest bg-zinc-900 px-2 py-1 rounded-md">{task.dueDate}</span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1 text-zinc-800 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {filteredCompleted.length > 0 && (
        <div className="mb-8">
          <p className="text-zinc-700 text-[10px] font-black uppercase tracking-widest mb-6 italic">Secure Zone</p>
          <div className="space-y-3">
            {filteredCompleted.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-5 p-5 bg-zinc-950 border border-transparent rounded-3xl opacity-40 scale-[0.98]"
              >
                <div className="w-8 h-8 bg-green-500/10 border-2 border-green-500/20 rounded-xl flex items-center justify-center">
                  <Check size={16} strokeWidth={3} className="text-green-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-sm uppercase tracking-tight text-zinc-600 line-through">{task.title}</h3>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-2 text-zinc-800 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto pb-10 space-y-3">
        <div className="space-y-1">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New Task Title"
              className={`flex-1 bg-zinc-900 border rounded-xl p-4 text-sm outline-none transition-all ${error ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-zinc-800 focus:border-green-500'
                }`}
              value={newTaskTitle}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddTask();
                }
              }}
              onBlur={() => setTouched(true)}
            />
            <button
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim()}
              className="bg-white text-black px-6 rounded-xl font-bold hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          {error && (
            <p className="text-red-400 text-xs flex items-center gap-1 px-1">
              <AlertCircle size={12} /> {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksPage;
