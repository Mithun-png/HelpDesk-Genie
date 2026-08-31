import { HITLRequest, UserAccount, AdminInvite, StaticApproverMapping } from '../types';

export const STATIC_APPROVER_MAP: StaticApproverMapping[] = [
  {
    resourceKeyword: 'aws',
    approverEmail: 'marcus.vance@corp.internal',
    approverName: 'Marcus Vance (Cloud Lead)',
    department: 'Cloud Infrastructure',
    slaHours: 4
  },
  {
    resourceKeyword: 'snowflake',
    approverEmail: 'data-governance@corp.internal',
    approverName: 'Elena Rostova (Data Governance Lead)',
    department: 'Data Platforms',
    slaHours: 6
  },
  {
    resourceKeyword: 'database',
    approverEmail: 'marcus.vance@corp.internal',
    approverName: 'Marcus Vance (DBA Lead)',
    department: 'Database Operations',
    slaHours: 4
  },
  {
    resourceKeyword: 'ad_admin',
    approverEmail: 'it-security-lead@corp.internal',
    approverName: 'Security Operations Approver',
    department: 'IT Security',
    slaHours: 2
  },
  {
    resourceKeyword: 'vpn_tier2',
    approverEmail: 'network-ops@corp.internal',
    approverName: 'Network Ops Approver',
    department: 'Network Services',
    slaHours: 8
  }
];

export class IdentityService {
  private users: Map<string, UserAccount> = new Map([
    // Employees (AD/LDAP Sandbox)
    ['alex.chen@corp.internal', {
      id: 'USR-1001',
      email: 'alex.chen@corp.internal',
      name: 'Alex Chen',
      role: 'employee',
      department: 'Frontend Engineering',
      manager: 'sarah.jenkins@corp.internal',
      mobile: '+1 (555) 349-8812',
      isLocked: false,
      authSource: 'AD_LDAP',
      status: 'active'
    }],
    ['david.kim@corp.internal', {
      id: 'USR-1002',
      email: 'david.kim@corp.internal',
      name: 'David Kim',
      role: 'employee',
      department: 'Backend Platform',
      manager: 'marcus.vance@corp.internal',
      mobile: '+1 (555) 912-4421',
      isLocked: true, // Currently locked in AD
      authSource: 'AD_LDAP',
      status: 'active'
    }],
    ['priya.sharma@corp.internal', {
      id: 'USR-1003',
      email: 'priya.sharma@corp.internal',
      name: 'Priya Sharma',
      role: 'employee',
      department: 'Product Management',
      manager: 'sarah.jenkins@corp.internal',
      mobile: '+1 (555) 441-2099',
      isLocked: false,
      authSource: 'AD_LDAP',
      status: 'active'
    }],

    // IT Agents (Admin Invited)
    ['elena.rostova@corp.internal', {
      id: 'AGT-2001',
      email: 'elena.rostova@corp.internal',
      name: 'Elena Rostova',
      role: 'agent',
      department: 'Tier 2 IT Service Desk',
      manager: 'sarah.jenkins@corp.internal',
      mobile: '+1 (555) 883-1120',
      isLocked: false,
      authSource: 'ADMIN_INVITE',
      status: 'active'
    }],

    // IT Approvers / Managers (Admin Invited)
    ['marcus.vance@corp.internal', {
      id: 'APR-3001',
      email: 'marcus.vance@corp.internal',
      name: 'Marcus Vance',
      role: 'approver',
      department: 'Engineering Director / IT Approver',
      manager: 'vp-eng@corp.internal',
      mobile: '+1 (555) 777-9090',
      isLocked: false,
      authSource: 'ADMIN_INVITE',
      status: 'active'
    }],

    // IT System Administrator
    ['admin@corp.internal', {
      id: 'ADM-0001',
      email: 'admin@corp.internal',
      name: 'Sarah Jenkins (IT Admin)',
      role: 'it_admin',
      department: 'IT Infrastructure & Security',
      manager: 'cio@corp.internal',
      mobile: '+1 (555) 101-2020',
      isLocked: false,
      authSource: 'ADMIN_INVITE',
      status: 'active'
    }]
  ]);

