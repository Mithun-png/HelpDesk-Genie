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
          <h2 className="text-2xl font-bold font-serif text-[#2D3B42] flex items-center gap-2 tracking-tight">
            <BookOpen className="w-5 h-5 text-[#EF4623]" />
            Confluence Knowledge Base & Runbooks
          </h2>
          <p className="text-xs text-[#2D3B42]/60 mt-0.5">
            Vectorized IT documentation indexed in Pinecone for grounded RAG generation (Confidence threshold: {(retrievalThreshold * 100).toFixed(0)}%)
          </p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-3 p-4 rounded-3xl bg-white/85 border border-[#2D3B42]/10 backdrop-blur-xl shadow-sm">
        <Input
          placeholder="Semantic vector search over runbooks, password policies, VPN guides, hardware fixes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-[#EF4623]" />}
        />

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-[30px] text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#EF4623] text-white shadow-md shadow-[#EF4623]/25'
                  : 'bg-white/80 text-[#2D3B42]/70 hover:bg-[#FDF1EE] border border-[#2D3B42]/10'
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
              className="rounded-3xl border border-[#2D3B42]/10 bg-white/90 backdrop-blur-xl p-5 cursor-pointer transition-all duration-200 hover:border-[#EF4623]/35 hover:shadow-md flex flex-col justify-between group shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#EF4623]/10 text-[#EF4623] border border-[#EF4623]/25">
                    {article.id}
                  </span>
                  {score !== undefined && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" /> {(score * 100).toFixed(0)}% Vector Match
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-[#2D3B42] group-hover:text-[#EF4623] transition-colors line-clamp-2 mb-1.5 font-serif">
                  {article.title}
                </h3>

                <p className="text-xs text-[#2D3B42]/70 line-clamp-3 mb-3 leading-relaxed">
                  {article.summary}
                </p>
              </div>

              <div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {article.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FDF1EE] text-[#EF4623] border border-[#EF4623]/20">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#2D3B42]/60 pt-2 border-t border-[#2D3B42]/10">
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {article.resolvedTicketCount} tickets resolved
                  </span>
                  <span className="text-[#EF4623] font-semibold group-hover:underline flex items-center gap-1">
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
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#2D3B42]/10 shadow-sm">
              <span className="text-[#2D3B42]/70">Last Verified by IT SecOps: <strong className="text-[#2D3B42]">{selectedArticle.lastUpdated}</strong></span>
              <a
                href={selectedArticle.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#EF4623] hover:text-[#D93816] font-semibold"
              >
                Confluence Source <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-[#FDF1EE]/70 border border-[#2D3B42]/10 text-[#2D3B42] leading-relaxed font-mono whitespace-pre-wrap text-[11px] shadow-sm">
              {selectedArticle.content}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#2D3B42]/10">
              <div className="flex items-center gap-1.5 text-[#2D3B42]/60">
                <Tag className="w-3.5 h-3.5 text-[#EF4623]" />
                <span>Tags: {selectedArticle.tags.join(', ')}</span>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setSelectedArticle(null)} className="rounded-[30px]">
                Close Runbook
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
