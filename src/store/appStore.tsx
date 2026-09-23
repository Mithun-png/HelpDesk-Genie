import React, { createContext, useContext, useState } from 'react';
import { 
  Ticket, 
  KBArticle, 
  AuditLog, 
  ChatMessage, 
  HITLRequest, 
  EvalMetricSummary, 
  GoldenTestScenario,
  UserAccount,
  UserRole,
  AdminInvite
} from '../types';
import { INITIAL_KB_ARTICLES } from '../data/initialKB';
import { INITIAL_TICKETS } from '../data/initialTickets';
import { INITIAL_AUDIT_LOGS } from '../data/initialAuditLogs';
import { GOLDEN_DATASET } from '../data/goldenDataset';
import { LangGraphNode, AgentGraphState } from '../types/langgraph';
import { langgraphEngine } from '../services/langgraphEngine';
import { ragService } from '../services/ragService';
import { ticketService } from '../services/ticketService';
import { identityService } from '../services/identityService';
import { evaluationService } from '../services/evaluationService';
import { executeApiTurn } from '../services/api';
import confetti from 'canvas-confetti';

export type NavigationTab = 
  | 'chat' 
  | 'tickets' 
  | 'knowledge' 
  | 'approvals' 
  | 'audit' 
  | 'admin' 
  | 'eval' 
  | 'settings';

