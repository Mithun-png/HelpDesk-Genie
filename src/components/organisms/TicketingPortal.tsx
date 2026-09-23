import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { Ticket, PlatformType, TicketPriority, TicketStatus } from '../../types';
import { TicketSummaryCard } from '../molecules/TicketSummaryCard';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Modal } from '../atoms/Modal';
import { Badge } from '../atoms/Badge';
import { 
  Plus, 
  Search, 
  Filter, 
  Layers, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowUpRight, 
  User, 
  ExternalLink, 
  Clock, 
  MessageSquare, 
  Copy, 
  Check, 
  Calendar,
  Tag,
  AlertTriangle,
  Building
} from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { JiraCloudModal } from './JiraCloudModal';
import { ServiceNowModal } from './ServiceNowModal';

export const TicketingPortal: React.FC = () => {
  const { 
    tickets, 
    currentUser, 
    addTicket, 
    escalateTicket, 
    closeTicket,
    selectedTicketId,
    setSelectedTicketId,
    setActiveTab,
    sendMessage,
    jiraBaseUrl,
    serviceNowBaseUrl,
    addAuditLog
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'All' | PlatformType>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | TicketStatus>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [scopeFilter, setScopeFilter] = useState<'my_tickets' | 'all_tickets'>(
    currentUser.role === 'employee' ? 'my_tickets' : 'all_tickets'
  );
  
  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPlatform, setNewPlatform] = useState<PlatformType>('JIRA');
  const [newPriority, setNewPriority] = useState<TicketPriority>('Medium');
  const [newCategory, setNewCategory] = useState('Hardware & Peripherals');

  // Escalate Modal state
  const [escalateTicketId, setEscalateTicketId] = useState<string | null>(null);
  const [escalateReason, setEscalateReason] = useState('');

  // Close / Resolve Modal state
  const [closeTicketId, setCloseTicketId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Selected Ticket detail state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeJiraTicket, setActiveJiraTicket] = useState<Ticket | null>(null);
  const [activeServiceNowTicket, setActiveServiceNowTicket] = useState<Ticket | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Sync selectedTicketId from AppStore
  useEffect(() => {
    if (selectedTicketId) {
      const match = tickets.find(t => t.id.toLowerCase() === selectedTicketId.toLowerCase());
      if (match) {
        setSelectedTicket(match);
      }
    }
  }, [selectedTicketId, tickets]);

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.createdByName && t.createdByName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPlatform = platformFilter === 'All' || t.platform === platformFilter;
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
    const matchesScope = scopeFilter === 'all_tickets' || t.createdBy.toLowerCase() === currentUser.email.toLowerCase();
    
    return matchesSearch && matchesPlatform && matchesStatus && matchesCategory && matchesScope;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = ticketService.createTicket({
      platform: newPlatform,
      title: newTitle.trim(),
      description: newDescription.trim() || newTitle.trim(),
      priority: newPriority,
      category: newCategory,
      createdBy: currentUser.email,
      createdByName: currentUser.name
    });

    addTicket(created);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDescription('');

    addAuditLog({
      id: `AUDIT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.email,
      userRole: currentUser.role,
      eventType: 'TOOL_EXECUTION',
      toolName: 'create_ticket',
      inputPayload: { title: created.title, platform: created.platform, category: created.category },
      outputPayload: { ticketId: created.id, status: 'Open' },
      status: 'SUCCESS',
      confidenceScore: 1.0,
      executionDurationMs: 90
    });
  };

  const handleEscalateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalateTicketId) return;
    escalateTicket(escalateTicketId, escalateReason);
    setEscalateTicketId(null);
    setEscalateReason('');
    if (selectedTicket && selectedTicket.id === escalateTicketId) {
      setSelectedTicket(prev => prev ? { ...prev, priority: 'Urgent' } : null);
    }
  };

  const handleCloseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!closeTicketId) return;
    closeTicket(closeTicketId, resolutionNotes || 'Resolved by user from Service Desk Portal');
    setCloseTicketId(null);
    setResolutionNotes('');
    if (selectedTicket && selectedTicket.id === closeTicketId) {
      setSelectedTicket(prev => prev ? { ...prev, status: 'Resolved' } : null);
    }
  };

  const handleOpenExternal = (ticket: Ticket) => {
    if (ticket.platform === 'JIRA') {
      setActiveJiraTicket(ticket);
    } else {
      setActiveServiceNowTicket(ticket);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleChatAboutTicket = (ticket: Ticket) => {
    setSelectedTicket(null);
    setSelectedTicketId(null);
    setActiveTab('chat');
    sendMessage(`Check status and recent logs for ticket ${ticket.id}`);
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif text-[#2D3B42] flex items-center gap-2 tracking-tight">
            <Layers className="w-5 h-5 text-[#EF4623]" />
            IT Service Desk Ticket Hub
          </h2>
          <p className="text-xs text-[#2D3B42]/60 mt-0.5">
            Unified ticketing dashboard synchronized with sandbox JIRA REST (<code className="text-[#EF4623] font-semibold">KAN</code> project) and ServiceNow Table APIs
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Scope toggle */}
          <div className="flex items-center p-1 rounded-[30px] bg-white/90 border border-[#2D3B42]/10 text-xs shadow-sm">
            <button
              onClick={() => setScopeFilter('my_tickets')}
              className={`px-3.5 py-1.5 rounded-[30px] font-semibold transition-all ${
                scopeFilter === 'my_tickets' 
                  ? 'bg-[#EF4623] text-white shadow-sm' 
                  : 'text-[#2D3B42]/60 hover:text-[#2D3B42]'
              }`}
            >
              My Tickets ({tickets.filter(t => t.createdBy.toLowerCase() === currentUser.email.toLowerCase()).length})
            </button>
            <button
              onClick={() => setScopeFilter('all_tickets')}
              className={`px-3.5 py-1.5 rounded-[30px] font-semibold transition-all ${
                scopeFilter === 'all_tickets' 
                  ? 'bg-[#EF4623] text-white shadow-sm' 
                  : 'text-[#2D3B42]/60 hover:text-[#2D3B42]'
              }`}
            >
              All Team Queue ({tickets.length})
            </button>
          </div>

          <a
            href={ticketService.getJiraBoardUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-[30px] text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white border border-sky-400/40 flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/20"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open JIRA KAN Board</span>
          </a>

          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-lg shadow-[#EF4623]/20 rounded-[30px]"
          >
            Create IT Ticket
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3.5 rounded-3xl bg-white/85 border border-[#2D3B42]/10 backdrop-blur-xl shadow-sm">
        <div className="sm:col-span-4">
          <Input
            placeholder="Search by ticket ID (e.g. KAN-101, INC0089211), title, or reporter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-[#EF4623]" />}
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as any)}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#2D3B42]/15 text-[#2D3B42] text-xs focus:outline-none focus:border-[#EF4623] transition-colors shadow-sm"
          >
            <option value="All">All Platforms (JIRA & ServiceNow)</option>
            <option value="JIRA">JIRA Cloud (Project: KAN)</option>
            <option value="ServiceNow">ServiceNow Sandbox</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#2D3B42]/15 text-[#2D3B42] text-xs focus:outline-none focus:border-[#EF4623] transition-colors shadow-sm"
          >
            <option value="All">All Lifecycle Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#2D3B42]/15 text-[#2D3B42] text-xs focus:outline-none focus:border-[#EF4623] transition-colors shadow-sm"
          >
            <option value="All">All Categories</option>
            <option value="VPN & Network">VPN & Network</option>
            <option value="Identity & Access">Identity & Access</option>
            <option value="Hardware & Peripherals">Hardware & Peripherals</option>
            <option value="Software & Tools">Software & Tools</option>
          </select>
        </div>
      </div>

      {/* Ticket List */}
      <div className="grid grid-cols-1 gap-3">
        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white/50 border border-[#2D3B42]/10">
            <Layers className="w-10 h-10 mx-auto text-[#2D3B42]/40 mb-2" />
            <h3 className="text-sm font-semibold text-[#2D3B42]">No tickets found</h3>
            <p className="text-xs text-[#2D3B42]/60 mt-1">
              Try adjusting your search criteria or create a new IT ticket.
            </p>
          </div>
        ) : (
          filteredTickets.map(ticket => (
            <TicketSummaryCard
              key={ticket.id}
              ticket={ticket}
              onEscalate={(id) => setEscalateTicketId(id)}
              onClose={(id) => setCloseTicketId(id)}
              onClick={() => setSelectedTicket(ticket)}
              onViewServiceDesk={() => setSelectedTicket(ticket)}
              onOpenExternal={handleOpenExternal}
            />
          ))
        )}
      </div>

      {/* Interactive Ticket Details Modal */}
      {selectedTicket && (
        <Modal
          isOpen={!!selectedTicket}
          onClose={() => {
            setSelectedTicket(null);
            setSelectedTicketId(null);
          }}
          title={`Ticket Details — ${selectedTicket.id}`}
        >
          <div className="space-y-4 text-xs">
            {/* Top Badges & Actions */}
            <div className="flex items-center justify-between pb-3 border-b border-[#2D3B42]/10 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                  selectedTicket.platform === 'JIRA'
                    ? 'bg-sky-500/15 text-sky-700 border border-sky-500/30'
                    : 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
                }`}>
                  {selectedTicket.platform} • {selectedTicket.id}
                </span>
                <Badge variant="status" status={selectedTicket.status} size="sm" />
                <Badge variant="priority" priority={selectedTicket.priority} size="sm" />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyKey(selectedTicket.id)}
                  className="px-2.5 py-1 rounded-xl bg-[#2D3B42]/5 hover:bg-[#2D3B42]/10 border border-[#2D3B42]/15 text-[#2D3B42] flex items-center gap-1.5 transition-all text-xs"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copied Key!' : 'Copy Key'}</span>
                </button>

                <a
                  href={selectedTicket.externalUrl || (selectedTicket.platform === 'JIRA' ? `${jiraBaseUrl}/browse/${selectedTicket.id}` : `${serviceNowBaseUrl}/nav_to.do?uri=incident.do?sys_id=${selectedTicket.id}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-md text-xs transition-all hover:scale-[1.02] ${
                    selectedTicket.platform === 'JIRA'
                      ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-500/25'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{selectedTicket.platform === 'JIRA' ? 'Open in JIRA' : 'Open in ServiceNow'}</span>
                </a>
              </div>
            </div>

            {/* Title & Description */}
            <div>
              <h3 className="text-base font-bold text-[#2D3B42] mb-1.5">
                {selectedTicket.title}
              </h3>
              <div className="p-3.5 rounded-2xl bg-white border border-[#2D3B42]/10 text-[#2D3B42] leading-relaxed whitespace-pre-wrap shadow-sm">
                {selectedTicket.description}
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-white/80 border border-[#2D3B42]/10 shadow-sm">
              <div>
                <span className="text-[11px] text-[#2D3B42]/60 block mb-0.5">Reporter (AD Account)</span>
                <span className="font-semibold text-[#2D3B42]">{selectedTicket.createdByName || selectedTicket.createdBy}</span>
                <span className="text-[10px] text-[#2D3B42]/60 block font-mono">{selectedTicket.createdBy}</span>
              </div>

              <div>
                <span className="text-[11px] text-[#2D3B42]/60 block mb-0.5">Assigned Engineer</span>
                <span className="font-semibold text-[#2D3B42]">{selectedTicket.assignedTo || 'Unassigned'}</span>
              </div>

              <div>
                <span className="text-[11px] text-[#2D3B42]/60 block mb-0.5">Category</span>
                <span className="font-semibold text-[#EF4623]">{selectedTicket.category}</span>
              </div>

              <div>
                <span className="text-[11px] text-[#2D3B42]/60 block mb-0.5">Created Timestamp</span>
                <span className="text-[#2D3B42]">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
              </div>

              <div>
                <span className="text-[11px] text-[#2D3B42]/60 block mb-0.5">Last Activity</span>
                <span className="text-[#2D3B42]">{new Date(selectedTicket.updatedAt).toLocaleString()}</span>
              </div>

              <div>
                <span className="text-[11px] text-[#2D3B42]/60 block mb-0.5">External URL</span>
                <span className="text-sky-600 underline font-mono text-[10px] truncate block cursor-pointer" onClick={() => handleOpenExternal(selectedTicket)}>
                  {selectedTicket.externalUrl || 'Sandbox URL Active'}
                </span>
              </div>
            </div>

            {/* Resolution Notes if available */}
            {selectedTicket.resolutionNotes && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800">
                <span className="font-bold block mb-1">Resolution Summary:</span>
                <p className="text-xs leading-relaxed">{selectedTicket.resolutionNotes}</p>
              </div>
            )}

            {/* Actions Bar */}
            <div className="pt-3 border-t border-[#2D3B42]/10 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => handleChatAboutTicket(selectedTicket)}
                className="px-3.5 py-1.5 rounded-[30px] bg-[#EF4623]/10 hover:bg-[#EF4623]/20 text-[#EF4623] border border-[#EF4623]/25 flex items-center gap-1.5 transition-all text-xs font-semibold"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Discuss with HelpDeskGenie in Chat</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedTicket.priority !== 'Urgent' && selectedTicket.status !== 'Resolved' && selectedTicket.status !== 'Closed' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setEscalateTicketId(selectedTicket.id);
                    }}
                  >
                    Escalate to Urgent
                  </Button>
                )}

                {selectedTicket.status !== 'Resolved' && selectedTicket.status !== 'Closed' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setCloseTicketId(selectedTicket.id);
                    }}
                  >
                    Resolve & Close
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Ticket Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New IT Service Desk Ticket"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="p-3 rounded-2xl bg-[#EF4623]/10 border border-[#EF4623]/20 text-[#2D3B42] flex items-center gap-2">
            <User className="w-4 h-4 text-[#EF4623] flex-shrink-0" />
            <span>Ticket will be opened under your AD account: <strong className="text-[#2D3B42]">{currentUser.email}</strong></span>
          </div>

          <div>
            <label className="block text-[#2D3B42] font-semibold mb-1">Issue Title</label>
            <Input
              placeholder="e.g. MacBook cannot connect to conference room display"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[#2D3B42] font-semibold mb-1">Detailed Description</label>
            <textarea
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#2D3B42]/15 text-[#2D3B42] text-xs focus:outline-none focus:border-[#EF4623] focus:ring-2 focus:ring-[#EF4623]/20 shadow-sm min-h-[90px]"
              placeholder="Describe symptoms, steps taken, hardware model, error logs..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[#2D3B42] font-semibold mb-1">Target Platform</label>
              <select
                className="w-full px-3 py-2 rounded-2xl bg-white border border-[#2D3B42]/15 text-[#2D3B42] text-xs focus:outline-none focus:border-[#EF4623] shadow-sm"
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value as any)}
              >
                <option value="JIRA">JIRA Cloud (KAN)</option>
                <option value="ServiceNow">ServiceNow Table</option>
              </select>
            </div>

            <div>
              <label className="block text-[#2D3B42] font-semibold mb-1">Priority</label>
              <select
                className="w-full px-3 py-2 rounded-2xl bg-white border border-[#2D3B42]/15 text-[#2D3B42] text-xs focus:outline-none focus:border-[#EF4623] shadow-sm"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent (Sev-1)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#2D3B42] font-semibold mb-1">Category</label>
              <select
                className="w-full px-3 py-2 rounded-2xl bg-white border border-[#2D3B42]/15 text-[#2D3B42] text-xs focus:outline-none focus:border-[#EF4623] shadow-sm"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option value="VPN & Network">VPN & Network</option>
                <option value="Identity & Access">Identity & Access</option>
                <option value="Hardware & Peripherals">Hardware & Peripherals</option>
                <option value="Software & Tools">Software & Tools</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>

      {/* Escalate Modal */}
      <Modal
        isOpen={!!escalateTicketId}
        onClose={() => setEscalateTicketId(null)}
        title="Escalate IT Ticket to Urgent"
      >
        <form onSubmit={handleEscalateSubmit} className="space-y-4 text-xs">
          <p className="text-[#2D3B42]/70">
            Escalating ticket <strong className="text-[#EF4623] font-mono">{escalateTicketId}</strong> will bump its priority to <strong>Urgent</strong> and page the on-call Tier 2 engineering team.
          </p>

          <div>
            <label className="block text-[#2D3B42] font-semibold mb-1">Business Impact / Escalation Reason</label>
            <Input
              placeholder="e.g. Blocking entire sprint release / Production outage"
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEscalateTicketId(null)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit">
              Confirm Escalation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Close Ticket Modal */}
      <Modal
        isOpen={!!closeTicketId}
        onClose={() => setCloseTicketId(null)}
        title="Resolve & Close IT Ticket"
      >
        <form onSubmit={handleCloseSubmit} className="space-y-4 text-xs">
          <p className="text-[#2D3B42]/70">
            Resolving ticket <strong className="text-[#EF4623] font-mono">{closeTicketId}</strong> will mark the issue as resolved and commit resolution notes to the audit log.
          </p>

          <div>
            <label className="block text-[#2D3B42] font-semibold mb-1">Resolution Notes</label>
            <textarea
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#2D3B42]/15 text-[#2D3B42] text-xs focus:outline-none focus:border-[#EF4623] focus:ring-2 focus:ring-[#EF4623]/20 shadow-sm min-h-[80px]"
              placeholder="e.g. Configured display settings and updated Thunderbolt drivers..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCloseTicketId(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Confirm Resolution
            </Button>
          </div>
        </form>
      </Modal>

      {/* JIRA Cloud Sandbox Modal */}
      <JiraCloudModal
        isOpen={!!activeJiraTicket}
        ticket={activeJiraTicket}
        onClose={() => setActiveJiraTicket(null)}
        onEscalate={(id) => {
          escalateTicket(id, 'Escalated from Jira Cloud Sandbox View');
          if (activeJiraTicket) setActiveJiraTicket({ ...activeJiraTicket, priority: 'Urgent' });
          if (selectedTicket && selectedTicket.id === id) setSelectedTicket({ ...selectedTicket, priority: 'Urgent' });
        }}
        onResolve={(id, notes) => {
          closeTicket(id, notes);
          if (activeJiraTicket) setActiveJiraTicket({ ...activeJiraTicket, status: 'Resolved' });
          if (selectedTicket && selectedTicket.id === id) setSelectedTicket({ ...selectedTicket, status: 'Resolved' });
        }}
      />

      {/* ServiceNow Sandbox Modal */}
      <ServiceNowModal
        isOpen={!!activeServiceNowTicket}
        ticket={activeServiceNowTicket}
        onClose={() => setActiveServiceNowTicket(null)}
        onEscalate={(id) => {
          escalateTicket(id, 'Escalated from ServiceNow Sandbox View');
          if (activeServiceNowTicket) setActiveServiceNowTicket({ ...activeServiceNowTicket, priority: 'Urgent' });
          if (selectedTicket && selectedTicket.id === id) setSelectedTicket({ ...selectedTicket, priority: 'Urgent' });
        }}
        onResolve={(id, notes) => {
          closeTicket(id, notes);
          if (activeServiceNowTicket) setActiveServiceNowTicket({ ...activeServiceNowTicket, status: 'Resolved' });
          if (selectedTicket && selectedTicket.id === id) setSelectedTicket({ ...selectedTicket, status: 'Resolved' });
        }}
      />
    </div>
  );
};
