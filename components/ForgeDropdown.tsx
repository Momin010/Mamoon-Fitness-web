import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface ForgeDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
}

export const ForgeDropdown: React.FC<ForgeDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  searchable = false,
  disabled = false,
  className = '',
  size = 'md',
  variant = 'default'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = searchable
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, searchable]);

  // Reset highlighted index when filtering
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  const handleSelect = useCallback((optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex] && !filteredOptions[highlightedIndex].disabled) {
          handleSelect(filteredOptions[highlightedIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        break;
    }
  }, [isOpen, filteredOptions, highlightedIndex, handleSelect]);

  const sizeClasses = {
    sm: 'py-2 px-3 text-sm',
    md: 'py-3 px-4 text-sm',
    lg: 'py-4 px-5 text-base'
  };

  const variantClasses = {
    default: 'bg-zinc-900 border-zinc-800 hover:border-zinc-700',
    filled: 'bg-zinc-800 border-transparent hover:bg-zinc-700',
    outlined: 'bg-transparent border-zinc-700 hover:border-zinc-600'
  };

  return (
    <div ref={containerRef} className={`forge-dropdown ${className}`}>
      {label && (
        <label className="block text-zinc-400 text-sm mb-2 font-medium">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          forge-dropdown__trigger
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${isOpen ? 'border-green-500 ring-2 ring-green-500/20' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          w-full flex items-center justify-between gap-3
          rounded-xl border transition-all duration-200
          text-left
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={`truncate ${!selectedOption ? 'text-zinc-500' : 'text-white'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`flex-shrink-0 text-zinc-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-green-500' : ''
          }`}
        />
      </button>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Dropdown Menu */}
      <div
        className={`
          ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
          ${isOpen ? 'translate-y-0' : 'translate-y-2'}
          fixed left-0 right-0 bottom-0
          bg-zinc-900 border border-zinc-800
          rounded-t-2xl
          shadow-2xl z-50
          transition-all duration-200 ease-out
          max-h-[70vh]
          flex flex-col
          max-w-md mx-auto
        `}
        role="listbox"
      >
        {/* Mobile Handle */}
        <div className="md:hidden flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-zinc-700 rounded-full" />
        </div>

        {/* Search Input */}
        {searchable && (
          <div className="p-3 border-b border-zinc-800">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Options List */}
        <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
          {filteredOptions.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-sm">
              No options found
            </div>
          ) : (
            filteredOptions.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onClick={() => !option.disabled && handleSelect(option.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left
                  transition-colors duration-150
                  ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-zinc-800'}
                  ${value === option.value ? 'bg-green-500/10 text-green-500' : 'text-white'}
                  ${highlightedIndex === index && value !== option.value ? 'bg-zinc-800' : ''}
                `}
                role="option"
                aria-selected={value === option.value}
                disabled={option.disabled}
              >
                {option.icon && (
                  <span className="flex-shrink-0">{option.icon}</span>
                )}
                <span className="flex-1 text-sm font-medium">{option.label}</span>
                {value === option.value && (
                  <Check size={16} className="flex-shrink-0 text-green-500" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Mobile Close Button */}
        <div className="md:hidden p-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full py-3 bg-zinc-800 rounded-lg text-white font-medium hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgeDropdown;
