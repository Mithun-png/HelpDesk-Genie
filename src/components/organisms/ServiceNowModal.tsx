import React, { useState } from 'react';
import { Ticket } from '../../types';
import { Badge } from '../atoms/Badge';
import { 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  Send, 
  Clock, 
  ChevronRight,
  Link2,
  Shield,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';

export interface ServiceNowModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onEscalate?: (id: string) => void;
  onResolve?: (id: string, notes: string) => void;
}

export const ServiceNowModal: React.FC<ServiceNowModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onEscalate,
  onResolve
}) => {
  const { serviceNowBaseUrl, currentUser, addAuditLog } = useAppStore();
  const [activeTab, setActiveTab] = useState<'notes' | 'resolution' | 'details'>('notes');
  const [workNoteText, setWorkNoteText] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [notes, setNotes] = useState<Array<{ author: string; time: string; text: string }>>([
    {
      author: 'HelpDeskGenie Automation',
      time: 'Just now',
      text: 'Incident record generated and synchronized with ServiceNow Table API. Identity verified via Twilio MFA OTP.'
    }
  ]);

  if (!isOpen || !ticket) return null;

  const targetUrl = ticket.externalUrl || `${serviceNowBaseUrl}/nav_to.do?uri=incident.do?sys_id=${ticket.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenExternal = () => {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workNoteText.trim()) return;

    const newNote = {
      author: currentUser.name,
      time: 'Just now',
      text: workNoteText.trim()
    };

    setNotes(prev => [newNote, ...prev]);
    setWorkNoteText('');

    addAuditLog({
      id: `AUDIT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.email,
      userRole: currentUser.role,
      eventType: 'TOOL_EXECUTION',
      toolName: 'servicenow_add_worknote',
      inputPayload: { incidentId: ticket.id, note: newNote.text },
      outputPayload: { success: true },
      status: 'SUCCESS',
      confidenceScore: 1.0,
      executionDurationMs: 35
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#2D3B42]/50 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-white border border-[#2D3B42]/10 shadow-2xl overflow-hidden text-[#2D3B42] text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ServiceNow Top Navigation Banner */}
        <div className="bg-[#1E3932] border-b border-emerald-500/30 text-white px-5 py-3 flex items-center justify-between flex-shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="font-bold tracking-tight text-sm">ServiceNow IT Service Management</span>
            </div>
            <span className="text-emerald-300">/</span>
            <div className="flex items-center gap-1.5 text-emerald-100 font-mono text-xs">
              <span>Incident</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <strong className="text-white bg-emerald-800/60 px-2 py-0.5 rounded-lg">{ticket.id}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Copy Incident URL"
              className="px-3 py-1 rounded-[30px] bg-emerald-800/80 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Copy URL'}</span>
            </button>

            <button
              onClick={handleOpenExternal}
              title="Launch External ServiceNow Instance"
              className="px-3.5 py-1 rounded-[30px] bg-emerald-400 hover:bg-emerald-300 text-[#1E3932] font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-emerald-800 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#FAF7F5]">
          <div className="lg:col-span-8 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 font-mono text-[11px] font-bold border border-emerald-500/30">
                  ServiceNow Incident
                </span>
                <span className="text-[#2D3B42]/60 font-mono">{ticket.id}</span>
              </div>
              <h2 className="text-xl font-bold font-serif text-[#2D3B42] leading-snug">
                {ticket.title}
              </h2>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-white border border-[#2D3B42]/10 shadow-sm">
              <span className="text-[#2D3B42]/60 text-[11px] px-2 font-medium">State:</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 font-bold border border-emerald-500/30">
                {ticket.status}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#EF4623]/10 text-[#EF4623] font-bold border border-[#EF4623]/25">
                Urgency: {ticket.priority}
              </span>
              
              {onEscalate && ticket.priority !== 'Urgent' && ticket.status !== 'Resolved' && (
                <button
                  onClick={() => onEscalate(ticket.id)}
                  className="px-3 py-1 rounded-[30px] bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 border border-rose-500/30 font-semibold transition-colors"
                >
                  ⚡ Escalate to P1/Urgent
                </button>
              )}

              {onResolve && ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                <button
                  onClick={() => onResolve(ticket.id, 'Resolved via ServiceNow Table API')}
                  className="px-3 py-1 rounded-[30px] bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 border border-emerald-500/30 font-semibold transition-colors"
                >
                  ✓ Resolve Incident
                </button>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-[#2D3B42] uppercase tracking-wider">Short Description & Details</h4>
              <div className="p-3.5 rounded-2xl bg-white border border-[#2D3B42]/10 text-[#2D3B42] leading-relaxed whitespace-pre-wrap shadow-sm">
                {ticket.description}
              </div>
            </div>

            {/* Work Notes */}
            <div className="pt-3 border-t border-[#2D3B42]/10 space-y-3">
              <h4 className="text-xs font-bold text-[#2D3B42] uppercase tracking-wider">Work Notes & ITIL Journal</h4>
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={workNoteText}
                  onChange={(e) => setWorkNoteText(e.target.value)}
                  placeholder="Post internal work notes to incident journal..."
                  className="flex-1 px-3.5 py-2 rounded-2xl bg-white border border-[#2D3B42]/15 text-[#2D3B42] placeholder:text-[#2D3B42]/40 focus:outline-none focus:border-emerald-600 shadow-sm text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-[30px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </form>

              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {notes.map((n, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-white border border-[#2D3B42]/10 space-y-1 shadow-sm">
                    <div className="flex items-center justify-between text-[11px]">
                      <strong className="text-[#2D3B42]">{n.author}</strong>
                      <span className="text-[#2D3B42]/50 text-[10px]">{n.time}</span>
                    </div>
                    <p className="text-xs text-[#2D3B42]/80 leading-relaxed">{n.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: ServiceNow ITIL Fields */}
          <div className="lg:col-span-4 space-y-4 bg-white p-4 rounded-3xl border border-[#2D3B42]/10 shadow-sm">
            <h4 className="text-xs font-bold text-[#2D3B42] uppercase tracking-wider pb-2 border-b border-[#2D3B42]/10">
              ServiceNow Fields
            </h4>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-[#2D3B42]/60 block mb-0.5">Caller</span>
                <span className="font-semibold text-[#2D3B42] block">{ticket.createdByName || ticket.createdBy}</span>
                <span className="text-[10px] text-[#2D3B42]/60 font-mono">{ticket.createdBy}</span>
              </div>

              <div>
                <span className="text-[11px] text-[#2D3B42]/60 block mb-0.5">Assignment Group</span>
                <span className="font-semibold text-emerald-700">Tier 1 Service Desk Automation</span>
              </div>

              <div>
                <span className="text-[11px] text-[#2D3B42]/60 block mb-0.5">Category</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-[#EF4623]/10 text-[#EF4623] font-medium border border-[#EF4623]/25 text-[11px]">
                  {ticket.category || 'General IT'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[#2D3B42]/60 block mb-0.5">Direct Incident URL</span>
                <button
                  onClick={handleOpenExternal}
                  className="text-emerald-700 hover:text-emerald-800 underline font-mono text-[11px] truncate max-w-full text-left flex items-center gap-1"
                >
                  <Link2 className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{targetUrl}</span>
                </button>
              </div>

              <div>
                <span className="text-[11px] text-[#2D3B42]/60 block mb-0.5">Opened Timestamp</span>
                <span className="text-[#2D3B42] text-[11px]">{new Date(ticket.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
