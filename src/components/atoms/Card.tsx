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
    glass: 'bg-white/85 backdrop-blur-xl border border-[#2D3B42]/10 shadow-[0_8px_30px_rgba(45,59,66,0.06)]',
    solid: 'bg-white border border-[#2D3B42]/10 shadow-sm',
    glow: 'bg-gradient-to-b from-white to-[#FDF1EE] backdrop-blur-2xl border border-[#EF4623]/25 shadow-[0_10px_35px_rgba(239,70,35,0.08)]',
    interactive: 'bg-white/85 backdrop-blur-xl border border-[#2D3B42]/10 hover:border-[#EF4623]/40 hover:bg-white transition-all duration-200 cursor-pointer shadow-sm hover:shadow-[0_12px_35px_rgba(239,70,35,0.12)]'
  };

  return (
    <div
      className={twMerge(
        clsx(
          "rounded-3xl relative overflow-hidden",
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
