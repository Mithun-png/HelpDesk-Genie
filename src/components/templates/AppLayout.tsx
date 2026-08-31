import React from 'react';
import { useAppStore, NavigationTab } from '../../store/appStore';
import { Header } from './Header';
import { 
  MessageSquare, 
  Layers, 
  BookOpen, 
  ShieldCheck, 
  Shield, 
  BarChart3, 
  Settings, 
  Sparkles,
  LayoutDashboard
} from 'lucide-react';
import { identityService } from '../../services/identityService';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTab, setActiveTab, currentUser, tickets, auditLogs } = useAppStore();

  const userTickets = ticketServiceTickets();
  function ticketServiceTickets() {
    if (currentUser.role === 'employee') {
      return tickets.filter(t => t.createdBy.toLowerCase() === currentUser.email.toLowerCase());
    }
    return tickets;
  }

  const openTicketsCount = userTickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length;
  const pendingApprovalsCount = identityService.getPendingApprovalsForApprover(currentUser.email).length;

  const allNavItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string; roles: string[] }[] = [
    { id: 'chat', label: 'IT Assistant', icon: <MessageSquare className="w-4 h-4" />, roles: ['employee', 'agent', 'approver', 'it_admin'] },
    { id: 'tickets', label: currentUser.role === 'employee' ? 'My Tickets' : 'Ticket Hub', icon: <Layers className="w-4 h-4" />, badge: openTicketsCount > 0 ? `${openTicketsCount}` : undefined, roles: ['employee', 'agent', 'approver', 'it_admin'] },
    { id: 'knowledge', label: 'Knowledge Base', icon: <BookOpen className="w-4 h-4" />, roles: ['employee', 'agent', 'approver', 'it_admin'] },
    { id: 'eval', label: 'Iteration 3 Eval', icon: <BarChart3 className="w-4 h-4" />, badge: '0% Hallucination', roles: ['employee', 'agent', 'approver', 'it_admin'] },
    { id: 'approvals', label: 'HITL Approvals', icon: <ShieldCheck className="w-4 h-4" />, badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : undefined, roles: ['approver', 'it_admin'] },
    { id: 'audit', label: 'Security Audit', icon: <Shield className="w-4 h-4" />, badge: `${auditLogs.length}`, roles: ['employee', 'agent', 'approver', 'it_admin'] },
    { id: 'admin', label: 'ITSM Analytics', icon: <LayoutDashboard className="w-4 h-4" />, roles: ['it_admin'] },
    { id: 'settings', label: 'Sandbox Config', icon: <Settings className="w-4 h-4" />, roles: ['it_admin'] },
  ];

  const visibleNavItems = allNavItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="min-h-screen bg-[#09080E] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Subtle glowing ambient gradient blobs in background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <Header />

      {/* Body with Sidebar & Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Glassy Sidebar Navigation */}
        <aside className="w-64 border-r border-violet-500/15 bg-[#0B0916]/80 backdrop-blur-xl p-3.5 hidden md:flex flex-col justify-between flex-shrink-0">
          <div className="space-y-1.5">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Navigation</span>
              <span className="font-mono text-[9px] text-violet-400">{currentUser.role.toUpperCase()}</span>
            </div>

            {visibleNavItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600/30 to-purple-600/20 text-violet-200 border border-violet-500/40 shadow-sm shadow-violet-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-violet-400' : 'text-slate-400 group-hover:text-violet-300'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                      isActive 
                        ? 'bg-violet-500 text-white' 
                        : item.id === 'approvals'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-white/5 text-slate-400 border border-white/5'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Card / System Spec Info */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#141029] to-[#0D0B18] border border-violet-500/20 text-xs space-y-2">
            <div className="flex items-center gap-2 text-violet-300 font-bold text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Spec 1.0 Compliant</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Active Directory LDAP login • Max 2-turn clarify limit • Static Approver Routing • Full Audit Trail.
            </p>
          </div>
        </aside>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0916]/95 border-t border-violet-500/20 backdrop-blur-xl flex justify-around p-2">
          {visibleNavItems.slice(0, 5).map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`p-2 rounded-xl flex flex-col items-center gap-1 text-[10px] font-medium ${
                activeTab === item.id ? 'text-violet-400' : 'text-slate-400'
              }`}
            >
              {item.icon}
              <span className="truncate max-w-[60px]">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Main Workspace Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 mb-16 md:mb-0">
          {children}
        </main>
      </div>
    </div>
  );
};
