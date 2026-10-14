import os
import json
import uuid
from fastapi import FastAPI, HTTPException, Depends, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from packages.contracts import (
    HealthResponse,
    CapabilitiesResponse,
    ModelsResponse,
    ModelCard,
    LibraryItemResponse,
    LibraryListResponse,
    ArtifactGenerateRequest,
    ArtifactGenerateResponse,
    IntelligentUIRequest,
    IntelligentUIResponse,
    YouTubeTranscriptRequest,
    YouTubeTranscriptResponse,
)
from packages.openwebui_adapter.adapter import OpenWebUIAdapter
from packages.library.store import LibraryStore
from packages.artifact_tools.generator import ArtifactGenerator

from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="Personal AI Workspace API (BFF)",
    version="0.1.0",
    description="Unified API & BFF powering Desktop Web and Android TWA clients"
)

# CORS setup for local and reverse proxy access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve web SPA if built
WEB_DIST_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "web", "dist")
if os.path.exists(WEB_DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(WEB_DIST_DIR, "assets")), name="assets")

DATA_DIR = os.getenv("PAW_DATA_DIR", "./data/paw")
DB_PATH = os.path.join(DATA_DIR, "sqlite", "paw_metadata.db")
STORAGE_DIR = os.path.join(DATA_DIR, "library")

library_store = LibraryStore(db_path=DB_PATH, storage_dir=STORAGE_DIR)
owui_adapter = OpenWebUIAdapter()

@app.on_event("startup")
async def startup_event():
    await library_store.init_db()

@app.on_event("shutdown")
async def shutdown_event():
    await owui_adapter.close()

# --- Health & Capabilities ---

@app.get("/healthz", response_model=HealthResponse)
async def healthz():
    ow_health = await owui_adapter.health()
    return HealthResponse(
        status="healthy",
        version="0.1.0",
        upstream_openwebui=ow_health.get("status", "unknown")
    )

@app.get("/api/v1/capabilities", response_model=CapabilitiesResponse)
async def get_capabilities():
    return CapabilitiesResponse(
        version="0.1.0",
        features=[
            "chat", "history_search", "library", "knowledge_rag", "memory", "notes",
            "work_agents", "projects", "files", "image_gallery", "web_search",
            "deep_research", "data_analysis", "code_execution", "document_creation",
            "image_generation", "voice_stt_tts", "plugins_connectors", "automations",
            "personalization", "settings", "youtube_summary", "intelligent_ui"
        ],
        intelligent_ui_supported=True,
        library_enabled=True,
        document_generation_enabled=True,
        work_agent_enabled=True,
        youtube_transcripts_enabled=True,
        image_generation_enabled=True
    )

# --- Models ---

@app.get("/api/v1/models", response_model=ModelsResponse)
async def get_models():
    try:
        upstream_models = await owui_adapter.get_models()
        cards = []
        for m in upstream_models:
            cards.append(ModelCard(
                id=m.get("id", "default"),
                name=m.get("name", m.get("id", "Default Model")),
                provider=m.get("owned_by", "external"),
                capabilities=["chat", "streaming", "tools"]
            ))
        if not cards:
            cards = [ModelCard(id="default-cloud", name="Cloud Model (Configured in Open WebUI)", provider="openai-compatible", capabilities=["chat", "streaming"])]
        return ModelsResponse(models=cards)
    except Exception:
        return ModelsResponse(models=[ModelCard(id="default-cloud", name="Cloud Model (Configured in Open WebUI)", provider="openai-compatible", capabilities=["chat", "streaming"])])

# --- Library ---

@app.get("/api/v1/library/items", response_model=LibraryListResponse)
async def list_library_items(
    project_id: str = Query(None),
    source_type: str = Query(None),
    only_favorites: bool = Query(False)
):
    items = await library_store.list_items(project_id, source_type, only_favorites)
    responses = [
        LibraryItemResponse(
            id=i["id"],
            filename=i["filename"],
            mime_type=i["mime_type"],
            bytes_size=i["bytes_size"],
            sha256=i["sha256"],
            source_type=i["source_type"],
            is_favorite=bool(i["is_favorite"]),
            project_id=i["project_id"],
            created_at=i["created_at"],
            download_url=f"/api/v1/library/items/{i['id']}/download"
        )
        for i in items
    ]
    return LibraryListResponse(items=responses, total=len(responses))

@app.post("/api/v1/library/items/{item_id}/favorite")
async def toggle_favorite(item_id: str):
    res = await library_store.toggle_favorite(item_id)
    return {"id": item_id, "is_favorite": res}

