"use client";

import React, { useState } from 'react';
import { AlertTriangle, Wrench, Star, Smile, Heart } from 'lucide-react';

const glassCard = {
  background: 'var(--glass-bg)',
  backdropFilter: 'blur(20px)',
  border: '1px solid var(--glass-border)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
};

export function ImprovementsRequiredCard({ journals, history }: { journals: any[]; history: any[] }) {
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
              className="p-4 rounded-2xl border border-destructive/20 cursor-pointer transition-all hover:bg-destructive/10 bg-[var(--destructive-muted)]"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1 pr-4">
                  <span className="text-base font-medium text-destructive/90">{dayName}</span>
                  <span className="text-xs text-muted-foreground opacity-70">
                    {displayTime} • {item.source === 'journal' ? 'Journal' : 'Chat'}
                  </span>
                  <span className="text-sm text-foreground/80 mt-1 line-clamp-1">{item.description}</span>
                  {!isExpanded && (
                    <span className="text-xs font-medium text-destructive/80 mt-2 flex items-center gap-1">
                      Tap to view growth opportunities
                    </span>
                  )}
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

export function BestMomentsCard({ data }: { data: any[] }) {
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
    <div className="p-6 rounded-2xl flex flex-col font-sans" style={glassCard}>
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
              className="p-4 rounded-2xl border border-border cursor-pointer transition-all hover:bg-[var(--card-hover-bg)] bg-[var(--primary-muted)]"
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
