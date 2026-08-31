import React, { useRef, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { ChatMessageItem } from '../molecules/ChatMessageItem';
import { ChatInputArea } from '../molecules/ChatInputArea';
import { GraphStatePill } from '../molecules/GraphStatePill';
import { Trash2, Shield, Network, Activity } from 'lucide-react';
import { Button } from '../atoms/Button';

export const ChatInterface: React.FC = () => {
  const { 
    messages, 
    currentNode, 
    isProcessing, 
    sendMessage, 
    clearConversation,
    submitOTP,
    resolveHITLApproval,
    setActiveTab
  } = useAppStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const handleActionClick = (action: string, payload?: unknown) => {
    if (action === 'open_kb') {
      setActiveTab('knowledge');
    } else if (action === 'resolved') {
      sendMessage('Thank you, this resolved my issue!');
    } else if (action === 'quick_ticket') {
      sendMessage(`Please open a support ticket for: ${payload || 'my current issue'}`);
    } else if (action === 'escalate_ticket') {
      sendMessage(`Please escalate ticket ${payload} to Urgent priority immediately`);
    } else if (action === 'close_ticket') {
      sendMessage(`Close ticket ${payload} as resolved`);
    } else if (action === 'clarify_select' && typeof payload === 'string') {
      sendMessage(payload);
    } else if (action === 'preset' && typeof payload === 'string') {
      sendMessage(payload);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] max-w-5xl mx-auto">
      {/* Top Bar with Live Graph Status */}
      <div className="flex items-center justify-between pb-3 px-1 border-b border-violet-500/15 mb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <GraphStatePill currentNode={currentNode} isProcessing={isProcessing} />
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={clearConversation}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            className="text-slate-400 hover:text-rose-300"
          >
            Clear Session
          </Button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-2 select-text">
        {messages.map((msg) => (
          <ChatMessageItem
            key={msg.id}
            message={msg}
            onActionClick={handleActionClick}
            onSubmitOTP={submitOTP}
            onResolveApproval={resolveHITLApproval}
          />
        ))}

        {isProcessing && (
          <div className="flex items-center gap-3 py-3 px-4 rounded-2xl bg-[#141124]/60 border border-violet-500/20 max-w-md animate-pulse">
            <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-ping" />
            <span className="text-xs font-medium text-violet-300">
              LangGraph executing: <strong className="font-mono text-violet-200">{currentNode}</strong>...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="pt-3 flex-shrink-0">
        <ChatInputArea
          onSendMessage={sendMessage}
          isLoading={isProcessing}
          onPresetSelect={(query) => sendMessage(query)}
        />
      </div>
    </div>
  );
};
