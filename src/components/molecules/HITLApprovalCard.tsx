import React, { useState } from 'react';
import { HITLRequest } from '../../types';
import { ShieldCheck, Lock, Check, X, Smartphone, UserCheck, AlertCircle } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';

export interface HITLApprovalCardProps {
  request: HITLRequest;
  onSubmitOTP: (hitlId: string, otp: string) => void;
  onResolveApproval: (hitlId: string, approved: boolean) => void;
}

export const HITLApprovalCard: React.FC<HITLApprovalCardProps> = ({
  request,
  onSubmitOTP,
  onResolveApproval
}) => {
  const [otpInput, setOtpInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOTPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitOTP(request.id, otpInput.trim());
      setIsSubmitting(false);
    }, 400);
  };

  const reqType = request.type || (request as any).action_type || (request.verificationMethod === 'Twilio_SMS_OTP' ? 'reset_password' : 'grant_access_request');
  const isOTPFlow = reqType === 'unlock_account' || 
                    reqType === 'reset_password' || 
                    request.verificationMethod === 'Twilio_SMS_OTP' ||
                    !!request.otpCode || 
                    !!(request as any).otp_hint;

  const isPasswordReset = reqType === 'reset_password' || (request as any).action_type === 'reset_password';
  const resourceDisplay = request.resourceName || (request as any).resource_name || 'Production AWS Snowflake Analytics DB';
  const approverDisplay = request.approverName || request.approverId || (request as any).approver_id || 'Marcus Vance (Cloud Lead)';
  const justificationDisplay = request.justification || 'Production incident triage & data compliance audit';
  const otpDisplayCode = request.otpCode || (request as any).otp_hint || '749216';

  return (
    <div className="mt-3 p-4 rounded-3xl border border-amber-500/30 bg-amber-50/85 backdrop-blur-xl shadow-sm text-[#2D3B42]">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-800 border border-amber-500/30">
            {isOTPFlow ? <Smartphone className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#2D3B42]">
                {isOTPFlow 
                  ? (isPasswordReset ? 'Password Reset – Two-Factor Verification' : 'AD Account Unlock – Two-Factor Verification')
                  : 'Manager Sign-Off Required'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 border border-amber-500/30 font-mono font-bold">
                {request.id || 'HITL-CHECKPOINT'}
              </span>
            </div>
            <p className="text-xs text-[#2D3B42]/70 mt-0.5">
              {isOTPFlow 
                ? 'High-risk credential action gated by Zero-Trust IT Security Policy. Enter the one-time SMS verification code.'
                : `Elevated access to ${resourceDisplay} requires authorized managerial sign-off.`}
            </p>
          </div>
        </div>
      </div>

      {isOTPFlow ? (
        <form onSubmit={handleOTPSubmit} className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                placeholder={`Enter 6-digit OTP (e.g. ${otpDisplayCode})`}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                maxLength={6}
                leftIcon={<Lock className="w-4 h-4 text-amber-600" />}
                className="font-mono text-center tracking-widest text-base border-amber-500/40 focus:border-[#EF4623] text-[#2D3B42] placeholder:text-[#2D3B42]/40"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={otpInput.length < 4}
              className="bg-amber-600 hover:bg-amber-700 text-white border-amber-600/40 shadow-md shadow-amber-600/20 px-5 rounded-[30px]"
              rightIcon={<ShieldCheck className="w-4 h-4" />}
            >
              Verify OTP & Proceed
            </Button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-amber-900 bg-white/90 px-3.5 py-2 rounded-2xl border border-amber-500/30 shadow-sm">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Twilio SMS dispatched OTP: <strong className="font-mono text-amber-800 font-bold tracking-wider">{otpDisplayCode}</strong></span>
            </span>
            <button 
              type="button" 
              onClick={() => setOtpInput(otpDisplayCode)}
              className="underline hover:text-[#EF4623] font-semibold text-amber-800 ml-2"
            >
              Auto-fill OTP
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-white/90 border border-[#2D3B42]/10 space-y-1.5 text-xs text-[#2D3B42] shadow-sm">
            <div className="flex justify-between">
              <span className="text-[#2D3B42]/60">Target Resource:</span>
              <span className="font-semibold text-[#2D3B42]">{resourceDisplay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#2D3B42]/60">Assigned Approver:</span>
              <span className="font-semibold text-[#EF4623] font-mono">{approverDisplay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#2D3B42]/60">Justification:</span>
              <span className="text-[#2D3B42]">{justificationDisplay}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onResolveApproval(request.id, false)}
              leftIcon={<X className="w-3.5 h-3.5 text-rose-500" />}
              className="hover:border-rose-500/50 rounded-[30px]"
            >
              Reject Request
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => onResolveApproval(request.id, true)}
              leftIcon={<Check className="w-3.5 h-3.5" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500/30 rounded-[30px]"
            >
              Approve & Grant Access
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
