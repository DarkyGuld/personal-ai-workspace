import pytest
import os
import shutil
import pytest_asyncio
from packages.library.store import LibraryStore

TEST_DB_PATH = "./test_data/sqlite/test_library.db"
TEST_STORAGE_DIR = "./test_data/library_storage"

@pytest_asyncio.fixture
async def store():
    if os.path.exists("./test_data"):
        shutil.rmtree("./test_data")
    s = LibraryStore(db_path=TEST_DB_PATH, storage_dir=TEST_STORAGE_DIR)
    await s.init_db()
    yield s
    if os.path.exists("./test_data"):
        shutil.rmtree("./test_data")

@pytest.mark.asyncio
async def test_register_and_list_library_item(store):
    dummy_bytes = b"Sample File Content for Deduplication Testing"
    item = await store.register_item(
        item_id="item-001",
        filename="report.txt",
        mime_type="text/plain",
        content_bytes=dummy_bytes,
        source_type="upload"
    )

    assert item["id"] == "item-001"
    assert item["bytes_size"] == len(dummy_bytes)
    assert len(item["sha256"]) == 64

    # Verify listing
    items = await store.list_items()
    assert len(items) == 1
    assert items[0]["filename"] == "report.txt"
    assert items[0]["sha256"] == item["sha256"]

@pytest.mark.asyncio
async def test_toggle_favorite(store):
    await store.register_item(
        item_id="item-fav",
        filename="image.png",
        mime_type="image/png",
        content_bytes=b"fake-png-data",
        source_type="upload"
    )

    # Initially not favorite
    items = await store.list_items(only_favorites=True)
    assert len(items) == 0

    # Toggle to favorite
    res = await store.toggle_favorite("item-fav")
    assert res is True

    fav_items = await store.list_items(only_favorites=True)
    assert len(fav_items) == 1
    assert fav_items[0]["id"] == "item-fav"
