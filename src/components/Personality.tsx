"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../../api-client';
import { 
  User, Heart, ThumbsDown, Zap, ShieldAlert, Sparkles, Plus, X, Loader2, RefreshCcw, PieChart 
} from 'lucide-react';

type Profile = {
  id: string;
  userId: string;
  userName: string;
  traits: string[];
  likes: string[];
  dislikes: string[];
  communicationStyle: string;
  triggersAndTraumas: string[];
};

type Compatibility = {
  compatibilityPercentage: number;
  summary: string;
  growthOpportunities: string[];
};

export function Personality() {
  const { activeTenantId } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [compatibility, setCompatibility] = useState<Compatibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  const [newLike, setNewLike] = useState<{ [userId: string]: string }>({});
  const [newDislike, setNewDislike] = useState<{ [userId: string]: string }>({});

  const glassCard = {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(20px)',
    border: '1px solid var(--glass-border)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  };

  useEffect(() => {
    if (activeTenantId) {
      loadData();
    }
  }, [activeTenantId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/profiles/${activeTenantId}`);
      setProfiles(res.profiles || []);
      setCompatibility(res.compatibility || null);
    } catch (err) {
      console.error("Failed to load profiles", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!activeTenantId || generating) return;
    try {
      setGenerating(true);
      await apiClient.post(`/profiles/${activeTenantId}/generate`, {});
      alert("AI Analysis started! The profiles will be updated in the background. Check back in a minute.");
    } catch (err) {
      console.error("Failed to trigger generation", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleAddPreference = async (userId: string, type: 'like' | 'dislike') => {
    const item = type === 'like' ? newLike[userId] : newDislike[userId];
    if (!item?.trim() || !activeTenantId) return;

    try {
      const res = await apiClient.patch(`/profiles/${activeTenantId}/${userId}/likes`, {
        type,
        action: 'add',
        item: item.trim()
      });
      
      // Optimistic update
      setProfiles(prev => prev.map(p => {
        if (p.userId === userId) {
          const arr = type === 'like' ? [...p.likes] : [...p.dislikes];
          if (!arr.includes(item.trim())) arr.push(item.trim());
          return { ...p, [type === 'like' ? 'likes' : 'dislikes']: arr };
        }
        return p;
      }));
      
      if (type === 'like') setNewLike(prev => ({ ...prev, [userId]: '' }));
      else setNewDislike(prev => ({ ...prev, [userId]: '' }));
      
    } catch (err) {
      console.error("Failed to add", err);
    }
  };

  const handleRemovePreference = async (userId: string, type: 'like' | 'dislike', item: string) => {
    if (!activeTenantId) return;
    try {
      await apiClient.patch(`/profiles/${activeTenantId}/${userId}/likes`, {
        type,
        action: 'remove',
        item
      });
      
      setProfiles(prev => prev.map(p => {
        if (p.userId === userId) {
          const arr = type === 'like' ? p.likes.filter(i => i !== item) : p.dislikes.filter(i => i !== item);
          return { ...p, [type === 'like' ? 'likes' : 'dislikes']: arr };
        }
        return p;
      }));
    } catch (err) {
      console.error("Failed to remove", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground animate-pulse">Loading profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <User className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Personality Profiles</h1>
          </div>
          <p className="text-muted-foreground">Deep AI-driven insights into who you both are.</p>
        </div>
        
        <button 
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl transition-all shadow-sm group"
        >
          <RefreshCcw className={`w-4 h-4 text-primary ${generating ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          <span className="text-sm font-medium">{generating ? 'Analyzing...' : 'Force Resync AI'}</span>
        </button>
      </header>

      {profiles.length === 0 ? (
        <div className="text-center p-12 rounded-3xl" style={glassCard}>
           <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
           <h3 className="text-xl font-semibold mb-2">No Profiles Found</h3>
           <p className="text-muted-foreground mb-6">Profiles are automatically generated after 3-4 journal entries or when you manually sync.</p>
           <button onClick={handleGenerate} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:scale-105 transition-all">Generate Now</button>
        </div>
      ) : (
        <>
          {/* Profiles Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {profiles.map(profile => (
              <div key={profile.id} className="p-6 md:p-8 rounded-3xl overflow-hidden relative" style={glassCard}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {profile.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{profile.userName}</h2>
                    <p className="text-sm text-primary font-medium tracking-wide">AI Personality Synthesis</p>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Traits */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      <h3 className="text-sm font-semibold uppercase tracking-widest opacity-70">Core Traits</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.traits.map((t, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg bg-card border border-white/5 text-sm font-medium shadow-sm">{t}</span>
                      ))}
                      {profile.traits.length === 0 && <span className="text-xs opacity-50 italic">None identified yet</span>}
                    </div>
                  </div>

                  {/* Likes (Editable) */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Heart className="w-4 h-4 text-rose-500" />
                      <h3 className="text-sm font-semibold uppercase tracking-widest opacity-70">Likes & Joys</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {profile.likes.map((l, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 text-sm font-medium flex items-center gap-2 group">
                          {l}
                          <button onClick={() => handleRemovePreference(profile.userId, 'like', l)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-rose-500/20 rounded-full">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="Add a like..."
                        value={newLike[profile.userId] || ''}
                        onChange={e => setNewLike(prev => ({...prev, [profile.userId]: e.target.value}))}
                        onKeyDown={e => e.key === 'Enter' && handleAddPreference(profile.userId, 'like')}
                        className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-input/50 border border-border focus:outline-none focus:border-rose-500/50"
                      />
                      <button onClick={() => handleAddPreference(profile.userId, 'like')} className="p-1.5 rounded-lg bg-card border border-border hover:bg-accent text-muted-foreground"><Plus className="w-4 h-4"/></button>
                    </div>
                  </div>

                  {/* Dislikes (Editable) */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ThumbsDown className="w-4 h-4 text-orange-500" />
                      <h3 className="text-sm font-semibold uppercase tracking-widest opacity-70">Dislikes & Pet Peeves</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {profile.dislikes.map((d, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20 text-sm font-medium flex items-center gap-2 group">
                          {d}
                          <button onClick={() => handleRemovePreference(profile.userId, 'dislike', d)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-orange-500/20 rounded-full">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="Add a dislike..."
                        value={newDislike[profile.userId] || ''}
                        onChange={e => setNewDislike(prev => ({...prev, [profile.userId]: e.target.value}))}
                        onKeyDown={e => e.key === 'Enter' && handleAddPreference(profile.userId, 'dislike')}
                        className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-input/50 border border-border focus:outline-none focus:border-orange-500/50"
                      />
                      <button onClick={() => handleAddPreference(profile.userId, 'dislike')} className="p-1.5 rounded-lg bg-card border border-border hover:bg-accent text-muted-foreground"><Plus className="w-4 h-4"/></button>
                    </div>
                  </div>

                  {/* Comm Style */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-sm font-semibold uppercase tracking-widest opacity-70">Communication Style</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/80 bg-black/10 dark:bg-white/5 p-4 rounded-xl border border-white/5">
                      {profile.communicationStyle || "No data yet."}
                    </p>
                  </div>

                  {/* Triggers & Traumas */}
                  {profile.triggersAndTraumas.length > 0 && (
                    <div className="pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldAlert className="w-4 h-4 text-destructive/80" />
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-destructive/80">Triggers & Sensitivities</h3>
                      </div>
                      <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
                        {profile.triggersAndTraumas.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>

          {/* Compatibility Insights Section */}
          {compatibility && (
            <div className="mt-8 p-8 rounded-3xl relative overflow-hidden" style={glassCard}>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-500/5 pointer-events-none" />
              
              <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                {/* Score */}
                <div className="flex-shrink-0 text-center">
                   <div className="relative inline-flex items-center justify-center">
                     <svg className="w-32 h-32 transform -rotate-90">
                       <circle cx="64" cy="64" r="56" className="text-card stroke-current" strokeWidth="12" fill="transparent" />
                       <circle 
                         cx="64" 
                         cy="64" 
                         r="56" 
                         className="text-primary stroke-current drop-shadow-md" 
                         strokeWidth="12" 
                         fill="transparent" 
                         strokeDasharray={2 * Math.PI * 56} 
                         strokeDashoffset={2 * Math.PI * 56 * (1 - compatibility.compatibilityPercentage / 100)} 
                         strokeLinecap="round" 
                       />
                     </svg>
                     <div className="absolute flex flex-col items-center justify-center">
                       <span className="text-3xl font-black">{compatibility.compatibilityPercentage}%</span>
                       <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Match</span>
                     </div>
                   </div>
                </div>

                {/* Summary & Growth */}
                <div className="flex-1 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <PieChart className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-bold">Dynamic Analysis</h2>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{compatibility.summary}</p>
                  </div>
                  
                  {compatibility.growthOpportunities.length > 0 && (
                    <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Growth Opportunities</h3>
                      <div className="grid gap-2">
                        {compatibility.growthOpportunities.map((g, i) => (
                          <div key={i} className="flex gap-3 text-sm text-foreground/80">
                             <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                             <span>{g}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