  private invites: AdminInvite[] = [
    {
      id: 'INV-101',
      email: 'jordan.taylor@corp.internal',
      name: 'Jordan Taylor',
      role: 'agent',
      department: 'IT Service Desk',
      invitedBy: 'admin@corp.internal',
      invitedAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'pending',
      inviteToken: 'tok_agt_84920'
    },
    {
      id: 'INV-102',
      email: 'devops-lead@corp.internal',
      name: 'Liam Vance',
      role: 'approver',
      department: 'DevOps & SRE',
      invitedBy: 'admin@corp.internal',
      invitedAt: new Date(Date.now() - 172800000).toISOString(),
      status: 'pending',
      inviteToken: 'tok_apr_99182'
    }
  ];

  private activePendingHITL: Map<string, HITLRequest> = new Map([
    ['HITL-88219', {
      id: 'HITL-88219',
      type: 'grant_access_request',
      userId: 'alex.chen@corp.internal',
      userName: 'Alex Chen',
      resourceName: 'Production AWS Snowflake Analytics DB',
      approverId: 'marcus.vance@corp.internal',
      approverName: 'Marcus Vance (Cloud Lead)',
      status: 'pending_approval',
      verificationMethod: 'Manager_Signoff',
      justification: 'Quarterly compliance telemetry audit and pipeline diagnostics',
      requestedAt: new Date(Date.now() - 3600000).toISOString(),
      ticketId: 'KAN-104'
    }]
  ]);

  public registerHITLRequest(req: HITLRequest): void {
    if (!req.id) return;
    const existing = this.activePendingHITL.get(req.id);
    this.activePendingHITL.set(req.id, {
      ...existing,
      ...req,
      status: req.status || existing?.status || 'pending_otp',
      verificationMethod: req.verificationMethod || (req.type === 'grant_access_request' ? 'Manager_Signoff' : 'Twilio_SMS_OTP'),
      otpCode: req.otpCode || '749216',
      requestedAt: req.requestedAt || new Date().toISOString()
    });
  }

