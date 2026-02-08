
import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor }
  ] as const;

  return (
    <div className="flex gap-2 p-1 bg-zinc-900 rounded-lg">
      {themes.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setTheme(id)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
            theme === id
              ? 'bg-green-500 text-black'
              : 'text-zinc-400 hover:text-white'
          }`}
          aria-label={`Set ${label} theme`}
          aria-pressed={theme === id}
        >
          <Icon size={16} />
          <span className="text-sm font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
