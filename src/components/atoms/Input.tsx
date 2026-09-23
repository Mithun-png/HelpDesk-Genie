import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-[#2D3B42] uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-[#2D3B42]/50">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={twMerge(
            clsx(
              "w-full rounded-2xl bg-white/90 border border-[#2D3B42]/15 px-3.5 py-2.5 text-sm text-[#2D3B42] placeholder:text-[#2D3B42]/40",
              "focus:outline-none focus:border-[#EF4623] focus:ring-2 focus:ring-[#EF4623]/20 focus:shadow-[0_0_15px_rgba(239,70,35,0.15)]",
              "transition-all duration-200 backdrop-blur-md shadow-sm",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20",
              className
            )
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 flex items-center text-[#2D3B42]/50">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-rose-500 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-[#2D3B42]/60">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
