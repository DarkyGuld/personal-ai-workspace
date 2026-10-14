from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal

# --- Work Run & Research Contracts ---
class WorkStep(BaseModel):
    step_number: int
    name: str
    action_type: Literal["plan", "search", "extract", "generate_artifact", "verify"]
    status: Literal["pending", "in_progress", "completed", "failed"]
    details: Optional[Dict[str, Any]] = None

class WorkApprovalRequest(BaseModel):
    action: str
    description: str
    impact_level: Literal["low", "medium", "high", "destructive"]
    requires_explicit_consent: bool = True
    granted: Optional[bool] = None

class ResearchSource(BaseModel):
    url: str
    title: str
    snippet: str
    fetched_at: int
    reliability_score: float = 1.0

class DeepResearchReport(BaseModel):
    query: str
    summary: str
    sources: List[ResearchSource]
    generated_artifact_id: Optional[str] = None
    created_at: int
