import React, { useState } from 'react';
import { Ticket } from '../../types';
import { Badge } from '../atoms/Badge';
import { 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  Send, 
  MessageSquare, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Layers,
  ChevronRight,
  Sparkles,
  Link2
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';

export interface JiraCloudModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onEscalate?: (id: string) => void;
  onResolve?: (id: string, notes: string) => void;
}

export const JiraCloudModal: React.FC<JiraCloudModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onEscalate,
  onResolve
}) => {
  const { jiraBaseUrl, currentUser, addAuditLog } = useAppStore();
  const [activeTab, setActiveTab] = useState<'comments' | 'history' | 'sla'>('comments');
  const [commentText, setCommentText] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [comments, setComments] = useState<Array<{ author: string; role: string; time: string; text: string }>>([
    {
      author: 'HelpDeskGenie (AI Bot)',
      role: 'Automated ITSM Layer',
      time: 'Just now',
      text: 'Ticket ingested via conversational LangGraph state machine. Zero-Trust identity verification and Confluence KB search completed.'
    },
    {
      author: 'Elena Rostova',
      role: 'Tier 2 Support Engineer',
      time: '15 minutes ago',
      text: 'Investigating network adapter trace logs. Please keep dock plugged into primary Thunderbolt port.'
    }
  ]);

  if (!isOpen || !ticket) return null;

  const targetUrl = ticket.externalUrl || `${jiraBaseUrl}/browse/${ticket.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenExternal = () => {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      author: currentUser.name,
      role: currentUser.role === 'employee' ? 'Reporter' : 'Support Engineer',
      time: 'Just now',
      text: commentText.trim()
    };

    setComments(prev => [newComment, ...prev]);
    setCommentText('');

    addAuditLog({
      id: `AUDIT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.email,
      userRole: currentUser.role,
      eventType: 'TOOL_EXECUTION',
      toolName: 'jira_add_comment',
      inputPayload: { ticketId: ticket.id, comment: newComment.text },
      outputPayload: { success: true },
      status: 'SUCCESS',
      confidenceScore: 1.0,
      executionDurationMs: 40
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#2D3B42]/50 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-white border border-[#2D3B42]/10 shadow-2xl overflow-hidden text-[#2D3B42] text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Atlassian JIRA Top Navigation Banner */}
        <div className="bg-[#0052CC] text-white px-5 py-3 flex items-center justify-between flex-shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            {/* Jira Logo SVG */}
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.74c0 2.4 1.94 4.35 4.34 4.35V2h-10.47zm-5.76 5.82c0 2.4 1.97 4.35 4.35 4.35h1.78v1.74c0 2.4 1.94 4.35 4.34 4.35V7.82H5.77zm-5.77 5.83c0 2.4 1.97 4.35 4.35 4.35h1.78v1.74c0 2.4 1.94 4.35 4.34 4.35V13.65H0z"/>
              </svg>
              <span className="font-bold tracking-tight text-sm">Jira Cloud Sandbox</span>
            </div>
            <span className="text-blue-200">/</span>
            <div className="flex items-center gap-1.5 text-blue-100 font-mono text-xs">
              <span>IT Service Desk</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <strong className="text-white bg-blue-700/60 px-2 py-0.5 rounded-lg">{ticket.id}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Copy Jira Issue URL"
              className="px-3 py-1 rounded-[30px] bg-blue-700/70 hover:bg-blue-600 text-white font-medium flex items-center gap-1.5 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Copy URL'}</span>
            </button>

            <button
              onClick={handleOpenExternal}
              title="Launch External Atlassian Domain"
              className="px-3.5 py-1 rounded-[30px] bg-white text-[#0052CC] font-bold flex items-center gap-1.5 hover:bg-blue-50 transition-colors shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-blue-700 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#FAF7F5]">
          {/* Left Column: Issue Details, Description, Activity */}
          <div className="lg:col-span-8 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/15 text-sky-700 font-mono text-[11px] font-bold border border-sky-500/30">
                  ITSD Issue
                </span>
                <span className="text-[#2D3B42]/60 font-mono">{ticket.id}</span>
              </div>
              <h2 className="text-xl font-bold font-serif text-[#2D3B42] leading-snug">
                {ticket.title}
              </h2>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-white border border-[#2D3B42]/10 shadow-sm">
              <span className="text-[#2D3B42]/60 text-[11px] px-2 font-medium">JIRA Workflow:</span>
              <span className="px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-700 font-bold border border-sky-500/30">
                {ticket.status}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#EF4623]/10 text-[#EF4623] font-bold border border-[#EF4623]/25">
                Priority: {ticket.priority}
              </span>
              
              {onEscalate && ticket.priority !== 'Urgent' && ticket.status !== 'Resolved' && (
                <button
                  onClick={() => onEscalate(ticket.id)}
                  className="px-3 py-1 rounded-[30px] bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 border border-rose-500/30 font-semibold transition-colors"
                >
                  ⚡ Escalate to Urgent
                </button>
              )}

              {onResolve && ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                <button
                  onClick={() => onResolve(ticket.id, 'Resolved in Jira Sandbox')}
                  className="px-3 py-1 rounded-[30px] bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 border border-emerald-500/30 font-semibold transition-colors"
                >
                  ✓ Mark as Done
                </button>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-[#2D3B42] uppercase tracking-wider">Description</h4>
              <div className="p-3.5 rounded-2xl bg-white border border-[#2D3B42]/10 text-[#2D3B42] leading-relaxed whitespace-pre-wrap shadow-sm">
                {ticket.description}
              </div>
            </div>

            {/* Activity Tabs */}
            <div className="pt-3 border-t border-[#2D3B42]/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#2D3B42] uppercase tracking-wider">Activity</h4>
                <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-[#2D3B42]/10 shadow-sm">
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === 'comments' ? 'bg-[#0052CC] text-white shadow-sm' : 'text-[#2D3B42]/60 hover:text-[#2D3B42]'
                    }`}
                  >
                    Comments ({comments.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === 'history' ? 'bg-[#0052CC] text-white shadow-sm' : 'text-[#2D3B42]/60 hover:text-[#2D3B42]'
                    }`}
                  >
                    History
                  </button>
                  <button
                    onClick={() => setActiveTab('sla')}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === 'sla' ? 'bg-[#0052CC] text-white shadow-sm' : 'text-[#2D3B42]/60 hover:text-[#2D3B42]'
                    }`}
                  >
                    SLAs
                  </button>
                </div>
              </div>

              {/* Add Comment Input */}
              {activeTab === 'comments' && (
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add an internal note or reply to customer..."
                    className="flex-1 px-3.5 py-2 rounded-2xl bg-white border border-[#2D3B42]/15 text-[#2D3B42] placeholder:text-[#2D3B42]/40 focus:outline-none focus:border-[#0052CC] shadow-sm text-xs"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-[30px] bg-[#0052CC] hover:bg-[#0047B3] text-white font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </form>
              )}

              {/* Comments List */}
              {activeTab === 'comments' && (
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {comments.map((c, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-white border border-[#2D3B42]/10 space-y-1 shadow-sm">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <strong className="text-[#2D3B42]">{c.author}</strong>
                          <span className="text-[#EF4623] text-[10px]">({c.role})</span>
                        </div>
                        <span className="text-[#2D3B42]/50 text-[10px]">{c.time}</span>
                      </div>
                      <p className="text-xs text-[#2D3B42]/80 leading-relaxed">{c.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="p-3.5 rounded-2xl bg-white border border-[#2D3B42]/10 space-y-2 text-xs shadow-sm">
                  <div className="flex items-center gap-2 text-[#2D3B42]/80">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    <span>Issue created on {new Date(ticket.createdAt).toLocaleString()} by {ticket.createdByName || ticket.createdBy}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#2D3B42]/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Assigned to {ticket.assignedTo || 'Tier 2 Engineering Queue'}</span>
                  </div>
                </div>
              )}

              {/* SLA Tab */}
              {activeTab === 'sla' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-900 shadow-sm">
                    <span className="block font-bold text-xs">Time to First Response</span>
                    <span className="text-lg font-bold">12 mins</span>
                    <span className="block text-[10px] text-emerald-700">Target: 60 mins (Met ✓)</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/25 text-sky-900 shadow-sm">
                    <span className="block font-bold text-xs">Time to Resolution</span>
                    <span className="text-lg font-bold">3h 45m</span>
                    <span className="block text-[10px] text-sky-700">Target: 8h (On Track)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: JIRA Meta Fields */}
          <div className="lg:col-span-4 space-y-4 bg-white p-4 rounded-3xl border border-[#2D3B42]/10 shadow-sm">
            <h4 className="text-xs font-bold text-[#2D3B42] uppercase tracking-wider pb-2 border-b border-[#2D3B42]/10">
              Issue Metadata
            </h4>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-[#2D3B42]/60 block mb-0.5">Assignee</span>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#0052CC] text-white font-bold flex items-center justify-center text-[10px]">
                    {(ticket.assignedTo || 'E')[0].toUpperCase()}
                  </div>
                  <span className="font-semibold text-[#2D3B42]">{ticket.assignedTo || 'Unassigned'}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-[#2D3B42]/60 block mb-0.5">Reporter</span>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#EF4623] text-white font-bold flex items-center justify-center text-[10px]">
                    {(ticket.createdByName || ticket.createdBy)[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-[#2D3B42] block">{ticket.createdByName || ticket.createdBy}</span>
                    <span className="text-[10px] text-[#2D3B42]/60 font-mono">{ticket.createdBy}</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-[#2D3B42]/60 block mb-0.5">Project</span>
                <span className="font-semibold text-sky-700">IT Service Desk (ITSD / KAN)</span>
              </div>

              <div>
                <span className="text-[11px] text-[#2D3B42]/60 block mb-0.5">Category / Component</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-[#EF4623]/10 text-[#EF4623] font-medium border border-[#EF4623]/25 text-[11px]">
                  {ticket.category || 'General IT'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[#2D3B42]/60 block mb-0.5">Direct URL</span>
                <button
                  onClick={handleOpenExternal}
                  className="text-sky-700 hover:text-sky-800 underline font-mono text-[11px] truncate max-w-full text-left flex items-center gap-1"
                >
                  <Link2 className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{targetUrl}</span>
                </button>
              </div>

              <div>
                <span className="text-[11px] text-[#2D3B42]/60 block mb-0.5">Created Date</span>
                <span className="text-[#2D3B42] text-[11px]">{new Date(ticket.createdAt).toLocaleString()}</span>
              </div>

              <div>
                <span className="text-[11px] text-[#2D3B42]/60 block mb-0.5">Last Updated</span>
                <span className="text-[#2D3B42] text-[11px]">{new Date(ticket.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
