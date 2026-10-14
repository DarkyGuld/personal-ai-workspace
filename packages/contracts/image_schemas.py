from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal

# --- Image Generation & Editing Contracts ---
class ImageGenerateRequest(BaseModel):
    prompt: str
    size: str = "512x512"
    style: Optional[str] = "natural"
    project_id: Optional[str] = None

class ImageEditRequest(BaseModel):
    source_item_id: str
    instruction: str
    project_id: Optional[str] = None

class ImageOperationResponse(BaseModel):
    item_id: str
    filename: str
    download_url: str
    width: int
    height: int
    source_type: str
    lineage_parent_id: Optional[str] = None
