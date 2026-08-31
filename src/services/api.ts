import { AgentGraphState, LangGraphNode } from '../types/langgraph';
import { ChatMessage, HITLRequest, IntentCategory, KBSourceCitation } from '../types';
import { langgraphEngine } from './langgraphEngine';
import { identityService } from './identityService';

const RAW_API_URL = import.meta.env.VITE_API_URL;
const API_URL = RAW_API_URL ? RAW_API_URL.replace(/\/$/, '') : '';

type ApiMessage = {
  id?: string;
  sender: ChatMessage['sender'];
  content: string;
  timestamp: string;
  citations?: Array<{ id: string; title: string; snippet: string; similarity_score?: number; similarityScore?: number; url: string; category: string }>;
  hitl_request?: any;
  hitlRequest?: any;
  is_escalated?: boolean;
  isEscalated?: boolean;
  suggested_actions?: Array<{ label: string; action: string; payload?: unknown }>;
  suggestedActions?: Array<{ label: string; action: string; payload?: unknown }>;
};

type ApiTurn = {
  messages: ApiMessage[];
  detected_intent?: IntentCategory;
  detectedIntent?: IntentCategory;
  intent_confidence?: number;
  intentConfidence?: number;
  retrieved_docs?: ApiMessage['citations'];
  retrievedCitations?: ApiMessage['citations'];
  retrieval_confidence?: number;
  retrievalConfidence?: number;
  clarifying_turn_count?: number;
  clarifyingTurnCount?: number;
  active_hitl?: any;
  activeHITL?: any;
  tool_name?: string;
  current_node?: LangGraphNode;
  currentNode?: LangGraphNode;
};

const toCitation = (citation: NonNullable<ApiMessage['citations']>[number]): KBSourceCitation => ({
  id: citation.id,
  title: citation.title,
  snippet: citation.snippet,
  similarityScore: citation.similarityScore ?? citation.similarity_score ?? 0.92,
  url: citation.url,
  category: citation.category
});

const normalizeHITLRequest = (raw: any, state: AgentGraphState): HITLRequest | undefined => {
  if (!raw) return undefined;
  
  const rawType = raw.type || raw.action_type || (raw.verification_method === 'Twilio_SMS_OTP' ? 'reset_password' : 'grant_access_request');
  const hitlId = raw.id || `HITL-${Math.floor(10000 + Math.random() * 90000)}`;
  const isOTP = rawType === 'reset_password' || rawType === 'unlock_account' || raw.verification_method === 'Twilio_SMS_OTP' || raw.verificationMethod === 'Twilio_SMS_OTP';

  const hitlReq: HITLRequest = {
    id: hitlId,
    type: isOTP ? (rawType === 'unlock_account' ? 'unlock_account' : 'reset_password') : 'grant_access_request',
    userId: raw.userId || raw.user_id || state.userId,
    userName: raw.userName || raw.user_name || state.userId.split('@')[0],
    resourceName: raw.resourceName || raw.resource_name || (isOTP ? undefined : 'Production AWS Snowflake Analytics DB'),
    approverId: raw.approverId || raw.approver_id || (isOTP ? undefined : 'marcus.vance@corp.internal'),
    approverName: raw.approverName || raw.approver_name || (isOTP ? undefined : 'Marcus Vance (Cloud Lead)'),
    status: raw.status || (isOTP ? 'pending_otp' : 'pending_approval'),
    verificationMethod: isOTP ? 'Twilio_SMS_OTP' : 'Manager_Signoff',
    otpCode: raw.otpCode || raw.otp_code || raw.otp_hint || '749216',
    requestedAt: raw.requestedAt || raw.requested_at || new Date().toISOString(),
    justification: raw.justification || 'Production triage and security access check',
    ticketId: raw.ticketId || raw.ticket_id
  };

  // Register in client-side Identity Service so approval or OTP resolution succeeds immediately
  identityService.registerHITLRequest(hitlReq);
  return hitlReq;
};

export async function executeApiTurn(state: AgentGraphState): Promise<AgentGraphState> {
  // If no backend API URL is configured or if running in standalone/browser mode, execute directly via embedded LangGraph Engine
  if (!API_URL || API_URL.includes('localhost') && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return langgraphEngine.executeTurn(state);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`${API_URL}/api/chat/turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        conversation_id: state.conversationId,
        user_id: state.userId,
        user_role: state.userRole,
        query: state.currentQuery
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Backend API returned HTTP ${response.status}. Falling back to embedded LangGraph Engine.`);
      return langgraphEngine.executeTurn(state);
    }

    const result: ApiTurn = await response.json();
    const detectedIntent = result.detectedIntent || result.detected_intent || 'informational';
    const currentNode = result.currentNode || result.current_node || 'completed';
    const rawActiveHITL = result.activeHITL || result.active_hitl;
    const normalizedActiveHITL = normalizeHITLRequest(rawActiveHITL, state);

    const apiMessages: ChatMessage[] = (result.messages || []).map((message, index) => {
      const rawMsgHITL = message.hitlRequest || message.hitl_request || (index === (result.messages.length - 1) ? normalizedActiveHITL : undefined);
      const normalizedMsgHITL = normalizeHITLRequest(rawMsgHITL, state);

      return {
        id: message.id || `api-${Date.now()}-${index}`,
        sender: message.sender,
        content: message.content,
        timestamp: message.timestamp || new Date().toISOString(),
        citations: (message.citations || result.retrieved_docs || result.retrievedCitations)?.map(toCitation),
        hitlRequest: normalizedMsgHITL,
        isEscalated: message.isEscalated ?? message.is_escalated,
        intent: detectedIntent,
        graphState: currentNode,
        suggestedActions: message.suggestedActions || message.suggested_actions
      };
    });

    const retrievedDocs = result.retrievedCitations || result.retrieved_docs || [];

    return {
      ...state,
      messages: [...state.messages, ...apiMessages],
      detectedIntent: detectedIntent,
      intentConfidence: result.intentConfidence ?? result.intent_confidence ?? 0.95,
      retrievedCitations: retrievedDocs.map(toCitation),
      retrievalConfidence: result.retrievalConfidence ?? result.retrieval_confidence ?? 0.92,
      clarifyingTurnCount: result.clarifyingTurnCount ?? result.clarifying_turn_count ?? state.clarifyingTurnCount,
      activeHITL: normalizedActiveHITL,
      pendingToolCall: result.tool_name ? { name: result.tool_name, arguments: {} } : undefined,
      currentNode: currentNode
    };
  } catch (err) {
    console.warn('API execution failed or timed out. Gracefully executing turn with embedded LangGraph engine:', err);
    return langgraphEngine.executeTurn(state);
  }
}

