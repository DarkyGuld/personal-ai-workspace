from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal

# --- Audio STT / TTS Contracts ---
class AudioTranscriptionRequest(BaseModel):
    language: Optional[str] = "no"

class AudioTranscriptionResponse(BaseModel):
    text: str
    language: str
    duration_seconds: Optional[float] = None

class AudioSpeechRequest(BaseModel):
    text: str
    voice: Optional[str] = "default"
    speed: Optional[float] = 1.0

class AudioSpeechResponse(BaseModel):
    audio_format: str = "mp3"
    download_url: str

# --- Automation & Scheduler Contracts ---
class AutomationCreateRequest(BaseModel):
    name: str
    prompt: str
    rrule: str # iCal recurrence rule e.g. "FREQ=DAILY;BYHOUR=8;BYMINUTE=0"
    model_id: Optional[str] = "default-cloud"
    is_active: bool = True

class AutomationTaskResponse(BaseModel):
    id: str
    name: str
    prompt: str
    rrule: str
    is_active: bool
    last_run_at: Optional[int] = None
    next_run_at: Optional[int] = None
    created_at: int

# --- Connectors & Integrations Contracts ---
class ConnectorGrantRequest(BaseModel):
    provider: str
    scope: List[str]
    description: str

class ConnectorGrantResponse(BaseModel):
    grant_id: str
    provider: str
    scope: List[str]
    status: Literal["active", "revoked"]
    created_at: int
