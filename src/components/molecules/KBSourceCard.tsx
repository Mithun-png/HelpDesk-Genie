import React, { useState } from 'react';
import { KBSourceCitation } from '../../types';
import { ExternalLink, BookOpen, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Badge } from '../atoms/Badge';

export interface KBSourceCardProps {
  citation: KBSourceCitation;
}

export const KBSourceCard: React.FC<KBSourceCardProps> = ({ citation }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-[#2D3B42]/10 bg-white/85 backdrop-blur-md overflow-hidden transition-all duration-200 hover:border-[#EF4623]/30 shadow-sm">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 flex items-center justify-between cursor-pointer select-none group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-xl bg-[#EF4623]/10 text-[#EF4623] border border-[#EF4623]/25 flex-shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#2D3B42] truncate group-hover:text-[#EF4623] transition-colors">
                {citation.title}
              </span>
              <span className="text-[10px] text-[#2D3B42]/50 font-mono">[{citation.id}]</span>
            </div>
            <p className="text-[11px] text-[#2D3B42]/60 truncate">{citation.category}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <Badge variant="confidence" score={citation.similarityScore} size="sm" />
          <button className="text-[#2D3B42]/50 hover:text-[#EF4623] p-1">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-3.5 pb-3.5 pt-1 text-xs border-t border-[#2D3B42]/10 space-y-2.5 bg-[#FDF1EE]/50">
          <div className="p-2.5 rounded-xl bg-white border border-[#2D3B42]/10 text-[#2D3B42] leading-relaxed font-mono text-[11px] shadow-sm">
            <div className="flex items-center gap-1.5 text-[#EF4623] mb-1 font-sans font-semibold text-[10px] uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Grounded Context Snippet
            </div>
            {citation.snippet}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-[#2D3B42]/60">Source: Confluence Internal Knowledge Base</span>
            <a 
              href={citation.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-[#EF4623] hover:text-[#D93816] font-medium transition-colors hover:underline"
            >
              View original runbook <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
