import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Ticket, PlatformType, TicketPriority, TicketStatus } from '../../types';
import { TicketSummaryCard } from '../molecules/TicketSummaryCard';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Modal } from '../atoms/Modal';
import { Badge } from '../atoms/Badge';
import { Plus, Search, Filter, Layers, CheckCircle2, ShieldAlert, ArrowUpRight, User, ExternalLink } from 'lucide-react';
import { ticketService } from '../../services/ticketService';

export const TicketingPortal: React.FC = () => {
  const { tickets, currentUser, addTicket, escalateTicket, closeTicket } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'All' | PlatformType>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | TicketStatus>('All');
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

  // Selected Ticket detail state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = platformFilter === 'All' || t.platform === platformFilter;
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesScope = scopeFilter === 'all_tickets' || t.createdBy.toLowerCase() === currentUser.email.toLowerCase();
    
    return matchesSearch && matchesPlatform && matchesStatus && matchesScope;
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
  };

  const handleEscalateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalateTicketId) return;
    escalateTicket(escalateTicketId, escalateReason);
    setEscalateTicketId(null);
    setEscalateReason('');
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-violet-400" />
            IT Service Desk Ticket Hub
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Unified ticketing dashboard synchronized with sandbox JIRA REST (<code className="text-violet-300">KAN</code> project) and ServiceNow Table APIs
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Scope toggle */}
          <div className="flex items-center p-1 rounded-xl bg-black/40 border border-violet-500/20 text-xs">
            <button
              onClick={() => setScopeFilter('my_tickets')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                scopeFilter === 'my_tickets' 
                  ? 'bg-violet-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              My Tickets ({tickets.filter(t => t.createdBy.toLowerCase() === currentUser.email.toLowerCase()).length})
            </button>
            <button
              onClick={() => setScopeFilter('all_tickets')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                scopeFilter === 'all_tickets' 
                  ? 'bg-violet-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Team Queue ({tickets.length})
            </button>
          </div>

          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-md shadow-violet-600/30"
          >
            Create IT Ticket
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3.5 rounded-2xl bg-[#120F20]/80 border border-violet-500/15 backdrop-blur-xl">
        <div className="sm:col-span-6">
          <Input
            placeholder="Search by ticket ID (e.g. KAN-101, INC0089211), title, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-violet-400" />}
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as any)}
            className="w-full px-3 py-2.5 rounded-xl bg-[#09080E] border border-violet-500/25 text-slate-200 text-xs focus:outline-none focus:border-violet-500 transition-colors"
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
            className="w-full px-3 py-2.5 rounded-xl bg-[#09080E] border border-violet-500/25 text-slate-200 text-xs focus:outline-none focus:border-violet-500 transition-colors"
          >
            <option value="All">All Lifecycle Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Ticket List */}
      <div className="grid grid-cols-1 gap-3">
        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#120F20]/50 border border-violet-500/10">
            <Layers className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <h3 className="text-sm font-semibold text-slate-300">No tickets found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search criteria or create a new IT ticket.
            </p>
          </div>
        ) : (
          filteredTickets.map(ticket => (
            <TicketSummaryCard
              key={ticket.id}
              ticket={ticket}
              onEscalate={(id) => setEscalateTicketId(id)}
              onClose={(id) => closeTicket(id, 'Closed by user from Ticket Hub')}
              onClick={() => setSelectedTicket(ticket)}
            />
          ))
        )}
      </div>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New IT Service Desk Ticket"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-500/20 text-slate-300 flex items-center gap-2">
            <User className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <span>Ticket will be opened under your AD account: <strong className="text-slate-100">{currentUser.email}</strong></span>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Issue Title</label>
            <Input
              placeholder="e.g. MacBook cannot connect to conference room display"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Detailed Description</label>
            <textarea
              className="w-full px-3 py-2 rounded-xl bg-[#09080E] border border-violet-500/25 text-slate-100 text-xs focus:outline-none focus:border-violet-500 min-h-[90px]"
              placeholder="Describe symptoms, steps taken, hardware model, error logs..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Platform</label>
              <select
                className="w-full px-3 py-2 rounded-xl bg-[#09080E] border border-violet-500/25 text-slate-100 text-xs focus:outline-none focus:border-violet-500"
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value as any)}
              >
                <option value="JIRA">JIRA Cloud (KAN)</option>
                <option value="ServiceNow">ServiceNow Table</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Priority</label>
              <select
                className="w-full px-3 py-2 rounded-xl bg-[#09080E] border border-violet-500/25 text-slate-100 text-xs focus:outline-none focus:border-violet-500"
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
              <label className="block text-slate-300 font-semibold mb-1">Category</label>
              <select
                className="w-full px-3 py-2 rounded-xl bg-[#09080E] border border-violet-500/25 text-slate-100 text-xs focus:outline-none focus:border-violet-500"
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
          <p className="text-slate-400">
            Escalating ticket <strong className="text-violet-300 font-mono">{escalateTicketId}</strong> will bump its priority to <strong>Urgent</strong> and page the on-call Tier 2 engineering team.
          </p>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Business Impact / Escalation Reason</label>
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
    </div>
  );
};
