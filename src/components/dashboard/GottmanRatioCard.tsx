"use client";

import React from 'react';
import { Activity } from 'lucide-react';

const glassCard = {
  background: 'var(--glass-bg)',
  backdropFilter: 'blur(20px)',
  border: '1px solid var(--glass-border)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
};

export function GottmanEmptyState() {
  return (
    <div className="p-6 rounded-2xl" style={glassCard}>
      <div className="flex items-center gap-3 mb-4">
        <Activity className="w-6 h-6 text-primary" aria-hidden="true" />
        <h3 className="text-lg font-semibold">Gottman 5:1 Ratio</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Positive to negative interactions during conflict
      </p>
      <div className="flex flex-col items-center justify-center py-6 gap-4">
        <div className="relative">
          <svg className="w-48 h-48" viewBox="0 0 200 200" aria-label="No data yet">
            <circle cx="100" cy="100" r="80" fill="none" stroke="var(--muted)" strokeWidth="16" strokeDasharray="12 8" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-1">
            <div className="text-3xl font-bold text-muted-foreground/40">5:1</div>
            <div className="text-xs text-muted-foreground/50 font-medium uppercase tracking-widest">target</div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground/70 mb-1">No interactions logged yet</p>
          <p className="text-xs text-muted-foreground">Write journal entries to track your ratio</p>
        </div>
      </div>
    </div>
  );
}

export function GottmanRatioCard({ ratio, sampleWarning }: { ratio: number; sampleWarning?: boolean }) {
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
