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
    <Card variant="glass" padding="md" className="relative group rounded-3xl hover:border-[#EF4623]/35 transition-all shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-[#2D3B42]/60 uppercase tracking-wider block">
            {title}
          </span>
          <div className="text-3xl font-extrabold text-[#2D3B42] font-serif mt-1 tracking-tight">
            {value}
          </div>
        </div>
        <div className="p-2.5 rounded-2xl bg-[#EF4623]/10 text-[#EF4623] border border-[#EF4623]/25 group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>

      {(subtitle || change) && (
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#2D3B42]/10 text-xs">
          {change && (
            <span className={`font-semibold ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
              {change}
            </span>
          )}
          {subtitle && (
            <span className="text-[#2D3B42]/60 truncate">{subtitle}</span>
          )}
        </div>
      )}
    </Card>
  );
};
