import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Card } from '../atoms/Card';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { Settings, Sliders, Database, Shield, KeyRound, Server, UserCheck, ExternalLink, Check, RefreshCw } from 'lucide-react';

export const SandboxSettings: React.FC = () => {
  const {
    retrievalThreshold,
    setRetrievalThreshold,
    currentUser,
    switchUser,
    jiraBaseUrl,
    setJiraBaseUrl,
    serviceNowBaseUrl,
    setServiceNowBaseUrl
  } = useAppStore();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testJiraKey, setTestJiraKey] = useState('KAN-101');
  const [testServiceNowKey, setTestServiceNowKey] = useState('INC0089211');

  const userProfiles = [
    { email: 'alex.chen@corp.internal', name: 'Alex Chen', role: 'employee' as const, note: 'Standard Employee (VPN & Hardware queries)' },
    { email: 'david.kim@corp.internal', name: 'David Kim', role: 'employee' as const, note: 'Locked Active Directory Account (MFA Unlock test)' },
    { email: 'elena.rostova@corp.internal', name: 'Elena Rostova', role: 'agent' as const, note: 'IT Service Desk Agent (Triage Queue & Close tools)' },
    { email: 'marcus.vance@corp.internal', name: 'Marcus Vance', role: 'approver' as const, note: 'Engineering Director & Designated HITL Approver' },
    { email: 'admin@corp.internal', name: 'Sarah Jenkins (IT Admin)', role: 'it_admin' as const, note: 'Full IT Admin & Evaluation Access' }
  ];

  const handleTestJiraRedirect = () => {
    window.open(`${jiraBaseUrl}/browse/${testJiraKey}`, '_blank', 'noopener,noreferrer');
  };

  const handleTestServiceNowRedirect = () => {
    window.open(`${serviceNowBaseUrl}/nav_to.do?uri=incident.do?sys_id=${testServiceNowKey}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-serif text-[#2D3B42] flex items-center gap-2 tracking-tight">
          <Settings className="w-5 h-5 text-[#EF4623]" />
          Integration Sandbox & System Thresholds
        </h2>
        <p className="text-xs text-[#2D3B42]/60 mt-0.5">
          Tune LangGraph decision boundaries, vector thresholds, and configure JIRA & ServiceNow redirection hosts.
        </p>
      </div>

      {/* JIRA & ServiceNow URL Redirection Configuration */}
      <Card variant="glass" padding="lg" className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#2D3B42]/10">
          <div className="flex items-center gap-2 text-sm font-bold text-[#2D3B42]">
            <ExternalLink className="w-4 h-4 text-[#EF4623]" />
            <span>JIRA & ServiceNow Redirection Host Endpoints</span>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 font-semibold">
            LIVE SYNC
          </span>
        </div>

        <p className="text-xs text-[#2D3B42]/70 leading-relaxed">
          When tickets are raised or inspected in chat or ticket hub, HelpDeskGenie dynamically routes users to your enterprise JIRA or ServiceNow endpoints:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#2D3B42]">
              JIRA Base Instance URL
            </label>
            <Input
              value={jiraBaseUrl}
              onChange={(e) => setJiraBaseUrl(e.target.value)}
              placeholder="https://your-domain.atlassian.net or https://jira.corp.internal"
            />
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-[#2D3B42]/60 font-mono text-[10px]">Example: {jiraBaseUrl}/browse/KAN-101</span>
              <button
                onClick={handleTestJiraRedirect}
                className="px-2.5 py-1 rounded-[30px] text-[11px] font-semibold bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 border border-sky-500/30 flex items-center gap-1 transition-all"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Test Link</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#2D3B42]">
              ServiceNow Base Instance URL
            </label>
            <Input
              value={serviceNowBaseUrl}
              onChange={(e) => setServiceNowBaseUrl(e.target.value)}
              placeholder="https://dev12345.service-now.com or https://servicenow.corp.internal"
            />
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-[#2D3B42]/60 font-mono text-[10px] truncate max-w-[200px]">Example: {serviceNowBaseUrl}/incident.do</span>
              <button
                onClick={handleTestServiceNowRedirect}
                className="px-2.5 py-1 rounded-[30px] text-[11px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 border border-emerald-500/30 flex items-center gap-1 transition-all"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Test Link</span>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Simulated User Persona Switcher */}
      <Card variant="glass" padding="lg" className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#2D3B42] pb-2 border-b border-[#2D3B42]/10">
          <UserCheck className="w-4 h-4 text-[#EF4623]" />
          <span>Active Test Persona / Identity (Section 8)</span>
        </div>

        <p className="text-xs text-[#2D3B42]/70 leading-relaxed">
          Switch test accounts to simulate different Active Directory states, MFA tokens, and permissions:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {userProfiles.map(p => (
            <button
              key={p.email}
              onClick={() => switchUser(p.email)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                currentUser.email === p.email
                  ? 'bg-[#EF4623]/10 border-[#EF4623]/40 shadow-sm shadow-[#EF4623]/10'
                  : 'bg-white/80 border-[#2D3B42]/10 hover:border-[#EF4623]/30 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <strong className="text-xs text-[#2D3B42]">{p.name}</strong>
                {currentUser.email === p.email && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EF4623] text-white font-bold">Active</span>
                )}
              </div>
              <p className="text-[11px] text-[#EF4623] font-mono mt-0.5">{p.email}</p>
              <p className="text-[11px] text-[#2D3B42]/60 mt-1">{p.note}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* RAG Retrieval Confidence Threshold */}
      <Card variant="glass" padding="lg" className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#2D3B42]/10">
          <div className="flex items-center gap-2 text-sm font-bold text-[#2D3B42]">
            <Sliders className="w-4 h-4 text-[#EF4623]" />
            <span>Pinecone Vector Confidence Threshold</span>
          </div>
          <span className="text-sm font-bold text-[#EF4623] font-mono px-2.5 py-0.5 rounded-xl bg-[#EF4623]/10 border border-[#EF4623]/25">
            {(retrievalThreshold * 100).toFixed(0)}%
          </span>
        </div>

        <p className="text-xs text-[#2D3B42]/80 leading-relaxed">
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
            className="w-full h-2 bg-[#2D3B42]/15 rounded-lg appearance-none cursor-pointer accent-[#EF4623]"
          />
          <div className="flex justify-between text-[11px] text-[#2D3B42]/60">
            <span>0.40 (Permissive)</span>
            <span className="text-[#EF4623] font-semibold">0.65 (Spec Recommended)</span>
            <span>0.90 (Ultra-Conservative)</span>
          </div>
        </div>
      </Card>

      {/* Integrations Status */}
      <Card variant="glass" padding="lg" className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#2D3B42] pb-2 border-b border-[#2D3B42]/10">
          <Server className="w-4 h-4 text-[#EF4623]" />
          <span>External IT Systems & Sandbox Connectors</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/80 border border-[#2D3B42]/10 shadow-sm flex items-center justify-between">
            <div>
              <span className="font-bold text-[#2D3B42] block">JIRA REST API (Cloud)</span>
              <span className="text-[#2D3B42]/60 text-[11px] font-mono">{jiraBaseUrl}</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 font-semibold text-[10px]">
              CONNECTED
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 border border-[#2D3B42]/10 shadow-sm flex items-center justify-between">
            <div>
              <span className="font-bold text-[#2D3B42] block">ServiceNow Table API</span>
              <span className="text-[#2D3B42]/60 text-[11px] font-mono">{serviceNowBaseUrl}</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 font-semibold text-[10px]">
              CONNECTED
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 border border-[#2D3B42]/10 shadow-sm flex items-center justify-between">
            <div>
              <span className="font-bold text-[#2D3B42] block">Active Directory / ldap3</span>
              <span className="text-[#2D3B42]/60 text-[11px]">Domain: ad-sandbox.corp.internal</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 font-semibold text-[10px]">
              ACTIVE
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 border border-[#2D3B42]/10 shadow-sm flex items-center justify-between">
            <div>
              <span className="font-bold text-[#2D3B42] block">Twilio Verify MFA Hook</span>
              <span className="text-[#2D3B42]/60 text-[11px]">SMS OTP / Push Token Service</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 font-semibold text-[10px]">
              ACTIVE
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
