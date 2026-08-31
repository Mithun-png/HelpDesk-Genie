from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any, Optional
import time
import base64
import json

app = FastAPI(
    title="HelpDeskGenie API",
    description="Conversational IT Service Desk layer with LangGraph orchestration, AD/LDAP Auth, and Zero-Trust HITL Checkpoints",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-Memory Database for Sandbox execution
USERS_DB = {
    "alex.chen@corp.internal": {
        "id": "USR-1001",
        "email": "alex.chen@corp.internal",
        "name": "Alex Chen",
        "role": "employee",
        "department": "Frontend Engineering",
        "manager": "sarah.jenkins@corp.internal",
        "is_locked": False,
        "auth_source": "AD_LDAP"
    },
    "david.kim@corp.internal": {
        "id": "USR-1002",
        "email": "david.kim@corp.internal",
        "name": "David Kim",
        "role": "employee",
        "department": "Backend Platform",
        "manager": "marcus.vance@corp.internal",
        "is_locked": True,
        "auth_source": "AD_LDAP"
    },
    "elena.rostova@corp.internal": {
        "id": "AGT-2001",
        "email": "elena.rostova@corp.internal",
        "name": "Elena Rostova",
        "role": "agent",
        "department": "Tier 2 IT Service Desk",
        "manager": "sarah.jenkins@corp.internal",
        "is_locked": False,
        "auth_source": "ADMIN_INVITE"
    },
    "marcus.vance@corp.internal": {
        "id": "APR-3001",
        "email": "marcus.vance@corp.internal",
        "name": "Marcus Vance",
        "role": "approver",
        "department": "Engineering Director / IT Approver",
        "manager": "vp-eng@corp.internal",
        "is_locked": False,
        "auth_source": "ADMIN_INVITE"
    },
    "admin@corp.internal": {
        "id": "ADM-0001",
        "email": "admin@corp.internal",
        "name": "Sarah Jenkins (IT Admin)",
        "role": "it_admin",
        "department": "IT Infrastructure & Security",
        "manager": "cio@corp.internal",
        "is_locked": False,
        "auth_source": "ADMIN_INVITE"
    }
}

INVITES_DB = []

TICKETS_DB = [
    {
        "id": "KAN-101",
        "platform": "JIRA",
        "title": "VPN connection timing out on home mesh network",
        "description": "User reports GlobalProtect disconnects every 15 minutes on mesh Wi-Fi.",
        "status": "In Progress",
        "priority": "Medium",
        "category": "VPN & Network",
        "createdBy": "alex.chen@corp.internal",
        "assignedTo": "elena.rostova@corp.internal",
        "createdAt": "2026-08-24T09:15:00Z"
    },
    {
        "id": "INC0089211",
        "platform": "ServiceNow",
        "title": "AWS Production ReadOnly access request for incident triage",
        "description": "Emergency access request to investigate latency spikes on RDS cluster.",
        "status": "Pending Approval",
        "priority": "High",
        "category": "Identity & Access",
        "createdBy": "priya.sharma@corp.internal",
        "approverId": "marcus.vance@corp.internal",
        "createdAt": "2026-08-25T11:00:00Z"
    }
]

# Request / Response Schemas
class ChatTurnRequest(BaseModel):
    conversation_id: str
    user_id: str
    user_role: Optional[str] = "employee"
    query: str
    context: Optional[Dict[str, Any]] = None

class LDAPLoginRequest(BaseModel):
    email: str
    password: Optional[str] = None

class AdminInviteRequest(BaseModel):
    email: str
    name: str
    role: str
    department: str
    invited_by: str

class CreateTicketRequest(BaseModel):
    title: str
    description: str
    platform: Optional[str] = "JIRA"
    priority: Optional[str] = "Medium"
    category: Optional[str] = "General IT"
    created_by: str

class ResolveApprovalRequest(BaseModel):
    hitl_id: str
    approved: bool
    approver_email: str
    approver_name: str

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "HelpDeskGenie",
        "spec_version": "1.0",
        "langgraph_engine": "online",
        "sandboxes": {
            "jira": "connected",
            "servicenow": "connected",
            "active_directory": "connected",
            "pinecone_vector_store": "connected",
            "twilio_verify": "connected"
        }
    }

# ----------------- Auth & Identity Endpoints (Section 8) -----------------

