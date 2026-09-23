import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Paperclip, Mic, CornerDownLeft } from 'lucide-react';
import { Button } from '../atoms/Button';

export interface ChatInputAreaProps {
  onSendMessage: (text: string) => void;
  isLoading?: boolean;
  onPresetSelect?: (query: string) => void;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  onSendMessage,
  isLoading = false,
  onPresetSelect
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const presets = [
    { label: 'VPN Setup & macOS Fixes', query: 'How do I install and configure GlobalProtect VPN on macOS?' },
    { label: 'Reset AD Password', query: 'Reset my Active Directory password' },
    { label: 'Check Status: JIRA-4091', query: 'Check the status of ticket JIRA-4091' },
    { label: 'Request AWS DB Access', query: 'Grant me ReadOnly access to production AWS DB' },
    { label: 'Fix Monitor Flickering', query: 'My external monitor flickers via CalDigit dock' }
  ];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Quick Scenario Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
        <span className="text-[10px] font-bold text-[#EF4623] uppercase tracking-wider flex items-center gap-1 flex-shrink-0 mr-1">
          <Sparkles className="w-3 h-3 text-[#EF4623]" /> Quick Tests:
        </span>
        {presets.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              if (onPresetSelect) onPresetSelect(preset.query);
              else onSendMessage(preset.query);
            }}
            className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium bg-white/80 hover:bg-[#EF4623]/10 text-[#2D3B42] hover:text-[#EF4623] border border-[#2D3B42]/10 hover:border-[#EF4623]/30 transition-all shadow-sm"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Input Form Container */}
      <form
        onSubmit={handleSubmit}
        className="relative rounded-3xl bg-white/95 border border-[#2D3B42]/15 p-2.5 shadow-[0_8px_30px_rgba(45,59,66,0.06)] backdrop-blur-2xl focus-within:border-[#EF4623] focus-within:shadow-[0_8px_35px_rgba(239,70,35,0.15)] transition-all"
      >
        <div className="flex items-end gap-2 px-2 py-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask an IT question, request access, reset passwords, or ask about a ticket..."
            className="w-full bg-transparent text-sm text-[#2D3B42] placeholder:text-[#2D3B42]/40 resize-none focus:outline-none max-h-32 py-1.5 leading-relaxed"
          />

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={!input.trim() || isLoading}
              isLoading={isLoading}
              className="rounded-[30px] px-4 shadow-lg shadow-[#EF4623]/25"
              rightIcon={<Send className="w-4 h-4" />}
            >
              Send
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between px-2 pt-1.5 border-t border-[#2D3B42]/10 text-[11px] text-[#2D3B42]/60">
          <span className="flex items-center gap-1">
            Press <kbd className="px-1.5 py-0.5 rounded-lg bg-[#FDF1EE] border border-[#EF4623]/20 text-[#EF4623] font-mono text-[10px]">Enter ↵</kbd> to submit, <kbd className="px-1.5 py-0.5 rounded-lg bg-[#FDF1EE] border border-[#EF4623]/20 text-[#EF4623] font-mono text-[10px]">Shift+Enter</kbd> for newline
          </span>
          <span className="text-[#EF4623] font-semibold">LangGraph State Machine Connected</span>
        </div>
      </form>
    </div>
  );
};
