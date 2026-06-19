"use client";

import React from 'react';
import { Heart, TrendingUp, Zap, BarChart3, Sparkles, Shield, Star, AlertTriangle } from 'lucide-react';
import { useDashboardData } from './dashboard/useDashboardData';
import { GottmanRatioCard, GottmanEmptyState } from './dashboard/GottmanRatioCard';
import { InteractionTrendChart } from './dashboard/InteractionTrendChart';
import { ImprovementsRequiredCard, BestMomentsCard } from './dashboard/InsightCard';
import { DashboardSkeleton } from './dashboard/DashboardSkeleton';
import { DashboardError, NoRelationshipSelectedState } from './dashboard/DashboardEmptyState';

const glassCard = {
  background: 'var(--glass-bg)',
  backdropFilter: 'blur(20px)',
  border: '1px solid var(--glass-border)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
};

export function Dashboard() {
  const {
    loading,
    error,
    partnerDeparted,
    insights,
    journals,
    history,
    greeting,
    hasInteractions,
    isEmpty,
    sortedInteractions,
    totalBids,
    totalRepairs,
    gottmanRatio,
    sampleWarning,
    healthScore,
    trend,
    trendStatus,
    isPositiveTrend
  } = useDashboardData();

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError error={error} />;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Partner Departed Warning Banner */}
        {Boolean(partnerDeparted) && (
          <div 
            className="w-full p-4 md:p-6 rounded-2xl mb-8 relative overflow-hidden flex flex-col md:flex-row items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 50, 50, 0.2)',
              boxShadow: '0 4px 16px rgba(255, 0, 0, 0.05)',
            }}
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-destructive"></div>
            <div className="p-3 bg-destructive/10 rounded-full text-destructive">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-semibold text-foreground mb-1">Your partner has deleted their account</h3>
              <p className="text-sm text-muted-foreground">
                This dashboard reflects <strong className="text-foreground">historical relationship data</strong>. New metrics will only be generated from your personal journal entries moving forward.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="mb-8">
          {greeting && (
            <div className="flex items-center gap-2 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
                {greeting}
              </h2>
            </div>
          )}
          <div className="flex items-end gap-4 mb-2">
            <h1 className="leading-none">The Pulse</h1>
            {greeting && <div className="hidden md:block h-px flex-1 bg-gradient-to-r from-border to-transparent mb-2" />}
          </div>
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

        {/* No tenant selected */}
        {isEmpty && !localStorage.getItem('activeTenantId') && (
          <NoRelationshipSelectedState />
        )}

        {/* Connection Health */}
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
              <p className="text-sm text-muted-foreground mt-2">
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
              <p className="text-sm text-muted-foreground mt-2">
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
