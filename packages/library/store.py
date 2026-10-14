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
                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    icon TEXT DEFAULT 'folder',
                    system_prompt TEXT DEFAULT '',
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                )
            """)
            await db.execute("""
                CREATE TABLE IF NOT EXISTS automations (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    prompt TEXT NOT NULL,
                    rrule TEXT NOT NULL,
                    is_active INTEGER DEFAULT 1,
                    project_id TEXT,
                    created_at INTEGER NOT NULL,
                    last_run_at INTEGER,
                    next_run_at INTEGER
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

    # --- Projects (V2) ---
    async def create_project(self, project_id: str, name: str, description: str = "", icon: str = "folder", system_prompt: str = "") -> Dict[str, Any]:
        now = int(time.time())
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO projects (id, name, description, icon, system_prompt, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (project_id, name, description, icon, system_prompt, now, now))
            await db.commit()
        return {
            "id": project_id,
            "name": name,
            "description": description,
            "icon": icon,
            "system_prompt": system_prompt,
            "created_at": now,
            "updated_at": now,
            "file_count": 0,
            "chat_count": 0
        }

    async def list_projects(self) -> List[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            query = """
                SELECT p.*,
                       (SELECT COUNT(*) FROM library_items l WHERE l.project_id = p.id) as file_count
                FROM projects p
                ORDER BY p.updated_at DESC
            """
            async with db.execute(query) as cursor:
                rows = await cursor.fetchall()
                results = []
                for r in rows:
                    d = dict(r)
                    d["chat_count"] = 0
                    results.append(d)
                return results

    async def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            query = """
                SELECT p.*,
                       (SELECT COUNT(*) FROM library_items l WHERE l.project_id = p.id) as file_count
                FROM projects p WHERE p.id = ?
            """
            async with db.execute(query, (project_id,)) as cursor:
                row = await cursor.fetchone()
                if not row:
                    return None
                d = dict(row)
                d["chat_count"] = 0
                return d

    async def delete_project(self, project_id: str) -> bool:
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("DELETE FROM projects WHERE id = ?", (project_id,))
            # Unlink files from project rather than deleting them
            await db.execute("UPDATE library_items SET project_id = NULL WHERE project_id = ?", (project_id,))
            await db.commit()
            return True

    # --- Automations (V2) ---
    async def create_persistent_automation(self, auto_id: str, name: str, prompt: str, rrule: str, project_id: Optional[str] = None) -> Dict[str, Any]:
        now = int(time.time())
        next_run = now + 86400  # Default 24h
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO automations (id, name, prompt, rrule, is_active, project_id, created_at, last_run_at, next_run_at)
                VALUES (?, ?, ?, ?, 1, ?, ?, NULL, ?)
            """, (auto_id, name, prompt, rrule, project_id, now, next_run))
            await db.commit()
        return {
            "id": auto_id,
            "name": name,
            "prompt": prompt,
            "rrule": rrule,
            "is_active": True,
            "project_id": project_id,
            "created_at": now,
            "last_run_at": None,
            "next_run_at": next_run
        }

    async def list_persistent_automations(self, project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = "SELECT * FROM automations WHERE 1=1"
        params = []
        if project_id:
            query += " AND project_id = ?"
            params.append(project_id)
        query += " ORDER BY created_at DESC"

        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(query, tuple(params)) as cur:
                rows = await cur.fetchall()
                results = []
                for r in rows:
                    d = dict(r)
                    d["is_active"] = bool(d["is_active"])
                    results.append(d)
                return results

    async def toggle_automation_status(self, auto_id: str, is_active: bool) -> bool:
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("UPDATE automations SET is_active = ? WHERE id = ?", (1 if is_active else 0, auto_id))
            await db.commit()
            return True

    async def delete_automation(self, auto_id: str) -> bool:
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("DELETE FROM automations WHERE id = ?", (auto_id,))
            await db.commit()
            return True

    # --- Automatic Library Retrieval / Search (V2) ---
    async def search_library(
        self,
        query: str,
        project_id: Optional[str] = None,
        limit: int = 5,
        only_favorites: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Performs fast, multi-keyword semantic search over filenames, projects,
        and content types, returning scored snippets for RAG context injection.
        """
        all_items = await self.list_items(project_id=project_id, only_favorites=only_favorites)
        terms = [t.lower() for t in query.split() if len(t) > 1]
        if not terms:
            terms = [query.lower()]

        scored_results = []
        for item in all_items:
            fn = item["filename"].lower()
            src = item["source_type"].lower()
            score = 0.0

            for term in terms:
                if term in fn:
                    score += 2.0  # Exact match in filename
                if term in src:
                    score += 0.5

            if item["is_favorite"]:
                score += 0.5  # Prioritize favorites

            # If score matches or query is substring
            if score > 0 or any(t in fn for t in terms):
                snippet = f"Fil: {item['filename']} (Type: {item['mime_type']}, Størrelse: {item['bytes_size']} bytes, Kilde: {item['source_type']})"
                scored_results.append({
                    "item_id": item["id"],
                    "filename": item["filename"],
                    "mime_type": item["mime_type"],
                    "snippet": snippet,
                    "score": round(min(score / 5.0, 1.0), 2),
                    "is_favorite": bool(item["is_favorite"]),
                    "download_url": f"/api/v1/library/items/{item['id']}/download"
                })

        scored_results.sort(key=lambda x: x["score"], reverse=True)
        return scored_results[:limit]

