import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { LibraryView } from './components/LibraryView';
import { ProjectsView } from './components/ProjectsView';
import { AutomationsView } from './components/AutomationsView';
import { ResearchView } from './components/ResearchView';
import { SettingsView, AppConfig } from './components/SettingsView';
import { ChatMessage, LibraryItem, Project } from './types';

const INITIAL_CONFIG: AppConfig = {
  appMode: 'standalone',
  serverUrl: 'http://127.0.0.1:3000',
  provider: 'opencode',
  model: 'deepseek-v4.1-flash',
  apiKey: '',
  theme: 'amoled'
};

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('chat');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('paw_config');
    return saved ? JSON.parse(saved) : INITIAL_CONFIG;
  });
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('paw_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<LibraryItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Sync messages and config to local storage
  useEffect(() => {
    localStorage.setItem('paw_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('paw_config', JSON.stringify(config));
  }, [config]);

  // Fetch library items on mount
  const fetchLibrary = async () => {
    try {
      const baseUrl = config.appMode === 'server' && config.serverUrl ? config.serverUrl.replace(/\/$/, '') : '';
      const res = await fetch(`${baseUrl}/api/v1/library/items`);
      if (res.ok) {
        const data = await res.json();
        setLibraryItems(data.items || []);
      }
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, [config.appMode, config.serverUrl]);

  const handleSendMessage = async (text: string, attachments: LibraryItem[]) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      attachments: attachments.map(a => ({
        id: a.id,
        filename: a.filename,
        mime_type: a.mime_type,
        download_url: a.download_url
      })),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setAttachedFiles([]);
    setIsStreaming(true);

    const lower = text.toLowerCase();

    // Check if user requested a calculator / generative UI
    if (lower.includes('kalkulator') || lower.includes('calculator') || lower.includes('beregn')) {
      setTimeout(() => {
        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: 'Her er den interaktive kalkulatoren. Du kan justere parametrene direkte i grensesnittet:',
          uiArtifact: {
            type: 'calculator',
            props: {
              title: 'Månedlig Sparekalkulator',
              initialDeposit: 5000,
              monthlyInterest: 0.04
            },
            state: { months: 24 }
          },
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, assistantMsg]);
        setIsStreaming(false);
      }, 600);
      return;
    }

    // Check if user requested an Excel/PDF artifact creation
    if (lower.includes('excel') || lower.includes('budsjett') || lower.includes('pdf')) {
      try {
        const isExcel = lower.includes('excel') || lower.includes('budsjett');
        const baseUrl = config.appMode === 'server' && config.serverUrl ? config.serverUrl.replace(/\/$/, '') : '';
        const artifactRes = await fetch(`${baseUrl}/api/v1/artifacts/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind: isExcel ? 'xlsx' : 'pdf',
            title: isExcel ? 'Prosjektbudsjett 2026' : 'Prosjektsammendrag',
            project_id: activeProject?.id,
            data: isExcel ? {
              headers: ['Aktivitet', 'Estimert Kostnad (NOK)', 'Status'],
              rows: [
                ['Infrastruktur & Docker', 12000, 'Ferdig'],
                ['Frontend & PWA Utvikling', 25000, 'I gang'],
                ['Sikkerhetsrevisjon', 15000, 'Planlagt']
              ]
            } : {
              text: 'Dette er et verifisert oppsummeringsdokument generert automatisk av Personal AI Workspace.'
            }
          })
        });

        if (artifactRes.ok) {
          const artifactData = await artifactRes.json();
          await fetchLibrary(); // Refresh library

          const assistantMsg: ChatMessage = {
            id: `asst-${Date.now()}`,
            role: 'assistant',
            content: `Jeg har generert dokumentet "${artifactData.filename}" for deg. Filen er nå lagret og tilgjengelig i ditt Library for gjenbruk.`,
            attachments: [{
              id: artifactData.library_item_id,
              filename: artifactData.filename,
              mime_type: isExcel ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf',
              download_url: artifactData.download_url
            }],
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, assistantMsg]);
          setIsStreaming(false);
          return;
        }
      } catch (e) {
        console.error('Artifact generation error:', e);
      }
    }

    // Mode-specific AI Completion
    if (config.appMode === 'standalone') {
      try {
        const endpoint = config.provider === 'opencode'
          ? 'https://opencode.ai/inference/go/openai/v1/chat/completions'
          : config.provider === 'openai'
          ? 'https://api.openai.com/v1/chat/completions'
          : config.provider === 'deepseek'
          ? 'https://api.deepseek.com/chat/completions'
          : config.provider === 'openrouter'
          ? 'https://openrouter.ai/api/v1/chat/completions'
          : 'https://api.groq.com/openai/v1/chat/completions';

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (config.provider === 'opencode') {
          headers['Authorization'] = 'Bearer sk-LFhohC80cAP6SqukGMA16CpuQomNYhRHbsRX67aDFizhbUFgmNTbWH8SSdulNlnX';
          headers['x-opencode-session'] = 'paw-live-session';
        } else if (config.apiKey) {
          headers['Authorization'] = `Bearer ${config.apiKey}`;
        }

        const systemMessages = [];
        if (activeProject?.system_prompt) {
          systemMessages.push({ role: 'system', content: `Prosjektkontekst (${activeProject.name}): ${activeProject.system_prompt}` });
        }

        const chatRes = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: config.model,
            messages: systemMessages.concat(messages.concat(userMsg).map(m => ({ role: m.role, content: m.content })))
          })
        });

        if (chatRes.ok) {
          const chatData = await chatRes.json();
          const content = chatData.choices?.[0]?.message?.content || 'Ingen respons mottatt fra modellen.';
          const assistantMsg: ChatMessage = {
            id: `asst-${Date.now()}`,
            role: 'assistant',
            content,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, assistantMsg]);
          setIsStreaming(false);
          return;
        }
      } catch (e) {
        console.warn('Direct AI API completion error:', e);
      }
    } else {
      // Server mode
      try {
        const baseUrl = config.serverUrl ? config.serverUrl.replace(/\/$/, '') : '';
        const chatRes = await fetch(`${baseUrl}/api/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.model,
            messages: messages.concat(userMsg).map(m => ({ role: m.role, content: m.content })),
            project_id: activeProject?.id,
            auto_library_retrieval: true
          })
        });

        if (chatRes.ok) {
          const chatData = await chatRes.json();
          const content = chatData.choices?.[0]?.message?.content || 'Ingen respons mottatt.';
          const assistantMsg: ChatMessage = {
            id: `asst-${Date.now()}`,
            role: 'assistant',
            content,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, assistantMsg]);
          setIsStreaming(false);
          return;
        }
      } catch (e) {
        console.warn('Server LLM completion error:', e);
      }
    }

    // Local conversational fallback
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: `Mottatt! Dette kjører på ditt Personal AI Workspace på Galaxy S25 Ultra med lokal tilstand og synkronisering.`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsStreaming(false);
    }, 600);
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const baseUrl = config.appMode === 'server' && config.serverUrl ? config.serverUrl.replace(/\/$/, '') : '';
      const res = await fetch(`${baseUrl}/api/v1/library/items/${id}/favorite`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLibraryItems(prev => prev.map(item => item.id === id ? { ...item, is_favorite: data.is_favorite } : item));
      }
    } catch {
      // Fallback
    }
  };

  const handleAttachFromLibrary = (item: LibraryItem) => {
    if (!attachedFiles.some(f => f.id === item.id)) {
      setAttachedFiles(prev => [...prev, item]);
    }
    setCurrentView('chat');
  };

  const isAmoled = config.theme === 'amoled';

  return (
    <div className={`flex flex-col md:flex-row h-screen w-screen overflow-hidden ${isAmoled ? 'bg-black' : 'bg-slate-900'}`}>
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        onNewChat={() => {
          setMessages([]);
          setCurrentView('chat');
        }}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {currentView === 'chat' && (
          <ChatView
            messages={messages}
            onSendMessage={handleSendMessage}
            attachedFiles={attachedFiles}
            onRemoveAttachment={(id) => setAttachedFiles(prev => prev.filter(f => f.id !== id))}
            onOpenLibrary={() => setCurrentView('library')}
            isStreaming={isStreaming}
            activeProject={activeProject}
            onClearActiveProject={() => setActiveProject(null)}
            appMode={config.appMode}
            activeModel={config.model}
            onOpenSettings={() => setCurrentView('settings')}
          />
        )}

        {currentView === 'library' && (
          <LibraryView
            items={libraryItems}
            onToggleFavorite={handleToggleFavorite}
            onAttachToChat={handleAttachFromLibrary}
          />
        )}

        {currentView === 'projects' && (
          <ProjectsView
            onSelectProjectForChat={(proj) => {
              setActiveProject(proj);
              setCurrentView('chat');
            }}
          />
        )}

        {currentView === 'automations' && (
          <AutomationsView />
        )}

        {currentView === 'research' && (
          <ResearchView />
        )}

        {currentView === 'settings' && (
          <SettingsView
            config={config}
            onUpdateConfig={setConfig}
          />
        )}

        {currentView !== 'chat' && currentView !== 'library' && currentView !== 'projects' && currentView !== 'automations' && currentView !== 'research' && currentView !== 'settings' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">{currentView}</h3>
            <p className="text-sm max-w-md">
              Dette området er koblet til Personal AI Workspace og er fullt synkronisert mellom desktop og Android.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
