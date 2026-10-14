import React, { useState, useEffect } from 'react';
import { Settings, Smartphone, Server, Cpu, Palette, RefreshCw, ShieldCheck, FolderSync } from 'lucide-react';

export interface AppConfig {
  appMode: 'standalone' | 'server';
  serverUrl: string;
  provider: 'opencode' | 'openai' | 'anthropic' | 'deepseek' | 'gemini' | 'openrouter' | 'groq';
  model: string;
  apiKey: string;
  theme: 'slate' | 'amoled';
}

export const DEFAULT_CONFIG: AppConfig = {
  appMode: 'standalone',
  serverUrl: 'http://127.0.0.1:3000',
  provider: 'opencode',
  model: 'deepseek-v4.1-flash',
  apiKey: '',
  theme: 'amoled'
};

interface SettingsViewProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ config, onUpdateConfig }) => {
  const [formConfig, setFormConfig] = useState<AppConfig>(config);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setFormConfig(config);
  }, [config]);

  const handleChange = (field: keyof AppConfig, value: any) => {
    const updated = { ...formConfig, [field]: value };
    setFormConfig(updated);
    onUpdateConfig(updated);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus(null);
    try {
      if (formConfig.appMode === 'server') {
        const res = await fetch(`${formConfig.serverUrl.replace(/\/$/, '')}/healthz`);
        if (res.ok) {
          const data = await res.json();
          setTestStatus(`Tilkoblet server OK! PAW v${data.version} (Open WebUI: ${data.upstream_openwebui})`);
        } else {
          setTestStatus(`Server svarte med status ${res.status}`);
        }
      } else {
        // Test direct AI completion endpoint
        const endpoint = formConfig.provider === 'opencode'
          ? 'https://opencode.ai/inference/go/openai/v1/chat/completions'
          : formConfig.provider === 'openai'
          ? 'https://api.openai.com/v1/chat/completions'
          : formConfig.provider === 'deepseek'
          ? 'https://api.deepseek.com/chat/completions'
          : formConfig.provider === 'openrouter'
          ? 'https://openrouter.ai/api/v1/chat/completions'
          : 'https://api.groq.com/openai/v1/chat/completions';

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (formConfig.provider === 'opencode') {
          headers['Authorization'] = 'Bearer sk-LFhohC80cAP6SqukGMA16CpuQomNYhRHbsRX67aDFizhbUFgmNTbWH8SSdulNlnX';
          headers['x-opencode-session'] = 'paw-live-session';
        } else if (formConfig.apiKey) {
          headers['Authorization'] = `Bearer ${formConfig.apiKey}`;
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: formConfig.model,
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 5
          })
        });

        if (res.ok) {
          setTestStatus(`Tilkobling til ${formConfig.provider} (${formConfig.model}) var vellykket! HTTP 200 OK.`);
        } else {
          setTestStatus(`API-test returnerte status ${res.status}. Sjekk API-nøkkel.`);
        }
      }
    } catch (e: any) {
      setTestStatus(`Testfeil: ${e.message || 'Kunne ikke nå endepunktet'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 p-6 overflow-y-auto">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <h2 className="text-2xl font-bold flex items-center space-x-2 text-white">
          <Settings className="h-6 w-6 text-indigo-400" />
          <span>Innstillinger & App-modus</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Velg om appen skal fungere som en frittstående mobilapp med direkte Cloud AI, eller kobles til din hjemmeserver.
        </p>
      </div>

      <div className="max-w-2xl space-y-6 mt-6">
        {/* Mode Selector Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Driftsmodus (App Mode)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleChange('appMode', 'standalone')}
              className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                formConfig.appMode === 'standalone'
                  ? 'bg-emerald-950/40 border-emerald-500/80 text-white shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className={`p-2 rounded-lg ${formConfig.appMode === 'standalone' ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400'}`}>
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Full Lokal Mobilapp</h4>
                  <span className="text-[10px] text-emerald-400 font-medium">Direkte Cloud AI API</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Alt kjører direkte på telefonen. Ingen server/NAS trengs. Bruker direkte API-er for lynrask, høykvalitets AI.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleChange('appMode', 'server')}
              className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                formConfig.appMode === 'server'
                  ? 'bg-indigo-950/40 border-indigo-500/80 text-white shadow-md ring-1 ring-indigo-500/30'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className={`p-2 rounded-lg ${formConfig.appMode === 'server' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Tilkoblet Hjemmeserver</h4>
                  <span className="text-[10px] text-indigo-400 font-medium">Lenovo Legion 5 / PAW BFF</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Kobler mot din PAW-server over Wi-Fi eller Tailscale. Bruker serverens lokale modeller, GPU og sentrale bibliotek.
              </p>
            </button>
          </div>
        </div>

        {/* Standalone API Configuration */}
        {formConfig.appMode === 'standalone' ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-emerald-400" />
              <span>Direkte AI API Konfigurasjon (Mobil)</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">AI-Leverandør</label>
              <select
                value={formConfig.provider}
                onChange={e => handleChange('provider', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="opencode">OpenCode AI (Inkludert DeepSeek Flash - Null oppsett)</option>
                <option value="deepseek">DeepSeek Direct (V3 / R1)</option>
                <option value="openai">OpenAI (GPT-4o, o3-mini, o1)</option>
                <option value="anthropic">Anthropic Claude (Claude 3.5 Sonnet)</option>
                <option value="openrouter">OpenRouter (Alle modeller)</option>
                <option value="groq">Groq (Ultrarask Llama 3.3 70B)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Modellnavn</label>
              <input
                type="text"
                value={formConfig.model}
                onChange={e => handleChange('model', e.target.value)}
                placeholder="f.eks. deepseek-v4.1-flash eller gpt-4o"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {formConfig.provider !== 'opencode' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span>API-nøkkel</span>
                  <span className="text-[10px] text-slate-500">Lagres kun lokalt på enheten</span>
                </label>
                <input
                  type="password"
                  value={formConfig.apiKey}
                  onChange={e => handleChange('apiKey', e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            )}
          </div>
        ) : (
          /* Server Configuration */
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Server className="h-4 w-4 text-indigo-400" />
              <span>Hjemmeserver Tilkobling</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Server URL</label>
              <input
                type="text"
                value={formConfig.serverUrl}
                onChange={e => handleChange('serverUrl', e.target.value)}
                placeholder="http://192.168.1.100:3000 eller Tailscale URL"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Bruk din lokale IP (f.eks. http://192.168.1.50:3000) eller din Tailscale MagicDNS-adresse for sikker tilkobling utenfra.
              </span>
            </div>
          </div>
        )}

        {/* Theme & Samsung AMOLED Display */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Palette className="h-4 w-4 text-sky-400" />
            <span>Skjerm & Visning (AMOLED / Galaxy S25)</span>
          </h3>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => handleChange('theme', 'amoled')}
              className={`flex-1 p-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition ${
                formConfig.theme === 'amoled'
                  ? 'bg-black border-sky-500 text-white ring-1 ring-sky-500/30'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-black border border-slate-700" />
              <span>Ekte AMOLED Sort (#000000)</span>
            </button>

            <button
              type="button"
              onClick={() => handleChange('theme', 'slate')}
              className={`flex-1 p-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition ${
                formConfig.theme === 'slate'
                  ? 'bg-slate-900 border-sky-500 text-white ring-1 ring-sky-500/30'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700" />
              <span>Dark Slate (#0f172a)</span>
            </button>
          </div>
        </div>

        {/* Syncthing P2P Folder Status */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-2">
            <FolderSync className="h-4 w-4 text-emerald-400" />
            <span>Syncthing P2P Fildeling</span>
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Telefonen synkroniserer automatisk mappen <code className="text-emerald-400 font-mono text-[11px]">/storage/emulated/0/PersonalAI</code> med serveren når du er på Wi-Fi eller Tailscale.
          </p>
          <div className="bg-slate-900/80 rounded-xl p-3 text-[11px] text-slate-400 font-mono space-y-1 border border-slate-800/80">
            <div>• Innboks: <span className="text-slate-200">PersonalAI/inbox/</span> (Bilder, opptak)</div>
            <div>• Notater: <span className="text-slate-200">PersonalAI/notes/</span> (Markdown .md)</div>
            <div>• Library: <span className="text-slate-200">PersonalAI/library/</span> (PDF, DOCX, XLSX)</div>
          </div>
        </div>

        {/* Test Connection Button & Status */}
        <div className="pt-2 flex flex-col space-y-3">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 transition shadow-md"
          >
            {isTesting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Tester tilkobling...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Test Tilkobling Nå</span>
              </>
            )}
          </button>

          {testStatus && (
            <div className={`p-3 rounded-xl text-xs font-medium border ${
              testStatus.includes('OK') || testStatus.includes('vellykket')
                ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
                : 'bg-red-950/60 border-red-800/60 text-red-300'
            }`}>
              {testStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
