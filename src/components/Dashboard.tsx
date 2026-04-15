"use client";
import { useState, useEffect } from 'react';
import { Activity, Heart, TrendingUp, Zap, BarChart3, Smile, Sparkles, Shield, Star } from 'lucide-react';
import { 
  LineChart, 
  Line, 
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
export function GottmanRatioCard({ ratio }: { ratio: number }) {
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
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status:</span>
          <span className={ratio >= 5.0 ? 'text-green-500 font-medium' : 'text-destructive font-medium'}>
            {ratio >= 5.0 ? 'Healthy' : 'Needs Attention'}
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
      Positive: d.positiveCount || 0,
      Negative: d.negativeCount || 0,
    }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              background: 'var(--background)', 
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
          <Line 
            type="monotone" 
            dataKey="Positive" 
            stroke="var(--primary)" 
            strokeWidth={3}
            dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--background)' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
          <Line 
            type="monotone" 
            dataKey="Negative" 
            stroke="var(--destructive)" 
            strokeWidth={3}
            dot={{ r: 4, fill: 'var(--destructive)', strokeWidth: 2, stroke: 'var(--background)' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
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
          // No tenant selected — show empty state immediately
          setData({ lastMood: null, insights: [], recentInteractions: [] });
          return;
        }
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
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

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <Skeleton className="h-10 w-64 mb-4" />
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </header>
          <div className="mb-8 p-8 rounded-3xl" style={glassCard}>
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-4 w-32 mb-6" />
            <Skeleton className="h-4 w-full rounded-full" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
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

  const { lastMood, recentInteractions, greeting, insights } = data || {};

  // ── Detect empty state — no real data at all ───────────────────────────────
  const hasInteractions = Array.isArray(recentInteractions) && recentInteractions.length > 0;
  const hasMood = lastMood != null;
  const isEmpty = !hasInteractions && !hasMood;

  // ── Compute metrics only when we have real data ────────────────────────────
  const sortedInteractions = hasInteractions
    ? [...recentInteractions].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const totalPositive = sortedInteractions.reduce((s: number, i: any) => s + (i.positiveCount || 0), 0);
  const totalNegative = sortedInteractions.reduce((s: number, i: any) => s + (i.negativeCount || 0), 0);
  const totalBids = sortedInteractions.reduce((s: number, i: any) => s + (i.bidsCount || 0), 0);
  const totalRepairs = sortedInteractions.reduce((s: number, i: any) => s + (i.repairsCount || 0), 0);
  const gottmanRatio = hasInteractions
    ? (totalNegative === 0 ? totalPositive : Number((totalPositive / totalNegative).toFixed(1)))
    : null;

  const calculateScore = (interactions: any[], moodVal: number) => {
    const p = interactions.reduce((s: number, i: any) => s + (i.positiveCount || 0), 0);
    const n = interactions.reduce((s: number, i: any) => s + (i.negativeCount || 0), 0);
    const t = p + n;
    const interactionScore = t > 0 ? (p / t) * 100 : 50;
    return Math.round((interactionScore * 0.7) + (moodVal * 10 * 0.3));
  };

  const healthScore = hasInteractions
    ? calculateScore(sortedInteractions, lastMood?.moodValue || 5)
    : null;

  const midPoint = Math.max(1, Math.floor(sortedInteractions.length / 2));
  const olderHalf = sortedInteractions.slice(midPoint);
  const prevHealthScore = hasInteractions ? calculateScore(olderHalf, 7) : null;
  const trend = healthScore != null && prevHealthScore != null ? healthScore - prevHealthScore : null;
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
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
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
            {trend != null && trend !== 0 ? (
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingUp className={`w-4 h-4 ${isPositiveTrend ? 'text-green-500' : 'text-destructive rotate-180'}`} />
                <span className={`text-sm font-medium ${isPositiveTrend ? 'text-green-500' : 'text-destructive'}`}>
                  {isPositiveTrend ? '+' : ''}{trend} points
                </span>
                <span className="text-sm text-muted-foreground">from last week</span>
              </div>
            ) : isEmpty ? (
              <p className="text-sm text-muted-foreground opacity-50">
                Log your mood daily to track your wellness score
              </p>
            ) : null}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gottman card */}
          {gottmanRatio != null ? (
            <GottmanRatioCard ratio={gottmanRatio} />
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
        </div>
      </div>
    </div>
  );
}
