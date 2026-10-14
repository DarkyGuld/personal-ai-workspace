import pytest
from httpx import AsyncClient, ASGITransport
import os
import shutil
import pytest_asyncio

from apps.api.main import app, library_store

@pytest_asyncio.fixture
async def client():
    os.environ["PAW_DATA_DIR"] = "./test_image_data"
    os.makedirs("./test_image_data/sqlite", exist_ok=True)
    os.makedirs("./test_image_data/library", exist_ok=True)
    library_store.db_path = "./test_image_data/sqlite/paw_metadata.db"
    library_store.storage_dir = "./test_image_data/library"
    await library_store.init_db()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    if os.path.exists("./test_image_data"):
        shutil.rmtree("./test_image_data")

@pytest.mark.asyncio
async def test_image_generation_and_editing_flow(client):
    # 1. Generate new image
    gen_payload = {
        "prompt": "Et moderne kontorlandskap i solnedgang",
        "size": "512x512"
    }
    gen_resp = await client.post("/api/v1/images/generate", json=gen_payload)
    assert gen_resp.status_code == 200
    gen_data = gen_resp.json()
    assert gen_data["item_id"] is not None
    assert gen_data["width"] == 512
    assert gen_data["height"] == 512
    assert gen_data["source_type"] == "generated_image"

    # 2. Check that the image is in the Library
    lib_resp = await client.get("/api/v1/library/items?source_type=generated_image")
    assert lib_resp.status_code == 200
    items = lib_resp.json()["items"]
    assert len(items) == 1
    assert items[0]["id"] == gen_data["item_id"]

    # 3. Edit the image (simulate grayscale instruction)
    edit_payload = {
        "source_item_id": gen_data["item_id"],
        "instruction": "Gjør om til gråtone"
    }
    edit_resp = await client.post("/api/v1/images/edit", json=edit_payload)
    assert edit_resp.status_code == 200
    edit_data = edit_resp.json()
    assert edit_data["lineage_parent_id"] == gen_data["item_id"]
    assert edit_data["item_id"] != gen_data["item_id"]

    # 4. Verify that both original and edited images are preserved in Library (lineage)
    all_lib = await client.get("/api/v1/library/items")
    assert all_lib.status_code == 200
    all_items = all_lib.json()["items"]
    assert len(all_items) == 2
    item_ids = [i["id"] for i in all_items]
    assert gen_data["item_id"] in item_ids
    assert edit_data["item_id"] in item_ids
