import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ForgeSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'green' | 'blue' | 'red' | 'yellow' | 'purple';
  disabled?: boolean;
  className?: string;
  marks?: { value: number; label: string }[];
}

export const ForgeSlider: React.FC<ForgeSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  valueFormatter = (v) => v.toString(),
  size = 'md',
  color = 'green',
  disabled = false,
  className = '',
  marks
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const percentage = ((value - min) / (max - min)) * 100;

  const colorClasses = {
    green: {
      fill: 'bg-gradient-to-r from-green-600 to-green-400',
      thumb: 'border-green-500',
      value: 'text-green-500'
    },
    blue: {
      fill: 'bg-gradient-to-r from-blue-600 to-blue-400',
      thumb: 'border-blue-500',
      value: 'text-blue-500'
    },
    red: {
      fill: 'bg-gradient-to-r from-red-600 to-red-400',
      thumb: 'border-red-500',
      value: 'text-red-500'
    },
    yellow: {
      fill: 'bg-gradient-to-r from-yellow-600 to-yellow-400',
      thumb: 'border-yellow-500',
      value: 'text-yellow-500'
    },
    purple: {
      fill: 'bg-gradient-to-r from-purple-600 to-purple-400',
      thumb: 'border-purple-500',
      value: 'text-purple-500'
    }
  };

  const sizeClasses = {
    sm: {
      track: 'h-1.5',
      thumb: 'w-4 h-4 border-2'
    },
    md: {
      track: 'h-2',
      thumb: 'w-6 h-6 border-[3px]'
    },
    lg: {
      track: 'h-3',
      thumb: 'w-8 h-8 border-4'
    }
  };

  const calculateValue = useCallback((clientX: number) => {
    if (!trackRef.current) return min;
    
    const rect = trackRef.current.getBoundingClientRect();
    const position = (clientX - rect.left) / rect.width;
    const rawValue = min + position * (max - min);
    
    // Apply step
    const steppedValue = Math.round(rawValue / step) * step;
    
    // Clamp to min/max
    return Math.max(min, Math.min(max, steppedValue));
  }, [min, max, step]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    const newValue = calculateValue(e.clientX);
    if (newValue !== value) {
      onChange(newValue);
    }
  }, [disabled, calculateValue, value, onChange]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    const newValue = calculateValue(e.touches[0].clientX);
    if (newValue !== value) {
      onChange(newValue);
    }
  }, [disabled, calculateValue, value, onChange]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newValue = calculateValue(e.clientX);
      if (newValue !== value) {
        onChange(newValue);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const newValue = calculateValue(e.touches[0].clientX);
      if (newValue !== value) {
        onChange(newValue);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, calculateValue, value, onChange]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    
    let newValue = value;
    
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        newValue = Math.max(min, value - step);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        newValue = Math.min(max, value + step);
        break;
      case 'Home':
        e.preventDefault();
        newValue = min;
        break;
      case 'End':
        e.preventDefault();
        newValue = max;
        break;
      case 'PageDown':
        e.preventDefault();
        newValue = Math.max(min, value - step * 10);
        break;
      case 'PageUp':
        e.preventDefault();
        newValue = Math.min(max, value + step * 10);
        break;
    }
    
    if (newValue !== value) {
      onChange(newValue);
    }
  }, [disabled, value, min, max, step, onChange]);

  return (
    <div className={`w-full ${className}`}>
      {/* Label and Value */}
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-3">
          {label && (
            <span className="text-sm font-medium text-zinc-400">{label}</span>
          )}
          {showValue && (
            <span className={`text-lg font-bold ${colorClasses[color].value}`}>
              {valueFormatter(value)}
            </span>
          )}
        </div>
      )}

      {/* Slider Track */}
      <div
        ref={trackRef}
        className={`
          relative ${sizeClasses[size].track} bg-zinc-800 rounded-full cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
      >
        {/* Fill */}
        <div
          className={`absolute left-0 top-0 h-full rounded-full ${colorClasses[color].fill} transition-all duration-75`}
          style={{ width: `${percentage}%` }}
        />

        {/* Thumb */}
        <div
          className={`
            absolute top-1/2 -translate-y-1/2 -translate-x-1/2
            ${sizeClasses[size].thumb}
            bg-white rounded-full ${colorClasses[color].thumb}
            shadow-lg transition-transform duration-150
            ${isDragging ? 'scale-110 cursor-grabbing' : 'cursor-grab'}
            ${isHovering && !isDragging ? 'scale-110' : ''}
            ${disabled ? 'cursor-not-allowed' : ''}
          `}
          style={{ left: `${percentage}%` }}
        >
          {/* Glow effect when dragging */}
          {isDragging && (
            <div className={`absolute inset-0 rounded-full ${colorClasses[color].fill} opacity-30 animate-ping`} />
          )}
        </div>

        {/* Clickable area extension */}
        <div className="absolute inset-y-0 -inset-x-2" />
      </div>

      {/* Marks */}
      {marks && marks.length > 0 && (
        <div className="relative mt-2">
          <div className="flex justify-between text-xs text-zinc-500">
            {marks.map((mark) => (
              <button
                key={mark.value}
                type="button"
                onClick={() => !disabled && onChange(mark.value)}
                className={`
                  transition-colors hover:text-zinc-300
                  ${value === mark.value ? colorClasses[color].value : ''}
                `}
              >
                {mark.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Min/Max Labels */}
      {!marks && (
        <div className="flex justify-between mt-2 text-xs text-zinc-600">
          <span>{valueFormatter(min)}</span>
          <span>{valueFormatter(max)}</span>
        </div>
      )}
    </div>
  );
};

export default ForgeSlider;
