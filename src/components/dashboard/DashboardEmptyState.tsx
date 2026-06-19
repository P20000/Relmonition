"use client";

import React from 'react';
import { Heart } from 'lucide-react';

const glassCard = {
  background: 'var(--glass-bg)',
  backdropFilter: 'blur(20px)',
  border: '1px solid var(--glass-border)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
};

export function DashboardError({ error }: { error: string }) {
  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="text-center p-8 rounded-2xl" style={glassCard}>
        <p className="text-destructive font-medium mb-2">Unable to load dashboard</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    </div>
  );
}

export function NoRelationshipSelectedState() {
  return (
    <div className="mb-8 p-8 rounded-3xl text-center" style={glassCard}>
      <Heart className="w-12 h-12 mx-auto mb-4 text-primary opacity-40" />
      <h2 className="mb-2">No relationship selected</h2>
      <p className="text-muted-foreground text-sm">
        Go to <strong>Settings → Relationships</strong> to create or join a relationship space.
      </p>
    </div>
  );
}
