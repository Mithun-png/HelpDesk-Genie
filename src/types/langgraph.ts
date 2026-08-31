import { ChatMessage, IntentCategory, KBSourceCitation, HITLRequest, UserRole } from './index';

export type LangGraphNode = 
  | 'idle'
  | 'intent_classifier'
  | 'rag_retrieval'
  | 'grounded_answer'
  | 'clarify_escalate'
  | 'tool_execution'
  | 'hitl_checkpoint'
  | 'approver_notification'
  | 'audit_logger'
  | 'human_handoff'
  | 'completed';

export interface AgentGraphState {
  conversationId: string;
  userId: string;
  userRole: UserRole;
  messages: ChatMessage[];
  currentQuery: string;
  detectedIntent?: IntentCategory;
  intentConfidence: number;
  retrievedCitations: KBSourceCitation[];
  retrievalConfidence: number;
  clarifyingTurnCount: number;
  activeHITL?: HITLRequest;
  pendingToolCall?: {
    name: string;
    arguments: Record<string, unknown>;
  };
  currentNode: LangGraphNode;
  graphTrace: {
    node: LangGraphNode;
    timestamp: string;
    outputSummary: string;
    latencyMs: number;
  }[];
}
