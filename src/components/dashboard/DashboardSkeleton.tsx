"use client";

import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export function DashboardSkeleton() {
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
