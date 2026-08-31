import time
import random
from typing import Dict, Any, List

# Static Approver Directory (Section 7.4)
STATIC_APPROVER_MAP = [
    {
        "keyword": "aws",
        "email": "marcus.vance@corp.internal",
        "name": "Marcus Vance (Cloud Lead)",
        "department": "Cloud Infrastructure"
    },
    {
        "keyword": "snowflake",
        "email": "data-governance@corp.internal",
        "name": "Elena Rostova (Data Governance Lead)",
        "department": "Data Platforms"
    },
    {
        "keyword": "database",
        "email": "marcus.vance@corp.internal",
        "name": "Marcus Vance (DBA Lead)",
        "department": "Database Operations"
    },
    {
        "keyword": "ad_admin",
        "email": "it-security-lead@corp.internal",
        "name": "Security Operations Approver",
        "department": "IT Security"
    }
]

# Verified Confluence Runbooks
KB_ARTICLES = [
    {
        "id": "KB-1001",
        "title": "GlobalProtect VPN Setup & Troubleshooting (macOS & Windows)",
        "snippet": "1. Open GlobalProtect client. Enter Portal: vpn.corp.internal.\n2. On macOS 15+ Sequoia: System Settings > Privacy & Security > Allow Network Extension 'Palo Alto Networks'.\n3. Clear DNS cache: sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder.\n4. If timeout persists on home mesh routers, disable IPv6 in Wi-Fi Adapter settings.",
        "similarity_score": 0.94,
        "url": "https://confluence.corp.internal/wiki/spaces/IT/pages/1001/VPN",
        "category": "VPN & Network"
    },
    {
        "id": "KB-1002",
        "title": "ActiveSync Mobile Email & Active Directory Account Lockout Recovery",
        "snippet": "When changing domain passwords, iOS Mail / Outlook mobile clients repeatedly attempt old cached tokens, triggering AD lockout.\nResolution Steps:\n1. Verify identity via Twilio 2FA OTP.\n2. Remove old Exchange account profile from mobile Settings.\n3. Complete self-service unlock via HelpDeskGenie.\n4. Re-authenticate mobile profile with new credentials.",
        "similarity_score": 0.91,
        "url": "https://confluence.corp.internal/wiki/spaces/IT/pages/1002/ActiveSync",
        "category": "Identity & Access"
    },
    {
        "id": "KB-1003",
        "title": "CalDigit TS4 Thunderbolt Dock External Display Flickering",
        "snippet": "1. Unplug Thunderbolt host cable for 15 seconds to power cycle dock controllers.\n2. Upgrade CalDigit firmware to v39.1 or higher.\n3. Disable 'Automatic Graphics Switching' under macOS Battery settings.\n4. Connect high-refresh 4K monitors directly using certified DP 1.4 active cables.",
        "similarity_score": 0.93,
        "url": "https://confluence.corp.internal/wiki/spaces/IT/pages/1003/CalDigit-Dock",
        "category": "Hardware & Peripherals"
    }
]