  // Section 8.1 - Employee AD/LDAP Login & JWT Session Issuance
  public authenticateLDAP(email: string, _password?: string): { success: boolean; user?: UserAccount; token?: string; error?: string } {
    const normalized = email.toLowerCase().trim();
    const user = this.users.get(normalized);

    if (!user) {
      return { success: false, error: `Active Directory account "${normalized}" not found in sandbox domain corp.internal` };
    }

    if (user.isLocked) {
      return { 
        success: false, 
        error: `Active Directory account is LOCKED due to excessive bad password attempts. Please request an account unlock through HelpDeskGenie.` 
      };
    }

    // Deterministic simulated JWT
    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.helpdeskgenie.${btoa(JSON.stringify({ sub: user.id, email: user.email, role: user.role, iat: Date.now() }))}`;
    return { success: true, user, token };
  }

  // Section 8.2 - Admin Invite Provisioning
  public createInvite(email: string, name: string, role: 'agent' | 'approver' | 'it_admin', department: string, invitedBy: string): AdminInvite {
    const invite: AdminInvite = {
      id: `INV-${Math.floor(100 + Math.random() * 900)}`,
      email: email.toLowerCase().trim(),
      name,
      role,
      department,
      invitedBy,
      invitedAt: new Date().toISOString(),
      status: 'pending',
      inviteToken: `tok_${role}_${Math.floor(10000 + Math.random() * 90000)}`
    };

    this.invites.push(invite);

    // Also register user as invited account
    const newUserId = role === 'agent' ? `AGT-${Math.floor(2000 + Math.random() * 8000)}` : role === 'approver' ? `APR-${Math.floor(3000 + Math.random() * 7000)}` : `ADM-${Math.floor(1000 + Math.random() * 9000)}`;
    this.users.set(invite.email, {
      id: newUserId,
      email: invite.email,
      name: invite.name,
      role: invite.role,
      department: invite.department,
      manager: 'cio@corp.internal',
      mobile: '+1 (555) 000-1122',
      isLocked: false,
      authSource: 'ADMIN_INVITE',
      status: 'invited'
    });

    return invite;
  }

  public getAllInvites(): AdminInvite[] {
    return [...this.invites];
  }

  public getAllUsers(): UserAccount[] {
    return Array.from(this.users.values());
  }

  public getUser(email: string): UserAccount | undefined {
    return this.users.get(email.toLowerCase().trim());
  }

  // Section 7.4 - Static Approver Lookup
  public lookupApprover(resourceName: string, requesterUserId?: string): { email: string; name: string; department: string } {
    const lower = resourceName.toLowerCase();
    const match = STATIC_APPROVER_MAP.find(m => lower.includes(m.resourceKeyword));
    if (match) {
      return {
        email: match.approverEmail,
        name: match.approverName,
        department: match.department
      };
    }

    // Default to user manager
    const requester = requesterUserId ? this.users.get(requesterUserId) : undefined;
    const managerEmail = requester?.manager || 'marcus.vance@corp.internal';
    const managerUser = this.users.get(managerEmail);

    return {
      email: managerEmail,
      name: managerUser ? `${managerUser.name} (Direct Manager)` : 'Marcus Vance (IT Approver)',
      department: managerUser?.department || 'Operations'
    };
  }

  // Section 5.2 - Human In The Loop (Twilio OTP & Manager Signoff)
  public requestOTP(userId: string, actionType: 'reset_password' | 'unlock_account'): { hitlId: string; otpHint: string; mobileNumber: string } {
    const user = this.users.get(userId.toLowerCase().trim()) || {
      id: 'USR-TMP',
      email: userId,
      name: userId.split('@')[0],
      role: 'employee' as const,
      department: 'Operations',
      manager: 'sarah.jenkins@corp.internal',
      mobile: '+1 (555) 349-8812',
      isLocked: true,
      authSource: 'AD_LDAP' as const,
      status: 'active' as const
    };

    const hitlId = `HITL-${Math.floor(10000 + Math.random() * 90000)}`;
    const otpCode = '749216';

    const hitlReq: HITLRequest = {
      id: hitlId,
      type: actionType,
      userId: user.email,
      userName: user.name,
      status: 'pending_otp',
      verificationMethod: 'Twilio_SMS_OTP',
      otpCode,
      requestedAt: new Date().toISOString()
    };

    this.activePendingHITL.set(hitlId, hitlReq);

    return {
      hitlId,
      otpHint: '749216',
      mobileNumber: user.mobile || '+1 (555) 349-8812'
    };
  }

  public verifyOTP(hitlId: string, enteredCode: string): { success: boolean; message: string; request?: HITLRequest } {
    let req = this.activePendingHITL.get(hitlId);
    if (!req) {
      // Auto-create fallback entry if hitlId was dynamically created by external service
      req = {
        id: hitlId,
        type: 'reset_password',
        userId: 'alex.chen@corp.internal',
        userName: 'Alex Chen',
        status: 'pending_otp',
        verificationMethod: 'Twilio_SMS_OTP',
        otpCode: '749216',
        requestedAt: new Date().toISOString()
      };
      this.activePendingHITL.set(hitlId, req);
    }

    const trimmedCode = enteredCode.trim();
    if (trimmedCode === req.otpCode || trimmedCode === '749216' || trimmedCode === '123456' || trimmedCode.length === 6) {
      req.status = 'completed';
      req.completedAt = new Date().toISOString();

      // Unlock AD account if it was an unlock action or user was locked
      const user = this.users.get(req.userId.toLowerCase().trim());
      if (user) {
        user.isLocked = false;
      }

      const actionTitle = req.type === 'unlock_account' ? 'account unlock' : 'password reset';
      return {
        success: true,
        message: req.type === 'unlock_account' 
          ? `Active Directory account for ${req.userName || req.userId} has been successfully unlocked and bad password count cleared in Active Directory sandbox.`
          : `Password reset verified! A temporary password reset link and single-use credentials were dispatched to ${req.userId} via secure SMS & email channel.`,
        request: req
      };
    }

    return { 
      success: false, 
      message: 'Incorrect verification code. Please enter the 6-digit OTP code sent to your registered device (Hint: 749216).',
      request: req 
    };
  }

  public requestAccessApproval(userId: string, resourceName: string, approverId?: string, justification?: string, ticketId?: string): { hitlId: string; approver: string; approverName: string } {
    const user = this.users.get(userId.toLowerCase().trim());
    const assigned = approverId ? { email: approverId, name: this.users.get(approverId.toLowerCase().trim())?.name || approverId, department: 'Designated Approver' } : this.lookupApprover(resourceName, userId);

    const hitlId = `HITL-${Math.floor(10000 + Math.random() * 90000)}`;
    const hitlReq: HITLRequest = {
      id: hitlId,
      type: 'grant_access_request',
      userId,
      userName: user?.name || userId,
      resourceName,
      approverId: assigned.email,
      approverName: assigned.name,
      justification: justification || 'Incident remediation and cross-team project delivery',
      status: 'pending_approval',
      verificationMethod: 'Manager_Signoff',
      requestedAt: new Date().toISOString(),
      ticketId
    };

    this.activePendingHITL.set(hitlId, hitlReq);

    return {
      hitlId,
      approver: assigned.email,
      approverName: assigned.name
    };
  }

  public resolveAccessApproval(hitlId: string, approved: boolean, approverEmail: string, approverName: string): { success: boolean; message: string; request?: HITLRequest } {
    let req = this.activePendingHITL.get(hitlId);
    if (!req) {
      // Create fallback request entry so approval never crashes if originated from backend API
      req = {
        id: hitlId,
        type: 'grant_access_request',
        userId: 'alex.chen@corp.internal',
        userName: 'Alex Chen',
        resourceName: 'Production AWS Snowflake Analytics DB',
        approverId: approverEmail || 'marcus.vance@corp.internal',
        approverName: approverName || 'Marcus Vance',
        status: 'pending_approval',
        verificationMethod: 'Manager_Signoff',
        requestedAt: new Date().toISOString(),
        justification: 'Production triage and data telemetry verification'
      };
      this.activePendingHITL.set(hitlId, req);
    }

    req.status = approved ? 'approved' : 'rejected';
    req.completedAt = new Date().toISOString();
    req.approvedBy = `${approverName} (${approverEmail})`;

    const resourceName = req.resourceName || 'Production Access';
    return {
      success: true,
      message: approved 
        ? `Access to ${resourceName} granted to ${req.userName || req.userId} by ${approverName}. Provisioned to Active Directory Security Group.`
        : `Access request for ${resourceName} was denied by ${approverName}.`,
      request: req
    };
  }

  public getPendingRequests(): HITLRequest[] {
    return Array.from(this.activePendingHITL.values()).filter(r => r.status === 'pending_otp' || r.status === 'pending_approval');
  }

  public getPendingApprovalsForApprover(approverEmail: string): HITLRequest[] {
    const norm = approverEmail.toLowerCase().trim();
    return Array.from(this.activePendingHITL.values()).filter(r => 
      r.status === 'pending_approval' && (r.approverId?.toLowerCase() === norm || norm === 'admin@corp.internal' || norm === 'marcus.vance@corp.internal' || norm === 'sarah.jenkins@corp.internal')
    );
  }
}

export const identityService = new IdentityService();

