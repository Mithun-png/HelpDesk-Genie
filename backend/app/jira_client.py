import os
import base64
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

class JiraClient:
    def __init__(self):
        self.reload_config()

    def reload_config(self):
        self.instance_url = os.getenv("JIRA_INSTANCE_URL", "https://your-domain.atlassian.net").strip().rstrip("/")
        self.user_email = os.getenv("JIRA_USER_EMAIL", "").strip()
        self.api_token = os.getenv("JIRA_API_TOKEN", "").strip()
        self.project_key = os.getenv("JIRA_PROJECT_KEY", "ITSD").strip()

    def is_configured(self) -> bool:
        return (
            bool(self.instance_url)
            and "your-domain" not in self.instance_url
            and "corp.internal" not in self.instance_url
            and bool(self.user_email)
            and bool(self.api_token)
        )

    def _get_auth_header(self) -> str:
        auth_str = f"{self.user_email}:{self.api_token}"
        return f"Basic {base64.b64encode(auth_str.encode()).decode()}"

    def test_connection(self) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "success": False,
                "message": f"Jira instance URL is currently set to '{self.instance_url}'. Please provide your actual Atlassian Cloud domain (e.g. https://your-workspace.atlassian.net).",
                "is_sandbox": True
            }
        
        try:
            req = urllib.request.Request(
                f"{self.instance_url}/rest/api/3/myself",
                headers={
                    "Authorization": self._get_auth_header(),
                    "Accept": "application/json"
                }
            )
            with urllib.request.urlopen(req, timeout=10) as res:
                data = json.loads(res.read().decode())
                return {
                    "success": True,
                    "displayName": data.get("displayName"),
                    "emailAddress": data.get("emailAddress"),
                    "accountId": data.get("accountId"),
                    "instanceUrl": self.instance_url
                }
        except urllib.error.HTTPError as e:
            return {
                "success": False,
                "statusCode": e.code,
                "message": f"Atlassian API returned HTTP {e.code}: {e.reason}"
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Failed to connect to Atlassian Jira: {str(e)}"
            }

    def create_issue(
        self,
        summary: str,
        description: str,
        issue_type: str = "Task",
        priority: str = "Medium"
    ) -> Dict[str, Any]:
        if not self.is_configured():
            # In Sandbox mode
            return {
                "is_sandbox": True,
                "message": "Created in local HelpDeskGenie Jira Sandbox"
            }

        payload = {
            "fields": {
                "project": {"key": self.project_key},
                "summary": summary,
                "issuetype": {"name": issue_type},
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "text": description
                                }
                            ]
                        }
                    ]
                }
            }
        }

        try:
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                f"{self.instance_url}/rest/api/3/issue",
                data=req_data,
                headers={
                    "Authorization": self._get_auth_header(),
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            )
            with urllib.request.urlopen(req, timeout=12) as res:
                data = json.loads(res.read().decode())
                key = data.get("key")
                return {
                    "success": True,
                    "key": key,
                    "id": data.get("id"),
                    "url": f"{self.instance_url}/browse/{key}"
                }
        except Exception as e:
            return {
                "success": False,
                "is_sandbox": True,
                "error": str(e)
            }

jira_client = JiraClient()
