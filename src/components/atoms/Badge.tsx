import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { IntentCategory, TicketPriority, TicketStatus } from '../../types';

export type BadgeVariant = 
  | 'intent' 
  | 'status' 
  | 'priority' 
  | 'confidence' 
  | 'custom'
  | 'purple'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'default';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  intent?: IntentCategory;
  status?: TicketStatus;
  priority?: TicketPriority;
  score?: number;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'custom',
  intent,
  status,
  priority,
  score,
  className,
  size = 'md'
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] font-semibold tracking-wide',
    md: 'px-2.5 py-1 text-xs font-semibold tracking-wide'
  };

  let colorStyles = "bg-[#EF4623]/10 text-[#EF4623] border border-[#EF4623]/25";
  let content = children;

  if (variant === 'purple') {
    colorStyles = "bg-[#EF4623]/15 text-[#EF4623] border border-[#EF4623]/35 shadow-sm shadow-[#EF4623]/15";
  } else if (variant === 'success') {
    colorStyles = "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30";
  } else if (variant === 'warning') {
    colorStyles = "bg-amber-500/15 text-amber-700 border border-amber-500/30";
  } else if (variant === 'danger') {
    colorStyles = "bg-rose-500/15 text-rose-700 border border-rose-500/30";
  } else if (variant === 'info') {
    colorStyles = "bg-sky-500/15 text-sky-700 border border-sky-500/30";
  } else if (variant === 'default') {
    colorStyles = "bg-[#2D3B42]/10 text-[#2D3B42] border border-[#2D3B42]/20";
  } else if (variant === 'intent' && intent) {
    switch (intent) {
      case 'informational':
        colorStyles = "bg-sky-500/15 text-sky-700 border border-sky-500/30";
        content = content || 'Informational (RAG)';
        break;
      case 'actionable_safe':
        colorStyles = "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30";
        content = content || 'Safe Self-Service';
        break;
      case 'actionable_needs_approval':
        colorStyles = "bg-amber-500/15 text-amber-700 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
        content = content || 'Sensitive (HITL Required)';
        break;
      case 'ambiguous':
        colorStyles = "bg-[#EF4623]/10 text-[#EF4623] border border-[#EF4623]/30";
        content = content || 'Clarify / Escalate';
        break;
    }
  } else if (variant === 'status' && status) {
    switch (status) {
      case 'Open':
        colorStyles = "bg-sky-500/15 text-sky-700 border border-sky-500/30";
        break;
      case 'In Progress':
        colorStyles = "bg-[#EF4623]/15 text-[#EF4623] border border-[#EF4623]/35";
        break;
      case 'Pending Approval':
        colorStyles = "bg-amber-500/15 text-amber-700 border border-amber-500/30";
        break;
      case 'Resolved':
      case 'Closed':
        colorStyles = "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30";
        break;
    }
    content = content || status;
  } else if (variant === 'priority' && priority) {
    switch (priority) {
      case 'Low':
        colorStyles = "bg-slate-500/10 text-slate-700 border border-slate-500/20";
        break;
      case 'Medium':
        colorStyles = "bg-sky-500/15 text-sky-700 border border-sky-500/30";
        break;
      case 'High':
        colorStyles = "bg-amber-500/15 text-amber-700 border border-amber-500/30";
        break;
      case 'Urgent':
        colorStyles = "bg-rose-500/20 text-rose-700 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)] animate-pulse";
        break;
    }
    content = content || priority;
  } else if (variant === 'confidence' && score !== undefined) {
    const pct = Math.round(score * 100);
    if (pct >= 80) {
      colorStyles = "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30";
    } else if (pct >= 65) {
      colorStyles = "bg-amber-500/15 text-amber-700 border border-amber-500/30";
    } else {
      colorStyles = "bg-rose-500/15 text-rose-700 border border-rose-500/30";
    }
    content = content || `${pct}% Confidence`;
  }

  return (
    <span className={twMerge(clsx("inline-flex items-center rounded-full backdrop-blur-md", sizeStyles[size], colorStyles, className))}>
      {content}
    </span>
  );
};
