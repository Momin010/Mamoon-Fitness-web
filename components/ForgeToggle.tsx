import React from 'react';

interface ForgeToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ForgeToggle: React.FC<ForgeToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: {
      track: 'w-9 h-5',
      thumb: 'w-3.5 h-3.5',
      translate: 'translate-x-4.5'
    },
    md: {
      track: 'w-12 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-6'
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-7'
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <label
      className={`
        flex items-center gap-3 cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {/* Toggle Switch */}
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
          tabIndex={-1}
        />
        <div
          role="switch"
          aria-checked={checked}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={handleKeyDown}
          onClick={() => !disabled && onChange(!checked)}
          className={`
            ${sizeClasses[size].track}
            rounded-full transition-colors duration-200 ease-in-out
            ${checked ? 'bg-green-500' : 'bg-zinc-700'}
            ${!disabled ? 'cursor-pointer' : ''}
            focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 focus:ring-offset-black
          `}
        >
          <div
            className={`
              ${sizeClasses[size].thumb}
              bg-white rounded-full shadow-md
              transform transition-transform duration-200 ease-in-out
              absolute top-0.5 left-0.5
              ${checked ? sizeClasses[size].translate : 'translate-x-0'}
            `}
          />
        </div>
      </div>

      {/* Label and Description */}
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-white">{label}</span>
          )}
          {description && (
            <span className="text-xs text-zinc-500">{description}</span>
          )}
        </div>
      )}
    </label>
  );
};

export default ForgeToggle;
