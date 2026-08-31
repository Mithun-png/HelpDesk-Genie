# HelpDeskGenie – Conversational IT Service Desk Assistant

## 1. Overview

HelpDeskGenie is a conversational AI layer that sits on top of an organization's existing IT tools (Confluence, JIRA, ServiceNow, AD/LDAP) instead of replacing them. It answers IT questions using retrieval-augmented generation (RAG), takes safe self-service actions where appropriate, and routes anything sensitive or ambiguous to a human — with a full audit trail of every decision and action.

## 2. Business Constraints

- Must align with company IT security policies — no auto-unlock or auto-access-grant without proper identity/approval checks
- Hallucination-controlled responses — no invented remediation steps for critical systems
- Lightweight chat interface — usable on web, mobile, Slack, and Teams
- Integrates with existing tools (JIRA, Confluence, ServiceNow, AD/LDAP) rather than replacing them
- Full audit trail of every action the agent takes

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Orchestration | LangChain + LangGraph |
| LLM | Google Gemini |
| Vector store | Pinecone |
| Backend API | FastAPI (Python) |
| Ticketing | JIRA REST API (sandbox) |
| ITSM | ServiceNow Table API (sandbox) |
| Identity | AD/LDAP via `ldap3` / Microsoft Graph API (sandbox) |
| OTP/Verification | Twilio Verify (or internal MFA hook) |
| Database | PostgreSQL + SQLAlchemy |
| Auth | AD/LDAP-backed login (employees) + admin invite-flow accounts (agents/approvers), JWT sessions |
| Frontend | React + TypeScript + Tailwind CSS |
| Chat channels | Slack Bolt SDK, Microsoft Bot Framework (Teams) |
| Evaluation | Custom harness + Ragas, Pandas for scoring |
| Deployment | Render (backend), Vercel (frontend) |
| Scheduling | APScheduler (periodic Confluence re-indexing) |

Real sandbox accounts will be used for JIRA, ServiceNow, and AD/LDAP integrations rather than fully mocked APIs.

## 4. Architecture — LangGraph Flow

The agent is modeled as a LangGraph state machine rather than a single linear chain, since requests can branch into retrieval, direct tool execution, or human handoff, and can require more than one of these in the same conversation.

```
User Query
    │
    ▼
[Intent Classifier Node] ── classifies into:
    │        ├── Informational
    │        ├── Actionable (safe / auto-executable)
    │        ├── Actionable (needs approval / HITL)
    │        └── Ambiguous / Out-of-scope
    │
    ├── Informational ──▶ [RAG Retrieval Node] ──▶ [Grounded Answer Node] ──▶ Response
    │                                                     │
    │                                          (low retrieval confidence)
    │                                                     ▼
    │                                          [Clarify / Escalate Node]
    │
    ├── Actionable (safe) ──▶ [Tool Execution Node] ──▶ [Audit Log Node] ──▶ Response
    │        (create_ticket, check_ticket_status, escalate_ticket, close_ticket)
    │
    ├── Actionable (needs approval) ──▶ [Human-in-the-Loop Node] ──▶ [Approver Notification]
    │        (unlock_account, reset_password, grant_access_request)          │
    │                                                              (approved/denied)
    │                                                                        ▼
    │                                                          [Tool Execution Node] ──▶ [Audit Log Node]
    │
    └── Ambiguous / Out-of-scope ──▶ [Clarify / Escalate Node]
                                              │
                                    (still unresolved after 1-2 clarifying turns)
                                              ▼
                                    [Human Handoff Node] ──▶ Live agent / ticket queue
```

## 5. Core Design Principles

### 5.1 RAG-First, Hallucination-Controlled Answers
- Every informational answer must be grounded in retrieved Confluence/runbook/resolved-ticket content, with the source article linked in the response.
- A **retrieval confidence threshold** is enforced: if Pinecone similarity scores fall below the threshold, the agent does **not** generate a free-form answer. Instead it triggers the Clarify/Escalate node.
- The system prompt explicitly instructs Gemini to say "I don't have a confirmed answer for this in the knowledge base" rather than inferring a remediation step, especially for anything touching critical systems (VPN infra, AD, production access).
- Clarifying questions are asked before generation when the query is under-specified (e.g., "are you on VPN or office network?").

### 5.2 Human-in-the-Loop (HITL) for Sensitive Actions
- `unlock_account`, `reset_password`, and `grant_access_request` are **never auto-executed**.
- Flow: agent raises the request → identity verification step (OTP/MFA) → for `grant_access_request`, the request is routed to the named `approver_id` and paused in a "pending approval" state → only on explicit approval does the Tool Execution node fire.
- LangGraph's interrupt/checkpoint mechanism is used to pause the graph at the HITL node and resume once approval or verification is received, rather than handling this as a separate out-of-band process.
- Every HITL decision (who approved, when, verification method used) is written to the audit log.

### 5.3 Escalation to a Human When the Bot Can't Resolve It
- If the user's query falls outside the KB (no relevant retrieval match), or the intent classifier can't confidently categorize it after clarifying turns, the agent hands off to a human — either by creating a ticket routed to a live agent queue, or by handing off the chat session directly (channel-dependent: e.g., Slack handoff to a support channel).
- The user is told plainly that the bot could not resolve the issue and that a human will follow up, rather than being given a low-confidence guess.

### 5.4 Full Audit Trail
- Every classification decision, tool call, HITL approval/denial, and escalation is logged to PostgreSQL with timestamp, user ID, and outcome.
- This audit trail is also the raw data source for the Iteration 3 evaluation report.

