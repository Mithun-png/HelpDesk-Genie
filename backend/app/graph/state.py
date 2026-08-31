from typing import List, Dict, Any, Optional, TypedDict
from pydantic import BaseModel, Field

class KBSource(BaseModel):
    id: str
    title: str
    snippet: str
    similarity_score: float
    url: str
    category: str

class HITLState(BaseModel):
    id: str
    action_type: str
    user_id: str
    resource_name: Optional[str] = None
    approver_id: Optional[str] = None
    status: str = "pending"
    verification_method: str = "Twilio_SMS_OTP"
    otp_code: Optional[str] = None

class AgentState(TypedDict):
    conversation_id: str
    user_id: str
    user_role: str
    current_query: str
    messages: List[Dict[str, Any]]
    detected_intent: Optional[str]
    intent_confidence: float
    retrieved_docs: List[Dict[str, Any]]
    retrieval_confidence: float
    clarifying_turn_count: int
    active_hitl: Optional[Dict[str, Any]]
    tool_name: Optional[str]
    tool_arguments: Dict[str, Any]
    current_node: str
    audit_logs: List[Dict[str, Any]]
