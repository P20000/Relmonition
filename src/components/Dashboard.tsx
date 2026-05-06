"use client";
import { useState, useEffect } from 'react';
import { Activity, Heart, TrendingUp, Zap, BarChart3, Smile, Sparkles, Shield, Star, Loader2, AlertTriangle, Wrench } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';

const glassCard = {
  background: 'var(--glass-bg)',
  backdropFilter: 'blur(20px)',
  border: '1px solid var(--glass-border)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
};

// ─── Skeleton placeholder for loading ────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-lg animate-pulse bg-muted/50 ${className || ''}`}
    />
  );
}

// ─── Empty state for Gottman card ────────────────────────────────────────────
function GottmanEmptyState() {
  const circumference = 502.4;
  return (
    <div className="p-6 rounded-2xl" style={glassCard}>
      <div className="flex items-center gap-3 mb-4">
        <Activity className="w-6 h-6 text-primary" aria-hidden="true" />
        <h3 className="text-lg font-semibold">Gottman 5:1 Ratio</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Positive to negative interactions during conflict
      </p>
      <div className="flex items-center justify-center py-8">
        <div className="relative">
          <svg className="w-48 h-48" viewBox="0 0 200 200" aria-label="No data yet">
            <circle cx="100" cy="100" r="80" fill="none" stroke="var(--muted)" strokeWidth="16" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <div className="text-3xl font-bold text-muted-foreground">—</div>
            <div className="text-sm text-muted-foreground">no data yet</div>
          </div>
        </div>
      </div>
      <p className="text-center text-sm text-muted-foreground opacity-60">
        Start logging interactions to see your ratio
      </p>
    </div>
  );
}

