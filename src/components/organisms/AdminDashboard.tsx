import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Modal } from '../atoms/Modal';
import { 
  BarChart3, 
  Users, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  Shield, 
  TrendingUp, 
  AlertOctagon, 
  Mail, 
  Building,
  Key,
  Copy,
  Check
} from 'lucide-react';
import { identityService } from '../../services/identityService';

export const AdminDashboard: React.FC = () => {
  const { currentUser, tickets, auditLogs, sendInvite } = useAppStore();
  
  // Invite Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'agent' | 'approver' | 'it_admin'>('agent');
  const [inviteDept, setInviteDept] = useState('IT Service Desk');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Derived Analytics
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length;
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
  
  const autoRemediated = auditLogs.filter(a => a.toolName === 'unlock_account' || a.toolName === 'reset_password').length;
  const escalations = auditLogs.filter(a => a.eventType === 'ESCALATION').length;
  const autoRemediationRate = (autoRemediated + escalations) > 0 
    ? Math.round((autoRemediated / (autoRemediated + escalations)) * 100) 
    : 88;

  // Category distribution
  const categories = ['VPN & Network', 'Identity & Access', 'Hardware & Peripherals', 'Software & Tools'];
  const categoryCounts = categories.map(cat => ({
    name: cat,
    count: tickets.filter(t => t.category === cat).length
  }));

  const allUsers = identityService.getAllUsers();
  const allInvites = identityService.getAllInvites();

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;

    sendInvite(inviteEmail.trim(), inviteName.trim(), inviteRole, inviteDept);
    setIsInviteModalOpen(false);
    setInviteEmail('');
    setInviteName('');
  };

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                ITSM Analytics & Admin Governance
              </h2>
              <p className="text-xs text-slate-400">
                Service Desk metrics, auto-remediation telemetry, and role-based provisioning
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsInviteModalOpen(true)}
          leftIcon={<UserPlus className="w-4 h-4" />}
          className="shadow-md shadow-violet-600/30"
        >
          Invite Agent / Approver
        </Button>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-gradient-to-br from-[#120E24] to-[#0D0B18] border-violet-500/20">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Tickets Processed</span>
            <Building className="w-4 h-4 text-violet-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-100">{totalTickets}</span>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +18% MoM
            </span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-white/5 pt-2">
            <span>Open: <strong>{openTickets}</strong></span>
            <span>Resolved: <strong>{resolvedTickets}</strong></span>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-[#120E24] to-[#0D0B18] border-emerald-500/20">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Auto-Remediation Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{autoRemediationRate}%</span>
            <span className="text-[11px] text-emerald-300 font-semibold">HITL Compliant</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-white/5 pt-2">
            <span>AD Unlocks: <strong>{autoRemediated}</strong></span>
            <span>Escalations: <strong>{escalations}</strong></span>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-[#120E24] to-[#0D0B18] border-amber-500/20">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Recurring Issue Pattern</span>
            <AlertOctagon className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-amber-300 truncate">GlobalProtect VPN</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 border-t border-white/5 pt-2">
            <span>42% of tickets linked to macOS 15.1 network extension</span>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-[#120E24] to-[#0D0B18] border-indigo-500/20">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Enterprise Users</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-100">{allUsers.length}</span>
            <span className="text-[11px] text-indigo-300 font-mono">AD Synced</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-white/5 pt-2">
            <span>Agents: <strong>{allUsers.filter(u => u.role === 'agent').length}</strong></span>
            <span>Approvers: <strong>{allUsers.filter(u => u.role === 'approver').length}</strong></span>
          </div>
        </Card>
      </div>

      {/* Category Breakdown & Recurring Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-6 p-5 bg-[#0F0C1B]/90 border-violet-500/15 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Ticket Distribution by IT Category
          </h3>
          <div className="space-y-3">
            {categoryCounts.map(cat => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{cat.name}</span>
                  <span className="text-slate-400 font-mono">{cat.count} tickets</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                    style={{ width: `${Math.max(15, (cat.count / totalTickets) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-6 p-5 bg-[#0F0C1B]/90 border-violet-500/15 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Recurring Issue Detection (AI Clustering)
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-500/20 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-violet-500/20 text-violet-300 font-bold">1</div>
              <div>
                <h4 className="font-semibold text-slate-200">GlobalProtect VPN Gateway Timeout</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Frequent occurrence on home mesh Wi-Fi routers. Resolved automatically via KB-1001 runbook grounding.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-500/20 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-violet-500/20 text-violet-300 font-bold">2</div>
              <div>
                <h4 className="font-semibold text-slate-200">ActiveSync Mobile AD Lockout</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Occurs when corporate password changes while mobile mail client caches expired credentials. Remediated via Twilio OTP.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Admin Invite Management & User Directory (Section 8.2) */}
      <Card className="p-5 bg-[#0F0C1B]/90 border-violet-500/15 space-y-4">
        <div className="flex items-center justify-between border-b border-violet-500/15 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-400" />
              Enterprise User Directory & Admin Invites (Section 8.2)
            </h3>
            <p className="text-xs text-slate-400">
              Active Directory accounts & provisioned IT staff credentials with individual audit attribution
            </p>
          </div>

          <Badge variant="purple" className="font-mono text-xs">
            {allUsers.length} Registered Accounts
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-violet-500/15 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">User & Email</th>
                <th className="py-2.5 px-3">Assigned Role</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Auth Source</th>
                <th className="py-2.5 px-3">AD Lock Status</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-500/10 text-slate-300 font-normal">
              {allUsers.map(user => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-200 block">{user.name}</span>
                    <span className="font-mono text-[11px] text-violet-400">{user.email}</span>
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant={user.role === 'it_admin' ? 'purple' : user.role === 'approver' ? 'warning' : user.role === 'agent' ? 'info' : 'default'} className="text-[10px]">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-slate-400">{user.department}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-400">{user.authSource}</td>
                  <td className="py-3 px-3">
                    {user.isLocked ? (
                      <Badge variant="danger" className="text-[10px]">LOCKED</Badge>
                    ) : (
                      <Badge variant="success" className="text-[10px]">Active</Badge>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[11px] text-emerald-400 font-semibold">
                    {user.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite New IT Agent or Approver (Admin Flow)"
      >
        <form onSubmit={handleCreateInvite} className="space-y-4 text-xs">
          <p className="text-slate-400">
            Provision individual credentials for IT triage agents and managers so every ticket closure and HITL approval is strictly accountable in the audit log.
          </p>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
            <Input
              placeholder="e.g. Jordan Taylor"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Corporate Email Address</label>
            <Input
              type="email"
              placeholder="e.g. jordan.taylor@corp.internal"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Assigned Role</label>
              <select
                className="w-full px-3 py-2 rounded-xl bg-[#09080E] border border-violet-500/25 text-slate-100 text-xs focus:outline-none focus:border-violet-500"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
              >
                <option value="agent">IT Agent (Triage & Resolution)</option>
                <option value="approver">IT Approver (Managerial Sign-off)</option>
                <option value="it_admin">IT Administrator (Full Access)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Department</label>
              <Input
                placeholder="e.g. Tier 2 Support"
                value={inviteDept}
                onChange={(e) => setInviteDept(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" leftIcon={<Mail className="w-4 h-4" />}>
              Dispatch Provisioning Invite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
