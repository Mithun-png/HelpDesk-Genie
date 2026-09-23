import React, { useState } from 'react';
import { Ticket } from '../../types';
import { Badge } from '../atoms/Badge';
import { Clock, ExternalLink, Copy, Check, Layers, ArrowUpRight, ShieldAlert, Sparkles } from 'lucide-react';

export interface TicketSummaryCardProps {
  ticket: Ticket;
  compact?: boolean;
  onEscalate?: (id: string) => void;
  onClose?: (id: string) => void;
  onClick?: (ticket: Ticket) => void;
  onViewServiceDesk?: (ticket: Ticket) => void;
  onOpenExternal?: (ticket: Ticket) => void;
  onPreview?: (ticket: Ticket) => void;
}

export const TicketSummaryCard: React.FC<TicketSummaryCardProps> = ({
  ticket,
  compact = false,
  onEscalate,
  onClose,
  onClick,
  onViewServiceDesk,
  onOpenExternal,
  onPreview
}) => {
  const [copied, setCopied] = useState(false);
  const isJira = ticket.platform === 'JIRA';
  const targetUrl = ticket.externalUrl || (isJira ? `https://jira.atlassian.com/browse/${ticket.id}` : `https://servicenow.corp.internal/nav_to.do?uri=incident.do?sys_id=${ticket.id}`);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ticket.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExternalRedirect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenExternal) {
      onOpenExternal(ticket);
    }
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPreview) {
      onPreview(ticket);
    } else if (onClick) {
      onClick(ticket);
    }
  };

  const handleServiceDeskClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewServiceDesk) {
      onViewServiceDesk(ticket);
    } else if (onClick) {
      onClick(ticket);
    }
  };

  return (
    <div 
      onClick={() => onClick?.(ticket)}
      className={`rounded-3xl border border-[#2D3B42]/10 bg-white/90 backdrop-blur-xl p-4 transition-all duration-200 hover:border-[#EF4623]/35 hover:shadow-md hover:translate-y-[-1px] group ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono tracking-wide transition-colors ${
            isJira 
              ? 'bg-sky-500/15 text-sky-700 border border-sky-500/30' 
              : 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
          }`}>
            {ticket.platform} • {ticket.id}
          </span>
          <Badge variant="status" status={ticket.status} size="sm" />
          <Badge variant="priority" priority={ticket.priority} size="sm" />
        </div>

        {/* Action button to copy ID */}
        <button
          onClick={handleCopy}
          title="Copy Ticket Key to Clipboard"
          className="p-1 rounded-xl text-[#2D3B42]/50 hover:text-[#EF4623] hover:bg-[#EF4623]/10 transition-all flex items-center gap-1 text-[11px]"
        >
          {copied ? (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>Copied!</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 opacity-70 hover:opacity-100">
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copy ID</span>
            </span>
          )}
        </button>
      </div>

      {/* Ticket Title */}
      <h4 className="text-sm font-semibold text-[#2D3B42] line-clamp-1 mb-1 group-hover:text-[#EF4623] transition-colors">
        {ticket.title}
      </h4>

      {!compact && (
        <p className="text-xs text-[#2D3B42]/70 line-clamp-2 mb-3 leading-relaxed">
          {ticket.description}
        </p>
      )}

      {/* Interactive Platform Redirection Buttons */}
      <div className="mt-2.5 mb-2 pt-2.5 border-t border-[#2D3B42]/10 flex flex-wrap items-center gap-2">
        {/* Direct Native Link to JIRA / ServiceNow */}
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleExternalRedirect}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[30px] text-xs font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] ${
            isJira
              ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-500/20 border border-sky-400/40'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 border border-emerald-400/40'
          }`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>{isJira ? 'Open in JIRA Cloud' : 'Open in ServiceNow'}</span>
        </a>

        {/* Preview Issue Modal In-App */}
        <button
          onClick={handlePreviewClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[30px] text-xs font-semibold bg-white hover:bg-[#FDF1EE] text-[#2D3B42] border border-[#2D3B42]/15 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#EF4623]" />
          <span>{isJira ? 'Preview in JIRA Sandbox' : 'Preview Incident'}</span>
        </button>

        {/* View in Service Desk Hub (In-App) */}
        <button
          onClick={handleServiceDeskClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[30px] text-xs font-semibold bg-[#EF4623]/10 hover:bg-[#EF4623]/20 text-[#EF4623] border border-[#EF4623]/30 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Layers className="w-3.5 h-3.5 text-[#EF4623]" />
          <span>View in Service Desk Hub</span>
          <ArrowUpRight className="w-3 h-3 opacity-60" />
        </button>
      </div>

      {/* Footer Info & Actions */}
      <div className="flex items-center justify-between text-[11px] text-[#2D3B42]/60 pt-2 border-t border-[#2D3B42]/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[#2D3B42]/50">
            <Clock className="w-3.5 h-3.5" />
            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
          </div>
          {ticket.category && (
            <span className="hidden sm:inline text-[#2D3B42]/50">• {ticket.category}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onEscalate && ticket.priority !== 'Urgent' && ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEscalate(ticket.id);
              }}
              className="px-3 py-1 rounded-[30px] text-[10px] font-semibold bg-rose-500/15 hover:bg-rose-500/30 text-rose-700 border border-rose-500/30 transition-colors"
            >
              Escalate to Urgent
            </button>
          )}

          {onClose && ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(ticket.id);
              }}
              className="px-3 py-1 rounded-[30px] text-[10px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-700 border border-emerald-500/30 transition-colors"
            >
              Resolve Ticket
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