// ─── Gottman card with real data ──────────────────────────────────────────────
export function GottmanRatioCard({ ratio, sampleWarning }: { ratio: number, sampleWarning?: boolean }) {
  const circumference = 502.4;
  const strokeDash = (Math.min(ratio, 7) / 7) * circumference;

  return (
    <div className="p-6 rounded-2xl" style={glassCard}>
      <div className="flex items-center gap-3 mb-4">
        <Activity className="w-6 h-6 text-primary" aria-hidden="true" />
        <h3 className="text-lg font-semibold">Gottman 5:1 Ratio</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Positive to negative interactions during conflict
      </p>
      <div className="flex items-center justify-center py-8">
        <div className="relative">
          <svg className="w-48 h-48" viewBox="0 0 200 200" aria-label={`Gottman ratio: ${ratio} to 1`}>
            <circle cx="100" cy="100" r="80" fill="none" stroke="var(--muted)" strokeWidth="16" />
            <circle
              cx="100" cy="100" r="80" fill="none"
              stroke="var(--primary)" strokeWidth="16"
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <div className="text-4xl font-bold text-primary">{ratio}</div>
            <div className="text-sm text-muted-foreground">to 1</div>
          </div>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Target:</span>
          <span className="text-foreground font-medium">5.0+</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Status:</span>
          <span className={ratio >= 5.0 ? 'text-green-500 font-medium flex items-center' : 'text-destructive font-medium flex items-center'}>
            {ratio >= 5.0 ? 'Healthy' : 'Needs Attention'}
            {sampleWarning && (
              <span className="ml-2 text-[10px] uppercase tracking-wider opacity-60 bg-muted px-2 py-0.5 rounded-full cursor-help" title="Need more negative conflict samples to ensure an accurate 5:1 ratio calculation.">
                Low Data
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Interaction Chart ──────────────────────────────────────────────────────
function InteractionTrendChart({ data }: { data: any[] }) {
  // Format data for Recharts
  const chartData = [...data]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(d => ({
      date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      Bids: d.bidsCount || 0,
      Repairs: d.repairsCount || 0,
    }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="bidsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="repairsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.2} />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          />
          <Tooltip 
            contentStyle={{ 
              background: 'var(--background/95)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--border)', 
              borderRadius: '12px',
              fontSize: '12px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            height={36} 
            iconType="circle"
            wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          />
          <Area 
            type="monotone" 
            dataKey="Bids" 
            stroke="var(--primary)" 
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#bidsGradient)"
            dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--background)' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
          <Area 
            type="monotone" 
            dataKey="Repairs" 
            stroke="#4ade80" 
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#repairsGradient)"
            dot={{ r: 4, fill: '#4ade80', strokeWidth: 2, stroke: 'var(--background)' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ImprovementsRequiredCard({ journals, history }: { journals: any[], history: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const journalImprovements = (journals || [])
    .filter((j: any) => j.category === 'conflict' || j.sentimentScore < 0)
    .map((j: any) => ({
      id: `j-${j.id || j.date}`,
      date: j.date || j.createdAt,
      title: 'Journal Entry: Conflict',
      description: j.content,
      fix: "Reflect on this moment. Try to use 'I' statements next time and take a timeout if emotions run high.",
      source: 'journal'
    }));

  const historyImprovements = (history && history.length > 0) 
    ? history
        .filter((h: any) => h.score < 60 && h.summary !== 'Analysis pending.')
        .map((h: any) => ({
          id: `h-${h.date}`,
          date: h.date,
          title: 'Chat History: Low Connection',
          description: h.summary,
          fix: "Communication seemed strained here. Practice active listening and validate your partner's feelings even if you disagree.",
          source: 'history'
        }))
    : [];

  const allImprovements = [...journalImprovements, ...historyImprovements]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  if (allImprovements.length === 0) {
    return (
      <div className="p-6 rounded-2xl flex flex-col h-full" style={glassCard}>
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-destructive" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-destructive">Improvements Required</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <div className="text-sm text-muted-foreground mt-2">No areas of concern found. Great job!</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl flex flex-col h-full" style={glassCard}>
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-6 h-6 text-destructive" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-destructive">Improvements Required</h3>
      </div>
      <div className="flex flex-col gap-3">
        {allImprovements.map((item) => {
          const d = new Date(item.date);
          const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
          const displayTime = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          const isExpanded = expandedId === item.id;

          return (
            <div 
              key={item.id} 
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
              className="p-4 rounded-2xl border border-destructive/20 cursor-pointer transition-all hover:bg-destructive/5"
              style={{ backgroundColor: 'rgba(40, 10, 10, 0.3)' }}
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1 pr-4">
                  <span className="text-base font-medium text-destructive/90">{dayName}</span>
                  <span className="text-xs text-muted-foreground opacity-70">
                    {displayTime} • {item.source === 'journal' ? 'Journal' : 'Chat'}
                  </span>
                  <span className="text-sm text-foreground/80 mt-1 line-clamp-1">{item.description}</span>
                </div>
              </div>
              
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-destructive/20 text-sm text-muted-foreground animate-in slide-in-from-top-2 duration-200">
                  <p className="mb-4 leading-relaxed text-foreground/90 italic">
                    "{item.description}"
                  </p>
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2 mb-2">
                       <Wrench className="w-4 h-4 text-destructive" />
                       <span className="font-semibold text-destructive text-xs uppercase tracking-wider">Suggested Fix</span>
                    </div>
                    <p className="text-destructive/90 text-xs leading-relaxed">{item.fix}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


function BestMomentsCard({ data }: { data: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-6 rounded-2xl flex flex-col h-full" style={glassCard}>
        <div className="flex items-center gap-3 mb-4">
          <Star className="w-6 h-6 text-primary" aria-hidden="true" />
          <h3 className="text-lg font-semibold">Best Moments</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <div className="text-4xl font-bold text-muted-foreground">—</div>
          <div className="text-sm text-muted-foreground mt-2">no data yet</div>
        </div>
      </div>
    );
  }

  const bestMoments = data.filter(d => d.score >= 80 && d.summary !== 'Analysis pending.');

  if (bestMoments.length === 0) {
    return (
      <div className="p-6 rounded-2xl flex flex-col h-full" style={glassCard}>
        <div className="flex items-center gap-3 mb-4">
          <Star className="w-6 h-6 text-primary" aria-hidden="true" />
          <h3 className="text-lg font-semibold">Best Moments</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <div className="text-sm text-muted-foreground mt-2">No moments found yet.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl flex flex-col" style={glassCard}>
      <div className="flex items-center gap-3 mb-6">
        <Star className="w-6 h-6 text-primary" aria-hidden="true" />
        <h3 className="text-lg font-semibold">Best Moments</h3>
      </div>
      <div className="flex flex-col gap-3">
        {bestMoments.slice(0, 3).map((moment) => {
          const d = new Date(moment.date);
          const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
          const timeString = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
          const displayTime = (timeString && !timeString.includes('12:00 AM') && !timeString.includes('00:00')) 
            ? timeString 
            : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          
          const isExpanded = expandedId === moment.date;

          return (
            <div 
              key={moment.date} 
              onClick={() => setExpandedId(isExpanded ? null : moment.date)}
              className="p-4 rounded-2xl border border-white/5 cursor-pointer transition-all hover:bg-white/5"
              style={{ backgroundColor: 'rgba(30, 20, 40, 0.4)' }}
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1 pr-4">
                  <span className="text-base font-medium text-foreground">{dayName}</span>
                  <span className="text-xs text-muted-foreground opacity-70">
                    {displayTime}
                  </span>
                  <span className="text-sm text-foreground/80 mt-1 line-clamp-1">{moment.summary}</span>
                </div>
                <div className="px-2 py-1 rounded-lg bg-primary/20 text-primary/90 text-xs font-semibold border border-primary/10 whitespace-nowrap">
                  {moment.score}%
                </div>
              </div>
              
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-white/10 text-sm text-muted-foreground animate-in slide-in-from-top-2 duration-200">
                  <p className="mb-4 leading-relaxed text-foreground/90">
                    {moment.summary}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/20 border border-white/5 text-xs">
                       <Smile className="w-3.5 h-3.5 text-primary" />
                       <span className="font-medium text-foreground/80">{moment.partner1Mood || 'Happy'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/20 border border-white/5 text-xs">
                       <Heart className="w-3.5 h-3.5 text-accent" />
                       <span className="font-medium text-foreground/80">{moment.partner2Mood || 'Joyful'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function Dashboard() {
  const { userId } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const tenantId = localStorage.getItem('activeTenantId');
        if (!tenantId) {
          setData({ lastMood: null, insights: [], recentInteractions: [], history: [] });
          return;
        }
        const API_URL = process.env.NEXT_PUBLIC_API_URL || `https://api.relmonition.dpdns.org/${tenantId}/api/v1`;
        const url = new URL(`${API_URL}/dashboard/${tenantId}`);
        if (userId) url.searchParams.append('userId', userId);
        
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error('Failed to fetch data');
        setData(await response.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [userId]);

  // ... (rest of loading/error states)
  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-8 animate-in fade-in duration-1000 mt-[-10vh]">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <div className="relative bg-background p-5 rounded-full border border-primary/20 shadow-2xl backdrop-blur-sm">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Updating your stats
            </h2>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
              Fetching latest dashboard values...
            </p>
          </div>
          
          <div className="w-32 mx-auto h-1 bg-primary/10 rounded-full overflow-hidden">
             <div className="h-full bg-primary rounded-full animate-pulse opacity-50" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl" style={glassCard}>
          <p className="text-destructive font-medium mb-2">Unable to load dashboard</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const { lastMood, recentInteractions, greeting, insights, history, journals, computedMetrics } = data || {};

  // ── Detect empty state — no real data at all ───────────────────────────────
  const hasInteractions = Array.isArray(recentInteractions) && recentInteractions.length > 0;
  const hasMood = lastMood != null;
  const isEmpty = !hasInteractions && !hasMood;

  const sortedInteractions = hasInteractions
    ? [...recentInteractions].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(a.date).getTime())
    : [];

  const totalBids = sortedInteractions.reduce((s: number, i: any) => s + (i.bidsCount || 0), 0);
  const totalRepairs = sortedInteractions.reduce((s: number, i: any) => s + (i.repairsCount || 0), 0);

  const { gottmanRatio, sampleWarning, healthScore, trend, trendStatus } = computedMetrics || {};
  const isPositiveTrend = trend != null && trend >= 0;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          {greeting && (
            <div className="flex items-center gap-2 mb-4 animate-in fade-in slide-in-from-left duration-700">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
                {greeting}
              </h2>
            </div>
          )}
          <h1 className="mb-2">The Pulse</h1>
          <p className="text-muted-foreground">Your relationship wellness dashboard</p>
        </header>

        {/* AI Insight Card */}
        {insights && insights.length > 0 && (
          <div 
            className="mb-8 p-6 rounded-3xl border border-primary/20 bg-primary/5 relative overflow-hidden group hover:border-primary/40 transition-all duration-500"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-20 h-20 text-primary" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary/70">Relationship Pulse</span>
              </div>
              <p className="text-lg md:text-xl font-medium leading-relaxed">
                "{insights[0].content}"
              </p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  <Star className="w-3.5 h-3.5" />
                  {totalBids} Bids Detected
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                  <Heart className="w-3.5 h-3.5" />
                  {totalRepairs} Repairs Noticed
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── No tenant selected ── */}
        {isEmpty && !localStorage.getItem('activeTenantId') && (
          <div className="mb-8 p-8 rounded-3xl text-center" style={glassCard}>
            <Heart className="w-12 h-12 mx-auto mb-4 text-primary opacity-40" />
            <h2 className="mb-2">No relationship selected</h2>
            <p className="text-muted-foreground text-sm">
              Go to <strong>Settings → Relationships</strong> to create or join a relationship space.
            </p>
          </div>
        )}

        {/* Connection Health ── real or empty */}
        <div className="relative mb-8 p-8 rounded-3xl overflow-hidden" style={{ ...glassCard, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Heart className="w-8 h-8 text-primary" aria-hidden="true" />
                  <h2>Connection Health</h2>
                </div>
                <p className="text-muted-foreground">Overall relationship wellness score</p>
              </div>
              <div className="text-right">
                {healthScore != null ? (
                  <>
                    <div className="text-5xl font-bold text-primary">{healthScore}</div>
                    <div className="text-sm text-muted-foreground">out of 100</div>
                  </>
                ) : (
                  <>
                    <div className="text-5xl font-bold text-muted-foreground/30">—</div>
                    <div className="text-sm text-muted-foreground">no data yet</div>
                  </>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-4">
              {healthScore != null ? (
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000"
                  style={{ width: `${healthScore}%` }}
                  role="progressbar"
                  aria-valuenow={healthScore}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              ) : (
                /* Placeholder dashed bar */
                <div className="absolute inset-0 flex items-center px-2">
                  <div className="w-full border-t-2 border-dashed border-muted-foreground/20" />
                </div>
              )}
            </div>

            {/* Trend or placeholder hint */}
            {trendStatus === 'INSUFFICIENT_DATA' ? (
              <p className="text-sm text-muted-foreground opacity-50 mt-2">
                Log interactions for at least a week to see your trend
              </p>
            ) : trend != null && trend !== 0 ? (
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingUp className={`w-4 h-4 ${isPositiveTrend ? 'text-green-500' : 'text-destructive rotate-180'}`} />
                <span className={`text-sm font-medium ${isPositiveTrend ? 'text-green-500' : 'text-destructive'}`}>
                  {isPositiveTrend ? '+' : ''}{trend} points
                </span>
                <span className="text-sm text-muted-foreground">from last week</span>
              </div>
            ) : isEmpty ? (
              <p className="text-sm text-muted-foreground opacity-50 mt-2">
                Log your mood daily to track your wellness score
              </p>
            ) : null}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gottman card */}
          {gottmanRatio != null ? (
            <GottmanRatioCard ratio={gottmanRatio} sampleWarning={sampleWarning} />
          ) : (
            <GottmanEmptyState />
          )}

          {/* Recent Interactions */}
          <div className="p-6 rounded-2xl" style={glassCard}>
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-primary" aria-hidden="true" />
              <h3>Interaction Trends</h3>
            </div>
            {hasInteractions ? (
              <div className="mt-4">
                <InteractionTrendChart data={sortedInteractions} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <BarChart3 className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm opacity-50">No interactions logged yet</p>
                <p className="text-xs opacity-40 mt-1">Use the Journal to start tracking</p>
              </div>
            )}
          </div>

          {/* Improvements Required - Below Gottman (Left) */}
          <div className="lg:col-start-1">
            <ImprovementsRequiredCard journals={journals || []} history={history || []} />
          </div>

          {/* Best Moments - Below Interactions (Right) */}
          <div className="lg:col-start-2">
            <BestMomentsCard data={history || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