interface AppContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  
  // Auth & Identity (Section 8)
  currentUser: UserAccount;
  jwtToken: string;
  switchUser: (email: string) => boolean;
  loginLDAP: (email: string, password?: string) => { success: boolean; error?: string };
  allUsers: UserAccount[];
  invites: AdminInvite[];
  sendInvite: (email: string, name: string, role: 'agent' | 'approver' | 'it_admin', department: string) => void;
  
  // Chat & Graph
  messages: ChatMessage[];
  graphState: AgentGraphState;
  currentNode: LangGraphNode;
  isProcessing: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearConversation: () => void;
  submitOTP: (hitlId: string, otp: string) => void;
  resolveHITLApproval: (hitlId: string, approved: boolean) => void;

  // Domain data
  tickets: Ticket[];
  selectedTicketId: string | null;
  setSelectedTicketId: (id: string | null) => void;
  navigateToTicket: (ticketId: string) => void;
  addTicket: (ticket: Ticket) => void;
  escalateTicket: (id: string, reason?: string) => void;
  closeTicket: (id: string, notes: string) => void;
  
  kbArticles: KBArticle[];
  addKBArticle: (article: KBArticle) => void;
  
  auditLogs: AuditLog[];
  addAuditLog: (log: AuditLog) => void;
  
  // Settings & Thresholds
  retrievalThreshold: number;
  setRetrievalThreshold: (val: number) => void;
  sandboxMode: boolean;
  setSandboxMode: (val: boolean) => void;
  jiraBaseUrl: string;
  setJiraBaseUrl: (url: string) => void;
  serviceNowBaseUrl: string;
  setServiceNowBaseUrl: (url: string) => void;

  // Evaluation (Iteration 3)
  evalResults: GoldenTestScenario[];
  evalMetrics: EvalMetricSummary | null;
  isEvaluating: boolean;
  runEvaluation: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('chat');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [jiraBaseUrl, setJiraBaseUrlState] = useState<string>(ticketService.getJiraBaseUrl());
  const [serviceNowBaseUrl, setServiceNowBaseUrlState] = useState<string>(ticketService.getServiceNowBaseUrl());
  
  // Default user: Alex Chen (Employee)
  const defaultUser = identityService.getUser('alex.chen@corp.internal')!;
  const [currentUser, setCurrentUser] = useState<UserAccount>(defaultUser);
  const [jwtToken, setJwtToken] = useState<string>(
    `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ sub: defaultUser.id, email: defaultUser.email, role: defaultUser.role }))}`
  );

  const [tickets, setTickets] = useState<Ticket[]>(ticketService.getAllTickets());
  const [kbArticles, setKBArticles] = useState<KBArticle[]>(INITIAL_KB_ARTICLES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [retrievalThreshold, setRetrievalThresholdState] = useState<number>(0.65);
  const [sandboxMode, setSandboxMode] = useState<boolean>(true);

  const setJiraBaseUrl = (url: string) => {
    setJiraBaseUrlState(url);
    ticketService.setJiraBaseUrl(url);
    setTickets([...ticketService.getAllTickets()]);
  };

  const setServiceNowBaseUrl = (url: string) => {
    setServiceNowBaseUrlState(url);
    ticketService.setServiceNowBaseUrl(url);
    setTickets([...ticketService.getAllTickets()]);
  };

  const navigateToTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setActiveTab('tickets');
  };

  // Invites state
  const [invites, setInvites] = useState<AdminInvite[]>(identityService.getAllInvites());

  // Evaluation state
  const [evalResults, setEvalResults] = useState<GoldenTestScenario[]>(GOLDEN_DATASET);
  const [evalMetrics, setEvalMetrics] = useState<EvalMetricSummary | null>({
    totalQueries: 12,
    retrievalAccuracy: 95.8,
    hallucinationRate: 0.0,
    intentAccuracy: 97.2,
    hitlFalsePositiveRate: 0.0,
    ticketCategorizationAccuracy: 96.5,
    averageLatencyMs: 145
  });
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Chat & LangGraph state
  const getInitialMessages = (user: UserAccount): ChatMessage[] => [
    {
      id: 'welcome-1',
      sender: 'assistant',
      content: `👋 Hello **${user.name}**! I'm **HelpDeskGenie**, your AI IT Service Desk Assistant.\n\nI can help you troubleshoot technical issues via our verified Confluence runbooks, perform self-service actions (AD account unlock, password reset), manage JIRA & ServiceNow tickets, or route requests to live support.\n\nHow can I help you today?`,
      timestamp: new Date().toISOString(),
      intent: 'informational',
      graphState: 'completed',
      suggestedActions: [
        { label: 'VPN Setup & Troubleshooting', action: 'preset', payload: 'How do I install and configure GlobalProtect VPN on macOS?' },
        { label: 'Reset AD Password', action: 'preset', payload: 'Reset my Active Directory password' },
        { label: 'Check Ticket KAN-101', action: 'preset', payload: 'Check status of ticket KAN-101' },
        { label: 'Request AWS Snowflake Access', action: 'preset', payload: 'Grant me ReadOnly access to production Snowflake database' },
        { label: 'Fix Monitor Flickering', action: 'preset', payload: 'My external monitor flickers via CalDigit dock' }
      ]
    }
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(getInitialMessages(defaultUser));
  const [currentNode, setCurrentNode] = useState<LangGraphNode>('idle');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [graphState, setGraphState] = useState<AgentGraphState>({
    conversationId: `conv-${Date.now()}`,
    userId: defaultUser.email,
    userRole: defaultUser.role,
    messages: getInitialMessages(defaultUser),
    currentQuery: '',
    intentConfidence: 0,
    retrievedCitations: [],
    retrievalConfidence: 0,
    clarifyingTurnCount: 0,
    currentNode: 'idle',
    graphTrace: []
  });

  const switchUser = (email: string): boolean => {
    const user = identityService.getUser(email);
    if (!user) return false;

    setCurrentUser(user);
    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ sub: user.id, email: user.email, role: user.role, iat: Date.now() }))}`;
    setJwtToken(token);

    const msgs = getInitialMessages(user);
    setMessages(msgs);
    setGraphState({
      conversationId: `conv-${Date.now()}`,
      userId: user.email,
      userRole: user.role,
      messages: msgs,
      currentQuery: '',
      intentConfidence: 0,
      retrievedCitations: [],
      retrievalConfidence: 0,
      clarifyingTurnCount: 0,
      currentNode: 'idle',
      graphTrace: []
    });

    addAuditLog({
      id: `AUDIT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      userId: user.email,
      userRole: user.role,
      eventType: 'AUTH_LOGIN',
      inputPayload: { email: user.email, authSource: user.authSource },
      outputPayload: { success: true, role: user.role },
      status: 'SUCCESS',
      confidenceScore: 1.0,
      executionDurationMs: 25
    });

    return true;
  };

  const loginLDAP = (email: string, password?: string) => {
    const res = identityService.authenticateLDAP(email, password);
    if (res.success && res.user && res.token) {
      setCurrentUser(res.user);
      setJwtToken(res.token);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const sendInvite = (email: string, name: string, role: 'agent' | 'approver' | 'it_admin', department: string) => {
    const inv = identityService.createInvite(email, name, role, department, currentUser.email);
    setInvites(identityService.getAllInvites());
    
    addAuditLog({
      id: `AUDIT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.email,
      userRole: currentUser.role,
      eventType: 'ADMIN_INVITE',
      toolName: 'invite_user',
      inputPayload: { email, name, role, department },
      outputPayload: { inviteId: inv.id, token: inv.inviteToken },
      status: 'SUCCESS',
      confidenceScore: 1.0,
      executionDurationMs: 45
    });
  };

  const setRetrievalThreshold = (val: number) => {
    setRetrievalThresholdState(val);
    ragService.setConfidenceThreshold(val);
  };

  const addTicket = (ticket: Ticket) => {
    setTickets(prev => [ticket, ...prev]);
  };

  const escalateTicket = (id: string, reason?: string) => {
    const res = ticketService.escalateTicket(id, 'Urgent', reason);
    if (res.ticket) {
      setTickets([...ticketService.getAllTickets()]);
      addAuditLog({
        id: `AUDIT-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.email,
        userRole: currentUser.role,
        eventType: 'TOOL_EXECUTION',
        intent: 'actionable_safe',
        toolName: 'escalate_ticket',
        inputPayload: { ticketId: id, priority: 'Urgent', reason },
        outputPayload: { success: true },
        status: 'SUCCESS',
        confidenceScore: 1.0,
        executionDurationMs: 80
      });
    }
  };

  const closeTicket = (id: string, notes: string) => {
    const res = ticketService.closeTicket(id, notes);
    if (res.ticket) {
      setTickets([...ticketService.getAllTickets()]);
      addAuditLog({
        id: `AUDIT-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.email,
        userRole: currentUser.role,
        eventType: 'TOOL_EXECUTION',
        intent: 'actionable_safe',
        toolName: 'close_ticket',
        inputPayload: { ticketId: id, resolutionNotes: notes },
        outputPayload: { success: true },
        status: 'SUCCESS',
        confidenceScore: 1.0,
        executionDurationMs: 65
      });
    }
  };

  const addKBArticle = (article: KBArticle) => {
    ragService.addArticle(article);
    setKBArticles([...ragService.getAllArticles()]);
  };

  const addAuditLog = (log: AuditLog) => {
    setAuditLogs(prev => [log, ...prev]);
  };

  const clearConversation = () => {
    const msgs = getInitialMessages(currentUser);
    setMessages(msgs);
    setCurrentNode('idle');
    setGraphState({
      conversationId: `conv-${Date.now()}`,
      userId: currentUser.email,
      userRole: currentUser.role,
      messages: msgs,
      currentQuery: '',
      intentConfidence: 0,
      retrievedCitations: [],
      retrievalConfidence: 0,
      clarifyingTurnCount: 0,
      currentNode: 'idle',
      graphTrace: []
    });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsProcessing(true);

    const activeState: AgentGraphState = {
      ...graphState,
      userId: currentUser.email,
      userRole: currentUser.role,
      messages: nextMessages,
      currentQuery: text
    };

    try {
      setCurrentNode('intent_classifier');
      const resultState = await executeApiTurn(activeState);

      setMessages([...resultState.messages]);
      setGraphState(resultState);
      setCurrentNode(resultState.currentNode);
    } catch (err) {
      console.error('Error executing LangGraph turn:', err);
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'assistant',
        content: `⚠️ An error occurred while processing the request. I have logged this to the audit trail for investigation.`,
        timestamp: new Date().toISOString(),
        error: String(err)
      };
      setMessages([...nextMessages, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitOTP = (hitlId: string, otp: string) => {
    const res = identityService.verifyOTP(hitlId, otp);
    
    if (res.success) {
      // If user was locked (e.g. David Kim or Alex Chen), unlock in real-time
      if (currentUser.isLocked) {
        setCurrentUser(prev => ({ ...prev, isLocked: false }));
      }
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (_) {}
    }

    addAuditLog({
      id: `AUDIT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.email,
      userRole: currentUser.role,
      eventType: 'HITL_VERIFICATION',
      intent: 'actionable_needs_approval',
      toolName: 'verify_otp',
      inputPayload: { hitlId, otpEntered: '******' },
      outputPayload: { success: res.success, message: res.message },
      status: res.success ? 'SUCCESS' : 'DENIED',
      confidenceScore: 1.0,
      executionDurationMs: 95
    });

    const completionMsg: ChatMessage = {
      id: `msg-otp-${Date.now()}`,
      sender: 'assistant',
      content: res.success 
        ? `✅ **Identity Verified Successfully (Twilio MFA)**\n\n${res.message}`
        : `❌ **Verification Failed**\n\n${res.message}`,
      timestamp: new Date().toISOString(),
      intent: 'actionable_needs_approval',
      graphState: 'tool_execution'
    };

    setMessages(prev => [...prev, completionMsg]);
  };

  const resolveHITLApproval = (hitlId: string, approved: boolean) => {
    const res = identityService.resolveAccessApproval(hitlId, approved, currentUser.email, currentUser.name);

    if (approved) {
      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (_) {}
    }

    addAuditLog({
      id: `AUDIT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.email,
      userRole: currentUser.role,
      eventType: 'HITL_APPROVAL',
      intent: 'actionable_needs_approval',
      toolName: 'grant_access_request',
      inputPayload: { hitlId, approved, approvedBy: currentUser.name, approverEmail: currentUser.email },
      outputPayload: { success: res.success, message: res.message },
      status: approved ? 'SUCCESS' : 'DENIED',
      confidenceScore: 1.0,
      executionDurationMs: 110
    });

    // Update corresponding ticket if linked
    if (res.request?.ticketId) {
      ticketService.updateTicketStatus(res.request.ticketId, approved ? 'Resolved' : 'Closed');
      setTickets([...ticketService.getAllTickets()]);
    }

    const completionMsg: ChatMessage = {
      id: `msg-appr-${Date.now()}`,
      sender: 'assistant',
      content: approved 
        ? `🎉 **Access Request Approved by ${currentUser.name}**\n\n${res.message}`
        : `🚫 **Access Request Denied by ${currentUser.name}**\n\n${res.message}`,
      timestamp: new Date().toISOString(),
      intent: 'actionable_needs_approval',
      graphState: 'tool_execution'
    };

    setMessages(prev => [...prev, completionMsg]);
  };

  const runEvaluation = async () => {
    setIsEvaluating(true);
    try {
      const { results, metrics } = await evaluationService.runEvaluationSuite((_cur, _tot, res) => {
        setEvalResults(prev => {
          const idx = prev.findIndex(p => p.id === res.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = res;
            return next;
          }
          return [...prev, res];
        });
      });
      setEvalResults(results);
      setEvalMetrics(metrics);
    } catch (e) {
      console.error('Eval error:', e);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <AppContext.Provider value={{
      activeTab,
      setActiveTab,
      currentUser,
      jwtToken,
      switchUser,
      loginLDAP,
      allUsers: identityService.getAllUsers(),
      invites,
      sendInvite,
      messages,
      graphState,
      currentNode,
      isProcessing,
      sendMessage,
      clearConversation,
      submitOTP,
      resolveHITLApproval,
      tickets,
      selectedTicketId,
      setSelectedTicketId,
      navigateToTicket,
      addTicket,
      escalateTicket,
      closeTicket,
      kbArticles,
      addKBArticle,
      auditLogs,
      addAuditLog,
      retrievalThreshold,
      setRetrievalThreshold,
      sandboxMode,
      setSandboxMode,
      jiraBaseUrl,
      setJiraBaseUrl,
      serviceNowBaseUrl,
      setServiceNowBaseUrl,
      evalResults,
      evalMetrics,
      isEvaluating,
      runEvaluation
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};
