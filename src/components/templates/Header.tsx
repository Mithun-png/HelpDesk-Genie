import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { 
  Bot, 
  ShieldCheck, 
  ChevronDown, 
  User, 
  Lock, 
  KeyRound, 
  LogOut, 
  Check, 
  AlertCircle,
  ExternalLink,
  Shield
} from 'lucide-react';
import { Avatar } from '../atoms/Avatar';
import { Badge } from '../atoms/Badge';
import { Modal } from '../atoms/Modal';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { identityService } from '../../services/identityService';

export const Header: React.FC = () => {
  const { currentUser, switchUser, loginLDAP, jwtToken, tickets } = useAppStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [ldapEmail, setLdapEmail] = useState('');
  const [ldapPassword, setLdapPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const pendingApprovalsCount = identityService.getPendingApprovalsForApprover(currentUser.email).length;
  const allUsers = identityService.getAllUsers();

  const handleSwitchUser = (email: string) => {
    switchUser(email);
    setIsDropdownOpen(false);
  };

  const handleLdapLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const res = loginLDAP(ldapEmail, ldapPassword);
    if (res.success) {
      setIsLoginModalOpen(false);
      setLdapEmail('');
      setLdapPassword('');
    } else {
      setLoginError(res.error || 'Authentication failed against Active Directory sandbox.');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'it_admin': return 'purple';
      case 'approver': return 'warning';
      case 'agent': return 'info';
      default: return 'default';
    }
  };

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-violet-500/15 bg-[#09080E]/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 border border-violet-400/30">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-slate-100 tracking-tight">
              HelpDesk<span className="text-violet-400">Genie</span>
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-bold uppercase tracking-wide">
              Enterprise AI Layer
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            LangGraph State Machine • RAG Hallucination-Controlled • Zero-Trust HITL
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Approvals notification pill if approver/admin */}
        {(currentUser.role === 'approver' || currentUser.role === 'it_admin') && pendingApprovalsCount > 0 && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold animate-pulse">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{pendingApprovalsCount} Pending HITL Sign-off</span>
          </div>
        )}

        {/* User Persona & Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-violet-500/20 transition-all text-left group"
          >
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-xs font-bold text-slate-200 block leading-tight">{currentUser.name}</span>
                <Badge variant={getRoleBadgeVariant(currentUser.role)} className="text-[9px] py-0 px-1.5">
                  {currentUser.role}
                </Badge>
              </div>
              <span className="text-[10px] text-violet-400 font-mono">{currentUser.email}</span>
            </div>
            
            <Avatar type={currentUser.role === 'it_admin' ? 'assistant' : 'user'} size="sm" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#120F24] border border-violet-500/25 shadow-2xl shadow-black/80 backdrop-blur-2xl p-2 z-50 text-xs space-y-2">
              <div className="px-2.5 py-1.5 border-b border-white/5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Switch Testing Persona (RBAC)
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Switch between Employees, IT Triage Agents, Approvers, and Admin
                </p>
              </div>

              <div className="space-y-1 max-h-56 overflow-y-auto">
                {allUsers.map(user => {
                  const isSelected = user.email === currentUser.email;
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleSwitchUser(user.email)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl transition-all text-left ${
                        isSelected 
                          ? 'bg-violet-600/25 text-violet-200 border border-violet-500/40' 
                          : 'hover:bg-white/5 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-200">{user.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 text-violet-300 font-mono">
                            {user.role}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">{user.email}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-white/5 pt-1.5 flex flex-col gap-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsLoginModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-slate-300 hover:bg-white/5 hover:text-slate-100 transition-colors text-left"
                >
                  <KeyRound className="w-3.5 h-3.5 text-violet-400" />
                  <span>AD/LDAP Sandbox Login & JWT Token</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AD/LDAP Login & JWT Modal */}
      <Modal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="Active Directory / LDAP Authentication (Section 8)"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-400">
            Employees authenticate against the enterprise Active Directory domain (<code className="text-violet-300">corp.internal</code>). Upon successful binding, a signed JWT session token is attached automatically to every chat turn and ticket.
          </p>

          <form onSubmit={handleLdapLoginSubmit} className="space-y-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Corporate User ID / Email</label>
              <Input
                type="email"
                placeholder="e.g. alex.chen@corp.internal"
                value={ldapEmail}
                onChange={(e) => setLdapEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">AD Password</label>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={ldapPassword}
                onChange={(e) => setLdapPassword(e.target.value)}
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsLoginModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Authenticate via LDAP
              </Button>
            </div>
          </form>

          {/* Active JWT Session inspector */}
          <div className="mt-4 pt-3 border-t border-violet-500/15 space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-violet-400 uppercase tracking-wider block">
              Active JWT Session Token
            </span>
            <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 font-mono text-[10px] text-slate-400 break-all">
              {jwtToken}
            </div>
          </div>
        </div>
      </Modal>
    </header>
  );
};
