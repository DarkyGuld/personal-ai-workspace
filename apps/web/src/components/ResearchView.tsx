import React, { useState } from 'react';
import { Compass, CheckCircle2, Download, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { DeepResearchPlan } from '../types';

export const ResearchView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [focusAreaInput, setFocusAreaInput] = useState('');
  const [focusAreas, setFocusAreas] = useState<string[]>(['Teknisk arkitektur', 'Benchmark & Ytelse']);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [plan, setPlan] = useState<DeepResearchPlan | null>(null);
  const [resultReport, setResultReport] = useState<any | null>(null);

  const handleAddFocusArea = () => {
    if (focusAreaInput.trim() && !focusAreas.includes(focusAreaInput.trim())) {
      setFocusAreas([...focusAreas, focusAreaInput.trim()]);
      setFocusAreaInput('');
    }
  };

  const handleRemoveFocusArea = (area: string) => {
    setFocusAreas(focusAreas.filter(a => a !== area));
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsPlanning(true);
    setResultReport(null);
    try {
      const res = await fetch('/api/v1/research/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          focus_areas: focusAreas
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
      }
    } catch (e) {
      console.error('Plan generation failed', e);
    } finally {
      setIsPlanning(false);
    }
  };

  const handleExecuteResearch = async () => {
    if (!plan) return;
    setIsExecuting(true);
    try {
      const res = await fetch(`/api/v1/research/deep?query=${encodeURIComponent(plan.query)}`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setResultReport(data);
      }
    } catch (e) {
      console.error('Deep research execution failed', e);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 p-6 overflow-y-auto">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <h2 className="text-2xl font-bold flex items-center space-x-2 text-white">
          <Compass className="h-6 w-6 text-sky-400" />
          <span>Deep Research (Flertrinns Kilderecherche)</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Strukturert research-agent: dekomponerer tema til delmål, krysssjekker kilder og genererer verifiserte rapporter i Library.
        </p>
      </div>

      {/* Input Stage */}
      <div className="mt-6 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleGeneratePlan} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Research-mål / Spørsmål
            </label>
            <textarea
              rows={2}
              required
              placeholder="f.eks. Grundig sammenligning av Open WebUI vs LibreChat for on-premise bedriftsinstallasjon med 16GB RAM..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-sky-500 placeholder-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Fokusområder & Nøkkelkriterier
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                placeholder="Legg til fokusområde..."
                value={focusAreaInput}
                onChange={e => setFocusAreaInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddFocusArea(); } }}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleAddFocusArea}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium"
              >
                Legg til
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {focusAreas.map(area => (
                <span
                  key={area}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-sky-950 text-sky-300 text-xs border border-sky-800/50"
                >
                  <span>{area}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFocusArea(area)}
                    className="hover:text-red-300 ml-1 text-xs"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isPlanning || !query.trim()}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl font-medium text-xs flex items-center space-x-2 transition shadow"
            >
              {isPlanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Utarbeider plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>1. Lag Research-plan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Plan Review Stage */}
      {plan && (
        <div className="mt-6 bg-slate-950 border border-sky-900/40 rounded-2xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">
                Steg 2: Godkjenn Research-plan
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">{plan.query}</h3>
              <span className="text-xs text-slate-400">
                Estimert kildeomfang: ~{plan.estimated_sources} primærkilder
              </span>
            </div>

            <button
              onClick={handleExecuteResearch}
              disabled={isExecuting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-medium text-xs flex items-center space-x-2 transition shadow"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Kjører research & syntese...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Godkjenn & Utfør Deep Research</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {plan.suggested_steps.map(step => (
              <div
                key={step.step_number}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-sky-950 text-sky-400 border border-sky-800 flex items-center justify-center text-[10px] font-bold">
                      {step.step_number}
                    </span>
                    <h4 className="text-xs font-semibold text-white">{step.objective}</h4>
                  </div>
                  {step.search_queries.length > 0 && (
                    <div className="mt-3">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Søkefraser:</span>
                      <ul className="mt-1 space-y-1">
                        {step.search_queries.map((q, idx) => (
                          <li key={idx} className="text-[11px] font-mono text-sky-300/80 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80">
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500">Forventet funn:</span>
                  <p className="text-xs text-slate-400 italic mt-0.5">{step.expected_findings}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution Results */}
      {resultReport && (
        <div className="mt-6 bg-slate-950 border border-emerald-900/50 rounded-2xl p-6">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="h-4 w-4" />
            <span>Research Fullført & Arkivert i Library</span>
          </div>
          <h3 className="text-base font-bold text-white mb-2">{resultReport.query}</h3>
          <p className="text-xs text-slate-300 mb-4">{resultReport.summary}</p>

          <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 mb-4">
            <span className="text-xs font-semibold text-slate-300 block mb-2">Verifiserte Kilder:</span>
            <div className="space-y-2">
              {resultReport.sources.map((s: any, idx: number) => (
                <div key={idx} className="text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 font-medium hover:underline block mb-0.5"
                  >
                    {s.title}
                  </a>
                  <p className="text-[11px] text-slate-400">{s.snippet}</p>
                  <span className="text-[9px] text-emerald-400 font-mono mt-1 inline-block">
                    Pålitelighetsscore: {Math.round(s.reliability_score * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">Generert fil ID: {resultReport.generated_artifact_id}</span>
            <a
              href={`/api/v1/library/items/${resultReport.generated_artifact_id}/download`}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Last ned full rapport (DOCX)</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