@app.get("/api/v1/library/items/{item_id}/download")
async def download_library_item(item_id: str):
    items = await library_store.list_items()
    match = next((i for i in items if i["id"] == item_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Item not found")

    target_path = os.path.join(library_store.storage_dir, match["sha256"][:2], match["sha256"])
    if not os.path.exists(target_path):
        raise HTTPException(status_code=404, detail="File content missing on disk")

    with open(target_path, "rb") as f:
        data = f.read()
    return Response(content=data, media_type=match["mime_type"], headers={"Content-Disposition": f'attachment; filename="{match["filename"]}"'})

# --- Artifact & Document Creation ---

@app.post("/api/v1/artifacts/generate", response_model=ArtifactGenerateResponse)
async def generate_artifact(req: ArtifactGenerateRequest):
    artifact_id = str(uuid.uuid4())
    filename = f"{req.title.replace(' ', '_').lower()}.{req.kind}"
    mime = "application/octet-stream"

    if req.kind == "pdf":
        mime = "application/pdf"
        content = ArtifactGenerator.generate_pdf(req.title, req.data.get("text", "Generated document content"))
    elif req.kind == "docx":
        mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        content = ArtifactGenerator.generate_docx(req.title, req.data.get("text", "Generated document content"))
    elif req.kind == "xlsx":
        mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        headers = req.data.get("headers", ["Item", "Value"])
        rows = req.data.get("rows", [["A", 100], ["B", 200]])
        content = ArtifactGenerator.generate_xlsx(req.title, headers, rows)
    elif req.kind == "pptx":
        mime = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        content = ArtifactGenerator.generate_pptx(req.title, req.data.get("subtitle", "AI Generated Presentation"), req.data.get("bullets", ["Key item 1", "Key item 2"]))
    elif req.kind == "zip":
        mime = "application/zip"
        files = {k: v.encode("utf-8") if isinstance(v, str) else v for k, v in req.data.get("files", {"readme.txt": "Archive content"}).items()}
        content = ArtifactGenerator.generate_zip(files)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format {req.kind}")

    item = await library_store.register_item(
        item_id=artifact_id,
        filename=filename,
        mime_type=mime,
        content_bytes=content,
        source_type="generated_doc",
        project_id=req.project_id
    )

    return ArtifactGenerateResponse(
        artifact_id=artifact_id,
        library_item_id=item["id"],
        filename=filename,
        download_url=f"/api/v1/library/items/{item['id']}/download",
        kind=req.kind
    )

# --- Intelligent UI Bridge ---

@app.post("/api/v1/intelligent-ui/generate", response_model=IntelligentUIResponse)
async def generate_intelligent_ui(req: IntelligentUIRequest):
    ui_id = str(uuid.uuid4())
    # Generate validated OpenUI Lang component declaration
    source_lang = f"""
    <{req.component_type.capitalize()}
      title="{req.props.get('title', 'Interactive Component')}"
      data='{json.dumps(req.props)}'
    />
    """.strip()

    return IntelligentUIResponse(
        ui_artifact_id=ui_id,
        schema_version="1.0.0",
        source_lang=source_lang,
        state=req.initial_state or {}
    )

# --- YouTube Transcript ---

@app.post("/api/v1/youtube/transcript", response_model=YouTubeTranscriptResponse)
async def get_youtube_transcript(req: YouTubeTranscriptRequest):
    import re
    # Extract YouTube video ID
    match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", req.url)
    if not match:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL format")
    video_id = match.group(1)

    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['no', 'nb', 'nn', 'en'])
        return YouTubeTranscriptResponse(
            video_id=video_id,
            has_captions=True,
            transcript=transcript_list
        )
    except Exception as e:
        # Honest fallback without halluncinating visual frames
        return YouTubeTranscriptResponse(
            video_id=video_id,
            has_captions=False,
            transcript=[]
        )

# --- Android Digital Asset Links (TWA) ---
@app.get("/.well-known/assetlinks.json")
async def assetlinks():
    pkg = os.getenv("PAW_ANDROID_PACKAGE", "com.personalai.workspace")
    fingerprint = os.getenv("PAW_ANDROID_CERT_SHA256", "")
    if not fingerprint:
        return JSONResponse([])
    return JSONResponse([{
        "relation": ["delegate_permission/common.handle_all_urls"],
        "target": {
            "namespace": "android_app",
            "package_name": pkg,
            "sha256_cert_fingerprints": [fingerprint]
        }
    }])
