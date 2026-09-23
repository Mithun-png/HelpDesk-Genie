import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { 
  ShieldCheck, 
  Clock, 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  ExternalLink,
  FileText,
  AlertTriangle,
  Send
} from 'lucide-react';
import { identityService } from '../../services/identityService';

export const ApprovalsInbox: React.FC = () => {
  const { currentUser, resolveHITLApproval, auditLogs } = useAppStore();
  const [justificationNote, setJustificationNote] = useState<Record<string, string>>({});
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const pendingRequests = identityService.getPendingApprovalsForApprover(currentUser.email);

  const handleApprove = (hitlId: string) => {
    resolveHITLApproval(hitlId, true);
  };

  const handleReject = (hitlId: string) => {
    resolveHITLApproval(hitlId, false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-amber-500/15 text-amber-700 border border-amber-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-serif text-[#2D3B42] flex items-center gap-2 tracking-tight">
                Human-in-the-Loop (HITL) Approvals Inbox
              </h2>
              <p className="text-xs text-[#2D3B42]/60 mt-0.5">
                Authorized managerial sign-off portal for elevated permissions and sensitive identity actions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={pendingRequests.length > 0 ? 'warning' : 'success'} className="px-3 py-1 font-mono text-xs">
            {pendingRequests.length} Pending Approval{pendingRequests.length === 1 ? '' : 's'}
          </Badge>
        </div>
      </div>

      {/* Approver Policy Notice */}
      <div className="p-4 rounded-3xl bg-amber-50/85 border border-amber-500/30 text-xs text-[#2D3B42] flex items-start gap-3 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-[#2D3B42]">
            Enterprise Zero-Trust Policy Active (Section 5.2 & 7.4)
          </p>
          <p className="text-[#2D3B42]/70 leading-relaxed">
            Elevated resource accesses (e.g. AWS Production DB, Snowflake Governance) are never auto-provisioned. Approvers must verify requester identity, business justification, and required access window before signing off. All decisions are immutably signed to the PostgreSQL audit trail.
          </p>
        </div>
      </div>

      {/* Pending Approval List */}
      {pendingRequests.length === 0 ? (
        <Card className="p-12 text-center bg-white/85 border border-[#2D3B42]/10 rounded-3xl shadow-sm">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#2D3B42]">Inbox Clean & Compliant</h3>
          <p className="text-xs text-[#2D3B42]/60 max-w-md mx-auto mt-1">
            There are currently no outstanding HITL approval checkpoints requiring your sign-off.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingRequests.map(req => (
            <Card 
              key={req.id}
              className="p-5 bg-white/90 border border-[#2D3B42]/10 hover:border-[#EF4623]/35 rounded-3xl shadow-sm transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2D3B42]/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-[#EF4623]/10 text-[#EF4623] border border-[#EF4623]/25">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#EF4623]">{req.id}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-sm font-bold text-[#2D3B42]">{req.resourceName || 'Privileged Access'}</span>
                    </div>
                    <p className="text-xs text-[#2D3B42]/70">
                      Requested by <strong className="text-[#2D3B42]">{req.userName || req.userId}</strong> ({req.userId})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="text-[11px] text-[#2D3B42]/60 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    {new Date(req.requestedAt).toLocaleTimeString()}
                  </span>
                  <Badge variant="warning" className="text-[10px]">Pending Sign-Off</Badge>
                </div>
              </div>

              {/* Justification & Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#FDF1EE]/70 border border-[#2D3B42]/10 text-xs">
                <div>
                  <span className="text-[#2D3B42]/60 block text-[10px] uppercase font-bold tracking-wider">Business Justification</span>
                  <p className="text-[#2D3B42] mt-1">{req.justification || 'Incident investigation and telemetry verification.'}</p>
                </div>
                <div>
                  <span className="text-[#2D3B42]/60 block text-[10px] uppercase font-bold tracking-wider">Designated Approver</span>
                  <p className="text-[#EF4623] mt-1 font-semibold">{req.approverName || req.approverId}</p>
                </div>
                <div>
                  <span className="text-[#2D3B42]/60 block text-[10px] uppercase font-bold tracking-wider">Verification Protocol</span>
                  <p className="text-[#2D3B42] mt-1 font-mono">{req.verificationMethod || 'Manager_Signoff'}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <div className="text-[11px] text-[#2D3B42]/60 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Approving will commit transaction under: <strong>{currentUser.email}</strong></span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleReject(req.id)}
                    leftIcon={<XCircle className="w-4 h-4 text-rose-500" />}
                    className="rounded-[30px]"
                  >
                    Reject Access
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleApprove(req.id)}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    className="shadow-md shadow-emerald-500/20 rounded-[30px]"
                  >
                    Sign & Approve Access
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
