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
        return { label: 'Intent Classifier Node', icon: <Bot className="w-3.5 h-3.5 text-sky-400" />, color: 'border-sky-500/40 bg-sky-500/10 text-sky-300' };
      case 'rag_retrieval':
        return { label: 'Pinecone RAG Retrieval', icon: <Database className="w-3.5 h-3.5 text-violet-400" />, color: 'border-violet-500/40 bg-violet-500/10 text-violet-300' };
      case 'grounded_answer':
        return { label: 'Grounded Answer Synthesis', icon: <FileText className="w-3.5 h-3.5 text-emerald-400" />, color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' };
      case 'clarify_escalate':
        return { label: 'Clarify / Escalate Node', icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />, color: 'border-amber-500/40 bg-amber-500/10 text-amber-300' };
      case 'hitl_checkpoint':
        return { label: 'HITL Verification Checkpoint', icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />, color: 'border-rose-500/40 bg-rose-500/10 text-rose-300' };
      case 'approver_notification':
        return { label: 'Approver Routing Node', icon: <UserCheck className="w-3.5 h-3.5 text-amber-400" />, color: 'border-amber-500/40 bg-amber-500/10 text-amber-300' };
      case 'tool_execution':
        return { label: 'Tool Execution (JIRA/AD/SNOW)', icon: <Wrench className="w-3.5 h-3.5 text-indigo-400" />, color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300' };
      case 'audit_logger':
        return { label: 'Audit Log Node', icon: <FileText className="w-3.5 h-3.5 text-teal-400" />, color: 'border-teal-500/40 bg-teal-500/10 text-teal-300' };
      case 'human_handoff':
        return { label: 'Human Handoff Queue', icon: <UserCheck className="w-3.5 h-3.5 text-purple-400" />, color: 'border-purple-500/40 bg-purple-500/10 text-purple-300' };
      case 'completed':
        return { label: 'LangGraph Flow Completed', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />, color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' };
      default:
        return { label: 'LangGraph State Machine Idle', icon: <Network className="w-3.5 h-3.5 text-slate-400" />, color: 'border-slate-700 bg-slate-800/60 text-slate-300' };
    }
  };

  const details = getNodeDetails();

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md text-xs font-medium ${details.color} shadow-sm transition-all duration-300`}>
      <span className="relative flex h-2 w-2">
        {isProcessing && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${isProcessing ? 'bg-violet-400' : 'bg-slate-400'}`}></span>
      </span>
      {details.icon}
      <span className="tracking-wide">{details.label}</span>
    </div>
  );
};
