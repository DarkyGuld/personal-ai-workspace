import pytest
from httpx import AsyncClient, ASGITransport
import os
import shutil
import pytest_asyncio

from apps.api.main import app, library_store

@pytest_asyncio.fixture
async def client():
    os.environ["PAW_DATA_DIR"] = "./test_work_data"
    os.makedirs("./test_work_data/sqlite", exist_ok=True)
    os.makedirs("./test_work_data/library", exist_ok=True)
    library_store.db_path = "./test_work_data/sqlite/paw_metadata.db"
    library_store.storage_dir = "./test_work_data/library"
    await library_store.init_db()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    if os.path.exists("./test_work_data"):
        shutil.rmtree("./test_work_data")

@pytest.mark.asyncio
async def test_work_run_creation(client):
    payload = {
        "goal": "Analyser energiforbruk og lag rapport",
        "max_steps": 5,
        "budget_usd": 0.5
    }
    resp = await client.post("/api/v1/work/runs", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] is not None
    assert data["goal"] == payload["goal"]
    assert len(data["steps"]) >= 3
    assert data["status"] == "completed"

@pytest.mark.asyncio
async def test_deep_research_flow_and_library_export(client):
    # Perform deep research with automated source verification
    resp = await client.post("/api/v1/research/deep?query=OpenUI+arkitektur")
    assert resp.status_code == 200
    data = resp.json()
    assert data["query"] == "OpenUI arkitektur"
    assert len(data["sources"]) >= 2
    assert data["generated_artifact_id"] is not None

    # Verify that the generated research doc is stored in the Library
    lib_resp = await client.get("/api/v1/library/items")
    assert lib_resp.status_code == 200
    items = lib_resp.json()["items"]
    assert len(items) == 1
    assert items[0]["id"] == data["generated_artifact_id"]
    assert "research_" in items[0]["filename"]
