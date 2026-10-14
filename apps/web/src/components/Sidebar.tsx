import React, { useState } from 'react';
import {
  MessageSquare,
  FolderOpen,
  Folder,
  Compass,
  Clock,
  BookOpen,
  Brain,
  FileEdit,
  Briefcase,
  Image,
  Settings,
  Menu,
  X,
  Plus
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  onNewChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  onNewChat
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'research', label: 'Deep Research', icon: Compass },
    { id: 'library', label: 'Library', icon: FolderOpen },
    { id: 'automations', label: 'Automations', icon: Clock },
    { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
    { id: 'memory', label: 'Memory', icon: Brain },
    { id: 'notes', label: 'Notes', icon: FileEdit },
    { id: 'work', label: 'Work', icon: Briefcase },
    { id: 'images', label: 'Images', icon: Image },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelect = (id: string) => {
    onSelectView(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 text-white w-full">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <span className="font-semibold text-sm tracking-wide">Personal AI Workspace</span>
        <button
          onClick={onNewChat}
          className="p-1.5 bg-indigo-600 rounded-lg text-white"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Drawer / Desktop Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Workspace Brand Header */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <h1 className="font-bold text-slate-100 text-base">Personal AI</h1>
              <span className="text-[10px] uppercase font-semibold text-indigo-400 tracking-wider">Workspace 1.0</span>
            </div>
            <button
              onClick={onNewChat}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center space-x-1 text-xs px-2.5 py-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Ny Chat</span>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User & Version Footer */}
        <div className="p-3 border-t border-slate-800/80 text-xs text-slate-500 flex items-center justify-between">
          <span>Legion 5 • 16GB RAM</span>
          <span className="bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/40">Ready</span>
        </div>
      </aside>
    </>
  );
};
