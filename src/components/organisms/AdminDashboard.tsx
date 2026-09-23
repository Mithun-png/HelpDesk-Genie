import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Badge } from '../atoms/Badge';
import { Modal } from '../atoms/Modal';
import { identityService } from '../../services/identityService';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  AlertOctagon, 
  ShieldCheck, 
  UserPlus, 
  Mail, 
  Copy, 
  Check, 
  ArrowUpRight,
  Clock,
  Layers,
  Sparkles,
  Building
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { tickets, auditLogs, currentUser, addAuditLog } = useAppStore();
  const [allUsers, setAllUsers] = useState(() => identityService.getAllUsers());
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'agent' | 'approver' | 'it_admin'>('agent');
  const [inviteDept, setInviteDept] = useState('IT Operations');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Compute ITSM KPI Metrics
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status === 'Open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'In Progress').length;
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

  const autoRemediated = auditLogs.filter(l => l.eventType === 'TOOL_EXECUTION' && l.toolName === 'unlock_ad_account' && l.status === 'SUCCESS').length;
  const escalations = auditLogs.filter(l => l.eventType === 'ESCALATION').length;
  const autoRemediationRate = totalTickets > 0 ? Math.round(((resolvedTickets + autoRemediated) / (totalTickets + autoRemediated)) * 100) : 85;

  const categoryCounts = [
    { name: 'VPN & Network', count: tickets.filter(t => t.category === 'VPN & Network').length },
    { name: 'Identity & Access', count: tickets.filter(t => t.category === 'Identity & Access').length },
    { name: 'Hardware & Peripherals', count: tickets.filter(t => t.category === 'Hardware & Peripherals').length },
    { name: 'Software & Tools', count: tickets.filter(t => t.category === 'Software & Tools').length },
  ];

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    const invite = identityService.createInvite(
      inviteEmail,
      inviteName,
      inviteRole,
      inviteDept,
      currentUser.email
    );

    setAllUsers(identityService.getAllUsers());
    setIsInviteModalOpen(false);
    setInviteEmail('');
    setInviteName('');

    addAuditLog({
      id: `AUDIT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.email,
      userRole: currentUser.role,
      eventType: 'TOOL_EXECUTION',
      toolName: 'admin_invite_user',
      inputPayload: { invitedEmail: invite.email, role: invite.role },
      outputPayload: { success: true, inviteId: invite.id },
      status: 'SUCCESS',
      confidenceScore: 1.0,
      executionDurationMs: 25
    });
  };

  const copyTokenToClipboard = (token: string, key: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(key);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#EF4623]/10 text-[#EF4623] border border-[#EF4623]/25 shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-serif text-[#2D3B42] flex items-center gap-2 tracking-tight">
                ITSM Analytics & Admin Governance
              </h2>
              <p className="text-xs text-[#2D3B42]/60 mt-0.5">
                Service Desk metrics, auto-remediation telemetry, and role-based provisioning
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsInviteModalOpen(true)}
          leftIcon={<UserPlus className="w-4 h-4" />}
          className="shadow-lg shadow-[#EF4623]/20 rounded-[30px]"
        >
          Invite Agent / Approver
        </Button>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card variant="glass" padding="md" className="rounded-3xl hover:border-[#EF4623]/35 transition-all shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#2D3B42]/60 uppercase tracking-wider font-semibold">
            <span>Total Tickets Processed</span>
            <Building className="w-4 h-4 text-[#EF4623]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#2D3B42] font-serif tracking-tight">{totalTickets}</span>
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +18% MoM
            </span>
          </div>
          <div className="mt-3 text-[11px] text-[#2D3B42]/60 flex items-center justify-between border-t border-[#2D3B42]/10 pt-2.5">
            <span>Open: <strong className="text-[#2D3B42]">{openTickets}</strong></span>
            <span>Resolved: <strong className="text-emerald-700">{resolvedTickets}</strong></span>
          </div>
        </Card>

        <Card variant="glass" padding="md" className="rounded-3xl hover:border-[#EF4623]/35 transition-all shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#2D3B42]/60 uppercase tracking-wider font-semibold">
            <span>Auto-Remediation Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700 font-serif tracking-tight">{autoRemediationRate}%</span>
            <span className="text-[11px] text-emerald-700 font-semibold">HITL Compliant</span>
          </div>
          <div className="mt-3 text-[11px] text-[#2D3B42]/60 flex items-center justify-between border-t border-[#2D3B42]/10 pt-2.5">
            <span>AD Unlocks: <strong className="text-[#2D3B42]">{autoRemediated}</strong></span>
            <span>Escalations: <strong className="text-[#EF4623]">{escalations}</strong></span>
          </div>
        </Card>

        <Card variant="glass" padding="md" className="rounded-3xl hover:border-[#EF4623]/35 transition-all shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#2D3B42]/60 uppercase tracking-wider font-semibold">
            <span>Recurring Issue Pattern</span>
            <AlertOctagon className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-serif text-amber-800 truncate">GlobalProtect VPN</span>
          </div>
          <div className="mt-3 text-[11px] text-[#2D3B42]/60 border-t border-[#2D3B42]/10 pt-2.5">
            <span>42% of tickets linked to macOS 15.1 network extension</span>
          </div>
        </Card>

        <Card variant="glass" padding="md" className="rounded-3xl hover:border-[#EF4623]/35 transition-all shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#2D3B42]/60 uppercase tracking-wider font-semibold">
            <span>Active Enterprise Users</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#2D3B42] font-serif tracking-tight">{allUsers.length}</span>
            <span className="text-[11px] text-sky-700 font-mono">AD Synced</span>
          </div>
          <div className="mt-3 text-[11px] text-[#2D3B42]/60 flex items-center justify-between border-t border-[#2D3B42]/10 pt-2.5">
            <span>Agents: <strong className="text-[#2D3B42]">{allUsers.filter(u => u.role === 'agent').length}</strong></span>
            <span>Approvers: <strong className="text-[#2D3B42]">{allUsers.filter(u => u.role === 'approver').length}</strong></span>
          </div>
        </Card>
      </div>

      {/* Category Breakdown & Recurring Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card variant="glass" padding="lg" className="lg:col-span-6 space-y-3">
          <h3 className="text-xs font-bold text-[#2D3B42] uppercase tracking-wider">
            Ticket Distribution by IT Category
          </h3>
          <div className="space-y-3">
            {categoryCounts.map(cat => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#2D3B42] font-medium">{cat.name}</span>
                  <span className="text-[#2D3B42]/60 font-mono">{cat.count} tickets</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#2D3B42]/10 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-[#EF4623] to-orange-400"
                    style={{ width: `${Math.max(15, (cat.count / totalTickets) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="glass" padding="lg" className="lg:col-span-6 space-y-3">
          <h3 className="text-xs font-bold text-[#2D3B42] uppercase tracking-wider">
            Recurring Issue Detection (AI Clustering)
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="p-3.5 rounded-2xl bg-white border border-[#2D3B42]/10 flex items-start gap-3 shadow-sm">
              <div className="p-1.5 rounded-xl bg-[#EF4623]/10 text-[#EF4623] font-bold">1</div>
              <div>
                <h4 className="font-semibold text-[#2D3B42]">GlobalProtect VPN Gateway Timeout</h4>
                <p className="text-[11px] text-[#2D3B42]/70 mt-0.5 leading-relaxed">
                  Frequent occurrence on home mesh Wi-Fi routers. Resolved automatically via KB-1001 runbook grounding.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-[#2D3B42]/10 flex items-start gap-3 shadow-sm">
              <div className="p-1.5 rounded-xl bg-[#EF4623]/10 text-[#EF4623] font-bold">2</div>
              <div>
                <h4 className="font-semibold text-[#2D3B42]">ActiveSync Mobile AD Lockout</h4>
                <p className="text-[11px] text-[#2D3B42]/70 mt-0.5 leading-relaxed">
                  Occurs when corporate password changes while mobile mail client caches expired credentials. Remediated via Twilio OTP.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Admin Invite Management & User Directory (Section 8.2) */}
      <Card variant="glass" padding="lg" className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#2D3B42]/10 pb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold font-serif text-[#2D3B42] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#EF4623]" />
              Enterprise User Directory & Admin Invites (Section 8.2)
            </h3>
            <p className="text-xs text-[#2D3B42]/60 mt-0.5">
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
              <tr className="border-b border-[#2D3B42]/10 text-[#2D3B42]/60 uppercase text-[10px] tracking-wider bg-[#2D3B42]/5">
                <th className="py-2.5 px-3">User & Email</th>
                <th className="py-2.5 px-3">Assigned Role</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Auth Source</th>
                <th className="py-2.5 px-3">AD Lock Status</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D3B42]/10 text-[#2D3B42]">
              {allUsers.map(user => (
                <tr key={user.id} className="hover:bg-[#EF4623]/5 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-semibold text-[#2D3B42] block">{user.name}</span>
                    <span className="font-mono text-[11px] text-[#EF4623]">{user.email}</span>
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant={user.role === 'it_admin' ? 'purple' : user.role === 'approver' ? 'warning' : user.role === 'agent' ? 'info' : 'default'} className="text-[10px]">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-[#2D3B42]/70">{user.department}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-[#2D3B42]/60">{user.authSource}</td>
                  <td className="py-3 px-3">
                    {user.isLocked ? (
                      <Badge variant="danger" className="text-[10px]">LOCKED</Badge>
                    ) : (
                      <Badge variant="success" className="text-[10px]">Active</Badge>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[11px] text-emerald-700 font-semibold">
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
          <p className="text-[#2D3B42]/70 leading-relaxed">
            Provision individual credentials for IT triage agents and managers so every ticket closure and HITL approval is strictly accountable in the audit log.
          </p>

          <div>
            <label className="block text-[#2D3B42] font-semibold mb-1">Full Name</label>
            <Input
              placeholder="e.g. Jordan Taylor"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[#2D3B42] font-semibold mb-1">Corporate Email Address</label>
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
              <label className="block text-[#2D3B42] font-semibold mb-1">Assigned Role</label>
              <select
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#2D3B42]/15 text-[#2D3B42] text-xs focus:outline-none focus:border-[#EF4623] shadow-sm"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
              >
                <option value="agent">IT Agent (Triage & Resolution)</option>
                <option value="approver">IT Approver (Managerial Sign-off)</option>
                <option value="it_admin">IT Administrator (Full Access)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#2D3B42] font-semibold mb-1">Department</label>
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
