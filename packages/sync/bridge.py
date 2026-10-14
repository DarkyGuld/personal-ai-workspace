import os
import time
import uuid
import mimetypes
import shutil
from typing import List, Dict, Any, Optional

class SyncBridge:
    """
    SyncBridge handles bi-directional, peer-to-peer synchronization with Android devices
    via Syncthing or direct folder mounting.

    Directory structure:
      <sync_dir>/
        inbox/     - Android drops files here -> auto-ingested to Library
        notes/     - Synced Markdown notes (.md) readable offline in Android
        library/   - Mirrored CAS files accessible to Android file viewers
    """

    def __init__(self, sync_dir: str):
        self.sync_dir = sync_dir
        self.inbox_dir = os.path.join(sync_dir, "inbox")
        self.notes_dir = os.path.join(sync_dir, "notes")
        self.library_dir = os.path.join(sync_dir, "library")
        self.ingested_dir = os.path.join(sync_dir, "ingested")
        self._ensure_dirs()

    def _ensure_dirs(self):
        for d in [self.inbox_dir, self.notes_dir, self.library_dir, self.ingested_dir]:
            os.makedirs(d, exist_ok=True)

    async def scan_and_ingest_inbox(self, library_store) -> List[Dict[str, Any]]:
        """
        Scans the inbox directory for files synced from Android via Syncthing.
        Registers them into the LibraryStore with SHA-256 deduplication and moves to ingested/.
        """
        ingested = []
        if not os.path.exists(self.inbox_dir):
            return ingested

        for fname in os.listdir(self.inbox_dir):
            fpath = os.path.join(self.inbox_dir, fname)
            if not os.path.isfile(fpath):
                continue

            try:
                with open(fpath, "rb") as f:
                    content_bytes = f.read()

                mime, _ = mimetypes.guess_type(fname)
                if not mime:
                    mime = "application/octet-stream"

                item_id = str(uuid.uuid4())
                reg_item = await library_store.register_item(
                    item_id=item_id,
                    filename=fname,
                    mime_type=mime,
                    content_bytes=content_bytes,
                    source_type="synced_mobile"
                )

                # Move to ingested directory to prevent double processing
                dest_path = os.path.join(self.ingested_dir, f"{int(time.time())}_{fname}")
                shutil.move(fpath, dest_path)

                ingested.append(reg_item)
            except Exception as e:
                print(f"[SyncBridge] Error ingesting {fname}: {e}")

        return ingested

    def save_note(self, note_id: str, title: str, content: str) -> Dict[str, Any]:
        """
        Saves a note as plain Markdown (.md) with frontmatter into the notes/ sync folder.
        """
        now = int(time.time())
        filename = f"{note_id}.md"
        filepath = os.path.join(self.notes_dir, filename)

        frontmatter = f"""---
id: {note_id}
title: "{title}"
updated_at: {now}
---

"""
        full_content = frontmatter + content
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(full_content)

        return {
            "id": note_id,
            "title": title,
            "content": content,
            "updated_at": now,
            "filepath": filepath
        }

    def list_notes(self) -> List[Dict[str, Any]]:
        """
        Lists all Markdown notes present in the notes/ sync directory.
        """
        notes = []
        if not os.path.exists(self.notes_dir):
            return notes

        for fname in os.listdir(self.notes_dir):
            if not fname.endswith(".md"):
                continue

            fpath = os.path.join(self.notes_dir, fname)
            note_id = fname[:-3]
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    raw = f.read()

                # Basic frontmatter parsing
                title = fname
                content = raw
                updated_at = int(os.path.getmtime(fpath))

                if raw.startswith("---"):
                    parts = raw.split("---", 2)
                    if len(parts) >= 3:
                        meta_block = parts[1]
                        content = parts[2].strip()
                        for line in meta_block.splitlines():
                            if line.startswith("title:"):
                                title = line.split(":", 1)[1].strip().strip('"\'')
                            elif line.startswith("updated_at:"):
                                try:
                                    updated_at = int(line.split(":", 1)[1].strip())
                                except ValueError:
                                    pass

                notes.append({
                    "id": note_id,
                    "title": title,
                    "content": content,
                    "updated_at": updated_at
                })
            except Exception as e:
                print(f"[SyncBridge] Error reading note {fname}: {e}")

        notes.sort(key=lambda x: x["updated_at"], reverse=True)
        return notes

    def get_note(self, note_id: str) -> Optional[Dict[str, Any]]:
        notes = self.list_notes()
        return next((n for n in notes if n["id"] == note_id), None)

    def delete_note(self, note_id: str) -> bool:
        filepath = os.path.join(self.notes_dir, f"{note_id}.md")
        if os.path.exists(filepath):
            os.remove(filepath)
            return True
        return False

    def get_sync_status(self) -> Dict[str, Any]:
        """
        Returns folder statistics for monitoring Syncthing and local parity.
        """
        inbox_count = len([f for f in os.listdir(self.inbox_dir) if os.path.isfile(os.path.join(self.inbox_dir, f))]) if os.path.exists(self.inbox_dir) else 0
        notes_count = len([f for f in os.listdir(self.notes_dir) if f.endswith('.md')]) if os.path.exists(self.notes_dir) else 0
        ingested_count = len(os.listdir(self.ingested_dir)) if os.path.exists(self.ingested_dir) else 0

        return {
            "sync_enabled": True,
            "sync_dir": self.sync_dir,
            "inbox_pending_count": inbox_count,
            "notes_count": notes_count,
            "ingested_total_count": ingested_count,
            "protocol": "syncthing_p2p"
        }
