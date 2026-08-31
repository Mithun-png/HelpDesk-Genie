import React from 'react';
import { Ticket } from '../../types';
import { Badge } from '../atoms/Badge';
import { Clock, ShieldAlert, Layers, ExternalLink } from 'lucide-react';

export interface TicketSummaryCardProps {
  ticket: Ticket;
  compact?: boolean;
  onEscalate?: (id: string) => void;
  onClose?: (id: string) => void;
  onClick?: (ticket: Ticket) => void;
}

export const TicketSummaryCard: React.FC<TicketSummaryCardProps> = ({
  ticket,
  compact = false,
  onEscalate,
  onClose,
  onClick
}) => {
  const isJira = ticket.platform === 'JIRA';

  return (
    <div 
      onClick={() => onClick?.(ticket)}
      className={`rounded-xl border border-violet-500/20 bg-[#120F20]/90 backdrop-blur-md p-3.5 transition-all duration-200 hover:border-violet-500/40 hover:bg-[#161226] ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
            isJira ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            {ticket.platform} • {ticket.id}
          </span>
          <Badge variant="status" status={ticket.status} size="sm" />
        </div>

        <Badge variant="priority" priority={ticket.priority} size="sm" />
      </div>

      <h4 className="text-sm font-semibold text-slate-100 line-clamp-1 mb-1">
        {ticket.title}
      </h4>

      {!compact && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-3">
          {ticket.description}
        </p>
      )}

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-violet-500/10">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
        </div>

        <div className="flex items-center gap-2">
          {onEscalate && ticket.priority !== 'Urgent' && ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEscalate(ticket.id);
              }}
              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
            >
              Escalate
            </button>
          )}

          {onClose && ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(ticket.id);
              }}
              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors"
            >
              Resolve
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
