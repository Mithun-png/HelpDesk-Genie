import time
from typing import Dict, Any
from backend.app.graph.state import AgentState

def intent_classifier_node(state: AgentState) -> Dict[str, Any]:
    """
    Classifies the user query into:
    - Informational (RAG)
    - Actionable safe (auto-executable tools)
    - Actionable needs approval (HITL gated)
    - Ambiguous / Out-of-scope
    """
    query = state["current_query"].lower()
    
    # Sensitive actions requiring Human-In-The-Loop
    if "unlock" in query and ("account" in query or "ad" in query or "user" in query):
        return {
            "detected_intent": "actionable_needs_approval",
            "intent_confidence": 0.98,
            "tool_name": "unlock_account",
            "current_node": "intent_classifier"
        }
    if ("reset" in query or "change" in query or "forgot" in query) and "password" in query:
        return {
            "detected_intent": "actionable_needs_approval",
            "intent_confidence": 0.97,
            "tool_name": "reset_password",
            "current_node": "intent_classifier"
        }
    if ("grant" in query or "request" in query) and ("access" in query or "permission" in query or "aws" in query or "snowflake" in query):
        return {
            "detected_intent": "actionable_needs_approval",
            "intent_confidence": 0.96,
            "tool_name": "grant_access_request",
            "current_node": "intent_classifier"
        }

    # Safe actionable tools
    if "check" in query and ("status" in query or "ticket" in query or "jira" in query or "inc" in query):
        return {
            "detected_intent": "actionable_safe",
            "intent_confidence": 0.95,
            "tool_name": "check_ticket_status",
            "current_node": "intent_classifier"
        }
    if "escalate" in query:
        return {
            "detected_intent": "actionable_safe",
            "intent_confidence": 0.96,
            "tool_name": "escalate_ticket",
            "current_node": "intent_classifier"
        }
    if "close" in query and "ticket" in query:
        return {
            "detected_intent": "actionable_safe",
            "intent_confidence": 0.94,
            "tool_name": "close_ticket",
            "current_node": "intent_classifier"
        }
    if "create" in query or "open" in query or "broken" in query or "ticket" in query:
        return {
            "detected_intent": "actionable_safe",
            "intent_confidence": 0.93,
            "tool_name": "create_ticket",
            "current_node": "intent_classifier"
        }

    # Informational
    if "how to" in query or "vpn" in query or "guide" in query or "policy" in query or "sync" in query or "dock" in query or "monitor" in query:
        return {
            "detected_intent": "informational",
            "intent_confidence": 0.92,
            "current_node": "intent_classifier"
        }

    return {
        "detected_intent": "ambiguous",
        "intent_confidence": 0.45,
        "current_node": "intent_classifier"
    }

def rag_retrieval_node(state: AgentState) -> Dict[str, Any]:
    """
    Performs dense vector retrieval over Confluence KB in Pinecone
    """
    query = state["current_query"]
    # Simulated vector similarity lookup
    retrieved = [
        {
            "id": "KB-1001",
            "title": "GlobalProtect VPN Setup & Troubleshooting (macOS & Windows)",
            "snippet": "Portal Address: vpn.corp.company.com. On macOS: System Settings > Privacy & Security > Allow Network Extension.",
            "similarity_score": 0.92,
            "url": "https://confluence.corp.internal/wiki/spaces/IT/pages/1001/VPN",
            "category": "VPN & Network"
        }
    ]
    return {
        "retrieved_docs": retrieved,
        "retrieval_confidence": 0.92,
        "current_node": "rag_retrieval"
    }

def grounded_answer_node(state: AgentState) -> Dict[str, Any]:
    """
    Formats the grounded troubleshooting answer with citations and step lists
    """
    doc = state["retrieved_docs"][0]
    answer_text = f"Based on verified Confluence runbook **{doc['title']}**:\n\n{doc['snippet']}"
    
    messages = list(state["messages"])
    messages.append({
        "sender": "assistant",
        "content": answer_text,
        "citations": state["retrieved_docs"],
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    })
    
    return {
        "messages": messages,
        "current_node": "grounded_answer"
    }

def hitl_node(state: AgentState) -> Dict[str, Any]:
    """
    Pauses execution at checkpoint and issues OTP or Approver routing
    """
    tool_name = state.get("tool_name", "sensitive_action")
    messages = list(state["messages"])
    
    if tool_name == "grant_access_request":
        content = "🔒 High-privilege access request requires Manager approval."
        hitl = {
            "id": "HITL-78192",
            "action_type": "grant_access_request",
            "approver_id": "eng-lead@company.com",
            "status": "pending_approval"
        }
    else:
        content = "🔐 Identity verification required via Twilio SMS OTP."
        hitl = {
            "id": "HITL-78193",
            "action_type": tool_name,
            "status": "pending_otp",
            "otp_hint": "749216"
        }
        
    messages.append({
        "sender": "assistant",
        "content": content,
        "hitl_request": hitl,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    })
    
    return {
        "messages": messages,
        "active_hitl": hitl,
        "current_node": "hitl_checkpoint"
    }

def tool_execution_node(state: AgentState) -> Dict[str, Any]:
    """
    Executes safe tool (JIRA / ServiceNow) and appends result
    """
    tool_name = state.get("tool_name", "create_ticket")
    messages = list(state["messages"])
    
    result_text = f"✅ Executed tool `{tool_name}` successfully in sandbox environment."
    messages.append({
        "sender": "assistant",
        "content": result_text,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    })
    
    return {
        "messages": messages,
        "current_node": "tool_execution"
    }

def clarify_escalate_node(state: AgentState) -> Dict[str, Any]:
    """
    Enforces maximum 2 clarifying turns before transferring to live human agent
    """
    turns = state.get("clarifying_turn_count", 0) + 1
    messages = list(state["messages"])
    
    if turns > 2:
        content = "🧑‍💼 Clarification limit reached. Transferred conversation to Tier-1 Live Support queue."
        messages.append({
            "sender": "assistant",
            "content": content,
            "is_escalated": True,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
        })
        return {
            "messages": messages,
            "clarifying_turn_count": turns,
            "current_node": "human_handoff"
        }
        
    content = "Could you please clarify your operating system and network connection so I can assist accurately?"
    messages.append({
        "sender": "assistant",
        "content": content,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    })
    
    return {
        "messages": messages,
        "clarifying_turn_count": turns,
        "current_node": "clarify_escalate"
    }
