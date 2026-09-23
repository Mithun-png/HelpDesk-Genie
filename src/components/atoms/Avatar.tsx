import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Bot, User, ShieldCheck, UserCheck } from 'lucide-react';

export interface AvatarProps {
  type?: 'bot' | 'user' | 'admin' | 'approver' | 'assistant';
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isOnline?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  type = 'bot',
  name,
  size = 'md',
  className,
  isOnline = true
}) => {
  const sizeStyles = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const bgStyles = {
    bot: 'bg-gradient-to-tr from-[#EF4623] to-[#D93816] text-white shadow-md shadow-[#EF4623]/25 border border-[#EF4623]/30',
    assistant: 'bg-gradient-to-tr from-[#EF4623] to-[#D93816] text-white shadow-md shadow-[#EF4623]/25 border border-[#EF4623]/30',
    user: 'bg-gradient-to-tr from-[#2D3B42] to-[#1F292E] text-white border border-[#2D3B42]/30 shadow-sm',
    admin: 'bg-gradient-to-tr from-[#2D3B42] via-[#374852] to-[#EF4623] text-white border border-[#EF4623]/30 shadow-md shadow-[#EF4623]/20',
    approver: 'bg-gradient-to-tr from-amber-600 to-orange-500 text-white border border-amber-400/30 shadow-md shadow-amber-500/20'
  };

  const renderIcon = () => {
    switch (type) {
      case 'bot':
      case 'assistant':
        return <Bot className={iconSizes[size]} />;
      case 'admin':
        return <ShieldCheck className={iconSizes[size]} />;
      case 'approver':
        return <UserCheck className={iconSizes[size]} />;
      default:
        return <User className={iconSizes[size]} />;
    }
  };

  return (
    <div className="relative inline-flex flex-shrink-0">
      <div className={twMerge(clsx("rounded-2xl flex items-center justify-center font-bold select-none", sizeStyles[size], bgStyles[type], className))}>
        {renderIcon()}
      </div>
      {isOnline && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-500/40" />
      )}
    </div>
  );
};
