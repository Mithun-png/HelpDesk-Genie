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
      <div className="space-y-2 text-sm leading-relaxed text-slate-200">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Header
          if (line.startsWith('### ')) {
            return <h4 key={idx} className="text-base font-bold text-slate-100 mt-2">{line.replace('### ', '')}</h4>;
          }
          if (line.startsWith('## ')) {
            return <h3 key={idx} className="text-lg font-bold text-violet-300 mt-2">{line.replace('## ', '')}</h3>;
          }

          // Bullet points
          if (line.startsWith('- ') || line.startsWith('* ')) {
            const itemText = line.substring(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-violet-400 mt-1">•</span>
                <span>{renderInlineFormatting(itemText)}</span>
              </div>
            );
          }

          // Numbered lists
          const numMatch = line.match(/^(\d+)\.\s(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-2">
                <span className="font-semibold text-violet-400 text-xs mt-0.5">{numMatch[1]}.</span>
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
        return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="px-1.5 py-0.5 rounded bg-violet-950/60 border border-violet-500/20 text-violet-300 font-mono text-xs">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <div className={`flex items-start gap-3.5 my-4 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      <Avatar
        type={isAssistant ? 'bot' : 'user'}
        size="md"
        className={isAssistant ? 'mt-1' : ''}
      />

      <div className={`flex flex-col max-w-[85%] sm:max-w-[78%] ${isAssistant ? 'items-start' : 'items-end'}`}>
        {/* Header with intent badge / metadata */}
        <div className="flex items-center gap-2 mb-1.5 px-1">
          <span className="text-xs font-semibold text-slate-400">
            {isAssistant ? 'HelpDeskGenie' : 'You'}
          </span>
          <span className="text-[10px] text-slate-500">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isAssistant && message.intent && (
            <Badge variant="intent" intent={message.intent} size="sm" />
          )}
        </div>

        {/* Bubble */}
        <div
          className={`rounded-2xl p-4 transition-all duration-200 ${
            isAssistant
              ? 'bg-[#141124]/90 border border-violet-500/20 text-slate-100 shadow-glass-violet backdrop-blur-xl'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20 rounded-tr-sm'
          }`}
        >
          {message.error ? (
            <div className="flex items-start gap-2 text-rose-300 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{message.error}</span>
            </div>
          ) : (
            renderFormattedContent(message.content)
          )}

          {/* Embedded KB Citations */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-violet-500/15 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-300">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span>Retrieved Confluence Runbooks & Sources ({message.citations.length})</span>
              </div>
              <div className="space-y-1.5">
                {message.citations.map(c => (
                  <KBSourceCard key={c.id} citation={c} />
                ))}
              </div>
            </div>
          )}

          {/* Embedded Ticket Reference */}
          {message.ticketRef && (
            <div className="mt-3 pt-2">
              <TicketSummaryCard ticket={message.ticketRef} compact />
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
            <div className="mt-3.5 pt-3 border-t border-violet-500/15 flex flex-wrap gap-2">
              {message.suggestedActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => onActionClick?.(action.action, action.payload)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-violet-500/15 hover:bg-violet-500/30 text-violet-200 border border-violet-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
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
