export interface ModelCard {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  uiArtifact?: {
    type: string;
    props: any;
    state: any;
  };
  attachments?: {
    id: string;
    filename: string;
    mime_type: string;
    download_url: string;
  }[];
  timestamp: number;
}

export interface LibraryItem {
  id: string;
  filename: string;
  mime_type: string;
  bytes_size: number;
  sha256: string;
  source_type: string;
  is_favorite: boolean;
  project_id?: string;
  created_at: number;
  download_url: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  icon?: string;
  system_prompt?: string;
  file_count?: number;
  chat_count?: number;
  created_at: number;
}

export interface AutomationTask {
  id: string;
  name: string;
  prompt: string;
  rrule: string;
  is_active: boolean;
  created_at: number;
  next_run_at?: number;
}

export interface DeepResearchStep {
  step_number: number;
  objective: string;
  search_queries: string[];
  expected_findings: string;
}

export interface DeepResearchPlan {
  plan_id: string;
  query: string;
  suggested_steps: DeepResearchStep[];
  estimated_sources: number;
}
