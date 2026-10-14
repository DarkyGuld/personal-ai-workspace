import pytest
from httpx import AsyncClient, ASGITransport
import os
import shutil
import pytest_asyncio

from apps.api.main import app, library_store

@pytest_asyncio.fixture
async def client():
    test_dir = "./test_agent_workflow_data"
    os.environ["PAW_DATA_DIR"] = test_dir
    os.makedirs(f"{test_dir}/sqlite", exist_ok=True)
    os.makedirs(f"{test_dir}/library", exist_ok=True)
    library_store.db_path = f"{test_dir}/sqlite/paw_metadata.db"
    library_store.storage_dir = f"{test_dir}/library"
    await library_store.init_db()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)

@pytest.mark.asyncio
async def test_end_to_end_agent_workflow(client):
    # Step 1: Initialize an autonomous agent work run
    work_payload = {
        "goal": "Analyser energiforbruk og markedsdata for 2026, generer rapport og eksporter til Library",
        "parameters": {"max_sources": 5, "require_approval": False}
    }
    work_resp = await client.post("/api/v1/work/runs", json=work_payload)
    assert work_resp.status_code == 200
    work_data = work_resp.json()
    assert work_data["status"] == "completed"
    assert len(work_data["steps"]) >= 3
    assert work_data["steps"][0]["action_type"] == "plan"
    assert work_data["steps"][1]["action_type"] == "search"

    # Step 2: Agent performs web research and verifies source citations
    research_resp = await client.post("/api/v1/research/deep?query=energiforbruk+norge+2026")
    assert research_resp.status_code == 200
    research_data = research_resp.json()
    assert len(research_data["sources"]) > 0
    # Every source citation must have valid url and reliability score
    for s in research_data["sources"]:
        assert s["url"].startswith("http")
        assert 0.0 <= s["reliability_score"] <= 1.0
    doc_id = research_data["generated_artifact_id"]
    assert doc_id is not None

    # Step 3: Agent generates final executive spreadsheet artifact with calculation results
    artifact_payload = {
        "kind": "xlsx",
        "title": "Energianalyse 2026",
        "data": {
            "headers": ["Kvartal", "Forbruk (GWh)", "Gjennomsnittspris (NOK/kWh)"],
            "rows": [
                ["Q1", 34500, 0.85],
                ["Q2", 21200, 0.45],
                ["Q3", 18900, 0.38],
                ["Q4", 32100, 0.79]
            ]
        }
    }
    art_resp = await client.post("/api/v1/artifacts/generate", json=artifact_payload)
    assert art_resp.status_code == 200
    sheet_item_id = art_resp.json()["library_item_id"]

    # Step 4: Verify that all agent artifacts are cataloged in central Library with deduplication
    lib_resp = await client.get("/api/v1/library/items")
    assert lib_resp.status_code == 200
    items = lib_resp.json()["items"]
    # Should contain research document + spreadsheet
    assert len(items) >= 2
    item_ids = [i["id"] for i in items]
    assert doc_id in item_ids
    assert sheet_item_id in item_ids

    # Step 5: Test marking artifact as favorite and downloading binary verification
    fav_resp = await client.post(f"/api/v1/library/items/{sheet_item_id}/favorite")
    assert fav_resp.status_code == 200
    assert fav_resp.json()["is_favorite"] is True

    download_resp = await client.get(f"/api/v1/library/items/{sheet_item_id}/download")
    assert download_resp.status_code == 200
    assert len(download_resp.content) > 1000  # valid XLSX zip package
    # XLSX binary signature PK\x03\x04
    assert download_resp.content.startswith(b"PK\x03\x04")
