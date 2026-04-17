
import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, CheckCircle2, Loader2, Sparkles, 
  Settings, Server, BrainCircuit, AlertCircle, X, ChevronRight
} from 'lucide-react';
import { apiClient } from '../../api-client';

interface AIConfig {
  id: string;
  label: string;
  provider: string;
  apiKey: string;
  modelName: string;
  baseUrl?: string;
  isActive: boolean;
}

interface AIKeyManagerProps {
  tenantId: string;
}

export function AIKeyManager({ tenantId }: AIKeyManagerProps) {
  const [configs, setConfigs] = useState<AIConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    label: '',
    provider: 'openai',
    apiKey: '',
    modelName: '',
    baseUrl: ''
  });

  const loadConfigs = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const data = await apiClient.getAIConfigs(tenantId);
      setConfigs(data);
    } catch (err: any) {
      setError('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) loadConfigs();
  }, [tenantId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label || !formData.apiKey || !formData.modelName) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await apiClient.createAIConfig(tenantId, formData);
      setShowAddForm(false);
      setFormData({ label: '', provider: 'openai', apiKey: '', modelName: '', baseUrl: '' });
      await loadConfigs();
    } catch (err: any) {
      setError(err.message || 'Failed to create config');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (configId: string) => {
    setLoading(true);
    try {
      await apiClient.activateAIConfig(tenantId, configId);
      await loadConfigs();
    } catch (err: any) {
      setError('Failed to activate config');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this key?')) return;
    setLoading(true);
    try {
      await apiClient.deleteAIConfig(tenantId, configId);
      await loadConfigs();
    } catch (err: any) {
      setError('Failed to delete config');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="p-6 rounded-2xl transition-all duration-300"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-6 h-6 text-primary animate-pulse" />
          <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            AI Brain (BYOK)
          </h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 transition-all text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Model
        </button>
      </div>

      <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
        Connect your own AI brain. Switch between Gemini, Groq (Llama), Together AI, or OpenAI. 
        <span className="text-primary font-medium ml-1">Stable "Memory" (Gemini) remains active regardless of your brain choice.</span>
      </p>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 text-destructive" />
            {error}
          </div>
          <button onClick={() => setError('')}><X className="w-4 h-4 text-destructive" /></button>
        </div>
      )}

      {/* Add Form Section */}
      {showAddForm && (
        <div className="mb-8 p-6 rounded-2xl border border-primary/20 bg-primary/5 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> New Brain Connection
            </h3>
            <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-muted rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Friendly Label</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g. My Llama 3 (Groq)"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Provider</label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
              >
                <option value="openai">OpenAI Compatible (Groq, Together, DeepSeek)</option>
                <option value="gemini">Google Gemini</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Model Name</label>
              <input
                type="text"
                value={formData.modelName}
                onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                placeholder="e.g. llama-3-70b"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-2">API Key</label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>

            {formData.provider === 'openai' && (
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-2 flex items-center gap-2">
                  Base URL (API Root)
                  <span className="text-[10px] lowercase font-normal opacity-60">(e.g. stop at /v1)</span>
                </label>
                <input
                  type="text"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  placeholder="https://integrate.api.nvidia.com/v1"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/30"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="md:col-span-2 mt-2 w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:shadow-xl hover:shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Save Configuration
            </button>
          </form>
        </div>
      )}

      {/* Config List */}
      <div className="space-y-4">
        {configs.length === 0 && !loading && !showAddForm && (
          <div className="py-12 text-center rounded-2xl border-2 border-dashed border-border/50 bg-muted/5">
            <Server className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="text-muted-foreground font-medium">No custom AI brains yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Add one to use something other than the default Gemini.</p>
          </div>
        )}

        {configs.map((config) => (
          <div 
            key={config.id}
            className={`group p-5 rounded-2xl border transition-all duration-300 ${
              config.isActive 
                ? 'bg-primary/5 border-primary/40 shadow-inner' 
                : 'bg-background hover:bg-muted/30 border-border hover:border-primary/20 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-colors ${config.isActive ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'}`}>
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold flex items-center gap-2">
                    {config.label}
                    {config.isActive && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] uppercase tracking-tighter font-black">
                        Active Brain
                      </span>
                    )}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Settings className="w-3 h-3" /> {config.modelName}
                    </span>
                    <span className="text-[10px] text-muted-foreground/40">•</span>
                    <span className="text-xs font-mono text-muted-foreground/60">{config.apiKey}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                {!config.isActive && (
                  <button 
                    onClick={() => handleActivate(config.id)}
                    disabled={loading}
                    className="p-2 px-3 rounded-lg hover:bg-primary/10 text-primary transition-colors flex items-center gap-2 text-xs font-semibold"
                  >
                    Activate <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(config.id)}
                  disabled={loading}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {/* Default Fallback Indicator */}
        {!configs.some(c => c.isActive) && (
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between shadow-sm">
             <div className="flex items-center gap-3">
               <CheckCircle2 className="w-5 h-5 text-primary" />
               <span className="text-sm font-medium">Using System Default (Gemini 2.5 Flash)</span>
             </div>
             <span className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">Environment Active</span>
          </div>
        )}
      </div>

      {loading && configs.length === 0 && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
        </div>
      )}
    </div>
  );
}
