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
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Human-in-the-Loop (HITL) Approvals Inbox
              </h2>
              <p className="text-xs text-slate-400">
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
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 to-violet-950/20 border border-amber-500/20 text-xs text-slate-300 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-200">
            Enterprise Zero-Trust Policy Active (Section 5.2 & 7.4)
          </p>
          <p className="text-slate-400 leading-relaxed">
            Elevated resource accesses (e.g. AWS Production DB, Snowflake Governance) are never auto-provisioned. Approvers must verify requester identity, business justification, and required access window before signing off. All decisions are immutably signed to the PostgreSQL audit trail.
          </p>
        </div>
      </div>

      {/* Pending Approval List */}
      {pendingRequests.length === 0 ? (
        <Card className="p-12 text-center bg-[#0F0C1B]/80 border-violet-500/15">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-200">Inbox Clean & Compliant</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            There are currently no outstanding HITL approval checkpoints requiring your sign-off.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingRequests.map(req => (
            <Card 
              key={req.id}
              className="p-5 bg-gradient-to-br from-[#120E24] to-[#0D0B18] border-violet-500/20 hover:border-violet-500/40 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-violet-500/15 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/30">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-violet-400">{req.id}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-sm font-bold text-slate-100">{req.resourceName || 'Privileged Access'}</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Requested by <strong className="text-slate-200">{req.userName || req.userId}</strong> ({req.userId})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {new Date(req.requestedAt).toLocaleTimeString()}
                  </span>
                  <Badge variant="warning" className="text-[10px]">Pending Sign-Off</Badge>
                </div>
              </div>

              {/* Justification & Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-black/30 border border-white/5 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Business Justification</span>
                  <p className="text-slate-200 mt-1">{req.justification || 'Incident investigation and telemetry verification.'}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Designated Approver</span>
                  <p className="text-violet-300 mt-1 font-semibold">{req.approverName || req.approverId}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Verification Protocol</span>
                  <p className="text-slate-200 mt-1 font-mono">{req.verificationMethod || 'Manager_Signoff'}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Approving will commit transaction under: <strong>{currentUser.email}</strong></span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleReject(req.id)}
                    leftIcon={<XCircle className="w-4 h-4" />}
                  >
                    Reject Access
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleApprove(req.id)}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    className="shadow-md shadow-emerald-500/20"
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
