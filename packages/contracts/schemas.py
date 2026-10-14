from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal

# --- Health & Capabilities ---
class HealthResponse(BaseModel):
    status: str
    version: str
    upstream_openwebui: str

class CapabilitiesResponse(BaseModel):
    version: str
    features: List[str]
    intelligent_ui_supported: bool
    library_enabled: bool
    document_generation_enabled: bool
    work_agent_enabled: bool
    youtube_transcripts_enabled: bool
    image_generation_enabled: bool

# --- Model Discovery ---
class ModelCard(BaseModel):
    id: str
    name: str
    provider: str
    capabilities: List[str]
    description: Optional[str] = None

class ModelsResponse(BaseModel):
    models: List[ModelCard]

# --- Chat Contracts ---
class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant", "tool"]
    content: str
    metadata: Optional[Dict[str, Any]] = None

class ChatCompletionRequest(BaseModel):
    model: str = "deepseek-v4.1-flash"
    messages: List[ChatMessage]
    stream: bool = False
    temperature: Optional[float] = 0.7
    session_id: Optional[str] = None
    project_id: Optional[str] = None

class ChatStreamRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    stream: bool = True
    temperature: Optional[float] = 0.7
    project_id: Optional[str] = None
    library_item_ids: Optional[List[str]] = Field(default_factory=list)

class ChatChoice(BaseModel):
    index: int = 0
    message: ChatMessage
    finish_reason: Optional[str] = "stop"

class ChatUsage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

class ChatCompletionResponse(BaseModel):
    id: str
    model: str
    choices: List[ChatChoice]
    usage: Optional[ChatUsage] = None
    created: int


# --- Library Contracts ---
class LibraryItemCreate(BaseModel):
    filename: str
    mime_type: str
    bytes_size: int
    sha256: str
    storage_key: str
    source_type: Literal["upload", "generated_doc", "generated_image", "export"]
    project_id: Optional[str] = None

class LibraryItemResponse(BaseModel):
    id: str
    filename: str
    mime_type: str
    bytes_size: int
    sha256: str
    source_type: str
    is_favorite: bool = False
    project_id: Optional[str] = None
    created_at: int
    download_url: str

class LibraryListResponse(BaseModel):
    items: List[LibraryItemResponse]
    total: int

# --- Artifact & Document Generation ---
class ArtifactGenerateRequest(BaseModel):
    kind: Literal["pdf", "docx", "xlsx", "pptx", "csv", "zip"]
    title: str
    data: Dict[str, Any]
    project_id: Optional[str] = None

class ArtifactGenerateResponse(BaseModel):
    artifact_id: str
    library_item_id: str
    filename: str
    download_url: str
    kind: str

# --- Intelligent UI Contracts ---
class IntelligentUIRequest(BaseModel):
    chat_id: Optional[str] = None
    component_type: Literal["calculator", "chart", "table", "form", "quiz", "slider_group"]
    props: Dict[str, Any]
    initial_state: Optional[Dict[str, Any]] = None

class IntelligentUIResponse(BaseModel):
    ui_artifact_id: str
    schema_version: str = "1.0.0"
    source_lang: str
    state: Dict[str, Any]

# --- Work / Agent Contracts ---
class WorkRunCreate(BaseModel):
    goal: str
    project_id: Optional[str] = None
    max_steps: int = 10
    budget_usd: Optional[float] = 1.0

class WorkRunResponse(BaseModel):
    id: str
    goal: str
    status: Literal["pending", "running", "waiting_approval", "completed", "failed", "cancelled"]
    steps: List[Dict[str, Any]]
    approvals_required: List[Dict[str, Any]]
    output_refs: List[str]

# --- YouTube Summary Contract ---
class YouTubeTranscriptRequest(BaseModel):
    url: str

class YouTubeTranscriptResponse(BaseModel):
    video_id: str
    title: Optional[str] = None
    has_captions: bool
    transcript: List[Dict[str, Any]] # e.g. [{"text": "...", "start": 0.0, "duration": 2.5}]