@app.post("/api/auth/login")
def login_ldap(req: LDAPLoginRequest):
    email = req.email.lower().strip()
    user = USERS_DB.get(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {email} not found in Active Directory domain corp.internal"
        )
    
    if user.get("is_locked"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is locked in Active Directory. Please request an unlock via HelpDeskGenie."
        )

    # Issue simulated JWT
    token_payload = {
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "iat": int(time.time()),
        "exp": int(time.time()) + 86400
    }
    encoded = base64.b64encode(json.dumps(token_payload).encode()).decode()
    jwt_token = f"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.{encoded}.signature"

    return {
        "success": True,
        "user": user,
        "token": jwt_token
    }

@app.get("/api/auth/users")
def get_all_users():
    return list(USERS_DB.values())

@app.post("/api/auth/invite")
def invite_user(req: AdminInviteRequest):
    email = req.email.lower().strip()
    invite_id = f"INV-{int(time.time() % 10000)}"
    invite = {
        "id": invite_id,
        "email": email,
        "name": req.name,
        "role": req.role,
        "department": req.department,
        "invited_by": req.invited_by,
        "invited_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "status": "pending"
    }
    INVITES_DB.append(invite)

    # Register in user table as provisioned account
    prefix = "AGT" if req.role == "agent" else "APR" if req.role == "approver" else "ADM"
    USERS_DB[email] = {
        "id": f"{prefix}-{int(time.time() % 10000)}",
        "email": email,
        "name": req.name,
        "role": req.role,
        "department": req.department,
        "manager": "cio@corp.internal",
        "is_locked": False,
        "auth_source": "ADMIN_INVITE"
    }

    return {"success": True, "invite": invite}

# ----------------- Ticketing Endpoints -----------------

@app.get("/api/tickets")
def get_tickets(user_email: Optional[str] = None, role: Optional[str] = "it_admin"):
    if role == "employee" and user_email:
        return [t for t in TICKETS_DB if t["createdBy"].lower() == user_email.lower().strip()]
    return TICKETS_DB

@app.post("/api/tickets/create")
def create_ticket(req: CreateTicketRequest):
    platform = req.platform or "JIRA"
    ticket_id = f"KAN-{len(TICKETS_DB) + 104}" if platform == "JIRA" else f"INC00{int(time.time() % 100000)}"
    new_ticket = {
        "id": ticket_id,
        "platform": platform,
        "title": req.title,
        "description": req.description,
        "status": "Open",
        "priority": req.priority,
        "category": req.category,
        "createdBy": req.created_by,
        "assignedTo": "elena.rostova@corp.internal" if platform == "JIRA" else "HelpDeskGenie-Automated",
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    }
    TICKETS_DB.insert(0, new_ticket)
    return new_ticket

# ----------------- LangGraph Execution Endpoint -----------------

@app.post("/api/chat/turn")
def execute_turn(req: ChatTurnRequest):
    """
    Executes a single LangGraph state machine turn with 2-turn clarify limit and Static Approver Routing
    """
    from backend.app.graph.nodes import (
        intent_classifier_node, 
        rag_retrieval_node, 
        grounded_answer_node, 
        hitl_node, 
        tool_execution_node,
        clarify_escalate_node
    )
    
    state = {
        "conversation_id": req.conversation_id,
        "user_id": req.user_id,
        "user_role": req.user_role or "employee",
        "current_query": req.query,
        "messages": [],
        "detected_intent": None,
        "intent_confidence": 0.0,
        "retrieved_docs": [],
        "retrieval_confidence": 0.0,
        "clarifying_turn_count": 0,
        "active_hitl": None,
        "tool_name": None,
        "tool_arguments": {},
        "current_node": "idle",
        "audit_logs": []
    }
    
    # 1. Intent Classifier
    intent_res = intent_classifier_node(state)
    state.update(intent_res)
    
    # 2. Branching based on LangGraph State Machine
    if state["detected_intent"] == "actionable_needs_approval":
        hitl_res = hitl_node(state)
        state.update(hitl_res)
    elif state["detected_intent"] == "actionable_safe":
        tool_res = tool_execution_node(state)
        state.update(tool_res)
    elif state["detected_intent"] == "informational":
        rag_res = rag_retrieval_node(state)
        state.update(rag_res)
        answer_res = grounded_answer_node(state)
        state.update(answer_res)
    else:
        clarify_res = clarify_escalate_node(state)
        state.update(clarify_res)
        
    return state

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
