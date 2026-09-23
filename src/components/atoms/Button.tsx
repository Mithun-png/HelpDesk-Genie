import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'ghost' | 'danger' | 'success' | 'glow';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-[30px] select-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

  const sizeStyles = {
    xs: "px-3 py-1 text-xs gap-1.5",
    sm: "px-3.5 py-1.5 text-xs gap-2",
    md: "px-5 py-2 text-sm gap-2",
    lg: "px-6 py-2.5 text-base gap-2.5",
  };

  const variantStyles = {
    primary: "bg-[#EF4623] hover:bg-[#D93816] text-white shadow-lg shadow-[#EF4623]/20 hover:shadow-[#EF4623]/35 border border-[#EF4623]/30",
    secondary: "bg-[#2D3B42] hover:bg-[#1D272C] text-white border border-[#2D3B42]/20 shadow-sm",
    glass: "bg-white/80 hover:bg-white text-[#2D3B42] border border-[#2D3B42]/15 backdrop-blur-md shadow-sm hover:border-[#EF4623]/40",
    glow: "bg-[#EF4623]/10 hover:bg-[#EF4623]/20 text-[#EF4623] border border-[#EF4623]/30 shadow-[0_0_20px_rgba(239,70,35,0.2)] hover:shadow-[0_0_25px_rgba(239,70,35,0.35)]",
    ghost: "bg-transparent hover:bg-[#2D3B42]/5 text-[#2D3B42] hover:text-[#EF4623]",
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 border border-rose-500/30",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 border border-emerald-500/30"
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-0.5 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
