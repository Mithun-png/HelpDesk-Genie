import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { KBArticle } from '../../types';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { Modal } from '../atoms/Modal';
import { BookOpen, Search, ExternalLink, Sparkles, Tag, CheckCircle2 } from 'lucide-react';
import { ragService } from '../../services/ragService';

export const KnowledgeExplorer: React.FC = () => {
  const { kbArticles, retrievalThreshold } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);

  const categories = [
    'All',
    'VPN & Network',
    'Identity & Access',
    'Hardware & Peripherals',
    'Software & Tools',
    'Email & SaaS'
  ];

  const searchResults = searchQuery.trim() 
    ? ragService.searchVectorStore(searchQuery, 10).citations 
    : [];

  const filteredArticles = kbArticles.filter(art => {
    const matchesCat = selectedCategory === 'All' || art.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-400" />
            Confluence Knowledge Base & Runbooks
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Vectorized IT documentation indexed in Pinecone for grounded RAG generation (Confidence threshold: {(retrievalThreshold * 100).toFixed(0)}%)
          </p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-3 p-4 rounded-2xl bg-[#120F20]/80 border border-violet-500/15 backdrop-blur-xl">
        <Input
          placeholder="Semantic vector search over runbooks, password policies, VPN guides, hardware fixes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-violet-400" />}
        />

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 border border-violet-400/30'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArticles.map(article => {
          const citationMatch = searchResults.find(c => c.id === article.id);
          const score = citationMatch ? citationMatch.similarityScore : undefined;

          return (
            <div
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="rounded-2xl border border-violet-500/20 bg-[#120F20]/80 backdrop-blur-xl p-4 cursor-pointer transition-all duration-200 hover:border-violet-500/40 hover:bg-[#161228] flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                    {article.id}
                  </span>
                  {score !== undefined && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {(score * 100).toFixed(0)}% Vector Match
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-100 group-hover:text-violet-300 transition-colors line-clamp-2 mb-1.5">
                  {article.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-3 mb-3 leading-relaxed">
                  {article.summary}
                </p>
              </div>

              <div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {article.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-violet-500/10">
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {article.resolvedTicketCount} tickets resolved
                  </span>
                  <span className="text-violet-400 group-hover:underline flex items-center gap-1">
                    Read runbook →
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Article Detail Modal */}
      <Modal
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
        title={selectedArticle ? selectedArticle.title : 'Runbook Detail'}
        subtitle={selectedArticle ? `${selectedArticle.id} • ${selectedArticle.category}` : ''}
        maxWidth="lg"
      >
        {selectedArticle && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-violet-950/30 border border-violet-500/20">
              <span className="text-slate-300">Last Verified by IT SecOps: <strong className="text-white">{selectedArticle.lastUpdated}</strong></span>
              <a
                href={selectedArticle.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 font-semibold"
              >
                Confluence Source <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0916] border border-violet-500/20 text-slate-200 leading-relaxed font-mono whitespace-pre-wrap text-[11px]">
              {selectedArticle.content}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-violet-500/20">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Tag className="w-3.5 h-3.5" />
                <span>Tags: {selectedArticle.tags.join(', ')}</span>
              </div>
              <Button size="sm" variant="glass" onClick={() => setSelectedArticle(null)}>
                Close Runbook
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
