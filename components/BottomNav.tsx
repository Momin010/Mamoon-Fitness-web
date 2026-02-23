import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Dumbbell,
  LayoutGrid,
  User,
  Utensils,
  Share2
} from 'lucide-react';

const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-zinc-900/80 backdrop-blur-2xl border border-white/10 flex justify-between items-center py-2 px-2 sm:px-3 rounded-2xl sm:rounded-3xl z-50 shadow-2xl">
      <NavLink
        to="/workout"
        className={({ isActive }) => `flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 ${isActive ? 'text-green-500 bg-green-500/10' : 'text-zinc-500 hover:text-white'}`}
      >
        <Dumbbell size={22} strokeWidth={2.5} />
      </NavLink>

      <NavLink
        to="/tasks"
        className={({ isActive }) => `flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 ${isActive ? 'text-green-500 bg-green-500/10' : 'text-zinc-500 hover:text-white'}`}
      >
        <LayoutGrid size={22} strokeWidth={2.5} />
      </NavLink>

      <NavLink
        to="/macros"
        className={({ isActive }) => `flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 ${isActive ? 'text-green-500 bg-green-500/10' : 'text-zinc-500 hover:text-white'}`}
      >
        <Utensils size={22} strokeWidth={2.5} />
      </NavLink>

      <NavLink
        to="/hub"
        className={({ isActive }) => `flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 ${isActive ? 'text-green-500 bg-green-500/10' : 'text-zinc-500 hover:text-white'}`}
      >
        <Share2 size={22} strokeWidth={2.5} />
      </NavLink>

      <NavLink
        to="/settings"
        className={({ isActive }) => `flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 ${isActive ? 'text-green-500 bg-green-500/10' : 'text-zinc-500 hover:text-white'}`}
      >
        <User size={22} strokeWidth={2.5} />
      </NavLink>
    </nav>
  );
};

export default BottomNav;
