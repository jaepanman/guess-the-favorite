import React, { useState } from 'react';
import { X, Server, Cloud, Globe, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, RefreshCw, Terminal, Sparkles } from 'lucide-react';

interface ServerConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverUrl: string;
  onSaveServerUrl: (url: string) => void;
  isConnected: boolean;
  isLocalMode: boolean;
  onTestConnection: () => Promise<boolean>;
}

export const ServerConnectionModal: React.FC<ServerConnectionModalProps> = ({
  isOpen,
  onClose,
  serverUrl,
  onSaveServerUrl,
  isConnected,
  isLocalMode,
  onTestConnection,
}) => {
  const [activeTab, setActiveTab] = useState<'cloudrun' | 'url' | 'render'>('cloudrun');
  const [inputUrl, setInputUrl] = useState(serverUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveServerUrl(inputUrl.trim());
    onClose();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const ok = await onTestConnection();
      setTestResult(ok ? 'success' : 'failed');
    } catch {
      setTestResult('failed');
    } finally {
      setTesting(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const gcloudDeployCommand = 'gcloud run deploy efl-classroom-game --source . --port=3000 --allow-unauthenticated --session-affinity';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl border border-white/15 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                Multiplayer & Cloud Run Setup
              </h2>
              <p className="text-xs text-slate-400">
                Run natively on Google Cloud Run with WebSockets enabled
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="close-server-modal-btn"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Connection Status Pill */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          isConnected
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : isLocalMode
            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {isConnected ? '🟢' : isLocalMode ? '🟣' : '🟡'}
            </span>
            <div>
              <div className="text-xs font-black uppercase tracking-wider">
                {isConnected
                  ? 'Connected to Live Multiplayer Server'
                  : isLocalMode
                  ? 'In-Browser Classroom Host Mode (Active)'
                  : 'Connecting...'}
              </div>
              <p className="text-[11px] opacity-80 mt-0.5">
                {isConnected
                  ? 'Real-time WebSockets active across student devices.'
                  : isLocalMode
                  ? 'Active in your browser for smart board & projector projection. Connect Cloud Run for multi-device.'
                  : 'Attempting to establish server connection.'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-white/10 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('cloudrun')}
            id="tab-cloudrun-btn"
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cloudrun'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            Google Cloud Run (Recommended)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            id="tab-url-btn"
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'url'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Server URL
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('render')}
            id="tab-render-btn"
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'render'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Render / Vercel
          </button>
        </div>

        {/* TAB 1: Google Cloud Run Guide */}
        {activeTab === 'cloudrun' && (
          <div className="space-y-4 text-xs">
            {/* AI Studio 1-Click Cloud Run Deploy */}
            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/25 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sky-300">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>Method 1: Built-in 1-Click AI Studio Deployment (Easiest)</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                This app is already running on Google Cloud Run right inside Google AI Studio!
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li>Click the <strong>Deploy</strong> or <strong>Share</strong> button in the top right menu of AI Studio.</li>
                <li>AI Studio instantly provisions a dedicated production <strong>Google Cloud Run</strong> container.</li>
                <li>You receive a permanent <code>https://...run.app</code> URL with both the frontend and WebSocket backend bundled together — no external configuration required!</li>
              </ul>
            </div>

            {/* Standalone Cloud Run Deployment with gcloud */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Terminal className="w-4 h-4 text-sky-400" />
                  <span>Method 2: Deploy to Your Own Google Cloud Project</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold">
                  Dockerfile Included
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                A production multi-stage <code>Dockerfile</code> and <code>cloudbuild.yaml</code> are already generated in the project root. You can deploy directly with a single Google Cloud CLI command:
              </p>

              <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-sky-300 flex items-center justify-between gap-2 border border-white/10">
                <span className="break-all">{gcloudDeployCommand}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(gcloudDeployCommand, 'gcloud')}
                  id="copy-gcloud-cmd-btn"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0 cursor-pointer"
                  title="Copy gcloud command"
                >
                  {copied === 'gcloud' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="space-y-1.5 text-slate-400 text-[11px]">
                <div className="font-semibold text-slate-300">Key Settings Included:</div>
                <div className="flex items-center gap-2">
                  <code className="text-sky-300">--port=3000</code>: Matches the container port.
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-sky-300">--session-affinity</code>: Keeps each student connected to the same game room instance.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Server URL Configuration */}
        {activeTab === 'url' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Backend Server URL (Cloud Run, Render, or Custom)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="e.g. https://efl-game-xyz-uc.a.run.app"
                  className="flex-1 px-4 py-2.5 text-sm bg-slate-800 border border-white/10 text-white rounded-xl focus:outline-none focus:border-sky-500 font-mono"
                />
                <button
                  onClick={handleTest}
                  disabled={testing}
                  id="test-server-connection-btn"
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                  Test
                </button>
              </div>

              {testResult === 'success' && (
                <p className="text-xs text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Backend server is online and responding!
                </p>
              )}
              {testResult === 'failed' && (
                <p className="text-xs text-rose-400 flex items-center gap-1 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" /> Could not reach backend at that URL. Check the URL and ensure the service is running.
                </p>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setInputUrl('')}
                  className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                >
                  Reset to Default (Auto-detect)
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  id="save-server-url-btn"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Save Server URL
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              If your frontend is hosted on Vercel or GitHub Pages, enter your Cloud Run service URL here so student devices connect to the Cloud Run WebSocket server.
            </p>
          </div>
        )}

        {/* TAB 3: Render Deployment Guide */}
        {activeTab === 'render' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2 text-slate-300 leading-relaxed">
              <div className="font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                Render Setup Guide (Fix for &apos;dist/server.cjs not found&apos;)
              </div>
              <p>
                Render defaults to running only <code className="text-amber-300 bg-slate-950 px-1.5 py-0.5 rounded">npm install</code> (or <code className="text-amber-300 bg-slate-950 px-1.5 py-0.5 rounded">bun install</code>), which does not compile the Vite frontend or the Express server bundle.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-white/10 space-y-3">
              <div className="font-bold text-white text-xs uppercase tracking-wider">
                Required Settings in Render Dashboard:
              </div>

              <div className="space-y-2.5">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Build Command</span>
                    <code className="text-emerald-400 font-mono font-bold text-xs">npm install && npm run build</code>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('npm install && npm run build', 'render-build')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0 cursor-pointer"
                    title="Copy Build Command"
                  >
                    {copied === 'render-build' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Start Command</span>
                    <code className="text-emerald-400 font-mono font-bold text-xs">npm start</code>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('npm start', 'render-start')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0 cursor-pointer"
                    title="Copy Start Command"
                  >
                    {copied === 'render-start' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Auto-Recovery Included</span>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    We also added an automatic self-healing startup script (<code className="text-indigo-300">start.cjs</code>). Even if Render runs only <code className="text-indigo-300">npm install</code> during build, it will detect the missing files and build the project automatically before starting!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
