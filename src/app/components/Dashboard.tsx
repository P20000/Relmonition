import { useState, useEffect } from 'react';
import { Activity, Calendar, Heart, TrendingUp, MessageCircle, Zap } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '../../api-client';

export function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
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
  const healthScore = lastMood ? (lastMood.moodValue * 10) : 0;
  const gottmanRatio = 5.0; // Placeholder until backend provides real ratio

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
            <div className="relative h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000"
                style={{ width: `${healthScore}%` }}
                role="progressbar"
                aria-valuenow={healthScore}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Insights (Instead of Communication Frequency for now) */}
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
              <MessageCircle className="w-6 h-6 text-primary" aria-hidden="true" />
              <h3>AI Insights</h3>
            </div>
            <div className="space-y-4">
                {insights.map((insight: any) => (
                    <p key={insight.id} className="text-sm text-muted-foreground">{insight.content}</p>
                ))}
            </div>
          </div>

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
