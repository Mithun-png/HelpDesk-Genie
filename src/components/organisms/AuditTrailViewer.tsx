import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { AuditLog } from '../../types';
import { AuditLogEntry } from '../molecules/AuditLogEntry';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { Shield, Search, Download, Filter, FileText, CheckCircle2, Lock } from 'lucide-react';

export const AuditTrailViewer: React.FC = () => {
  const { auditLogs } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.toolName && log.toolName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesEvent = eventTypeFilter === 'All' || log.eventType === eventTypeFilter;
    const matchesStatus = statusFilter === 'All' || log.status === statusFilter;

    return matchesSearch && matchesEvent && matchesStatus;
  });

  const exportAuditLogsJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `HelpDeskGenie_Audit_Trail_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif text-[#2D3B42] flex items-center gap-2 tracking-tight">
            <Shield className="w-5 h-5 text-[#EF4623]" />
            Security & Compliance Audit Trail
          </h2>
          <p className="text-xs text-[#2D3B42]/60 mt-0.5">
            Immutable log of all intent classifications, tool executions, HITL MFA approvals, and escalations
          </p>
        </div>

        <Button
          variant="glass"
          onClick={exportAuditLogsJSON}
          leftIcon={<Download className="w-4 h-4 text-[#EF4623]" />}
          className="border-[#2D3B42]/15 rounded-[30px]"
        >
          Export Compliance JSON
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3.5 rounded-3xl bg-white/85 border border-[#2D3B42]/10 backdrop-blur-xl shadow-sm">
        <div className="sm:col-span-6">
          <Input
            placeholder="Search by Log ID, User, or Tool Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-[#EF4623]" />}
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="w-full rounded-2xl bg-white border border-[#2D3B42]/15 px-3.5 py-2.5 text-xs text-[#2D3B42] focus:outline-none focus:border-[#EF4623] shadow-sm"
          >
            <option value="All">All Event Types</option>
            <option value="INTENT_CLASSIFICATION">INTENT_CLASSIFICATION</option>
            <option value="TOOL_EXECUTION">TOOL_EXECUTION</option>
            <option value="HITL_VERIFICATION">HITL_VERIFICATION (OTP)</option>
            <option value="HITL_APPROVAL">HITL_APPROVAL (Manager)</option>
            <option value="RAG_RETRIEVAL">RAG_RETRIEVAL</option>
            <option value="ESCALATION">ESCALATION</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-2xl bg-white border border-[#2D3B42]/15 px-3.5 py-2.5 text-xs text-[#2D3B42] focus:outline-none focus:border-[#EF4623] shadow-sm"
          >
            <option value="All">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="BLOCKED_PENDING_HITL">BLOCKED_PENDING_HITL</option>
            <option value="DENIED">DENIED</option>
            <option value="ESCALATED">ESCALATED</option>
          </select>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-2.5">
        {filteredLogs.map(log => (
          <AuditLogEntry key={log.id} log={log} />
        ))}

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 border border-dashed border-[#2D3B42]/20 rounded-3xl bg-white/40">
            <p className="text-sm text-[#2D3B42]/60">No audit records found matching query.</p>
          </div>
        )}
      </div>
    </div>
  );
};
