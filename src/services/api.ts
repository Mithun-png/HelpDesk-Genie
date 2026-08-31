import { AgentGraphState, LangGraphNode } from '../types/langgraph';
import { ChatMessage, HITLRequest, IntentCategory, KBSourceCitation } from '../types';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

type ApiMessage = {
  sender: ChatMessage['sender'];
  content: string;
  timestamp: string;
  citations?: Array<{ id: string; title: string; snippet: string; similarity_score: number; url: string; category: string }>;
  hitl_request?: HITLRequest;
  is_escalated?: boolean;
};

type ApiTurn = {
  messages: ApiMessage[];
  detected_intent?: IntentCategory;
  intent_confidence: number;
  retrieved_docs: ApiMessage['citations'];
  retrieval_confidence: number;
  clarifying_turn_count: number;
  active_hitl?: HITLRequest;
  tool_name?: string;
  current_node: LangGraphNode;
};

const toCitation = (citation: NonNullable<ApiMessage['citations']>[number]): KBSourceCitation => ({
  id: citation.id,
  title: citation.title,
  snippet: citation.snippet,
  similarityScore: citation.similarity_score,
  url: citation.url,
  category: citation.category
});

export async function executeApiTurn(state: AgentGraphState): Promise<AgentGraphState> {
  const response = await fetch(`${API_URL}/api/chat/turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation_id: state.conversationId,
      user_id: state.userId,
      user_role: state.userRole,
      query: state.currentQuery
    })
  });

  if (!response.ok) {
    throw new Error(`API request failed (${response.status})`);
  }

  const result: ApiTurn = await response.json();
  const apiMessages: ChatMessage[] = result.messages.map((message, index) => ({
    id: `api-${Date.now()}-${index}`,
    sender: message.sender,
    content: message.content,
    timestamp: message.timestamp,
    citations: message.citations?.map(toCitation),
    hitlRequest: message.hitl_request,
    isEscalated: message.is_escalated,
    intent: result.detected_intent,
    graphState: result.current_node
  }));

  return {
    ...state,
    messages: [...state.messages, ...apiMessages],
    detectedIntent: result.detected_intent,
    intentConfidence: result.intent_confidence,
    retrievedCitations: result.retrieved_docs?.map(toCitation) || [],
    retrievalConfidence: result.retrieval_confidence,
    clarifyingTurnCount: result.clarifying_turn_count,
    activeHITL: result.active_hitl,
    pendingToolCall: result.tool_name ? { name: result.tool_name, arguments: {} } : undefined,
    currentNode: result.current_node
  };
}
