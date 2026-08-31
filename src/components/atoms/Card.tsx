import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'glow' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'glass',
  padding = 'md',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-7'
  };

  const variantStyles = {
    glass: 'bg-[#12101E]/70 backdrop-blur-xl border border-violet-500/15 shadow-glass-violet',
    solid: 'bg-[#151224] border border-slate-800 shadow-md',
    glow: 'bg-gradient-to-b from-[#1A1433]/80 to-[#100D20]/90 backdrop-blur-2xl border border-violet-500/30 shadow-[0_0_30px_rgba(139,92,246,0.15)]',
    interactive: 'bg-[#12101E]/70 backdrop-blur-xl border border-violet-500/15 hover:border-violet-500/35 hover:bg-[#18142A]/85 transition-all duration-200 cursor-pointer shadow-glass-violet hover:shadow-[0_10px_35px_rgba(139,92,246,0.2)]'
  };

  return (
    <div
      className={twMerge(
        clsx(
          "rounded-2xl relative overflow-hidden",
          paddingStyles[padding],
          variantStyles[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
