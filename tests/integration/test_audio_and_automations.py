import pytest
from httpx import AsyncClient, ASGITransport
import os
import shutil
import pytest_asyncio

from apps.api.main import app, library_store

@pytest_asyncio.fixture
async def client():
    os.environ["PAW_DATA_DIR"] = "./test_audio_data"
    os.makedirs("./test_audio_data/sqlite", exist_ok=True)
    os.makedirs("./test_audio_data/library", exist_ok=True)
    library_store.db_path = "./test_audio_data/sqlite/paw_metadata.db"
    library_store.storage_dir = "./test_audio_data/library"
    await library_store.init_db()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    if os.path.exists("./test_audio_data"):
        shutil.rmtree("./test_audio_data")

@pytest.mark.asyncio
async def test_audio_stt_and_tts(client):
    # 1. Test transcription
    stt_resp = await client.post("/api/v1/audio/transcriptions")
    assert stt_resp.status_code == 200
    stt_data = stt_resp.json()
    assert "transkripsjon" in stt_data["text"]

    # 2. Test TTS synthesis and library registration
    tts_payload = {"text": "Velkommen til Personal AI Workspace"}
    tts_resp = await client.post("/api/v1/audio/speech", json=tts_payload)
    assert tts_resp.status_code == 200
    tts_data = tts_resp.json()
    assert "download_url" in tts_data

@pytest.mark.asyncio
async def test_automation_task_lifecycle(client):
    # 1. Create a scheduled task
    payload = {
        "name": "Morgenbrifing",
        "prompt": "Oppsummer dagens nyheter og kalenderavtaler",
        "rrule": "FREQ=DAILY;BYHOUR=8;BYMINUTE=0"
    }
    create_resp = await client.post("/api/v1/automations/create", json=payload)
    assert create_resp.status_code == 200
    task_data = create_resp.json()
    assert task_data["name"] == "Morgenbrifing"
    assert task_data["is_active"] is True

    # 2. List automations
    list_resp = await client.get("/api/v1/automations/list")
    assert list_resp.status_code == 200
    tasks = list_resp.json()
    assert any(t["id"] == task_data["id"] for t in tasks)

@pytest.mark.asyncio
async def test_connector_grant_and_revocation(client):
    # 1. Grant connector scoped permission
    grant_payload = {
        "provider": "github",
        "scope": ["repo:read", "issues:write"],
        "description": "Lese issues og opprette pull requests"
    }
    grant_resp = await client.post("/api/v1/connectors/grant", json=grant_payload)
    assert grant_resp.status_code == 200
    grant = grant_resp.json()
    assert grant["status"] == "active"

    # 2. Revoke connector permission
    revoke_resp = await client.post(f"/api/v1/connectors/{grant['grant_id']}/revoke")
    assert revoke_resp.status_code == 200
    assert revoke_resp.json()["status"] == "revoked"
