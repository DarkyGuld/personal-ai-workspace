import pytest
from httpx import AsyncClient, ASGITransport
import os
import shutil
import pytest_asyncio

from apps.api.main import app, library_store

@pytest_asyncio.fixture
async def client():
    # Setup test directories
    os.environ["PAW_DATA_DIR"] = "./test_api_data"
    os.makedirs("./test_api_data/sqlite", exist_ok=True)
    os.makedirs("./test_api_data/library", exist_ok=True)
    library_store.db_path = "./test_api_data/sqlite/paw_metadata.db"
    library_store.storage_dir = "./test_api_data/library"
    await library_store.init_db()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    if os.path.exists("./test_api_data"):
        shutil.rmtree("./test_api_data", ignore_errors=True)

@pytest.mark.asyncio
async def test_health_endpoint(client):
    response = await client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "0.1.0"

@pytest.mark.asyncio
async def test_capabilities_endpoint(client):
    response = await client.get("/api/v1/capabilities")
    assert response.status_code == 200
    data = response.json()
    assert data["intelligent_ui_supported"] is True
    assert data["library_enabled"] is True
    assert "intelligent_ui" in data["features"]
    assert "document_creation" in data["features"]

@pytest.mark.asyncio
async def test_artifact_generation_and_library_registration(client):
    # 1. Generate an XLSX artifact via API
    payload = {
        "kind": "xlsx",
        "title": "Quarterly Budget",
        "data": {
            "headers": ["Category", "Amount"],
            "rows": [["Cloud", 120], ["API", 80]]
        }
    }
    gen_resp = await client.post("/api/v1/artifacts/generate", json=payload)
    assert gen_resp.status_code == 200
    gen_data = gen_resp.json()
    assert gen_data["kind"] == "xlsx"
    assert "download_url" in gen_data
    assert gen_data["library_item_id"] is not None

    # 2. Check that the item is immediately present and searchable in the Library
    lib_resp = await client.get("/api/v1/library/items")
    assert lib_resp.status_code == 200
    items = lib_resp.json()["items"]
    assert len(items) == 1
    assert items[0]["id"] == gen_data["library_item_id"]
    assert items[0]["filename"] == "quarterly_budget.xlsx"

    # 3. Test downloading the file and verifying binary content
    dl_resp = await client.get(gen_data["download_url"])
    assert dl_resp.status_code == 200
    assert len(dl_resp.content) > 100

@pytest.mark.asyncio
async def test_intelligent_ui_endpoint(client):
    payload = {
        "component_type": "calculator",
        "props": {
            "title": "Savings Growth Calculator",
            "initialDeposit": 1000,
            "monthlyInterest": 0.05
        },
        "initial_state": {"months": 12}
    }
    resp = await client.post("/api/v1/intelligent-ui/generate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "Savings Growth Calculator" in data["source_lang"]
    assert data["schema_version"] == "1.0.0"
    assert data["state"]["months"] == 12

@pytest.mark.asyncio
async def test_chat_completions_endpoint(client):
    payload = {
        "model": "deepseek-v4.1-flash",
        "messages": [
            {"role": "user", "content": "Hei, hvem er du?"}
        ]
    }
    resp = await client.post("/api/v1/chat/completions", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "choices" in data
    assert len(data["choices"]) > 0
    assert data["choices"][0]["message"]["role"] == "assistant"
    assert len(data["choices"][0]["message"]["content"]) > 0

