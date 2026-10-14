import httpx
from typing import Dict, Any, List, Optional
import os

class OpenWebUIAdapter:
    """
    Isolated, versioned adapter for all upstream communication with Open WebUI.
    Guarantees no direct monkeypatching or fragile database coupling.
    Target verified release: Open WebUI v0.12.0
    """
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or os.getenv("PAW_OPENWEBUI_URL", "http://localhost:3001")).rstrip("/")
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=30.0)

    async def close(self):
        await self.client.aclose()

    async def health(self) -> Dict[str, Any]:
        """Check upstream health endpoint."""
        try:
            resp = await self.client.get("/health")
            if resp.status_code == 200:
                return {"status": "ok", "upstream_healthy": True}
            return {"status": "degraded", "upstream_healthy": False, "code": resp.status_code}
        except Exception as e:
            return {"status": "unreachable", "upstream_healthy": False, "error": str(e)}

    async def get_models(self, token: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieve available models via /api/models."""
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        resp = await self.client.get("/api/models", headers=headers)
        resp.raise_for_status()
        data = resp.json()
        return data.get("data", []) if isinstance(data, dict) else data

    async def signin(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate user against Open WebUI auth endpoint."""
        payload = {"email": email, "password": password}
        resp = await self.client.post("/api/v1/auths/signin", json=payload)
        resp.raise_for_status()
        return resp.json()

    async def get_memories(self, token: str) -> List[Dict[str, Any]]:
        """Fetch memories via /api/v1/memories/."""
        headers = {"Authorization": f"Bearer {token}"}
        resp = await self.client.get("/api/v1/memories/", headers=headers)
        resp.raise_for_status()
        return resp.json()

    async def add_memory(self, token: str, content: str) -> Dict[str, Any]:
        """Add new memory item."""
        headers = {"Authorization": f"Bearer {token}"}
        payload = {"content": content}
        resp = await self.client.post("/api/v1/memories/add", json=payload, headers=headers)
        resp.raise_for_status()
        return resp.json()

    async def delete_memory(self, token: str, memory_id: str) -> Dict[str, Any]:
        """Delete specific memory."""
        headers = {"Authorization": f"Bearer {token}"}
        resp = await self.client.delete(f"/api/v1/memories/{memory_id}", headers=headers)
        resp.raise_for_status()
        return resp.json()

    async def list_automations(self, token: str) -> List[Dict[str, Any]]:
        """Fetch scheduled automations."""
        headers = {"Authorization": f"Bearer {token}"}
        resp = await self.client.get("/api/v1/automations/list", headers=headers)
        resp.raise_for_status()
        data = resp.json()
        return data.get("items", []) if isinstance(data, dict) else data
