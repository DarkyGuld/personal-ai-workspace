import os
import shutil
import tempfile
import pytest
from fastapi.testclient import TestClient
from apps.api.main import app, library_store, sync_bridge

@pytest.fixture(scope="module")
def sync_client():
    temp_dir = tempfile.mkdtemp(prefix="paw_sync_test_")
    orig_db = library_store.db_path
    orig_storage = library_store.storage_dir
    orig_sync = sync_bridge.sync_dir

    library_store.db_path = os.path.join(temp_dir, "metadata.db")
    library_store.storage_dir = os.path.join(temp_dir, "library")
    sync_bridge.sync_dir = os.path.join(temp_dir, "sync")
    sync_bridge.inbox_dir = os.path.join(sync_bridge.sync_dir, "inbox")
    sync_bridge.notes_dir = os.path.join(sync_bridge.sync_dir, "notes")
    sync_bridge.library_dir = os.path.join(sync_bridge.sync_dir, "library")
    sync_bridge.ingested_dir = os.path.join(sync_bridge.sync_dir, "ingested")
    sync_bridge._ensure_dirs()
    os.makedirs(library_store.storage_dir, exist_ok=True)

    with TestClient(app) as client:
        yield client

    # Teardown
    library_store.db_path = orig_db
    library_store.storage_dir = orig_storage
    sync_bridge.sync_dir = orig_sync
    shutil.rmtree(temp_dir, ignore_errors=True)

def test_sync_status_endpoint(sync_client):
    res = sync_client.get("/api/v1/sync/status")
    assert res.status_code == 200
    data = res.json()
    assert data["sync_enabled"] is True
    assert data["protocol"] == "syncthing_p2p"
    assert data["inbox_pending_count"] == 0

def test_notes_markdown_sync_lifecycle(sync_client):
    # 1. Create a note
    note_payload = {
        "title": "Android Local Sync Strategy",
        "content": "This note was saved on mobile and synced via Syncthing as a markdown file."
    }
    create_res = sync_client.post("/api/v1/notes", json=note_payload)
    assert create_res.status_code == 200
    created = create_res.json()
    note_id = created["id"]
    assert created["title"] == "Android Local Sync Strategy"
    assert "synced via Syncthing" in created["content"]

    # 2. Verify physical .md file on disk
    note_file = os.path.join(sync_bridge.notes_dir, f"{note_id}.md")
    assert os.path.exists(note_file)
    with open(note_file, "r", encoding="utf-8") as f:
        raw_text = f.read()
    assert "Android Local Sync Strategy" in raw_text

    # 3. List notes
    list_res = sync_client.get("/api/v1/notes")
    assert list_res.status_code == 200
    notes_list = list_res.json()["notes"]
    assert any(n["id"] == note_id for n in notes_list)

    # 4. Get note
    get_res = sync_client.get(f"/api/v1/notes/{note_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == note_id

    # 5. Delete note
    del_res = sync_client.delete(f"/api/v1/notes/{note_id}")
    assert del_res.status_code == 200
    assert not os.path.exists(note_file)

def test_syncthing_inbox_ingestion(sync_client):
    # Simulate Android phone dropping a photo/document into Syncthing inbox
    test_filename = "mobile_capture_receipt.txt"
    inbox_file = os.path.join(sync_bridge.inbox_dir, test_filename)
    with open(inbox_file, "wb") as f:
        f.write(b"Receipt #99182 - 2500 NOK for Hardware Testing")

    # Verify pending count in status
    status_res = sync_client.get("/api/v1/sync/status")
    assert status_res.status_code == 200
    assert status_res.json()["inbox_pending_count"] == 1

    # Ingest inbox
    ingest_res = sync_client.post("/api/v1/sync/ingest")
    assert ingest_res.status_code == 200
    ingest_data = ingest_res.json()
    assert ingest_data["ingested_count"] == 1
    item = ingest_data["items"][0]
    assert item["filename"] == test_filename
    assert item["source_type"] == "synced_mobile"

    # Verify file was moved out of inbox
    assert not os.path.exists(inbox_file)

    # Verify item is registered in Library
    lib_res = sync_client.get("/api/v1/library/items")
    assert lib_res.status_code == 200
    items = lib_res.json()["items"]
    assert any(i["filename"] == test_filename for i in items)
