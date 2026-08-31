import { KBArticle } from '../types';

export const INITIAL_KB_ARTICLES: KBArticle[] = [
  {
    id: 'KB-1001',
    title: 'GlobalProtect VPN Setup & Troubleshooting (macOS & Windows)',
    category: 'VPN & Network',
    summary: 'Step-by-step instructions to install, authenticate, and resolve connection errors on Palo Alto GlobalProtect VPN.',
    content: `### 1. Installation
1. Download the official installer from the internal software portal at https://software.corp.internal/vpn.
2. Run the pkg (macOS) or msi (Windows) installer and accept security permissions.
3. On macOS Sequoia/Sonoma: Navigate to System Settings > Privacy & Security > Allow GlobalProtect Network Extension.

### 2. Portal Configuration
- Portal Address: \`vpn.corp.company.com\`
- Enter your corporate email and SSO credentials.
- When prompted for MFA, approve the push on Microsoft Authenticator.

### 3. Common Error Fixes
- **Error 503 / Connection Refused**: Check if your home Wi-Fi DNS is blocking internal domains. Switch to 1.1.1.1 or 8.8.8.8.
- **Gateway Not Reachable**: Confirm you are disconnected from any personal VPNs (NordVPN, Tailscale).
- **Certificate Expired**: Run the Certificate Sync tool or clear cached portal credentials in GlobalProtect Settings > General > Clear Saved Credentials.`,
    sourceUrl: 'https://confluence.corp.internal/wiki/spaces/IT/pages/1001/GlobalProtect+VPN',
    lastUpdated: '2026-08-15',
    tags: ['vpn', 'globalprotect', 'network', 'macos', 'windows', 'remote-work'],
    resolvedTicketCount: 142
  },
  {
    id: 'KB-1002',
    title: 'Active Directory Password Policy & Self-Service Reset Guidelines',
    category: 'Identity & Access',
    summary: 'Corporate AD password requirements, expiration cadences, and identity verification rules for password resets.',
    content: `### Password Complexity Requirements
- Minimum length: 14 characters
- Must include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol (!@#$%^&*).
- Cannot reuse any of the last 10 passwords.
- Passwords expire every 90 days for standard accounts and 60 days for privileged/IT admins.

### Self-Service Reset & Identity Verification Policy
- HelpDeskGenie requires two-factor authentication (OTP via registered mobile number or Microsoft Authenticator) before resetting any AD password.
- No automated resets are permitted for Domain Admin or Executive accounts without manual Service Desk Lead sign-off.
- If your account is locked due to 5 consecutive failed attempts, it can be unlocked via HelpDeskGenie with OTP verification.`,
    sourceUrl: 'https://confluence.corp.internal/wiki/spaces/SEC/pages/1002/Password+Policy',
    lastUpdated: '2026-08-01',
    tags: ['password', 'active-directory', 'mfa', 'security', 'unlock', 'ldap'],
    resolvedTicketCount: 310
  },
  {
    id: 'KB-1003',
    title: 'Production AWS & Snowflake Access Approval Workflow',
    category: 'Identity & Access',
    summary: 'Standard operating procedure for requesting elevated cloud and database permissions.',
    content: `### Approval Matrix
- **AWS Production ReadOnly**: Requires Engineering Lead or Tech Director approval.
- **AWS Production ReadWrite / IAM**: Requires VP of Infrastructure and Security Officer approval.
- **Snowflake Analytics Prod**: Requires Data Platform Lead (approver: \`data-lead@corp.internal\`).
- **Production Postgres DB**: Requires Core Backend Lead (approver: \`db-admin@corp.internal\`).

### Request Procedure
1. Requests submitted through HelpDeskGenie are automatically routed to the designated approver's queue.
2. Approvals are valid for a maximum of 30 days unless perpetual access is justified by a project sponsor.
3. All access grants are logged in the immutable Security Audit Trail.`,
    sourceUrl: 'https://confluence.corp.internal/wiki/spaces/SEC/pages/1003/Access+Approval+Matrix',
    lastUpdated: '2026-07-20',
    tags: ['aws', 'snowflake', 'access', 'hitl', 'approval', 'database'],
    resolvedTicketCount: 89
  },
  {
    id: 'KB-1004',
    title: 'Apple MacBook Pro DisplayPort & External Monitor Troubleshooting',
    category: 'Hardware & Peripherals',
    summary: 'Remediation guide for external monitor black screen, flickering, or resolution scaling issues on M1/M2/M3 MacBooks.',
    content: `### Steps to Resolve Display Issues:
1. **Power Cycle Dock/Hub**: Unplug the CalDigit / Dell USB-C dock from power for 30 seconds, then reconnect.
2. **Reset NVRAM/Display Cache**:
   - Disconnect the USB-C cable.
   - Go to System Settings > Displays.
   - Hold Option and click "Detect Displays".
3. **Firmware Check**: Ensure DisplayLink Manager or Thunderbolt firmware is updated via Company Portal.
4. **Hardware Swap**: If flickering persists on HDMI, request a certified Thunderbolt 4 to DisplayPort 1.4 cable via IT hardware store.`,
    sourceUrl: 'https://confluence.corp.internal/wiki/spaces/IT/pages/1004/MacBook+Monitors',
    lastUpdated: '2026-08-10',
    tags: ['macbook', 'monitors', 'display', 'hardware', 'caldigit', 'dock'],
    resolvedTicketCount: 67
  },
  {
    id: 'KB-1005',
    title: 'Slack Workspace & Microsoft 365 Outlook Mail Sync Issues',
    category: 'Email & SaaS',
    summary: 'Resolving disconnected Slack sessions, Microsoft 365 token expiration, and Outlook search indexing failures.',
    content: `### Outlook Sync Repair
1. Open Outlook > Tools / File > Account Settings.
2. Click **Repair Account** to re-authenticate OAuth2 tokens.
3. If search fails: Go to Settings > Search > Rebuild Search Index.

### Slack App Troubleshooting
1. Open Slack > Help > Troubleshooting > Clear Cache and Restart.
2. If SSO loop occurs: Log out of your default browser's Okta session and log in again.`,
    sourceUrl: 'https://confluence.corp.internal/wiki/spaces/IT/pages/1005/SaaS+Sync+Guide',
    lastUpdated: '2026-06-18',
    tags: ['slack', 'outlook', 'email', 'microsoft365', 'okta', 'sync'],
    resolvedTicketCount: 114
  }
];
