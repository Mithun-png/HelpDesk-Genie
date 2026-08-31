import React from 'react';
import { Card } from '../atoms/Card';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  change,
  isPositive = true,
  icon
}) => {
  return (
    <Card variant="glass" padding="md" className="relative group hover:border-violet-500/35 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            {title}
          </span>
          <div className="text-2xl font-black text-slate-100 mt-1 tracking-tight">
            {value}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-violet-500/15 text-violet-300 border border-violet-500/30 group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>

      {(subtitle || change) && (
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-violet-500/10 text-xs">
          {change && (
            <span className={`font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {change}
            </span>
          )}
          {subtitle && (
            <span className="text-slate-400 truncate">{subtitle}</span>
          )}
        </div>
      )}
    </Card>
  );
};
