import { 
  AgentGraphState, 
  LangGraphNode 
} from '../types/langgraph';
import { 
  ChatMessage, 
  IntentCategory, 
  AuditLog
} from '../types';
import { ragService } from './ragService';
import { ticketService } from './ticketService';
import { identityService } from './identityService';

export interface GraphExecutionCallback {
  onNodeEnter?: (node: LangGraphNode, state: AgentGraphState) => void;
  onAuditLog?: (log: AuditLog) => void;
}

export class LangGraphEngine {
  private auditLogs: AuditLog[] = [];

  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  public addAuditLog(log: AuditLog) {
    this.auditLogs.unshift(log);
  }

  /**
   * Main entry point to process a user turn through the LangGraph State Machine
   */
  public async executeTurn(
    state: AgentGraphState,
    callbacks?: GraphExecutionCallback
  ): Promise<AgentGraphState> {
    const updatedState = { ...state };
    const query = updatedState.currentQuery.trim();
    const queryLower = query.toLowerCase();

    // Trace initial transition
    this.recordNodeTrace(updatedState, 'intent_classifier', 'Classifying user query intent');
    callbacks?.onNodeEnter?.('intent_classifier', updatedState);

    // 1. INTENT CLASSIFIER NODE
    const intentResult = this.classifyIntent(queryLower);
    updatedState.detectedIntent = intentResult.intent;
    updatedState.intentConfidence = intentResult.confidence;

    // Log Intent Classification in Audit Trail
    this.logAudit({
      userId: updatedState.userId,
      userRole: updatedState.userRole as any,
      eventType: 'INTENT_CLASSIFICATION',
      intent: intentResult.intent,
      inputPayload: { query: updatedState.currentQuery, role: updatedState.userRole },
      outputPayload: { intent: intentResult.intent, confidence: intentResult.confidence, toolCandidate: intentResult.toolName },
      status: 'SUCCESS',
      confidenceScore: intentResult.confidence,
      executionDurationMs: 35
    }, callbacks);

    // 2. ROUTE BASED ON INTENT
    if (intentResult.intent === 'actionable_needs_approval') {
      return this.handleHITLNode(updatedState, intentResult.toolName, callbacks);
    } 
    else if (intentResult.intent === 'actionable_safe') {
      return this.handleSafeToolNode(updatedState, intentResult.toolName, callbacks);
    } 
    else if (intentResult.intent === 'informational') {
      return this.handleRAGFlow(updatedState, callbacks);
    } 
    else {
      // Ambiguous / Out-of-scope
      return this.handleClarifyOrEscalate(updatedState, callbacks);
    }
  }

  /**
   * Intent Classification rules based on enterprise IT domain patterns
   */
  private classifyIntent(query: string): { intent: IntentCategory; confidence: number; toolName?: string } {
    // Check Sensitive HITL actions first
    if (query.includes('unlock') && (query.includes('account') || query.includes('user') || query.includes('active directory') || query.includes('locked') || query.includes('ad'))) {
      return { intent: 'actionable_needs_approval', confidence: 0.98, toolName: 'unlock_account' };
    }
    if ((query.includes('reset') || query.includes('change') || query.includes('forgot')) && query.includes('password')) {
      return { intent: 'actionable_needs_approval', confidence: 0.97, toolName: 'reset_password' };
    }
    if ((query.includes('grant') || query.includes('request') || query.includes('give me')) && (query.includes('access') || query.includes('permission') || query.includes('snowflake') || query.includes('aws') || query.includes('prod') || query.includes('database'))) {
      return { intent: 'actionable_needs_approval', confidence: 0.96, toolName: 'grant_access_request' };
    }

    // Check Safe Actionable tools
    if (query.includes('check') && (query.includes('status') || query.includes('ticket') || query.includes('jira') || query.includes('kan') || query.includes('inc00'))) {
      return { intent: 'actionable_safe', confidence: 0.95, toolName: 'check_ticket_status' };
    }
    if (query.includes('escalate') && (query.includes('ticket') || query.includes('priority') || query.includes('incident') || query.includes('urgent'))) {
      return { intent: 'actionable_safe', confidence: 0.96, toolName: 'escalate_ticket' };
    }
    if (query.includes('close') && (query.includes('ticket') || query.includes('resolve') || query.includes('done'))) {
      return { intent: 'actionable_safe', confidence: 0.94, toolName: 'close_ticket' };
    }
    if ((query.includes('create') || query.includes('open') || query.includes('file') || query.includes('raise') || query.includes('broken')) && (query.includes('ticket') || query.includes('incident') || query.includes('hardware') || query.includes('monitor') || query.includes('laptop') || query.includes('mouse'))) {
      return { intent: 'actionable_safe', confidence: 0.93, toolName: 'create_ticket' };
    }

    // Check Informational queries
    if (
      query.includes('how to') || query.includes('how do i') || query.includes('guide') || 
      query.includes('vpn') || query.includes('policy') || query.includes('requirement') || 
      query.includes('caldigit') || query.includes('display') || query.includes('dock') || 
      query.includes('slack') || query.includes('outlook') || query.includes('sync') ||
      query.includes('procedure') || query.includes('steps') || query.includes('configure')
    ) {
      return { intent: 'informational', confidence: 0.92 };
    }

    // Out-of-scope / Ambiguous
    if (query.length < 15 || query.includes('it is not working') || query.includes('something broken') || query.includes('help me') || query.includes('recipe') || query.includes('cookie') || query.includes('weather')) {
      return { intent: 'ambiguous', confidence: 0.45 };
    }

    // Default to informational search
    return { intent: 'informational', confidence: 0.70 };
  }

