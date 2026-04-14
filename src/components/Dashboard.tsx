"use client";
import { useState, useEffect } from 'react';
import { Activity, Calendar, Heart, TrendingUp, MessageCircle, Zap } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '../../api-client';

export function GottmanRatioCard({ ratio = 5.2 }: { ratio?: number }) {
  // SVG Progress calculation based on your provided formula
  // The value 502.4 represents the circumference of the circle (2 * PI * 80)
  const circumference = 502.4;
  // Cap visual progress at 7 to avoid overlapping, but keep the number accurate
  const strokeDash = (Math.min(ratio, 7) / 7) * circumference;

  return (
    <div
      className="p-6 rounded-2xl"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-4">
        <Activity className="w-6 h-6 text-primary" aria-hidden="true" />
        <h3 className="text-lg font-semibold">Gottman 5:1 Ratio</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Positive to negative interactions during conflict
      </p>

      {/* Visual Indicator (SVG Circle) */}
      <div className="flex items-center justify-center py-8">
        <div className="relative">
          <svg className="w-48 h-48" viewBox="0 0 200 200" aria-label={`Gottman ratio: ${ratio} to 1`}>
            {/* Background Track */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="var(--muted)"
              strokeWidth="16"
            />
            {/* Active Progress */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="16"
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center Text Labels */}
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <div className="text-4xl font-bold text-primary">{ratio}</div>
            <div className="text-sm text-muted-foreground">to 1</div>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Target:</span>
          <span className="text-foreground font-medium">5.0+</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status:</span>
          <span className={ratio >= 5.0 ? "text-green-500 font-medium" : "text-destructive font-medium"}>
            {ratio >= 5.0 ? 'Healthy' : 'Needs Attention'}
          </span>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const response = await fetch(`${API_URL}/dashboard/001`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>Error loading dashboard: {error}</div>;
  if (!data) return <div>No data found.</div>;

  const { lastMood, insights, recentInteractions } = data;

  // Sort interactions descending
  const sortedInteractions = [...recentInteractions].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Calculate aggregate Gottman ratio
  const totalPositive = sortedInteractions.reduce((sum: number, item: any) => sum + (item.positiveCount || 0), 0);
  const totalNegative = sortedInteractions.reduce((sum: number, item: any) => sum + (item.negativeCount || 0), 0);
  const gottmanRatio = totalNegative === 0 
    ? (totalPositive > 0 ? totalPositive : 5.0) 
    : Number((totalPositive / totalNegative).toFixed(1));

  // Better Health Score Calculation: 70% interactions percentage, 30% mood
  const calculateScore = (interactions: any[], moodVal: number) => {
    const p = interactions.reduce((sum: number, item: any) => sum + (item.positiveCount || 0), 0);
    const n = interactions.reduce((sum: number, item: any) => sum + (item.negativeCount || 0), 0);
    const t = p + n;
    const interactionScore = t > 0 ? (p / t) * 100 : 50;
    return Math.round((interactionScore * 0.7) + (moodVal * 10 * 0.3));
  };

  const healthScore = calculateScore(sortedInteractions, lastMood?.moodValue || 5);
  
  // Divide interactions to simulate 'last week' trend
  const midPoint = Math.max(1, Math.floor(sortedInteractions.length / 2));
  const olderHalf = sortedInteractions.slice(midPoint);
  const prevHealthScore = calculateScore(olderHalf, 7); // Using an average previous mood of 7
  const trend = healthScore - prevHealthScore;
  const isPositiveTrend = trend >= 0;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="mb-2">The Pulse</h1>
          <p className="text-muted-foreground">Your relationship wellness dashboard</p>
        </header>

        {/* Connection Meter - Hero Widget */}
        <div
          className="relative mb-8 p-8 rounded-3xl overflow-hidden"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
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
                <div className="text-5xl font-bold text-primary" aria-label={`Health score: ${healthScore} out of 100`}>
                  {healthScore}
                </div>
                <div className="text-sm text-muted-foreground">out of 100</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-4">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000"
                style={{ width: `${healthScore}%` }}
                role="progressbar"
                aria-valuenow={healthScore}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>

            {/* Trend Indicator */}
            {trend !== 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingUp className={`w-4 h-4 ${isPositiveTrend ? 'text-green-500' : 'text-destructive rotate-180'}`} />
                <span className={`text-sm font-medium ${isPositiveTrend ? 'text-green-500' : 'text-destructive'}`}>
                  {isPositiveTrend ? '+' : ''}{trend} points
                </span>
                <span className="text-sm text-muted-foreground">from last week</span>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gottman Ratio Card replacing AI Insights */}
          <GottmanRatioCard ratio={gottmanRatio} />

          {/* Interactions */}
          <div
            className="p-6 rounded-2xl"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-primary" aria-hidden="true" />
              <h3>Recent Interactions</h3>
            </div>
            <div className="space-y-2">
              {recentInteractions.map((interaction: any) => (
                <div key={interaction.id} className="flex justify-between p-2 border-b border-border">
                  <span className="text-sm">{new Date(interaction.date).toLocaleDateString()}</span>
                  <span className="text-sm font-medium">Positive: {interaction.positiveCount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
