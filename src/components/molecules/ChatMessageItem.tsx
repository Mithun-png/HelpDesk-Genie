import React from 'react';
import { ChatMessage } from '../../types';
import { Avatar } from '../atoms/Avatar';
import { Badge } from '../atoms/Badge';
import { KBSourceCard } from './KBSourceCard';
import { HITLApprovalCard } from './HITLApprovalCard';
import { TicketSummaryCard } from './TicketSummaryCard';
import { Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

export interface ChatMessageItemProps {
  message: ChatMessage;
  onActionClick?: (action: string, payload?: unknown) => void;
  onSubmitOTP?: (hitlId: string, otp: string) => void;
  onResolveApproval?: (hitlId: string, approved: boolean) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onActionClick,
  onSubmitOTP,
  onResolveApproval
}) => {
  const isAssistant = message.sender === 'assistant';

  // Format message content simple markdown (bold, lists, code)
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-2 text-sm leading-relaxed text-[#2D3B42]">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Header
          if (line.startsWith('### ')) {
            return <h4 key={idx} className="text-base font-bold font-serif text-[#2D3B42] mt-2">{line.replace('### ', '')}</h4>;
          }
          if (line.startsWith('## ')) {
            return <h3 key={idx} className="text-lg font-bold font-serif text-[#EF4623] mt-2">{line.replace('## ', '')}</h3>;
          }

          // Bullet points
          if (line.startsWith('- ') || line.startsWith('* ')) {
            const itemText = line.substring(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-[#EF4623] mt-1 font-bold">•</span>
                <span>{renderInlineFormatting(itemText)}</span>
              </div>
            );
          }

          // Numbered lists
          const numMatch = line.match(/^(\d+)\.\s(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-2">
                <span className="font-semibold text-[#EF4623] text-xs mt-0.5">{numMatch[1]}.</span>
                <span>{renderInlineFormatting(numMatch[2])}</span>
              </div>
            );
          }

          return <p key={idx}>{renderInlineFormatting(line)}</p>;
        })}
      </div>
    );
  };

  const renderInlineFormatting = (text: string) => {
    // Process bold, inline code
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-[#2D3B42]">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="px-1.5 py-0.5 rounded-lg bg-[#FDF1EE] border border-[#EF4623]/25 text-[#EF4623] font-mono text-xs">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <div className={`flex items-start gap-3.5 my-4 animate-fade-up ${isAssistant ? '' : 'flex-row-reverse'}`}>
      <Avatar
        type={isAssistant ? 'bot' : 'user'}
        size="md"
        className={isAssistant ? 'mt-1' : ''}
      />

      <div className={`flex flex-col max-w-[85%] sm:max-w-[78%] ${isAssistant ? 'items-start' : 'items-end'}`}>
        {/* Header with intent badge / metadata */}
        <div className="flex items-center gap-2 mb-1.5 px-1">
          <span className="text-xs font-semibold text-[#2D3B42]/70">
            {isAssistant ? 'HelpDeskGenie' : 'You'}
          </span>
          <span className="text-[10px] text-[#2D3B42]/50">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isAssistant && message.intent && (
            <Badge variant="intent" intent={message.intent} size="sm" />
          )}
        </div>

        {/* Bubble */}
        <div
          className={`rounded-3xl p-4 transition-all duration-200 ${
            isAssistant
              ? 'bg-white/95 border border-[#2D3B42]/10 text-[#2D3B42] shadow-[0_8px_30px_rgba(45,59,66,0.06)] backdrop-blur-xl'
              : 'bg-[#EF4623] text-white shadow-lg shadow-[#EF4623]/20 rounded-tr-sm'
          }`}
        >
          {message.error ? (
            <div className="flex items-start gap-2 text-rose-600 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{message.error}</span>
            </div>
          ) : (
            renderFormattedContent(message.content)
          )}

          {/* Embedded KB Citations */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-[#2D3B42]/10 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#EF4623]">
                <Sparkles className="w-3.5 h-3.5 text-[#EF4623]" />
                <span>Retrieved Confluence Runbooks & Sources ({message.citations.length})</span>
              </div>
              <div className="space-y-1.5">
                {message.citations.map(c => (
                  <KBSourceCard key={c.id} citation={c} />
                ))}
              </div>
            </div>
          )}

          {/* Embedded Ticket Reference with JIRA / ServiceNow Redirection */}
          {message.ticketRef && (
            <div className="mt-3 pt-2">
              <TicketSummaryCard 
                ticket={message.ticketRef} 
                compact={false}
                onViewServiceDesk={(t) => onActionClick?.('view_ticket_hub', t.id)}
                onOpenExternal={(t) => onActionClick?.(t.platform === 'JIRA' ? 'redirect_jira' : 'redirect_servicenow', t)}
                onPreview={(t) => onActionClick?.(t.platform === 'JIRA' ? 'preview_jira' : 'preview_servicenow', t)}
                onEscalate={(id) => onActionClick?.('escalate_ticket', id)}
                onClose={(id) => onActionClick?.('close_ticket', id)}
                onClick={(t) => onActionClick?.('view_ticket_hub', t.id)}
              />
            </div>
          )}

          {/* Embedded HITL Action */}
          {message.hitlRequest && onSubmitOTP && onResolveApproval && (
            <HITLApprovalCard
              request={message.hitlRequest}
              onSubmitOTP={onSubmitOTP}
              onResolveApproval={onResolveApproval}
            />
          )}

          {/* Suggested Quick Actions */}
          {message.suggestedActions && message.suggestedActions.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-[#2D3B42]/10 flex flex-wrap gap-2">
              {message.suggestedActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => onActionClick?.(action.action, action.payload)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[30px] text-xs font-semibold bg-[#EF4623]/10 hover:bg-[#EF4623]/20 text-[#EF4623] border border-[#EF4623]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>{action.label}</span>
                  <ArrowRight className="w-3 h-3 opacity-60" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
