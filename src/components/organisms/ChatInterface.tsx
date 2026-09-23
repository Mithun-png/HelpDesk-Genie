import React, { useRef, useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { ChatMessageItem } from '../molecules/ChatMessageItem';
import { ChatInputArea } from '../molecules/ChatInputArea';
import { GraphStatePill } from '../molecules/GraphStatePill';
import { JiraCloudModal } from './JiraCloudModal';
import { ServiceNowModal } from './ServiceNowModal';
import { Trash2, ExternalLink, CheckCircle, Sparkles, Layers } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Ticket } from '../../types';
import { ticketService } from '../../services/ticketService';

export const ChatInterface: React.FC = () => {
  const { 
    messages, 
    currentNode, 
    isProcessing, 
    sendMessage, 
    clearConversation,
    submitOTP,
    resolveHITLApproval,
    setActiveTab,
    navigateToTicket,
    tickets,
    escalateTicket,
    closeTicket,
    jiraBaseUrl,
    serviceNowBaseUrl,
    addAuditLog,
    currentUser
  } = useAppStore();

  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle?: string; icon?: React.ReactNode } | null>(null);
  const [activeJiraTicket, setActiveJiraTicket] = useState<Ticket | null>(null);
  const [activeServiceNowTicket, setActiveServiceNowTicket] = useState<Ticket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showToast = (title: string, subtitle?: string, icon?: React.ReactNode) => {
    setToastMessage({ title, subtitle, icon });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const handleActionClick = (action: string, payload?: unknown) => {
    if (action === 'open_kb') {
      setActiveTab('knowledge');
    } else if (action === 'resolved') {
      sendMessage('Thank you, this resolved my issue!');
    } else if (action === 'quick_ticket') {
      sendMessage(`Please open a support ticket for: ${payload || 'my current issue'}`);
    } else if (action === 'escalate_ticket') {
      const ticketId = typeof payload === 'string' ? payload : (payload as Ticket)?.id;
      if (ticketId) {
        escalateTicket(ticketId, 'Escalated via Chat Quick Action');
        showToast('Ticket Escalated', `${ticketId} bumped to Urgent priority`, <CheckCircle className="w-4 h-4 text-rose-400" />);
      } else {
        sendMessage(`Please escalate ticket ${payload} to Urgent priority immediately`);
      }
    } else if (action === 'close_ticket') {
      const ticketId = typeof payload === 'string' ? payload : (payload as Ticket)?.id;
      if (ticketId) {
        closeTicket(ticketId, 'Resolved by employee in Chat');
        showToast('Ticket Resolved', `${ticketId} marked as resolved`, <CheckCircle className="w-4 h-4 text-emerald-400" />);
      } else {
        sendMessage(`Close ticket ${payload} as resolved`);
      }
    } else if (action === 'clarify_select' && typeof payload === 'string') {
      sendMessage(payload);
    } else if (action === 'preset' && typeof payload === 'string') {
      sendMessage(payload);
    } else if (action === 'view_ticket_hub') {
      const ticketId = typeof payload === 'string' ? payload : (payload as Ticket)?.id;
      if (ticketId) {
        navigateToTicket(ticketId);
        showToast('Switched to IT Service Desk Hub', `Viewing ticket ${ticketId}`, <Layers className="w-4 h-4 text-[#EF4623]" />);
      } else {
        setActiveTab('tickets');
      }
    } else if (action === 'redirect_jira') {
      let ticketObj: Ticket | undefined;
      if (payload && typeof payload === 'object' && 'id' in (payload as any)) {
        ticketObj = payload as Ticket;
      } else if (typeof payload === 'string') {
        ticketObj = tickets.find(t => t.id.toLowerCase() === (payload as string).toLowerCase()) || ticketService.getTicketById(payload as string);
      }

      if (!ticketObj) {
        // Fallback default
        ticketObj = tickets.find(t => t.platform === 'JIRA') || {
          id: 'KAN-101',
          platform: 'JIRA',
          title: 'VPN connection timing out on home mesh network',
          description: 'User reports GlobalProtect disconnects every 15 minutes on mesh Wi-Fi.',
          status: 'In Progress',
          priority: 'Medium',
          category: 'VPN & Network',
          createdBy: currentUser.email,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          externalUrl: `${jiraBaseUrl}/browse/KAN-101`
        };
      }

      const targetUrl = ticketObj.externalUrl || `${jiraBaseUrl}/browse/${ticketObj.id}`;
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      showToast('Redirected to JIRA Cloud', targetUrl, <ExternalLink className="w-4 h-4 text-blue-400" />);
      
      addAuditLog({
        id: `AUDIT-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.email,
        userRole: currentUser.role,
        eventType: 'TOOL_EXECUTION',
        toolName: 'redirect_jira',
        inputPayload: { ticketId: ticketObj.id, url: targetUrl },
        outputPayload: { redirected: true },
        status: 'SUCCESS',
        confidenceScore: 1.0,
        executionDurationMs: 15
      });
    } else if (action === 'redirect_servicenow') {
      let ticketObj: Ticket | undefined;
      if (payload && typeof payload === 'object' && 'id' in (payload as any)) {
        ticketObj = payload as Ticket;
      } else if (typeof payload === 'string') {
        ticketObj = tickets.find(t => t.id.toLowerCase() === (payload as string).toLowerCase()) || ticketService.getTicketById(payload as string);
      }

      if (!ticketObj) {
        ticketObj = tickets.find(t => t.platform === 'ServiceNow') || {
          id: 'INC0089211',
          platform: 'ServiceNow',
          title: 'AWS Production ReadOnly access request for incident triage',
          description: 'Emergency access request to investigate latency spikes on RDS cluster.',
          status: 'Pending Approval',
          priority: 'High',
          category: 'Identity & Access',
          createdBy: currentUser.email,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          externalUrl: `${serviceNowBaseUrl}/nav_to.do?uri=incident.do?sys_id=INC0089211`
        };
      }

      const targetUrl = ticketObj.externalUrl || `${serviceNowBaseUrl}/nav_to.do?uri=incident.do?sys_id=${ticketObj.id}`;
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      showToast('Redirected to ServiceNow', targetUrl, <ExternalLink className="w-4 h-4 text-emerald-400" />);
      
      addAuditLog({
        id: `AUDIT-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.email,
        userRole: currentUser.role,
        eventType: 'TOOL_EXECUTION',
        toolName: 'redirect_servicenow',
        inputPayload: { ticketId: ticketObj.id, url: targetUrl },
        outputPayload: { redirected: true },
        status: 'SUCCESS',
        confidenceScore: 1.0,
        executionDurationMs: 15
      });
    } else if (action === 'preview_jira') {
      let ticketObj: Ticket | undefined;
      if (payload && typeof payload === 'object' && 'id' in (payload as any)) {
        ticketObj = payload as Ticket;
      } else if (typeof payload === 'string') {
        ticketObj = tickets.find(t => t.id.toLowerCase() === (payload as string).toLowerCase()) || ticketService.getTicketById(payload as string);
      }
      if (!ticketObj) {
        ticketObj = tickets.find(t => t.platform === 'JIRA') || {
          id: 'KAN-101',
          platform: 'JIRA',
          title: 'VPN connection timing out on home mesh network',
          description: 'User reports GlobalProtect disconnects every 15 minutes on mesh Wi-Fi.',
          status: 'In Progress',
          priority: 'Medium',
          category: 'VPN & Network',
          createdBy: currentUser.email,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          externalUrl: `${jiraBaseUrl}/browse/KAN-101`
        };
      }
      setActiveJiraTicket(ticketObj);
      showToast('Opened JIRA Sandbox Preview', `Inspecting issue ${ticketObj.id}`, <Sparkles className="w-4 h-4 text-blue-400" />);
    } else if (action === 'preview_servicenow') {
      let ticketObj: Ticket | undefined;
      if (payload && typeof payload === 'object' && 'id' in (payload as any)) {
        ticketObj = payload as Ticket;
      } else if (typeof payload === 'string') {
        ticketObj = tickets.find(t => t.id.toLowerCase() === (payload as string).toLowerCase()) || ticketService.getTicketById(payload as string);
      }
      if (!ticketObj) {
        ticketObj = tickets.find(t => t.platform === 'ServiceNow') || {
          id: 'INC0089211',
          platform: 'ServiceNow',
          title: 'AWS Production ReadOnly access request for incident triage',
          description: 'Emergency access request to investigate latency spikes on RDS cluster.',
          status: 'Pending Approval',
          priority: 'High',
          category: 'Identity & Access',
          createdBy: currentUser.email,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          externalUrl: `${serviceNowBaseUrl}/nav_to.do?uri=incident.do?sys_id=INC0089211`
        };
      }
      setActiveServiceNowTicket(ticketObj);
      showToast('Opened ServiceNow Sandbox Preview', `Inspecting incident ${ticketObj.id}`, <Sparkles className="w-4 h-4 text-emerald-400" />);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] max-w-5xl mx-auto relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-3xl bg-white/95 border border-[#2D3B42]/10 shadow-2xl backdrop-blur-xl animate-fade-in text-xs text-[#2D3B42]">
          {toastMessage.icon || <CheckCircle className="w-4 h-4 text-[#EF4623]" />}
          <div>
            <span className="font-semibold text-[#2D3B42]">{toastMessage.title}</span>
            {toastMessage.subtitle && (
              <span className="text-[#2D3B42]/60 ml-1.5 font-mono text-[11px]">{toastMessage.subtitle}</span>
            )}
          </div>
        </div>
      )}

      {/* Top Bar with Live Graph Status */}
      <div className="flex items-center justify-between pb-3 px-1 border-b border-[#2D3B42]/10 mb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <GraphStatePill currentNode={currentNode} isProcessing={isProcessing} />
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={clearConversation}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            className="text-[#2D3B42]/60 hover:text-rose-600 hover:bg-rose-50"
          >
            Clear Session
          </Button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-2 select-text">
        {messages.map((msg) => (
          <ChatMessageItem
            key={msg.id}
            message={msg}
            onActionClick={handleActionClick}
            onSubmitOTP={submitOTP}
            onResolveApproval={resolveHITLApproval}
          />
        ))}

        {isProcessing && (
          <div className="flex items-center gap-3 py-3 px-4 rounded-3xl bg-white/85 border border-[#EF4623]/25 shadow-sm max-w-md animate-pulse">
            <div className="w-2.5 h-2.5 rounded-full bg-[#EF4623] animate-ping" />
            <span className="text-xs font-medium text-[#2D3B42]">
              LangGraph executing: <strong className="font-mono text-[#EF4623]">{currentNode}</strong>...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="pt-3 flex-shrink-0">
        <ChatInputArea
          onSendMessage={sendMessage}
          isLoading={isProcessing}
          onPresetSelect={(query) => sendMessage(query)}
        />
      </div>

      {/* JIRA Cloud Sandbox Modal */}
      <JiraCloudModal
        isOpen={!!activeJiraTicket}
        ticket={activeJiraTicket}
        onClose={() => setActiveJiraTicket(null)}
        onEscalate={(id) => {
          escalateTicket(id, 'Escalated from Jira Cloud Sandbox View');
          if (activeJiraTicket) setActiveJiraTicket({ ...activeJiraTicket, priority: 'Urgent' });
        }}
        onResolve={(id, notes) => {
          closeTicket(id, notes);
          if (activeJiraTicket) setActiveJiraTicket({ ...activeJiraTicket, status: 'Resolved' });
        }}
      />

      {/* ServiceNow Sandbox Modal */}
      <ServiceNowModal
        isOpen={!!activeServiceNowTicket}
        ticket={activeServiceNowTicket}
        onClose={() => setActiveServiceNowTicket(null)}
        onEscalate={(id) => {
          escalateTicket(id, 'Escalated from ServiceNow Sandbox View');
          if (activeServiceNowTicket) setActiveServiceNowTicket({ ...activeServiceNowTicket, priority: 'Urgent' });
        }}
        onResolve={(id, notes) => {
          closeTicket(id, notes);
          if (activeServiceNowTicket) setActiveServiceNowTicket({ ...activeServiceNowTicket, status: 'Resolved' });
        }}
      />
    </div>
  );
};
