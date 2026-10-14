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
  created_at: number;
}
