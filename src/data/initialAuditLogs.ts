import { AuditLog } from '../types';

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AUDIT-8991',
    timestamp: '2026-08-25T11:05:12Z',
    userId: 'priya.sharma@company.com',
    eventType: 'HITL_APPROVAL',
    intent: 'actionable_needs_approval',
    toolName: 'grant_access_request',
    inputPayload: {
      resource: 'AWS_PROD_READONLY',
      approverId: 'eng-lead@company.com',
      justification: 'RDS Latency Incident Sev-2'
    },
    outputPayload: {
      approvalStatus: 'PENDING_MANAGER_SIGNOFF',
      notificationSent: true,
      channel: 'Slack & Email'
    },
    status: 'BLOCKED_PENDING_HITL',
    confidenceScore: 0.98,
    ipAddress: '192.168.10.45',
    executionDurationMs: 42
  },
  {
    id: 'AUDIT-8990',
    timestamp: '2026-08-25T10:48:30Z',
    userId: 'alex.chen@company.com',
    eventType: 'RAG_RETRIEVAL',
    intent: 'informational',
    toolName: 'pinecone_vector_search',
    inputPayload: {
      query: 'How to fix GlobalProtect VPN DNS error 503 on macOS',
      topK: 3
    },
    outputPayload: {
      matchedDocId: 'KB-1001',
      similarityScore: 0.92,
      groundedInKB: true
    },
    status: 'SUCCESS',
    confidenceScore: 0.92,
    ipAddress: '192.168.10.12',
    executionDurationMs: 118
  },
  {
    id: 'AUDIT-8989',
    timestamp: '2026-08-24T16:03:12Z',
    userId: 'david.kim@company.com',
    eventType: 'TOOL_EXECUTION',
    intent: 'actionable_needs_approval',
    toolName: 'unlock_account',
    inputPayload: {
      targetUserId: 'david.kim@company.com',
      ldapServer: 'ad.corp.internal',
      mfaMethod: 'Twilio_SMS_OTP',
      otpVerified: true
    },
    outputPayload: {
      accountUnlocked: true,
      badPwdCountReset: 0,
      ldapResultCode: 'SUCCESS_0'
    },
    status: 'SUCCESS',
    confidenceScore: 0.99,
    ipAddress: '172.16.4.88',
    executionDurationMs: 245
  },
  {
    id: 'AUDIT-8988',
    timestamp: '2026-08-24T09:15:00Z',
    userId: 'alex.chen@company.com',
    eventType: 'TOOL_EXECUTION',
    intent: 'actionable_safe',
    toolName: 'create_ticket',
    inputPayload: {
      platform: 'JIRA',
      issueType: 'Incident',
      summary: 'VPN connection timing out on home mesh network'
    },
    outputPayload: {
      ticketId: 'JIRA-4091',
      status: 'Open',
      queue: 'Network Engineering'
    },
    status: 'SUCCESS',
    confidenceScore: 0.97,
    ipAddress: '192.168.10.12',
    executionDurationMs: 310
  },
  {
    id: 'AUDIT-8987',
    timestamp: '2026-08-23T15:20:10Z',
    userId: 'anonymous_user@company.com',
    eventType: 'ESCALATION',
    intent: 'ambiguous',
    toolName: 'clarify_and_escalate',
    inputPayload: {
      query: 'my screen is acting strange please help',
      clarifyingTurnsTaken: 2,
      unresolved: true
    },
    outputPayload: {
      escalatedToQueue: 'Tier-1-LiveSupport',
      transcriptAttached: true
    },
    status: 'ESCALATED',
    confidenceScore: 0.41,
    ipAddress: '10.0.12.9',
    executionDurationMs: 65
  }
];
