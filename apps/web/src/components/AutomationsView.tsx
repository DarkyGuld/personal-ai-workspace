import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Power } from 'lucide-react';
import { AutomationTask } from '../types';

export const AutomationsView: React.FC = () => {
  const [automations, setAutomations] = useState<AutomationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [frequency, setFrequency] = useState('daily');

  const fetchAutomations = async () => {
    try {
      const res = await fetch('/api/v1/automations');
      if (res.ok) {
        const data = await res.json();
        setAutomations(data || []);
      }
    } catch (e) {
      console.error('Failed to fetch automations', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !prompt.trim()) return;

    const rrule = frequency === 'daily'
      ? 'FREQ=DAILY;BYHOUR=8;BYMINUTE=0'
      : frequency === 'weekly'
      ? 'FREQ=WEEKLY;BYDAY=MO;BYHOUR=9;BYMINUTE=0'
      : 'FREQ=HOURLY;INTERVAL=1';

    try {
      const res = await fetch('/api/v1/automations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          prompt: prompt.trim(),
          rrule,
          is_active: true
        })
      });

      if (res.ok) {
        setName('');
        setPrompt('');
        setShowModal(false);
        await fetchAutomations();
      }
    } catch (e) {
      console.error('Failed to create automation', e);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/v1/automations/${id}/toggle?is_active=${!currentStatus}`, {
        method: 'POST'
      });
      if (res.ok) {
        setAutomations(prev =>
          prev.map(a => a.id === id ? { ...a, is_active: !currentStatus } : a)
        );
      }
    } catch (e) {
      console.error('Failed to toggle automation', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Er du sikker på at du vil slette denne automatiseringen?')) return;
    try {
      const res = await fetch(`/api/v1/automations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAutomations(prev => prev.filter(a => a.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete automation', e);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 p-6 overflow-y-auto">
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2 text-white">
            <Clock className="h-6 w-6 text-emerald-400" />
            <span>Automatiseringer & Planlagte Oppgaver</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Sett opp periodiske bakgrunnsoppgaver som kjører automatisk, samler data og lagrer i Library.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-sm flex items-center space-x-2 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Ny Automatisering</span>
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-500">
          Laster oppgaver...
        </div>
      ) : automations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-400">
          <Clock className="h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-200">Ingen aktive automatiseringer</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            Du kan be AI-en om å kjøre en oppsummering hver morgen eller overvåke kilder ukentlig.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-500"
          >
            Opprett oppgave
          </button>
        </div>
      ) : (
        <div className="space-y-3 mt-6">
          {automations.map(a => (
            <div
              key={a.id}
              className={`p-4 rounded-xl border transition flex items-center justify-between ${
                a.is_active
                  ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleToggle(a.id, a.is_active)}
                  className={`p-2.5 rounded-lg transition ${
                    a.is_active
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                  title={a.is_active ? 'Aktiv (klikk for å pause)' : 'Pauset (klikk for å aktivere)'}
                >
                  <Power className="h-4 w-4" />
                </button>
                <div>
                  <h4 className="font-semibold text-white text-sm">{a.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{a.prompt}</p>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 inline-block">
                    {a.rrule} {a.next_run_at && `• Neste kjøring: ${new Date(a.next_run_at * 1000).toLocaleString()}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-slate-900"
                  title="Slett oppgave"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Opprett planlagt automatisering</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Navn på oppgave</label>
                <input
                  type="text"
                  required
                  placeholder="f.eks. Morgenbriefing: AI-nyheter"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Instruks / Prompt</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Hva skal kjøres? f.eks: Gjør et websøk etter siste oppdateringer på Open WebUI og lagre sammendrag i Library."
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Frekvens</label>
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="daily">Hver dag (kl. 08:00)</option>
                  <option value="weekly">Hver uke (mandag kl. 09:00)</option>
                  <option value="hourly">Hver time</option>
                </select>
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg font-medium"
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