## 6. Iteration Plan

### Iteration 1 — Confluence-Based Troubleshooting Assistant
- Natural language IT queries answered via RAG over Confluence KB, runbooks, and resolved-ticket summaries
- Step-by-step troubleshooting output with source KB links
- Clarifying follow-up questions on ambiguous queries
- Conversational Q&A for password policies, software install requests, access procedures

### Iteration 2 — Ticketing & Self-Service Remediation
- Router classifies each request: informational (→ RAG) vs. actionable (→ tool call); some requests need both
- Tools:
  - `create_ticket(user_id, issue_type, description)` — via JIRA API
  - `check_ticket_status(ticket_id)`
  - `unlock_account(user_id)` — HITL, identity verification required
  - `reset_password(user_id)` — HITL, OTP/verification flow
  - `grant_access_request(user_id, resource, approver_id)` — HITL, routed to approver, never auto-executed
  - `escalate_ticket(ticket_id, priority)`
  - `close_ticket(ticket_id, resolution_notes)`

### Iteration 3 — Evaluation
- Golden dataset of common IT queries with expected KB answers → measure retrieval accuracy and hallucination rate
- Golden dataset for intent classification: informational vs. actionable vs. needs-approval
- False-positive rate on auto-remediation tools (e.g., was `unlock_account` ever called without proper identity verification?)
- Prompt/model comparison for ticket categorization accuracy against real historical JIRA ticket labels
- Evaluation report with scores and failure-case analysis

### Stretch Goal — Admin Dashboard & Tracking
- Per-user ticket history and recurring-issue detection
- Admin dashboard: open vs. resolved tickets by category, most common issue types, auto-remediation success rate vs. manual escalation rate
- Adaptive response style based on user technical level

## 7. Resolved Decisions

### 7.1 Sandbox Tenants & Credentials
- Use non-production JIRA and ServiceNow projects only, plus a dedicated test AD/LDAP or identity-provider sandbox.
- The assistant is never granted broad production admin rights — service accounts are scoped to the sandbox tenants only.

### 7.2 Retrieval Confidence Threshold
- Start conservative. Below the threshold, the agent does not improvise an answer — it shows the relevant KB links it did find, asks a clarifying question, and offers to create a ticket if the user still isn't resolved.
- The exact threshold value is tuned later using the Iteration 3 evaluation results.

### 7.3 Clarifying-Turn Limit
- Maximum of **two** focused clarifying follow-ups.
- If still unresolved after that, the agent hands off to a human with full context attached: the conversation transcript, detected intent, retrieved KB sources, and the specific missing details that blocked resolution.

### 7.4 Approver Assignment Logic
- Start with a **static, auditable resource-to-approver map** for `grant_access_request`.
- Dynamic AD/HR-based manager lookup is a later enhancement, only introduced after validating HR/manager data quality and adding explicit checks against self-approval and stale-manager records.

### 7.5 Slack/Teams Handoff Definition
- To be finalized: whether handoff means creating a JIRA/ServiceNow ticket, routing to a staffed live-agent channel, or both.
- Must define, alongside the handoff mechanism: ownership of the escalated request, SLA for human response, and after-hours behavior (e.g., queue vs. on-call vs. next-business-day).

## 8. Authentication & Roles

Login and role separation were not in the original scope but are required for the HITL approval flow and audit trail to be meaningful — an approval or ticket needs to resolve to a specific, accountable individual rather than an anonymous session.

### 8.1 Employee (User) Login
- Employees authenticate against the same AD/LDAP sandbox already used for `unlock_account`/`reset_password`, rather than a separate auth table.
- This keeps identity consistent everywhere: the person answering a chat query, the person named on a ticket, and the person being identity-verified for a sensitive action are all resolved from the one AD/LDAP source.
- On successful AD/LDAP authentication, a session token (JWT) is issued; the authenticated user's email/user ID is attached automatically to every chat message and ticket they raise — they don't need to re-enter it manually.

### 8.2 Agent / Approver Login
- Agent and approver accounts are **admin-created**, via a simple signup/invite flow rather than open self-registration or a single shared password.
- Each agent/approver has their own individual credentials, so every action they take (closing a ticket, approving an access request) is attributable to that specific person in the audit log.
- Role-based access is enforced at the API layer: `employee` role can only see their own chats/tickets; `agent`/`approver` role can see the ticket queue, pending approvals, and the audit viewer.

### 8.3 Ticket ID Handling
- Ticket IDs shown to the user are JIRA's native ID (e.g., `ITSD-1042`), returned directly from the JIRA API response — no separate internal ID scheme is layered on top.
- The ticket is created with the authenticated user's email as the reporter, and the JIRA ID is stored in the PostgreSQL audit table linked to that user and the originating conversation ID, so `check_ticket_status()` can look tickets up either by ID or by the user's identity.

## 9. Remaining Open Questions / To Be Decided

- [ ] Exact numeric retrieval confidence threshold (pending Iteration 3 evaluation data)
- [ ] Final handoff mechanism for Slack/Teams (ticket vs. live channel vs. both) and associated SLA/after-hours policy
- [ ] Timeline and criteria for introducing dynamic AD-based approver lookup
- [ ] Invite-flow details for agent/approver provisioning (who sends invites, expiry, email verification step)
- [ ] Session/token expiry policy for employee JWT sessions issued after AD/LDAP login