  /**
   * RAG Flow: Retrieval -> Confidence check -> Grounded Answer or Clarify
   */
  private async handleRAGFlow(
    state: AgentGraphState, 
    callbacks?: GraphExecutionCallback
  ): Promise<AgentGraphState> {
    this.recordNodeTrace(state, 'rag_retrieval', 'Executing Pinecone vector similarity search across Confluence KB');
    callbacks?.onNodeEnter?.('rag_retrieval', state);

    const { citations, topScore } = ragService.searchVectorStore(state.currentQuery, 3);
    state.retrievedCitations = citations;
    state.retrievalConfidence = topScore;

    this.logAudit({
      userId: state.userId,
      userRole: state.userRole as any,
      eventType: 'RAG_RETRIEVAL',
      intent: 'informational',
      toolName: 'pinecone_vector_search',
      inputPayload: { query: state.currentQuery },
      outputPayload: { topScore, topDoc: citations[0]?.title, threshold: ragService.getConfidenceThreshold() },
      status: 'SUCCESS',
      confidenceScore: topScore,
      executionDurationMs: 82
    }, callbacks);

    // Enforce Retrieval Confidence Threshold
    if (topScore < ragService.getConfidenceThreshold()) {
      // Below threshold -> trigger Clarify/Escalate Node instead of hallucinating
      return this.handleClarifyOrEscalate(state, callbacks);
    }

    // Grounded Answer Node
    this.recordNodeTrace(state, 'grounded_answer', 'Synthesizing verified grounded response with citations');
    callbacks?.onNodeEnter?.('grounded_answer', state);

    const topDoc = citations[0];
    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      content: `I found verified troubleshooting guidance in our Confluence Knowledge Base for **${topDoc.title}**.\n\nHere are the recommended resolution steps:\n\n${topDoc.snippet}`,
      timestamp: new Date().toISOString(),
      intent: 'informational',
      graphState: 'grounded_answer',
      citations: citations,
      suggestedActions: [
        { label: 'View Confluence Runbook', action: 'open_kb', payload: topDoc.id },
        { label: 'Issue Resolved', action: 'resolved' },
        { label: 'Still Having Issues (Create Ticket)', action: 'quick_ticket', payload: `Assistance with ${topDoc.title}` }
      ]
    };

    state.messages.push(assistantMsg);
    this.recordNodeTrace(state, 'completed', 'Completed informational turn');
    callbacks?.onNodeEnter?.('completed', state);

