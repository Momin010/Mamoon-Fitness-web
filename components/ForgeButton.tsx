import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  uppercase?: boolean;
}

export const ForgeButton: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  uppercase = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center gap-2
    font-semibold rounded-xl
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black
    active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
  `;

  const variantClasses = {
    primary: `
      bg-green-500 text-black
      hover:bg-green-400
      focus:ring-green-500/50
      shadow-lg shadow-green-500/20
      hover:shadow-green-500/30
    `,
    secondary: `
      bg-zinc-800 text-white
      hover:bg-zinc-700
      focus:ring-zinc-500/50
      border border-zinc-700
    `,
    ghost: `
      bg-transparent text-zinc-400
      hover:text-white hover:bg-zinc-800/50
      focus:ring-zinc-500/30
    `,
    danger: `
      bg-red-500 text-white
      hover:bg-red-400
      focus:ring-red-500/50
      shadow-lg shadow-red-500/20
    `,
    outline: `
      bg-transparent text-white
      border-2 border-zinc-700
      hover:border-zinc-500 hover:bg-zinc-800/50
      focus:ring-zinc-500/50
    `
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${uppercase ? 'uppercase tracking-wider' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 size={size === 'sm' ? 14 : size === 'lg' || size === 'xl' ? 20 : 16} className="animate-spin" />
          {children}
        </>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  );
};

export default ForgeButton;
