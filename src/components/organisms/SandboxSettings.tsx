import React from 'react';
import { useAppStore } from '../../store/appStore';
import { Card } from '../atoms/Card';
import { Toggle } from '../atoms/Toggle';
import { Button } from '../atoms/Button';
import { Settings, Sliders, Database, Shield, KeyRound, Server, UserCheck } from 'lucide-react';

export const SandboxSettings: React.FC = () => {
  const {
    retrievalThreshold,
    setRetrievalThreshold,
    sandboxMode,
    setSandboxMode,
    currentUser,
    switchUser
  } = useAppStore();

  const userProfiles = [
    { email: 'alex.chen@corp.internal', name: 'Alex Chen', role: 'employee' as const, note: 'Standard Employee (VPN & Hardware queries)' },
    { email: 'david.kim@corp.internal', name: 'David Kim', role: 'employee' as const, note: 'Locked Active Directory Account (MFA Unlock test)' },
    { email: 'elena.rostova@corp.internal', name: 'Elena Rostova', role: 'agent' as const, note: 'IT Service Desk Agent (Triage Queue & Close tools)' },
    { email: 'marcus.vance@corp.internal', name: 'Marcus Vance', role: 'approver' as const, note: 'Engineering Director & Designated HITL Approver' },
    { email: 'admin@corp.internal', name: 'Sarah Jenkins (IT Admin)', role: 'it_admin' as const, note: 'Full IT Admin & Evaluation Access' }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-violet-400" />
          Integration Sandbox & System Thresholds
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Tune LangGraph decision boundaries, vector thresholds, and mock/live service connectors.
        </p>
      </div>

      {/* Simulated User Persona Switcher */}
      <Card variant="glass" padding="lg" className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-100 pb-2 border-b border-violet-500/15">
          <UserCheck className="w-4 h-4 text-violet-400" />
          <span>Active Test Persona / Identity (Section 8)</span>
        </div>

        <p className="text-xs text-slate-400">
          Switch test accounts to simulate different Active Directory states, MFA tokens, and permissions:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {userProfiles.map(p => (
            <button
              key={p.email}
              onClick={() => switchUser(p.email)}
              className={`p-3 rounded-xl border text-left transition-all ${
                currentUser.email === p.email
                  ? 'bg-violet-600/20 border-violet-500/60 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                  : 'bg-[#0B0916] border-violet-500/15 hover:border-violet-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <strong className="text-xs text-slate-100">{p.name}</strong>
                {currentUser.email === p.email && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500 text-white font-bold">Active</span>
                )}
              </div>
              <p className="text-[11px] text-violet-300 font-mono mt-0.5">{p.email}</p>
              <p className="text-[10px] text-slate-400 mt-1">{p.note}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* RAG Retrieval Confidence Threshold */}
      <Card variant="glass" padding="lg" className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-violet-500/15">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
            <Sliders className="w-4 h-4 text-violet-400" />
            <span>Pinecone Vector Confidence Threshold</span>
          </div>
          <span className="text-sm font-bold text-violet-300 font-mono px-2.5 py-0.5 rounded-lg bg-violet-500/20 border border-violet-500/30">
            {(retrievalThreshold * 100).toFixed(0)}%
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Per Section 5.1 & 7.2 of the project spec, if Pinecone similarity falls below this threshold, the agent 
          <strong> will NOT guess or hallucinate</strong>. Instead, it triggers the <em>Clarify / Escalate Node</em>.
        </p>

        <div className="space-y-2">
          <input
            type="range"
            min="0.40"
            max="0.90"
            step="0.05"
            value={retrievalThreshold}
            onChange={(e) => setRetrievalThreshold(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
          />
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>0.40 (Permissive)</span>
            <span className="text-violet-400 font-medium">0.65 (Spec Recommended)</span>
            <span>0.90 (Ultra-Conservative)</span>
          </div>
        </div>
      </Card>

      {/* Integrations Status */}
      <Card variant="glass" padding="lg" className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-100 pb-2 border-b border-violet-500/15">
          <Server className="w-4 h-4 text-violet-400" />
          <span>External IT Systems & Sandbox Connectors</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#0B0916] border border-violet-500/20 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-200 block">JIRA REST API</span>
              <span className="text-slate-500 text-[11px]">Sandbox: dev-jira.company.internal</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold text-[10px]">
              CONNECTED
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#0B0916] border border-violet-500/20 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-200 block">ServiceNow Table API</span>
              <span className="text-slate-500 text-[11px]">Sandbox: dev98124.service-now.com</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold text-[10px]">
              CONNECTED
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#0B0916] border border-violet-500/20 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-200 block">Active Directory / ldap3</span>
              <span className="text-slate-500 text-[11px]">Domain: ad-sandbox.corp.internal</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold text-[10px]">
              ACTIVE
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#0B0916] border border-violet-500/20 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-200 block">Twilio Verify MFA Hook</span>
              <span className="text-slate-500 text-[11px]">SMS OTP / Push Token Service</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold text-[10px]">
              ACTIVE
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
