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
    <div className="rounded-xl border border-violet-500/20 bg-[#151224]/80 backdrop-blur-md overflow-hidden transition-all duration-200 hover:border-violet-500/40">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 flex items-center justify-between cursor-pointer select-none group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-violet-500/15 text-violet-300 border border-violet-500/30 flex-shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-violet-300 transition-colors">
                {citation.title}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">[{citation.id}]</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">{citation.category}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <Badge variant="confidence" score={citation.similarityScore} size="sm" />
          <button className="text-slate-400 hover:text-white p-1">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-3.5 pb-3.5 pt-1 text-xs border-t border-violet-500/10 space-y-2.5 bg-[#0D0B17]/60">
          <div className="p-2.5 rounded-lg bg-violet-950/30 border border-violet-500/15 text-slate-300 leading-relaxed font-mono text-[11px]">
            <div className="flex items-center gap-1.5 text-violet-400 mb-1 font-sans font-semibold text-[10px] uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Grounded Context Snippet
            </div>
            {citation.snippet}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400">Source: Confluence Internal Knowledge Base</span>
            <a 
              href={citation.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 font-medium transition-colors hover:underline"
            >
              View original runbook <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
