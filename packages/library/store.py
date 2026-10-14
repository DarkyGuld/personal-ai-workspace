import os
import aiosqlite
import hashlib
import time
from typing import List, Optional, Dict, Any

class LibraryStore:
    """
    Manages centralized file registration, SHA-256 deduplication,
    metadata, and collections for Personal AI Workspace.
    """
    def __init__(self, db_path: str, storage_dir: str):
        self.db_path = db_path
        self.storage_dir = storage_dir
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        os.makedirs(self.storage_dir, exist_ok=True)

    async def init_db(self):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS library_items (
                    id TEXT PRIMARY KEY,
                    owner_id TEXT,
                    filename TEXT NOT NULL,
                    mime_type TEXT NOT NULL,
                    bytes_size INTEGER NOT NULL,
                    sha256 TEXT NOT NULL,
                    storage_key TEXT NOT NULL,
                    source_type TEXT NOT NULL,
                    project_id TEXT,
                    is_favorite INTEGER DEFAULT 0,
                    created_at INTEGER NOT NULL
                )
            """)
            await db.execute("""
                CREATE INDEX IF NOT EXISTS idx_library_sha256 ON library_items(sha256)
            """)
            await db.execute("""
                CREATE INDEX IF NOT EXISTS idx_library_project ON library_items(project_id)
            """)
            await db.commit()

    async def register_item(
        self,
        item_id: str,
        filename: str,
        mime_type: str,
        content_bytes: bytes,
        source_type: str = "upload",
        project_id: Optional[str] = None,
        owner_id: str = "default_user"
    ) -> Dict[str, Any]:
        sha256 = hashlib.sha256(content_bytes).hexdigest()
        storage_key = f"{sha256[:2]}/{sha256}"
        target_path = os.path.join(self.storage_dir, storage_key)
        os.makedirs(os.path.dirname(target_path), exist_ok=True)

        if not os.path.exists(target_path):
            with open(target_path, "wb") as f:
                f.write(content_bytes)

        now = int(time.time())
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT OR REPLACE INTO library_items
                (id, owner_id, filename, mime_type, bytes_size, sha256, storage_key, source_type, project_id, is_favorite, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
            """, (item_id, owner_id, filename, mime_type, len(content_bytes), sha256, storage_key, source_type, project_id, now))
            await db.commit()

        return {
            "id": item_id,
            "filename": filename,
            "mime_type": mime_type,
            "bytes_size": len(content_bytes),
            "sha256": sha256,
            "source_type": source_type,
            "project_id": project_id,
            "created_at": now
        }

    async def list_items(
        self,
        project_id: Optional[str] = None,
        source_type: Optional[str] = None,
        only_favorites: bool = False
    ) -> List[Dict[str, Any]]:
        query = "SELECT id, filename, mime_type, bytes_size, sha256, source_type, project_id, is_favorite, created_at FROM library_items WHERE 1=1"
        params = []
        if project_id:
            query += " AND project_id = ?"
            params.append(project_id)
        if source_type:
            query += " AND source_type = ?"
            params.append(source_type)
        if only_favorites:
            query += " AND is_favorite = 1"
        query += " ORDER BY created_at DESC"

        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(query, tuple(params)) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

    async def toggle_favorite(self, item_id: str) -> bool:
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute("SELECT is_favorite FROM library_items WHERE id = ?", (item_id,)) as cur:
                row = await cur.fetchone()
                if not row:
                    return False
                new_val = 0 if row[0] == 1 else 1
            await db.execute("UPDATE library_items SET is_favorite = ? WHERE id = ?", (new_val, item_id))
            await db.commit()
            return bool(new_val)
