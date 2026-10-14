import React, { useState } from 'react';
import { ChatMessage, LibraryItem } from '../types';
import { IntelligentUIWidget } from './IntelligentUIWidget';
import { Send, Paperclip, Sparkles, Download, X } from 'lucide-react';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, attachments: LibraryItem[]) => void;
  attachedFiles: LibraryItem[];
  onRemoveAttachment: (id: string) => void;
  onOpenLibrary: () => void;
  isStreaming: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  attachedFiles,
  onRemoveAttachment,
  onOpenLibrary,
  isStreaming
}) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && attachedFiles.length === 0) return;
    onSendMessage(inputText, attachedFiles);
    setInputText('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="p-4 bg-indigo-950/60 rounded-2xl border border-indigo-800/40 text-indigo-400 mb-4 shadow-inner">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Hva kan jeg hjelpe deg med i dag?</h3>
            <p className="text-sm max-w-md text-slate-400 mb-6">
              Still spørsmål, be om interaktive kalkulatorer, eller be meg generere rapporter i Excel, PDF eller PowerPoint.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-md">
              <button
                onClick={() => setInputText('Lag en interaktiv lånekalkulator')}
                className="text-left text-xs bg-slate-800 hover:bg-slate-700/80 p-3 rounded-xl border border-slate-700/60 text-slate-300 transition-colors"
              >
                📊 "Lag en interaktiv lånekalkulator"
              </button>
              <button
                onClick={() => setInputText('Generer et Excel-budsjett for prosjektet')}
                className="text-left text-xs bg-slate-800 hover:bg-slate-700/80 p-3 rounded-xl border border-slate-700/60 text-slate-300 transition-colors"
              >
                📑 "Generer et Excel-budsjett for prosjektet"
              </button>
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] md:max-w-2xl rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-none'
                }`}
              >
                {/* Text Content */}
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* Attached Files rendering */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-700/40 space-y-1.5">
                    {msg.attachments.map(att => (
                      <a
                        key={att.id}
                        href={att.download_url}
                        download={att.filename}
                        className="inline-flex items-center space-x-2 text-xs bg-slate-900/60 hover:bg-slate-900 text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-700/30 transition-colors mr-2"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>{att.filename}</span>
                      </a>
                    ))}
                  </div>
                )}

                {/* Intelligent Generative UI Widget */}
                {msg.uiArtifact && (
                  <IntelligentUIWidget
                    type={msg.uiArtifact.type}
                    props={msg.uiArtifact.props}
                    initialState={msg.uiArtifact.state}
                  />
                )}
              </div>
            </div>
          ))
        )}

        {isStreaming && (
          <div className="flex items-center space-x-2 text-indigo-400 text-xs py-2">
            <span className="animate-spin text-base">✦</span>
            <span>Tenker og genererer svar...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80">
        {/* Active Attachments bar */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachedFiles.map(file => (
              <span
                key={file.id}
                className="inline-flex items-center space-x-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-md"
              >
                <span className="truncate max-w-[150px]">{file.filename}</span>
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(file.id)}
                  className="text-slate-400 hover:text-rose-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenLibrary}
            title="Legg ved fil fra Library"
            className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 transition-colors"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          <input
            type="text"
            placeholder="Skriv en melding..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="submit"
            disabled={!inputText.trim() && attachedFiles.length === 0}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl transition-colors shadow-sm"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
