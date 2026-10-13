import { useState, useEffect } from 'react';
import { Server, CheckCircle2, AlertCircle, RefreshCw, X, Globe, Save } from 'lucide-react';
import { getCustomApiUrl, setCustomApiUrl, checkApiHealth, type HealthCheckResult, getApiBaseUrl } from '../services/api';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function ApiSettingsModal({ isOpen, onClose, onSaved }: ApiSettingsModalProps) {
  const [apiUrl, setApiUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthCheckResult | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiUrl(getCustomApiUrl() || getApiBaseUrl());
      setSavedSuccess(false);
      handleTestPing();
    }
  }, [isOpen]);

  const handleTestPing = async () => {
    setTesting(true);
    const result = await checkApiHealth();
    setHealthStatus(result);
    setTesting(false);
  };

  const handleSave = () => {
    setCustomApiUrl(apiUrl);
    setSavedSuccess(true);
    handleTestPing();
    if (onSaved) onSaved();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    setApiUrl('');
    setCustomApiUrl('');
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      handleTestPing();
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-2xl">
            <Server size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Backend API Connection</h3>
            <p className="text-xs text-slate-400">Configure connection for Netlify / Cloud Hosting</p>
          </div>
        </div>

        {/* Live Status Card */}
        <div className={`p-4 rounded-2xl border mb-5 flex items-center justify-between transition-all ${
          healthStatus?.connected 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
        }`}>
          <div className="flex items-center gap-3">
            {healthStatus?.connected ? (
              <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle size={24} className="text-rose-400 shrink-0" />
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">
                {healthStatus?.connected ? 'Backend Connected' : 'Cannot Reach Backend'}
              </p>
              <p className="text-xs opacity-80">
                {healthStatus?.connected 
                  ? `Latency: ${healthStatus.latencyMs}ms • Operational` 
                  : (healthStatus?.message || 'Check URL or CORS settings')}
              </p>
            </div>
          </div>
          <button
            onClick={handleTestPing}
            disabled={testing}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-600 transition-colors disabled:opacity-50"
            title="Test Connection"
          >
            <RefreshCw size={16} className={testing ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              API Base URL
            </label>
            <div className="relative">
              <Globe size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://fazah-garage-api.onrender.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Leave blank to use Netlify proxy rewrite (<code className="text-blue-400">/api</code>) or enter your hosted Render/Railway URL.
            </p>
          </div>

          {savedSuccess && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs text-center font-bold">
              ✓ API URL Updated & Saved!
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleReset}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm transition-all"
            >
              Reset to Default
            </button>
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-blue-600/30 transition-all active:scale-95"
            >
              <Save size={16} /> Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
