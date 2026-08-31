export type IntentCategory = 
  | 'informational' 
  | 'actionable_safe' 
  | 'actionable_needs_approval' 
  | 'ambiguous';

export type TicketStatus = 'Open' | 'In Progress' | 'Pending Approval' | 'Resolved' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type PlatformType = 'JIRA' | 'ServiceNow';

export type UserRole = 'employee' | 'agent' | 'approver' | 'it_admin';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  manager: string;
  mobile: string;
  isLocked: boolean;
  avatarUrl?: string;
  authSource: 'AD_LDAP' | 'ADMIN_INVITE';
  status: 'active' | 'invited' | 'suspended';
}

export interface AdminInvite {
  id: string;
  email: string;
  name: string;
  role: 'agent' | 'approver' | 'it_admin';
  department: string;
  invitedBy: string;
  invitedAt: string;
  status: 'pending' | 'accepted' | 'expired';
  inviteToken: string;
}

export interface Ticket {
  id: string;
  platform: PlatformType;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  createdBy: string;
  createdByName?: string;
  assignedTo?: string;
  approverId?: string;
  createdAt: string;
  updatedAt: string;
  resolutionNotes?: string;
  conversationId?: string;
  metadata?: Record<string, unknown>;
}

export interface KBArticle {
  id: string;
  title: string;
  category: 'VPN & Network' | 'Identity & Access' | 'Hardware & Peripherals' | 'Software & Tools' | 'Email & SaaS';
  content: string;
  summary: string;
  sourceUrl: string;
  lastUpdated: string;
  tags: string[];
  resolvedTicketCount: number;
}

export interface KBSourceCitation {
  id: string;
  title: string;
  snippet: string;
  similarityScore: number;
  url: string;
  category: string;
}

export interface HITLRequest {
  id: string;
  type: 'reset_password' | 'unlock_account' | 'grant_access_request';
  userId: string;
  userName?: string;
  resourceName?: string;
  approverId?: string;
  approverName?: string;
  status: 'pending_otp' | 'pending_approval' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  verificationMethod?: 'Twilio_SMS_OTP' | 'Microsoft_Authenticator' | 'Manager_Signoff';
  otpCode?: string;
  requestedAt: string;
  completedAt?: string;
  approvedBy?: string;
  justification?: string;
  ticketId?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userRole?: UserRole;
  eventType: 'INTENT_CLASSIFICATION' | 'TOOL_EXECUTION' | 'HITL_VERIFICATION' | 'HITL_APPROVAL' | 'ESCALATION' | 'RAG_RETRIEVAL' | 'AUTH_LOGIN' | 'ADMIN_INVITE';
  intent?: IntentCategory;
  toolName?: string;
  inputPayload: Record<string, unknown>;
  outputPayload?: Record<string, unknown>;
  status: 'SUCCESS' | 'BLOCKED_PENDING_HITL' | 'DENIED' | 'FAILED' | 'ESCALATED';
  confidenceScore?: number;
  ipAddress?: string;
  executionDurationMs?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  intent?: IntentCategory;
  graphState?: string;
  citations?: KBSourceCitation[];
  hitlRequest?: HITLRequest;
  ticketRef?: Ticket;
  clarifyingTurn?: number;
  isEscalated?: boolean;
  escalationContext?: {
    transcriptSnippet: string;
    detectedIntent: string;
    missingDetails: string;
    assignedQueue: string;
  };
  suggestedActions?: { label: string; action: string; payload?: unknown }[];
  steps?: { title: string; detail: string; completed?: boolean }[];
  error?: string;
}

export interface EvalMetricSummary {
  totalQueries: number;
  retrievalAccuracy: number;
  hallucinationRate: number;
  intentAccuracy: number;
  hitlFalsePositiveRate: number;
  ticketCategorizationAccuracy: number;
  averageLatencyMs: number;
}

export interface GoldenTestScenario {
  id: string;
  query: string;
  expectedIntent: IntentCategory;
  expectedTool?: string;
  expectedCitations?: string[];
  expectedHITL: boolean;
  notes: string;
  actualIntent?: IntentCategory;
  actualTool?: string;
  passed?: boolean;
  hallucinationDetected?: boolean;
  retrievalScore?: number;
}

export interface StaticApproverMapping {
  resourceKeyword: string;
  approverEmail: string;
  approverName: string;
  department: string;
  slaHours: number;
}
