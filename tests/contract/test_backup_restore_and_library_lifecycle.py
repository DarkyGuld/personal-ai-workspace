import os
import io
import shutil
import tarfile
import hashlib
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from apps.api.main import app, library_store
from packages.library.store import LibraryStore
from packages.artifact_tools.generator import ArtifactGenerator

@pytest_asyncio.fixture
async def library_fixture():
    test_dir = "./test_lib_lifecycle"
    os.makedirs(f"{test_dir}/sqlite", exist_ok=True)
    os.makedirs(f"{test_dir}/library", exist_ok=True)
    store = LibraryStore(
        db_path=f"{test_dir}/sqlite/paw_metadata.db",
        storage_dir=f"{test_dir}/library"
    )
    await store.init_db()
    yield store, test_dir
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)

@pytest.mark.asyncio
async def test_library_deduplication_and_integrity(library_fixture):
    store, base_dir = library_fixture
    content_a = b"Unique content for PAW document v1"
    sha = hashlib.sha256(content_a).hexdigest()

    # Register first file
    item1 = await store.register_item(
        item_id="item-101",
        filename="report_v1.txt",
        mime_type="text/plain",
        content_bytes=content_a,
        source_type="upload"
    )
    assert item1["sha256"] == sha

    # Register second file with identical bytes under different name
    item2 = await store.register_item(
        item_id="item-102",
        filename="report_duplicate.txt",
        mime_type="text/plain",
        content_bytes=content_a,
        source_type="upload"
    )
    assert item2["sha256"] == sha

    # Deduplication check: only one physical content-addressed file exists
    target_path = os.path.join(store.storage_dir, sha[:2], sha)
    assert os.path.exists(target_path)
    with open(target_path, "rb") as f:
        assert f.read() == content_a

    # Verify both metadata records exist
    items = await store.list_items()
    assert len(items) == 2

@pytest.mark.asyncio
async def test_backup_creation_and_recovery_flow(library_fixture):
    store, base_dir = library_fixture
    # 1. Populate database and storage
    sample_doc = ArtifactGenerator.generate_pdf("Snapshot Report", "Important backup data.")
    await store.register_item(
        item_id="snap-doc-1",
        filename="snapshot_report.pdf",
        mime_type="application/pdf",
        content_bytes=sample_doc,
        source_type="generated_doc"
    )
    initial_items = await store.list_items()
    assert len(initial_items) == 1

    # 2. Perform snapshot archive (simulating manage.sh backup)
    backup_dir = os.path.join(base_dir, "backup_snapshot")
    os.makedirs(backup_dir, exist_ok=True)
    archive_path = os.path.join(backup_dir, "paw_data.tar.gz")

    with tarfile.open(archive_path, "w:gz") as tar:
        tar.add(os.path.join(base_dir, "sqlite"), arcname="sqlite")
        tar.add(os.path.join(base_dir, "library"), arcname="library")

    assert os.path.exists(archive_path)
    archive_size = os.path.getsize(archive_path)
    assert archive_size > 500

    # 3. Simulate disaster / corruption by wiping local data
    shutil.rmtree(os.path.join(base_dir, "sqlite"))
    shutil.rmtree(os.path.join(base_dir, "library"))
    assert not os.path.exists(os.path.join(base_dir, "sqlite"))

    # 4. Perform restore from snapshot (simulating manage.sh restore)
    with tarfile.open(archive_path, "r:gz") as tar:
        tar.extractall(path=base_dir)

    assert os.path.exists(os.path.join(base_dir, "sqlite", "paw_metadata.db"))
    assert os.path.exists(os.path.join(base_dir, "library"))

    # 5. Reinitialize store on restored database and verify 100% data fidelity
    restored_store = LibraryStore(
        db_path=os.path.join(base_dir, "sqlite", "paw_metadata.db"),
        storage_dir=os.path.join(base_dir, "library")
    )
    await restored_store.init_db()
    restored_items = await restored_store.list_items()
    assert len(restored_items) == 1
    assert restored_items[0]["id"] == "snap-doc-1"
    assert restored_items[0]["filename"] == "snapshot_report.pdf"
