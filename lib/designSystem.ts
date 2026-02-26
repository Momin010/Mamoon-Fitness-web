// Design System Constants for LockIn Fitness App
// This replaces the chaotic mix of random values throughout the app

// Typography System
export const typography = {
  // Font sizes with consistent scale
  xs: 'text-xs',      // 12px
  sm: 'text-sm',      // 14px  
  base: 'text-base',  // 16px
  lg: 'text-lg',      // 18px
  xl: 'text-xl',      // 20px
  '2xl': 'text-2xl',  // 24px
  '3xl': 'text-3xl',  // 30px
  '4xl': 'text-4xl',  // 36px
  
  // Font weights
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  black: 'font-black',
  
  // Text styles for specific use cases
  header: 'text-2xl font-black uppercase tracking-tighter',
  subheader: 'text-lg font-bold',
  body: 'text-sm font-medium',
  caption: 'text-xs font-medium text-zinc-500',
  button: 'text-sm font-black uppercase tracking-wider',
  label: 'text-[10px] font-black uppercase tracking-widest text-zinc-500',
} as const;

// Spacing System (based on 4px grid)
export const spacing = {
  // Padding
  px: 'p-px',
  0: 'p-0',
  0.5: 'p-0.5',   // 2px
  1: 'p-1',       // 4px
  1.5: 'p-1.5',   // 6px
  2: 'p-2',       // 8px
  2.5: 'p-2.5',   // 10px
  3: 'p-3',       // 12px
  3.5: 'p-3.5',   // 14px
  4: 'p-4',       // 16px
  5: 'p-5',       // 20px
  6: 'p-6',       // 24px
  7: 'p-7',       // 28px
  8: 'p-8',       // 32px
  
  // Margin (same scale)
  m: (value: keyof typeof spacing) => `m-${value.replace('p-', '')}`,
  
  // Gap
  gap: (value: keyof typeof spacing) => `gap-${value.replace('p-', '')}`,
} as const;

// Mobile-optimized spacing (prevents viewport overflow)
export const mobileSpacing = {
  // Safe padding that works on all screen sizes
  safe: 'p-4',
  header: 'p-4',
  section: 'p-4 mb-4',
  card: 'p-4',
  button: 'p-3',
  
  // Compact spacing for dense UI
  compact: 'p-2',
  tight: 'p-1',
  
  // Bottom nav compensation
  bottomNav: 'pb-20',
} as const;

// Color System
export const colors = {
  // Primary brand colors
  primary: 'bg-green-500',
  primaryHover: 'hover:bg-green-400',
  primaryText: 'text-green-500',
  primaryBorder: 'border-green-500',
  
  // Background colors
  background: 'bg-black',
  surface: 'bg-zinc-900',
  surfaceHover: 'hover:bg-zinc-800',
  elevated: 'bg-zinc-800',
  
  // Text colors
  textPrimary: 'text-white',
  textSecondary: 'text-zinc-400',
  textMuted: 'text-zinc-500',
  textDisabled: 'text-zinc-600',
  
  // Border colors
  border: 'border-zinc-800',
  borderHover: 'border-zinc-700',
  borderFocus: 'border-green-500',
  
  // Status colors
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
} as const;

// Layout System
export const layout = {
  // Container constraints
  maxWidth: 'max-w-md',
  container: 'w-full max-w-md mx-auto',
  
  // Flexbox helpers
  flexCol: 'flex flex-col',
  flexRow: 'flex flex-row',
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',
  
  // Positioning
  relative: 'relative',
  absolute: 'absolute',
  sticky: 'sticky top-0',
  
  // Z-index layers
  z10: 'z-10',
  z20: 'z-20',
  z30: 'z-30',
  z40: 'z-40',
  z50: 'z-50',
} as const;

// Component Patterns
export const patterns = {
  // Card patterns
  card: 'bg-zinc-900 rounded-2xl border border-zinc-800',
  cardHover: 'hover:border-zinc-700 transition-colors',
  cardElevated: 'bg-zinc-900 rounded-2xl border border-zinc-800 shadow-lg',
  
  // Button patterns
  button: 'px-4 py-3 rounded-xl font-black uppercase tracking-wider transition-all active:scale-[0.98]',
  buttonPrimary: 'bg-green-500 text-black hover:bg-green-400',
  buttonSecondary: 'bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-800',
  buttonDestructive: 'bg-red-500 text-white hover:bg-red-400',
  
  // Input patterns
  input: 'w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none transition-all',
  inputError: 'border-red-500 focus:border-red-500',
  inputSuccess: 'border-green-500 focus:border-green-500',
  
  // Modal patterns (phone-safe)
  modalBackdrop: 'absolute inset-0 bg-black/80 backdrop-blur-sm',
  modalContent: 'relative w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl',
  modalClose: 'absolute top-4 right-4 p-2 hover:bg-zinc-800 rounded-full transition-colors',
} as const;

// Animation System
export const animations = {
  // Transitions
  transition: 'transition-all duration-200',
  transitionFast: 'transition-all duration-150',
  transitionSlow: 'transition-all duration-300',
  
  // Transform effects
  scale: 'active:scale-[0.98]',
  hoverScale: 'hover:scale-105 active:scale-100',
  
  // Animation utilities
  fadeIn: 'animate-in fade-in duration-200',
  slideIn: 'animate-in slide-in-from-bottom-4 duration-300',
  zoomIn: 'animate-in zoom-in-95 duration-200',
  
  // Loading states
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',
} as const;

// Mobile-specific patterns
export const mobile = {
  // Touch targets (minimum 44px)
  touchTarget: 'min-h-[44px] min-w-[44px]',
  touchArea: 'p-4', // Ensures 44px touch area
  
  // Safe areas
  safeAreaTop: 'pt-12', // Account for notches/status bar
  safeAreaBottom: 'pb-20', // Account for bottom nav/home indicator
  
  // Mobile typography
  mobileHeader: 'text-xl font-black uppercase tracking-tighter',
  mobileBody: 'text-sm font-medium',
  mobileCaption: 'text-xs font-medium',
  
  // Mobile spacing
  mobilePadding: 'p-4',
  mobileGap: 'gap-3',
  mobileSection: 'mb-4',
} as const;

// Export type-safe className helper
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// Usage examples:
// <div className={cn(patterns.card, patterns.cardHover, mobile.mobilePadding)}>
// <button className={cn(patterns.button, patterns.buttonPrimary, animations.transition, mobile.touchTarget)}>
// <p className={cn(typography.body, colors.textSecondary)}>