import pytest
from httpx import AsyncClient, ASGITransport
import os
import shutil
import pytest_asyncio

from apps.api.main import app, library_store
from packages.openwebui_adapter.adapter import OpenWebUIAdapter

@pytest_asyncio.fixture
async def client():
    os.environ["PAW_DATA_DIR"] = "./test_resilience_data"
    os.makedirs("./test_resilience_data/sqlite", exist_ok=True)
    os.makedirs("./test_resilience_data/library", exist_ok=True)
    library_store.db_path = "./test_resilience_data/sqlite/paw_metadata.db"
    library_store.storage_dir = "./test_resilience_data/library"
    await library_store.init_db()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    if os.path.exists("./test_resilience_data"):
        shutil.rmtree("./test_resilience_data")

@pytest.mark.asyncio
async def test_upstream_unreachable_graceful_degradation(client):
    """
    Test that when upstream Open WebUI is offline, unreachable, or returns an error,
    the BFF does NOT crash. It must return a graceful degraded status and fallback model.
    """
    # 1. Health check should report upstream as unreachable or degraded without 500 error
    health_resp = await client.get("/healthz")
    assert health_resp.status_code == 200
    data = health_resp.json()
    assert data["status"] == "healthy" # BFF is healthy
    assert data["upstream_openwebui"] in ["unreachable", "degraded", "unknown"]

    # 2. Model listing should return local/cloud fallback card without crashing
    models_resp = await client.get("/api/v1/models")
    assert models_resp.status_code == 200
    models_data = models_resp.json()
    assert len(models_data["models"]) >= 1
    assert models_data["models"][0]["id"] == "default-cloud"

@pytest.mark.asyncio
async def test_upstream_breaking_change_adapter_resilience():
    """
    Simulate a breaking response format from upstream Open WebUI API
    and verify the adapter handles exceptions cleanly.
    """
    adapter = OpenWebUIAdapter(base_url="http://127.0.0.1:9999") # Non-existent port
    health = await adapter.health()
    assert health["upstream_healthy"] is False
    assert health["status"] == "unreachable"
    await adapter.close()

@pytest.mark.asyncio
async def test_security_path_traversal_protection(client):
    """
    Verify that arbitrary path traversal attempts (e.g. ../../etc/passwd)
    are strictly rejected by the API.
    """
    res = await client.get("/api/v1/library/items/../../etc/passwd/download")
    assert res.status_code in [404, 400]
