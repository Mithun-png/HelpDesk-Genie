import React, { useState } from 'react';
import { AuditLog } from '../../types';
import { Badge } from '../atoms/Badge';
import { Shield, ChevronDown, ChevronUp, Clock, Terminal, Activity } from 'lucide-react';

export interface AuditLogEntryProps {
  log: AuditLog;
}

export const AuditLogEntry: React.FC<AuditLogEntryProps> = ({ log }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusBadge = () => {
    switch (log.status) {
      case 'SUCCESS':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">SUCCESS</span>;
      case 'BLOCKED_PENDING_HITL':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 border border-amber-500/30">HITL BLOCKED</span>;
      case 'DENIED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 border border-rose-500/30">DENIED</span>;
      case 'ESCALATED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EF4623]/15 text-[#EF4623] border border-[#EF4623]/30">ESCALATED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#2D3B42]/10 text-[#2D3B42]">{log.status}</span>;
    }
  };

  return (
    <div className="rounded-2xl border border-[#2D3B42]/10 bg-white/85 backdrop-blur-md overflow-hidden transition-all duration-200 hover:border-[#EF4623]/35 shadow-sm">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-3.5 flex items-center justify-between cursor-pointer select-none group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-[#EF4623]/10 text-[#EF4623] border border-[#EF4623]/25">
            <Terminal className="w-4 h-4" />
          </div>

          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#EF4623]">{log.id}</span>
              <span className="text-xs font-semibold text-[#2D3B42] truncate">
                {log.toolName ? `tool: ${log.toolName}` : log.eventType}
              </span>
              {log.intent && <Badge variant="intent" intent={log.intent} size="sm" />}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#2D3B42]/60 mt-0.5">
              <span>User: <strong className="text-[#2D3B42] font-mono">{log.userId}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#2D3B42]/40" />
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              {log.executionDurationMs && (
                <>
                  <span>•</span>
                  <span>{log.executionDurationMs}ms</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0 ml-3">
          {getStatusBadge()}
          <button className="text-[#2D3B42]/50 group-hover:text-[#EF4623] p-1">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-3.5 border-t border-[#2D3B42]/10 bg-[#FDF1EE]/50 text-xs font-mono space-y-3">
          <div>
            <div className="text-[10px] text-[#EF4623] uppercase tracking-wider font-sans font-bold mb-1">
              Input Payload
            </div>
            <pre className="p-2.5 rounded-xl bg-white border border-[#2D3B42]/10 text-[#2D3B42] overflow-x-auto text-[11px] shadow-sm">
              {JSON.stringify(log.inputPayload, null, 2)}
            </pre>
          </div>

          {log.outputPayload && (
            <div>
              <div className="text-[10px] text-[#EF4623] uppercase tracking-wider font-sans font-bold mb-1">
                Output Payload / Audit State
              </div>
              <pre className="p-2.5 rounded-xl bg-white border border-[#2D3B42]/10 text-emerald-700 overflow-x-auto text-[11px] shadow-sm">
                {JSON.stringify(log.outputPayload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
