from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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
        "mobile": "+1 (555) 349-8812",
        "is_locked": False,
        "auth_source": "AD_LDAP",
        "status": "active"
    },
    "david.kim@corp.internal": {
        "id": "USR-1002",
        "email": "david.kim@corp.internal",
        "name": "David Kim",
        "role": "employee",
        "department": "Backend Platform",
        "manager": "marcus.vance@corp.internal",
        "mobile": "+1 (555) 912-4421",
        "is_locked": True,
        "auth_source": "AD_LDAP",
        "status": "active"
    },
    "priya.sharma@corp.internal": {
        "id": "USR-1003",
        "email": "priya.sharma@corp.internal",
        "name": "Priya Sharma",
        "role": "employee",
        "department": "Product Management",
        "manager": "sarah.jenkins@corp.internal",
        "mobile": "+1 (555) 441-2099",
        "is_locked": False,
        "auth_source": "AD_LDAP",
        "status": "active"
    },
    "elena.rostova@corp.internal": {
        "id": "AGT-2001",
        "email": "elena.rostova@corp.internal",
        "name": "Elena Rostova",
        "role": "agent",
        "department": "Tier 2 IT Service Desk",
        "manager": "sarah.jenkins@corp.internal",
        "mobile": "+1 (555) 883-1120",
        "is_locked": False,
        "auth_source": "ADMIN_INVITE",
        "status": "active"
    },
    "marcus.vance@corp.internal": {
        "id": "APR-3001",
        "email": "marcus.vance@corp.internal",
        "name": "Marcus Vance",
        "role": "approver",
        "department": "Engineering Director / IT Approver",
        "manager": "vp-eng@corp.internal",
        "mobile": "+1 (555) 777-9090",
        "is_locked": False,
        "auth_source": "ADMIN_INVITE",
        "status": "active"
    },
    "admin@corp.internal": {
        "id": "ADM-0001",
        "email": "admin@corp.internal",
        "name": "Sarah Jenkins (IT Admin)",
        "role": "it_admin",
        "department": "IT Infrastructure & Security",
        "manager": "cio@corp.internal",
        "mobile": "+1 (555) 101-2020",
        "is_locked": False,
        "auth_source": "ADMIN_INVITE",
        "status": "active"
    }
}

INVITES_DB = []

PENDING_HITL_DB: Dict[str, Dict[str, Any]] = {
    "HITL-88219": {
        "id": "HITL-88219",
        "type": "grant_access_request",
        "action_type": "grant_access_request",
        "userId": "alex.chen@corp.internal",
        "userName": "Alex Chen",
        "resourceName": "Production AWS Snowflake Analytics DB",
        "approverId": "marcus.vance@corp.internal",
        "approverName": "Marcus Vance (Cloud Lead)",
        "status": "pending_approval",
        "verificationMethod": "Manager_Signoff",
        "justification": "Quarterly compliance telemetry audit and pipeline diagnostics",
        "requestedAt": "2026-08-30T14:00:00Z",
        "ticketId": "KAN-104"
    }
}

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
        "createdByName": "Alex Chen",
        "assignedTo": "elena.rostova@corp.internal",
        "createdAt": "2026-08-24T09:15:00Z",
        "updatedAt": "2026-08-24T09:30:00Z"
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
        "createdByName": "Priya Sharma",
        "approverId": "marcus.vance@corp.internal",
        "createdAt": "2026-08-25T11:00:00Z",
        "updatedAt": "2026-08-25T11:00:00Z"
    },
    {
        "id": "KAN-103",
        "platform": "JIRA",
        "title": "External Dell 4K display flickering when connected to CalDigit TS4 dock",
        "description": "Dual monitor setup flickers on macOS 15.1 after waking from sleep.",
        "status": "In Progress",
        "priority": "Medium",
        "category": "Hardware & Peripherals",
        "createdBy": "alex.chen@corp.internal",
        "createdByName": "Alex Chen",
        "assignedTo": "elena.rostova@corp.internal",
        "createdAt": "2026-08-26T10:00:00Z",
        "updatedAt": "2026-08-26T10:00:00Z"
    }
]

AUDIT_LOGS_DB: List[Dict[str, Any]] = []

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
    created_by_name: Optional[str] = None

class VerifyOTPRequest(BaseModel):
    hitl_id: str
    otp_code: str
    user_id: Optional[str] = None

class ResolveApprovalRequest(BaseModel):
    hitl_id: str
    approved: bool
    approver_email: str
    approver_name: str

class EscalateTicketRequest(BaseModel):
    reason: Optional[str] = "User requested priority escalation"

class CloseTicketRequest(BaseModel):
    resolution_notes: Optional[str] = "Resolved via HelpDeskGenie service desk"

from backend.app.jira_client import jira_client

class JiraConfigRequest(BaseModel):
    instance_url: str
    project_key: Optional[str] = "ITSD"

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

@app.get("/api/jira/status")
def get_jira_status():
    return jira_client.test_connection()

@app.post("/api/jira/config")
def update_jira_config(req: JiraConfigRequest):
    import os
    clean_url = req.instance_url.strip().rstrip("/")
    os.environ["JIRA_INSTANCE_URL"] = clean_url
    if req.project_key:
        os.environ["JIRA_PROJECT_KEY"] = req.project_key.strip()
    jira_client.reload_config()
    return jira_client.test_connection()

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
        "mobile": "+1 (555) 000-1122",
        "is_locked": False,
        "auth_source": "ADMIN_INVITE",
        "status": "invited"
    }

    return {"success": True, "invite": invite}

# ----------------- HITL Endpoints (Section 5.2) -----------------

