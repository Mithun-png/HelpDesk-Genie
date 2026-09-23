import React from 'react';
import { LangGraphNode } from '../../types/langgraph';
import { Network, Database, ShieldAlert, CheckCircle2, Bot, Wrench, FileText, UserCheck, AlertTriangle } from 'lucide-react';

export interface GraphStatePillProps {
  currentNode: LangGraphNode;
  isProcessing?: boolean;
}

export const GraphStatePill: React.FC<GraphStatePillProps> = ({ currentNode, isProcessing }) => {
  const getNodeDetails = () => {
    switch (currentNode) {
      case 'intent_classifier':
        return { label: 'Intent Classifier Node', icon: <Bot className="w-3.5 h-3.5 text-sky-600" />, color: 'border-sky-500/30 bg-sky-500/10 text-sky-700' };
      case 'rag_retrieval':
        return { label: 'Pinecone RAG Retrieval', icon: <Database className="w-3.5 h-3.5 text-[#EF4623]" />, color: 'border-[#EF4623]/30 bg-[#EF4623]/10 text-[#EF4623]' };
      case 'grounded_answer':
        return { label: 'Grounded Answer Synthesis', icon: <FileText className="w-3.5 h-3.5 text-emerald-600" />, color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' };
      case 'clarify_escalate':
        return { label: 'Clarify / Escalate Node', icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />, color: 'border-amber-500/30 bg-amber-500/10 text-amber-700' };
      case 'hitl_checkpoint':
        return { label: 'HITL Verification Checkpoint', icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />, color: 'border-rose-500/30 bg-rose-500/10 text-rose-700' };
      case 'approver_notification':
        return { label: 'Approver Routing Node', icon: <UserCheck className="w-3.5 h-3.5 text-amber-600" />, color: 'border-amber-500/30 bg-amber-500/10 text-amber-700' };
      case 'tool_execution':
        return { label: 'Tool Execution (JIRA/AD/SNOW)', icon: <Wrench className="w-3.5 h-3.5 text-[#2D3B42]" />, color: 'border-[#2D3B42]/20 bg-[#2D3B42]/10 text-[#2D3B42]' };
      case 'audit_logger':
        return { label: 'Audit Log Node', icon: <FileText className="w-3.5 h-3.5 text-teal-600" />, color: 'border-teal-500/30 bg-teal-500/10 text-teal-700' };
      case 'human_handoff':
        return { label: 'Human Handoff Queue', icon: <UserCheck className="w-3.5 h-3.5 text-[#EF4623]" />, color: 'border-[#EF4623]/30 bg-[#EF4623]/10 text-[#EF4623]' };
      case 'completed':
        return { label: 'LangGraph Flow Completed', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />, color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' };
      default:
        return { label: 'LangGraph State Machine Idle', icon: <Network className="w-3.5 h-3.5 text-[#2D3B42]/60" />, color: 'border-[#2D3B42]/15 bg-white/80 text-[#2D3B42]' };
    }
  };

  const details = getNodeDetails();

  return (
    <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border backdrop-blur-md text-xs font-semibold ${details.color} shadow-sm transition-all duration-300`}>
      <span className="relative flex h-2 w-2">
        {isProcessing && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4623] opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${isProcessing ? 'bg-[#EF4623]' : 'bg-[#2D3B42]/40'}`}></span>
      </span>
      {details.icon}
      <span className="tracking-wide">{details.label}</span>
    </div>
  );
};
