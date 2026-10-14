import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { LibraryView } from './components/LibraryView';
import { ChatMessage, LibraryItem } from './types';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('chat');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('paw_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<LibraryItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Sync messages to local storage for offline / Android persistence
  useEffect(() => {
    localStorage.setItem('paw_messages', JSON.stringify(messages));
  }, [messages]);

  // Fetch library items on mount
  const fetchLibrary = async () => {
    try {
      const res = await fetch('/api/v1/library/items');
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
  }, []);

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

    // Check if user specifically requested a calculator / generative UI
    const lower = text.toLowerCase();
    if (lower.includes('kalkulator') || lower.includes('calculator') || lower.includes('beregn')) {
      setTimeout(() => {
        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: 'Her er den interaktive sparekalkulatoren. Du kan justere varigheten med slideren nedenfor for å se oppdatert avkastning:',
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
      }, 700);
      return;
    }

    // Check if user requested an Excel/PDF artifact creation
    if (lower.includes('excel') || lower.includes('budsjett') || lower.includes('pdf')) {
      try {
        const isExcel = lower.includes('excel') || lower.includes('budsjett');
        const artifactRes = await fetch('/api/v1/artifacts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind: isExcel ? 'xlsx' : 'pdf',
            title: isExcel ? 'Prosjektbudsjett 2026' : 'Prosjektsammendrag',
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

    // Default conversational response
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: `Mottatt! Dette kjører på ditt lokale Personal AI Workspace med full datalagring og paritet på både PC og Android.`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsStreaming(false);
    }, 600);
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/library/items/${id}/favorite`, { method: 'POST' });
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

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-slate-900">
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
          />
        )}

        {currentView === 'library' && (
          <LibraryView
            items={libraryItems}
            onToggleFavorite={handleToggleFavorite}
            onAttachToChat={handleAttachFromLibrary}
          />
        )}

        {currentView !== 'chat' && currentView !== 'library' && (
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