@app.post("/api/hitl/otp/verify")
def verify_otp(req: VerifyOTPRequest):
    hitl_req = PENDING_HITL_DB.get(req.hitl_id)
    code = req.otp_code.strip()
    
    # Accept 749216, 123456 or standard 6-digit verification in sandbox
    if code in ["749216", "123456"] or len(code) == 6:
        if hitl_req:
            hitl_req["status"] = "completed"
            hitl_req["completedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")

        # Unlock user if target was locked
        target_user = req.user_id or (hitl_req.get("userId") if hitl_req else "alex.chen@corp.internal")
        if target_user and target_user in USERS_DB:
            USERS_DB[target_user]["is_locked"] = False

        msg = f"Active Directory account has been successfully unlocked and bad password count cleared in AD sandbox." if (hitl_req and hitl_req.get("type") == "unlock_account") else f"Temporary password reset link dispatched to registered user via secure SMS/email channel."

        return {
            "success": True,
            "message": msg,
            "request": hitl_req
        }
    
    return {
        "success": False,
        "message": "Incorrect verification code. Please enter the 6-digit OTP code sent to your registered device (Hint: 749216)."
    }

@app.post("/api/hitl/approval/resolve")
def resolve_approval(req: ResolveApprovalRequest):
    hitl_req = PENDING_HITL_DB.get(req.hitl_id)
    if not hitl_req:
        hitl_req = {
            "id": req.hitl_id,
            "type": "grant_access_request",
            "userId": "alex.chen@corp.internal",
            "userName": "Alex Chen",
            "resourceName": "Production AWS Snowflake Analytics DB",
            "approverId": req.approver_email,
            "approverName": req.approver_name,
            "status": "pending_approval"
        }
        PENDING_HITL_DB[req.hitl_id] = hitl_req

    hitl_req["status"] = "approved" if req.approved else "rejected"
    hitl_req["completedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
    hitl_req["approvedBy"] = f"{req.approver_name} ({req.approver_email})"

    # Update ticket status if attached
    if hitl_req.get("ticketId"):
        for t in TICKETS_DB:
            if t["id"] == hitl_req["ticketId"]:
                t["status"] = "Resolved" if req.approved else "Closed"

    resource_name = hitl_req.get("resourceName", "Production Access")
    msg = f"Access to {resource_name} granted by {req.approver_name}. Provisioned to Active Directory Security Group." if req.approved else f"Access request for {resource_name} was denied by {req.approver_name}."

    return {
        "success": True,
        "message": msg,
        "request": hitl_req
    }

@app.get("/api/hitl/pending")
def get_pending_hitl(approver_email: Optional[str] = None):
    requests = list(PENDING_HITL_DB.values())
    if approver_email:
        norm = approver_email.lower().strip()
        requests = [r for r in requests if r.get("approverId", "").lower() == norm or norm in ["admin@corp.internal", "marcus.vance@corp.internal"]]
    return requests

# ----------------- Ticketing Endpoints -----------------

@app.get("/api/tickets")
def get_tickets(user_email: Optional[str] = None, role: Optional[str] = "it_admin"):
    if role == "employee" and user_email:
        return [t for t in TICKETS_DB if t["createdBy"].lower() == user_email.lower().strip()]
    return TICKETS_DB

@app.post("/api/tickets/create")
def create_ticket(req: CreateTicketRequest):
    platform = req.platform or "JIRA"
    external_url = None
    if platform == "JIRA" and jira_client.is_configured():
        jira_res = jira_client.create_issue(
            summary=req.title,
            description=req.description,
            priority=req.priority
        )
        if jira_res.get("success") and jira_res.get("key"):
            ticket_id = jira_res["key"]
            external_url = jira_res["url"]
        else:
            ticket_id = f"KAN-{len(TICKETS_DB) + 104}"
    else:
        ticket_id = f"KAN-{len(TICKETS_DB) + 104}" if platform == "JIRA" else f"INC00{int(time.time() % 100000)}"

    if not external_url:
        external_url = f"{jira_client.instance_url}/browse/{ticket_id}" if platform == "JIRA" else f"https://dev354821.service-now.com/nav_to.do?uri=incident.do?sys_id={ticket_id}"

    new_ticket = {
        "id": ticket_id,
        "platform": platform,
        "title": req.title,
        "description": req.description,
        "status": "Open",
        "priority": req.priority,
        "category": req.category,
        "createdBy": req.created_by,
        "createdByName": req.created_by_name or req.created_by.split("@")[0],
        "assignedTo": "elena.rostova@corp.internal" if platform == "JIRA" else "HelpDeskGenie-Automated",
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "externalUrl": external_url
    }
    TICKETS_DB.insert(0, new_ticket)
    return new_ticket

@app.post("/api/tickets/{ticket_id}/escalate")
def escalate_ticket(ticket_id: str, req: EscalateTicketRequest):
    for t in TICKETS_DB:
        if t["id"].lower() == ticket_id.lower().strip():
            t["priority"] = "Urgent"
            t["updatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
            return {"success": True, "ticket": t}
    raise HTTPException(status_code=404, detail="Ticket not found")

@app.post("/api/tickets/{ticket_id}/close")
def close_ticket(ticket_id: str, req: CloseTicketRequest):
    for t in TICKETS_DB:
        if t["id"].lower() == ticket_id.lower().strip():
            t["status"] = "Resolved"
            t["resolutionNotes"] = req.resolution_notes
            t["updatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
            return {"success": True, "ticket": t}
    raise HTTPException(status_code=404, detail="Ticket not found")

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
        if state.get("active_hitl"):
            PENDING_HITL_DB[state["active_hitl"]["id"]] = state["active_hitl"]
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