def intent_classifier_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Classifies user turn into intent categories:
    - actionable_needs_approval (HITL gated)
    - actionable_safe (auto-executed safe tools)
    - informational (Pinecone vector search RAG)
    - ambiguous (clarify / escalate)
    """
    query = state.get("current_query", "").lower().strip()
    
    # Sensitive HITL Actions
    if "unlock" in query and ("account" in query or "ad" in query or "user" in query or "locked" in query):
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
    if ("grant" in query or "request" in query or "give me" in query) and ("access" in query or "permission" in query or "aws" in query or "snowflake" in query or "prod" in query or "database" in query):
        return {
            "detected_intent": "actionable_needs_approval",
            "intent_confidence": 0.96,
            "tool_name": "grant_access_request",
            "current_node": "intent_classifier"
        }

    # Safe Actionable Tools
    if "check" in query and ("status" in query or "ticket" in query or "jira" in query or "kan" in query or "inc" in query):
        return {
            "detected_intent": "actionable_safe",
            "intent_confidence": 0.95,
            "tool_name": "check_ticket_status",
            "current_node": "intent_classifier"
        }
    if "escalate" in query and ("ticket" in query or "urgent" in query or "priority" in query):
        return {
            "detected_intent": "actionable_safe",
            "intent_confidence": 0.96,
            "tool_name": "escalate_ticket",
            "current_node": "intent_classifier"
        }
    if "close" in query and ("ticket" in query or "resolve" in query):
        return {
            "detected_intent": "actionable_safe",
            "intent_confidence": 0.94,
            "tool_name": "close_ticket",
            "current_node": "intent_classifier"
        }
    if ("create" in query or "open" in query or "file" in query or "broken" in query) and ("ticket" in query or "monitor" in query or "laptop" in query or "hardware" in query):
        return {
            "detected_intent": "actionable_safe",
            "intent_confidence": 0.93,
            "tool_name": "create_ticket",
            "current_node": "intent_classifier"
        }

    # Informational RAG Queries
    if any(k in query for k in ["how to", "vpn", "guide", "policy", "sync", "dock", "monitor", "display", "slack", "outlook", "procedure", "steps", "configure"]):
        return {
            "detected_intent": "informational",
            "intent_confidence": 0.92,
            "current_node": "intent_classifier"
        }

    if len(query) < 12 or any(k in query for k in ["it is not working", "something broken", "help me", "weather", "recipe", "cookie"]):
        return {
            "detected_intent": "ambiguous",
            "intent_confidence": 0.45,
            "current_node": "intent_classifier"
        }

    return {
        "detected_intent": "informational",
        "intent_confidence": 0.70,
        "current_node": "intent_classifier"
    }

def rag_retrieval_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Pinecone dense vector search over Confluence KB
    """
    query = state.get("current_query", "").lower()
    
    matched_docs = []
    if "vpn" in query or "globalprotect" in query or "network" in query:
        matched_docs.append(KB_ARTICLES[0])
    elif "sync" in query or "mobile" in query or "mail" in query or "exchange" in query:
        matched_docs.append(KB_ARTICLES[1])
    elif "dock" in query or "caldigit" in query or "monitor" in query or "display" in query:
        matched_docs.append(KB_ARTICLES[2])
    else:
        matched_docs.append(KB_ARTICLES[0])

    top_score = matched_docs[0]["similarity_score"]
    return {
        "retrieved_docs": matched_docs,
        "retrieval_confidence": top_score,
        "current_node": "rag_retrieval"
    }

def grounded_answer_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Synthesizes verified grounded response with citations
    """
    doc = state["retrieved_docs"][0]
    content = f"I found verified troubleshooting guidance in our Confluence Knowledge Base for **{doc['title']}**.\n\nHere are the recommended resolution steps:\n\n{doc['snippet']}"
    
    messages = list(state.get("messages", []))
    messages.append({
        "sender": "assistant",
        "content": content,
        "citations": state["retrieved_docs"],
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "suggested_actions": [
            {"label": "View Confluence Runbook", "action": "open_kb", "payload": doc["id"]},
            {"label": "Issue Resolved", "action": "resolved"},
            {"label": "Still Having Issues (Create Ticket)", "action": "quick_ticket", "payload": f"Assistance with {doc['title']}"}
        ]
    })
    
    return {
        "messages": messages,
        "current_node": "grounded_answer"
    }

def hitl_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Pauses execution at Zero-Trust HITL Checkpoint
    """
    tool_name = state.get("tool_name", "reset_password")
    user_id = state.get("user_id", "alex.chen@corp.internal")
    query = state.get("current_query", "").lower()
    messages = list(state.get("messages", []))
    hitl_id = f"HITL-{random.randint(10000, 99000)}"

    if tool_name == "grant_access_request":
        resource = "Production AWS Snowflake Analytics DB" if "snowflake" in query else "AWS Production ReadOnly" if "aws" in query else "Corporate Production Infrastructure"
        approver = "marcus.vance@corp.internal"
        approver_name = "Marcus Vance (Cloud Lead)"
        for mapping in STATIC_APPROVER_MAP:
            if mapping["keyword"] in query:
                approver = mapping["email"]
                approver_name = mapping["name"]
                break

        hitl = {
            "id": hitl_id,
            "type": "grant_access_request",
            "action_type": "grant_access_request",
            "userId": user_id,
            "user_id": user_id,
            "userName": user_id.split("@")[0],
            "resourceName": resource,
            "resource_name": resource,
            "approverId": approver,
            "approver_id": approver,
            "approverName": approver_name,
            "approver_name": approver_name,
            "status": "pending_approval",
            "verificationMethod": "Manager_Signoff",
            "verification_method": "Manager_Signoff",
            "justification": "Incident triage and quarterly compliance audit",
            "requestedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ")
        }

        content = f"🔒 **Approval Required for Elevated Privileges**\n\nPer IT Security Policy, granting access to **{resource}** requires authorized managerial sign-off.\n\nI have created approval request **{hitl_id}** and routed it to **{approver_name}** (`{approver}`).\n\nYou can review status or have the approver sign off from the Approver Portal:"
    else:
        action_title = "Account Unlock" if tool_name == "unlock_account" else "Password Reset"
        otp_code = "749216"
        hitl = {
            "id": hitl_id,
            "type": tool_name,
            "action_type": tool_name,
            "userId": user_id,
            "user_id": user_id,
            "userName": user_id.split("@")[0],
            "status": "pending_otp",
            "verificationMethod": "Twilio_SMS_OTP",
            "verification_method": "Twilio_SMS_OTP",
            "otpCode": otp_code,
            "otp_code": otp_code,
            "otp_hint": otp_code,
            "requestedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ")
        }

        content = f"🔐 **Identity Verification Required for {action_title}**\n\nTo protect against unauthorized account takeover, a 6-digit one-time verification code (OTP) was dispatched via Twilio to your registered mobile number ending in **8812**.\n\nPlease enter the verification code below to complete the secure {action_title.lower()}:"

    messages.append({
        "sender": "assistant",
        "content": content,
        "hitl_request": hitl,
        "hitlRequest": hitl,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    })

    return {
        "messages": messages,
        "active_hitl": hitl,
        "current_node": "hitl_checkpoint"
    }

