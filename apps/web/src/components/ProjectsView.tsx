import React, { useState, useEffect } from 'react';
import { Folder, Plus, Trash2, MessageSquare } from 'lucide-react';
import { Project } from '../types';

interface ProjectsViewProps {
  onSelectProjectForChat: (project: Project) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ onSelectProjectForChat }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [icon] = useState('folder');

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/v1/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (e) {
      console.error('Failed to fetch projects', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          system_prompt: systemPrompt.trim(),
          icon
        })
      });

      if (res.ok) {
        setName('');
        setDescription('');
        setSystemPrompt('');
        setShowModal(false);
        await fetchProjects();
      }
    } catch (e) {
      console.error('Failed to create project', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Er du sikker på at du vil slette dette prosjektet? Filer forblir i Library.')) return;
    try {
      const res = await fetch(`/api/v1/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete project', e);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 p-6 overflow-y-auto">
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2 text-white">
            <Folder className="h-6 w-6 text-indigo-400" />
            <span>Prosjekter (Projects & Workspace)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Samle spesifikke systeminstruksjoner, kunnskapsfiler og samtaler under ett felles mål.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm flex items-center space-x-2 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Nytt Prosjekt</span>
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-500">
          Laster prosjekter...
        </div>
      ) : projects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-400">
          <Folder className="h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-200">Ingen prosjekter ennå</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            Opprett ditt første prosjekt for å gi assistenten egne instrukser og koble til filer.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-500"
          >
            Opprett prosjekt
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {projects.map(p => (
            <div
              key={p.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-indigo-950/70 text-indigo-400 rounded-lg border border-indigo-900/50">
                      <Folder className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{p.name}</h3>
                      <span className="text-[10px] text-slate-500">
                        {p.file_count || 0} tilknyttede filer
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-slate-500 hover:text-red-400 p-1 rounded"
                    title="Slett prosjekt"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {p.description && (
                  <p className="text-xs text-slate-400 mt-3 line-clamp-2">
                    {p.description}
                  </p>
                )}
                {p.system_prompt && (
                  <div className="mt-3 bg-slate-900/90 rounded-lg p-2.5 border border-slate-800/80">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                      Systeminstruks:
                    </span>
                    <p className="text-xs text-slate-300 line-clamp-2 font-mono">
                      {p.system_prompt}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  {new Date(p.created_at * 1000).toLocaleDateString()}
                </span>
                <button
                  onClick={() => onSelectProjectForChat(p)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs rounded-lg font-medium flex items-center space-x-1.5 transition"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Start Chat</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Opprett nytt prosjekt</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Prosjektnavn</label>
                <input
                  type="text"
                  required
                  placeholder="f.eks. Q3 Markedsføringsstrategi"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Beskrivelse</label>
                <input
                  type="text"
                  placeholder="Hva skal dette prosjektet oppnå?"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Egendefinert systeminstruks (System Prompt)
                </label>
                <textarea
                  rows={3}
                  placeholder="Instruer AI-en om tone, ekspertise, og retningslinjer for dette prosjektet..."
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg font-medium"
                >
                  Opprett
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
