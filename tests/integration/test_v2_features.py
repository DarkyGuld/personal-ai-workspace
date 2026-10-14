import pytest
import os
import shutil
import tempfile
from fastapi.testclient import TestClient
from apps.api.main import app, library_store

@pytest.fixture(scope="module")
def client():
    # Setup test directory
    temp_dir = tempfile.mkdtemp(prefix="paw_v2_test_")
    orig_db = library_store.db_path
    orig_storage = library_store.storage_dir

    library_store.db_path = os.path.join(temp_dir, "test_v2.db")
    library_store.storage_dir = os.path.join(temp_dir, "storage")
    os.makedirs(library_store.storage_dir, exist_ok=True)

    with TestClient(app) as test_client:
        yield test_client

    # Teardown
    library_store.db_path = orig_db
    library_store.storage_dir = orig_storage
    shutil.rmtree(temp_dir, ignore_errors=True)

def test_projects_crud_lifecycle(client):
    # 1. Create project
    create_payload = {
        "name": "Q3 Growth Initiative",
        "description": "Strategic planning and revenue projections",
        "icon": "rocket",
        "system_prompt": "You are a senior growth strategist focusing on SaaS metrics and CAC/LTV."
    }
    res = client.post("/api/v1/projects", json=create_payload)
    assert res.status_code == 200, res.text
    data = res.json()
    project_id = data["id"]
    assert data["name"] == "Q3 Growth Initiative"
    assert data["icon"] == "rocket"
    assert "SaaS metrics" in data["system_prompt"]

    # 2. List projects
    res_list = client.get("/api/v1/projects")
    assert res_list.status_code == 200
    list_data = res_list.json()
    assert list_data["total"] >= 1
    found = any(p["id"] == project_id for p in list_data["projects"])
    assert found

    # 3. Get single project
    res_get = client.get(f"/api/v1/projects/{project_id}")
    assert res_get.status_code == 200
    assert res_get.json()["id"] == project_id

    # 4. Project context injected in chat completion
    chat_payload = {
        "model": "deepseek-v4.1-flash",
        "messages": [{"role": "user", "content": "Hva er kjernefokuset vårt?"}],
        "project_id": project_id
    }
    chat_res = client.post("/api/v1/chat/completions", json=chat_payload)
    assert chat_res.status_code == 200
    # Chat succeeds with project context attached
    assert len(chat_res.json()["choices"]) > 0

    # 5. Delete project
    del_res = client.delete(f"/api/v1/projects/{project_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deleted"

    # Verify not found
    res_get2 = client.get(f"/api/v1/projects/{project_id}")
    assert res_get2.status_code == 404

def test_library_search_and_auto_retrieval(client):
    # Register test items in library
    res1 = client.post("/api/v1/artifacts/generate", json={
        "kind": "xlsx",
        "title": "Quarterly Financial Analysis 2026",
        "data": {"headers": ["Metric", "Value"], "rows": [["MRR", 50000], ["Churn", 0.02]]}
    })
    assert res1.status_code == 200
    item_id = res1.json()["library_item_id"]

    res2 = client.post("/api/v1/artifacts/generate", json={
        "kind": "pdf",
        "title": "Security Guidelines",
        "data": {"text": "Zero-trust network architecture and credential hygiene."}
    })
    assert res2.status_code == 200

    # 1. Search library specifically for financial analysis
    search_payload = {
        "query": "Financial Analysis",
        "limit": 5
    }
    search_res = client.post("/api/v1/library/search", json=search_payload)
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert search_data["total"] >= 1
    top_hit = search_data["results"][0]
    assert "quarterly_financial_analysis" in top_hit["filename"].lower()
    assert top_hit["score"] > 0

    # 2. Chat completion with auto_library_retrieval enabled
    chat_payload = {
        "model": "deepseek-v4.1-flash",
        "messages": [{"role": "user", "content": "Vis meg detaljer om Financial Analysis"}],
        "auto_library_retrieval": True
    }
    chat_res = client.post("/api/v1/chat/completions", json=chat_payload)
    assert chat_res.status_code == 200
    assert len(chat_res.json()["choices"]) > 0

def test_persistent_automations_lifecycle(client):
    # 1. Create automation
    create_payload = {
        "name": "Daily Competitive Intelligence Briefing",
        "prompt": "Search AI releases from OpenAI, Anthropic and Google and summarize changes.",
        "rrule": "FREQ=DAILY;BYHOUR=8;BYMINUTE=0",
        "is_active": True
    }
    create_res = client.post("/api/v1/automations/create", json=create_payload)
    assert create_res.status_code == 200
    data = create_res.json()
    auto_id = data["id"]
    assert data["name"] == "Daily Competitive Intelligence Briefing"
    assert data["is_active"] is True

    # 2. List automations
    list_res = client.get("/api/v1/automations")
    assert list_res.status_code == 200
    items = list_res.json()
    assert any(a["id"] == auto_id for a in items)

    # 3. Toggle automation inactive
    toggle_res = client.post(f"/api/v1/automations/{auto_id}/toggle?is_active=false")
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_active"] is False

    # Check that list reflects updated active state
    list_res2 = client.get("/api/v1/automations")
    updated_item = next(a for a in list_res2.json() if a["id"] == auto_id)
    assert updated_item["is_active"] is False

    # 4. Delete automation
    del_res = client.delete(f"/api/v1/automations/{auto_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deleted"

    # Check list no longer contains it
    list_res3 = client.get("/api/v1/automations")
    assert not any(a["id"] == auto_id for a in list_res3.json())

def test_interactive_deep_research_planning(client):
    plan_payload = {
        "query": "Comparison of Open WebUI v0.12 architecture vs LibreChat for enterprise RAG",
        "focus_areas": ["Memory persistence", "MCP server support", "Offline deployment"]
    }
    res = client.post("/api/v1/research/plan", json=plan_payload)
    assert res.status_code == 200
    data = res.json()
    assert "plan_id" in data
    assert data["query"] == plan_payload["query"]
    assert len(data["suggested_steps"]) == 4
    # Step 1 should be primary sources
    assert data["suggested_steps"][0]["step_number"] == 1
    assert len(data["suggested_steps"][0]["search_queries"]) >= 2
    # Step 2 should cover focus areas
    assert "Memory persistence" in data["suggested_steps"][1]["objective"] or "MCP server" in data["suggested_steps"][1]["objective"]
    # Total estimated sources should be positive
    assert data["estimated_sources"] > 0