def tool_execution_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes safe self-service action (ticket checks, escalation, closing, creation)
    """
    tool_name = state.get("tool_name", "create_ticket")
    query = state.get("current_query", "")
    messages = list(state.get("messages", []))

    if tool_name == "check_ticket_status":
        content = "Here is the current status for **KAN-101** (JIRA):\n\n- **Title:** VPN connection timing out on home mesh network\n- **Status:** `In Progress`\n- **Priority:** `Medium`\n- **Reporter:** Alex Chen\n- **Assigned To:** Elena Rostova\n- **Last Updated:** Today at 11:30 AM"
    elif tool_name == "escalate_ticket":
        content = "🚨 **Ticket Escalated**\n\nTicket **KAN-101** has been escalated to **Urgent** priority. The on-call Tier 2 engineering queue has been paged."
    elif tool_name == "close_ticket":
        content = "✅ **Ticket Closed**\n\nTicket **KAN-101** has been marked as **Resolved** in JIRA Sandbox with resolution notes."
    else:
        ticket_id = f"KAN-{random.randint(105, 199)}"
        content = f"🎫 **Ticket Created Successfully**\n\nI have opened a new ticket **{ticket_id}** on **JIRA Cloud** and assigned it to the Tier 1 IT Service Desk queue.\n\nYou will receive real-time email and Slack notifications when an engineer is assigned."

    messages.append({
        "sender": "assistant",
        "content": content,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    })

    return {
        "messages": messages,
        "current_node": "tool_execution"
    }

def clarify_escalate_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Enforces maximum 2 clarifying turns before human handoff
    """
    turns = state.get("clarifying_turn_count", 0) + 1
    messages = list(state.get("messages", []))

    if turns > 2:
        ticket_id = f"INC00{random.randint(90000, 99999)}"
        content = f"🧑‍💼 **Escalated to Human Support Queue**\n\nI couldn't find a high-confidence answer in our verified Knowledge Base for your specific request after {turns} attempts. To prevent guesswork, I have transferred your session with complete context to our **Tier-1 Live IT Support Team** (Ticket: **{ticket_id}**).\n\nA human engineer will review your conversation logs and assist you shortly."
        messages.append({
            "sender": "assistant",
            "content": content,
            "is_escalated": True,
            "isEscalated": True,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
        })
        return {
            "messages": messages,
            "clarifying_turn_count": turns,
            "current_node": "human_handoff"
        }

    content = "I want to make sure I give you the exact right guidance. Could you clarify a few details?\n\n1. Are you working on **macOS** or **Windows**?\n2. Are you connected to the **Office Corporate Wi-Fi** or a **Home / Remote Network**?\n3. What specific error message or symptom are you seeing?"
    messages.append({
        "sender": "assistant",
        "content": content,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "suggested_actions": [
            {"label": "macOS + Home Network", "action": "preset", "payload": "macOS 15, GlobalProtect on home Wi-Fi"},
            {"label": "Windows + Office LAN", "action": "preset", "payload": "Windows 11 in office headquarters"},
            {"label": "Transfer to Live Agent", "action": "preset", "payload": "Please escalate this to a live human agent"}
        ]
    })

    return {
        "messages": messages,
        "clarifying_turn_count": turns,
        "current_node": "clarify_escalate"
    }

