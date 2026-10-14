import React, { useState } from 'react';
import { LibraryItem } from '../types';
import { Star, Download, FileText, Image as ImageIcon, Search } from 'lucide-react';

interface LibraryViewProps {
  items: LibraryItem[];
  onToggleFavorite: (id: string) => void;
  onAttachToChat?: (item: LibraryItem) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  items,
  onToggleFavorite,
  onAttachToChat
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'images' | 'documents'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = items.filter(item => {
    if (activeTab === 'favorites' && !item.is_favorite) return false;
    if (activeTab === 'images' && !item.mime_type.startsWith('image/')) return false;
    if (activeTab === 'documents' && item.mime_type.startsWith('image/')) return false;
    if (searchQuery && !item.filename.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 p-6 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Library</h2>
          <p className="text-sm text-slate-400 mt-1">
            Sentralt filregister for opplastede og AI-genererte filer, bilder og rapporter.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Søk i filer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 my-4 border-b border-slate-800 pb-2">
        {(['all', 'favorites', 'documents', 'images'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {tab === 'all' && 'Alle filer'}
            {tab === 'favorites' && 'Favoritter'}
            {tab === 'documents' && 'Dokumenter'}
            {tab === 'images' && 'Bilder'}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-sm">
            Ingen filer funnet i dette utvalget.
          </div>
        ) : (
          filtered.map(item => (
            <div
              key={item.id}
              className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-slate-900 rounded-lg text-indigo-400">
                    {item.mime_type.startsWith('image/') ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-slate-100 truncate max-w-[180px]">{item.filename}</h4>
                    <p className="text-xs text-slate-400">{(item.bytes_size / 1024).toFixed(1)} KB • {item.source_type}</p>
                  </div>
                </div>

                <button
                  onClick={() => onToggleFavorite(item.id)}
                  className={`p-1.5 rounded-md hover:bg-slate-700 ${item.is_favorite ? 'text-amber-400' : 'text-slate-500'}`}
                >
                  <Star className="h-4 w-4 fill-current" />
                </button>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700/50">
                <a
                  href={item.download_url}
                  download={item.filename}
                  className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Last ned</span>
                </a>

                {onAttachToChat && (
                  <button
                    onClick={() => onAttachToChat(item)}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1 rounded-md transition-colors"
                  >
                    Bruk i chat
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