    return state;
  }

  /**
   * Safe Tool Execution Node
   */
  private async handleSafeToolNode(
    state: AgentGraphState, 
    toolName?: string, 
    callbacks?: GraphExecutionCallback
  ): Promise<AgentGraphState> {
    this.recordNodeTrace(state, 'tool_execution', `Executing safe self-service action: ${toolName}`);
    callbacks?.onNodeEnter?.('tool_execution', state);

    const query = state.currentQuery;
    let assistantMsg: ChatMessage;
    let toolResultPayload: Record<string, unknown> = {};

    if (toolName === 'check_ticket_status') {
      const match = query.match(/(kan-\d+|jira-\d+|inc\d+)/i);
      const ticketId = match ? match[1].toUpperCase() : 'KAN-101';
      const ticket = ticketService.getTicketById(ticketId);

      if (ticket) {
        toolResultPayload = { ticketId: ticket.id, status: ticket.status, priority: ticket.priority };
        assistantMsg = {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          content: `Here is the current status for **${ticket.id}** (${ticket.platform}):\n\n- **Title:** ${ticket.title}\n- **Status:** \`${ticket.status}\`\n- **Priority:** \`${ticket.priority}\`\n- **Reporter:** ${ticket.createdByName || ticket.createdBy}\n- **Assigned To:** ${ticket.assignedTo || 'Unassigned'}\n- **Last Updated:** ${new Date(ticket.updatedAt).toLocaleString()}`,
          timestamp: new Date().toISOString(),
          intent: 'actionable_safe',
          graphState: 'tool_execution',
          ticketRef: ticket,
          suggestedActions: [
            { label: ticket.platform === 'JIRA' ? 'Open in JIRA Cloud' : 'Open in ServiceNow', action: ticket.platform === 'JIRA' ? 'redirect_jira' : 'redirect_servicenow', payload: ticket },
            { label: 'View in Service Desk Hub', action: 'view_ticket_hub', payload: ticket.id },
            { label: 'Escalate to Urgent', action: 'escalate_ticket', payload: ticket.id },
            { label: 'Close Ticket', action: 'close_ticket', payload: ticket.id }
          ]
        };
      } else {
        assistantMsg = {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          content: `I could not locate ticket **${ticketId}** in JIRA or ServiceNow. Would you like me to open a new ticket for you?`,
          timestamp: new Date().toISOString(),
          intent: 'actionable_safe',
          graphState: 'tool_execution',
          suggestedActions: [
            { label: `Create New Ticket for ${ticketId}`, action: 'quick_ticket', payload: `Assistance regarding ${ticketId}` }
          ]
        };
      }
    } 
    else if (toolName === 'escalate_ticket') {
      const match = query.match(/(kan-\d+|jira-\d+|inc\d+)/i);
      const ticketId = match ? match[1].toUpperCase() : 'KAN-101';
      const res = ticketService.escalateTicket(ticketId, 'Urgent', 'User escalated via HelpDeskGenie');

      toolResultPayload = { ticketId, priority: 'Urgent', success: res.success };
      assistantMsg = {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        content: `🚨 **Ticket Escalated**\n\n${res.message}`,
        timestamp: new Date().toISOString(),
        intent: 'actionable_safe',
        graphState: 'tool_execution',
        ticketRef: res.ticket,
        suggestedActions: [
          { label: res.ticket?.platform === 'JIRA' ? 'Open in JIRA Cloud' : 'Open in ServiceNow', action: res.ticket?.platform === 'JIRA' ? 'redirect_jira' : 'redirect_servicenow', payload: res.ticket },
          { label: 'View in Service Desk Hub', action: 'view_ticket_hub', payload: ticketId }
        ]
      };
    }
    else if (toolName === 'close_ticket') {
      const match = query.match(/(kan-\d+|jira-\d+|inc\d+)/i);
      const ticketId = match ? match[1].toUpperCase() : 'KAN-103';
      const res = ticketService.closeTicket(ticketId, 'Resolved by employee via HelpDeskGenie conversation');

      toolResultPayload = { ticketId, success: res.success };
      assistantMsg = {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        content: `✅ **Ticket Closed**\n\n${res.message}`,
        timestamp: new Date().toISOString(),
        intent: 'actionable_safe',
        graphState: 'tool_execution',
        ticketRef: res.ticket,
        suggestedActions: [
          { label: 'View in Service Desk Hub', action: 'view_ticket_hub', payload: ticketId }
        ]
      };
    }
    else {
      // create_ticket
      const isHardware = query.toLowerCase().includes('monitor') || query.toLowerCase().includes('hardware') || query.toLowerCase().includes('dock');
      const newTicket = ticketService.createTicket({
        platform: isHardware ? 'JIRA' : 'ServiceNow',
        title: query.length > 50 ? `${query.slice(0, 47)}...` : query,
        description: `Automated ticket created via HelpDeskGenie turn for user: ${state.userId}.\nDetails: ${query}`,
        priority: query.toLowerCase().includes('urgent') ? 'Urgent' : 'Medium',
        category: isHardware ? 'Hardware & Peripherals' : 'General IT',
        createdBy: state.userId,
        conversationId: state.conversationId
      });

      toolResultPayload = { ticketId: newTicket.id, platform: newTicket.platform };
      assistantMsg = {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        content: `🎫 **Ticket Created Successfully**\n\nI have generated a new ticket **${newTicket.id}** on **${newTicket.platform}** and routed it to the **${newTicket.category}** engineering queue.\n\nYou will receive updates via email and Slack when an engineer is assigned.`,
        timestamp: new Date().toISOString(),
        intent: 'actionable_safe',
        graphState: 'tool_execution',
        ticketRef: newTicket,
        suggestedActions: [
          { label: newTicket.platform === 'JIRA' ? 'Open in JIRA Cloud' : 'Open in ServiceNow', action: newTicket.platform === 'JIRA' ? 'redirect_jira' : 'redirect_servicenow', payload: newTicket },
          { label: 'View in Service Desk Hub', action: 'view_ticket_hub', payload: newTicket.id },
          { label: 'Escalate to Urgent', action: 'escalate_ticket', payload: newTicket.id }
        ]
      };
    }

    state.messages.push(assistantMsg);

    // Audit Log Node
    this.recordNodeTrace(state, 'audit_logger', 'Committing action audit record to PostgreSQL');
    callbacks?.onNodeEnter?.('audit_logger', state);

    this.logAudit({
      userId: state.userId,
      userRole: state.userRole as any,
      eventType: 'TOOL_EXECUTION',
      intent: 'actionable_safe',
      toolName: toolName || 'generic_tool',
      inputPayload: { query: state.currentQuery },
      outputPayload: toolResultPayload,
      status: 'SUCCESS',
      confidenceScore: 0.96,
      executionDurationMs: 140
    }, callbacks);

    this.recordNodeTrace(state, 'completed', 'Execution finished');
    callbacks?.onNodeEnter?.('completed', state);

    return state;
  }

  /**
   * Human-in-the-Loop (HITL) Node for Sensitive Actions with Static Approver Routing
   */
  private async handleHITLNode(
    state: AgentGraphState, 
    toolName?: string, 
    callbacks?: GraphExecutionCallback
  ): Promise<AgentGraphState> {
    this.recordNodeTrace(state, 'hitl_checkpoint', `Sensitive action "${toolName}" requires identity verification / approver checkpoint`);
    callbacks?.onNodeEnter?.('hitl_checkpoint', state);

    let assistantMsg: ChatMessage;

    if (toolName === 'grant_access_request') {
      const resource = state.currentQuery.toLowerCase().includes('snowflake') 
        ? 'Snowflake Analytics Prod' 
        : state.currentQuery.toLowerCase().includes('aws') ? 'AWS Production ReadOnly' : 'Corporate Production Infrastructure';
      
      const { hitlId, approver, approverName } = identityService.requestAccessApproval(state.userId, resource);

      this.logAudit({
        userId: state.userId,
        userRole: state.userRole as any,
        eventType: 'HITL_APPROVAL',
        intent: 'actionable_needs_approval',
        toolName: 'grant_access_request',
        inputPayload: { resource, approver, userId: state.userId },
        outputPayload: { hitlId, status: 'BLOCKED_PENDING_HITL', approverName },
        status: 'BLOCKED_PENDING_HITL',
        confidenceScore: 0.98,
        executionDurationMs: 40
      }, callbacks);

      assistantMsg = {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        content: `🔒 **Approval Required for Elevated Privileges**\n\nPer IT Security Policy, granting access to **${resource}** requires authorized sign-off.\n\nI have created approval request **${hitlId}** and routed it to **${approverName}** (\`${approver}\`).\n\nYou can review status or have the approver sign off from the Approver Portal:`,
        timestamp: new Date().toISOString(),
        intent: 'actionable_needs_approval',
        graphState: 'hitl_checkpoint',
        hitlRequest: {
          id: hitlId,
          type: 'grant_access_request',
          userId: state.userId,
          resourceName: resource,
          approverId: approver,
          approverName,
          status: 'pending_approval',
          verificationMethod: 'Manager_Signoff',
          requestedAt: new Date().toISOString(),
          justification: 'Incident triage and quarterly data compliance audit'
        }
      };
    } else {
      // reset_password or unlock_account
      const actionType = toolName === 'unlock_account' ? 'unlock_account' : 'reset_password';
      const { hitlId, otpHint, mobileNumber } = identityService.requestOTP(state.userId, actionType);

      this.logAudit({
        userId: state.userId,
        userRole: state.userRole as any,
        eventType: 'HITL_VERIFICATION',
        intent: 'actionable_needs_approval',
        toolName: actionType,
        inputPayload: { targetUserId: state.userId, mobile: mobileNumber },
        outputPayload: { hitlId, status: 'BLOCKED_PENDING_OTP' },
        status: 'BLOCKED_PENDING_HITL',
        confidenceScore: 0.99,
        executionDurationMs: 45
      }, callbacks);

      const actionTitle = actionType === 'unlock_account' ? 'Account Unlock' : 'Password Reset';
      assistantMsg = {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        content: `🔐 **Identity Verification Required for ${actionTitle}**\n\nTo protect against unauthorized account takeover, a 6-digit one-time verification code (OTP) was dispatched via Twilio to your registered mobile number ending in **${mobileNumber.slice(-4)}**.\n\nPlease enter the code below to complete the secure AD unlock:`,
        timestamp: new Date().toISOString(),
        intent: 'actionable_needs_approval',
        graphState: 'hitl_checkpoint',
        hitlRequest: {
          id: hitlId,
          type: actionType,
          userId: state.userId,
          status: 'pending_otp',
          verificationMethod: 'Twilio_SMS_OTP',
          otpCode: otpHint,
          requestedAt: new Date().toISOString()
        }
      };
    }

    state.messages.push(assistantMsg);
    this.recordNodeTrace(state, 'completed', 'Paused at HITL checkpoint awaiting user response');
    callbacks?.onNodeEnter?.('completed', state);

    return state;
  }

  /**
   * Clarify / Escalate Node with strict 2-turn max rule (Section 7.3)
   */
  private async handleClarifyOrEscalate(
    state: AgentGraphState, 
    callbacks?: GraphExecutionCallback
  ): Promise<AgentGraphState> {
    state.clarifyingTurnCount += 1;

    if (state.clarifyingTurnCount > 2) {
      // Exceeded 2 turns -> Human Handoff Node with full attached context
      this.recordNodeTrace(state, 'human_handoff', 'Clarifying turns exceeded limit of 2. Escalating with full transcript to Live IT Support Queue.');
      callbacks?.onNodeEnter?.('human_handoff', state);

      const escalationTicket = ticketService.createTicket({
        platform: 'ServiceNow',
        title: `Live Agent Escalation: ${state.currentQuery.slice(0, 40)}...`,
        description: `Escalated by HelpDeskGenie after ${state.clarifyingTurnCount} unresolved turns.\nRequester: ${state.userId}\nDetected Intent: ${state.detectedIntent || 'Ambiguous'}\nMissing details: Exact OS version / Network gateway configuration.`,
        priority: 'High',
        category: 'Tier-1-LiveSupport',
        createdBy: state.userId,
        conversationId: state.conversationId
      });

      this.logAudit({
        userId: state.userId,
        userRole: state.userRole as any,
        eventType: 'ESCALATION',
        intent: 'ambiguous',
        toolName: 'human_handoff',
        inputPayload: { query: state.currentQuery, turnCount: state.clarifyingTurnCount },
        outputPayload: { ticketId: escalationTicket.id, queue: 'Tier-1-LiveSupport', transcriptLength: state.messages.length },
        status: 'ESCALATED',
        confidenceScore: 0.35,
        executionDurationMs: 50
      }, callbacks);

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        content: `🧑‍💼 **Escalated to Human Support Queue**\n\nI couldn't find a high-confidence answer in our verified Knowledge Base for your specific request after ${state.clarifyingTurnCount} attempts. To prevent guesswork, I have transferred your session with complete context to our **Tier-1 Live IT Support Team** (Ticket: **${escalationTicket.id}**).\n\nA human engineer will review your conversation logs and assist you shortly.`,
        timestamp: new Date().toISOString(),
        intent: 'ambiguous',
        graphState: 'human_handoff',
        isEscalated: true,
        escalationContext: {
          transcriptSnippet: state.currentQuery,
          detectedIntent: state.detectedIntent || 'Ambiguous / Out-of-scope',
          missingDetails: 'Environment configuration, exact error codes, or local host settings',
          assignedQueue: 'Tier-1-LiveSupport'
        },
        ticketRef: escalationTicket,
        suggestedActions: [
          { label: 'Open in ServiceNow', action: 'redirect_servicenow', payload: escalationTicket },
          { label: 'View in Service Desk Hub', action: 'view_ticket_hub', payload: escalationTicket.id }
        ]
      };

      state.messages.push(assistantMsg);
      this.recordNodeTrace(state, 'completed', 'Completed human escalation transition');
      callbacks?.onNodeEnter?.('completed', state);
      return state;
    }

    // Still within <= 2 turns -> Clarify question
    this.recordNodeTrace(state, 'clarify_escalate', `Generating clarifying question (Turn ${state.clarifyingTurnCount}/2)`);
    callbacks?.onNodeEnter?.('clarify_escalate', state);

    this.logAudit({
      userId: state.userId,
      userRole: state.userRole as any,
      eventType: 'INTENT_CLASSIFICATION',
      intent: 'ambiguous',
      toolName: 'clarify_escalate',
      inputPayload: { query: state.currentQuery, turnCount: state.clarifyingTurnCount },
      outputPayload: { action: 'ask_clarification', turnCount: state.clarifyingTurnCount },
      status: 'SUCCESS',
      confidenceScore: 0.45,
      executionDurationMs: 30
    }, callbacks);

    const clarifyingMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      content: `I want to make sure I give you the exact right guidance. Could you clarify a few details?\n\n1. Are you working on **macOS** or **Windows**?\n2. Are you connected to the **Office Corporate Wi-Fi** or a **Home / Remote Network**?\n3. What specific error message or symptom are you seeing?`,
      timestamp: new Date().toISOString(),
      intent: 'ambiguous',
      graphState: 'clarify_escalate',
      clarifyingTurn: state.clarifyingTurnCount,
      suggestedActions: [
        { label: 'macOS + Home Network', action: 'preset', payload: 'macOS 15, GlobalProtect on home Wi-Fi' },
        { label: 'Windows + Office LAN', action: 'preset', payload: 'Windows 11 in office headquarters' },
        { label: 'Transfer to Live Agent', action: 'preset', payload: 'Please escalate this to a live human agent' }
      ]
    };

    state.messages.push(clarifyingMsg);
    this.recordNodeTrace(state, 'completed', 'Completed clarify turn');
    callbacks?.onNodeEnter?.('completed', state);

    return state;
  }

  private recordNodeTrace(state: AgentGraphState, node: LangGraphNode, description: string) {
    state.currentNode = node;
    state.graphTrace.push({
      node: node,
      timestamp: new Date().toISOString(),
      outputSummary: description,
      latencyMs: 35
    });
  }

  private logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>, callbacks?: GraphExecutionCallback) {
    const fullLog: AuditLog = {
      id: `AUDIT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      ...log
    };
    this.addAuditLog(fullLog);
    callbacks?.onAuditLog?.(fullLog);
  }
}

export const langgraphEngine = new LangGraphEngine();
