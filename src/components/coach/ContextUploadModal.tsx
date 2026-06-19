"use client";

import React from 'react';
import { X, Plus, RefreshCcw, FileText, CheckCircle, Loader2, Trash2 } from 'lucide-react';
import { ContextUpload } from './useAICoach';

interface StrategyChoiceModalProps {
  pendingFile: File | null;
  executeUpload: (strategy: 'append' | 'replace') => void;
  setShowStrategyModal: (show: boolean) => void;
}

export function StrategyChoiceModal({
  pendingFile,
  executeUpload,
  setShowStrategyModal,
}: StrategyChoiceModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="max-w-md w-full mx-4 p-8 rounded-3xl border border-border shadow-2xl bg-card">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold tracking-tight">Update Relationship Context</h3>
            <p className="text-sm text-muted-foreground mt-1">How would you like to handle {pendingFile?.name}?</p>
          </div>
          <button 
            onClick={() => setShowStrategyModal(false)} 
            className="p-2 -mr-2 rounded-full hover:bg-accent opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="grid gap-4">
          <button 
            onClick={() => executeUpload('append')}
            className="flex items-start gap-4 p-5 rounded-2xl border border-border hover:border-primary hover:bg-primary/5 text-left transition-all group cursor-pointer"
          >
            <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm">Append to History</div>
              <p className="text-xs text-muted-foreground mt-1">Add this file as a new fragment. Current context remains intact.</p>
            </div>
          </button>

          <button 
            onClick={() => executeUpload('replace')}
            className="flex items-start gap-4 p-5 rounded-2xl border border-border hover:border-destructive hover:bg-destructive/5 text-left transition-all group cursor-pointer"
          >
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive group-hover:scale-110 transition-transform">
              <RefreshCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm">Replace Context</div>
              <p className="text-xs text-muted-foreground mt-1">Clear ALL existing uploaded context and replace it with this file.</p>
            </div>
          </button>
        </div>
        
        <button 
          onClick={() => setShowStrategyModal(false)}
          className="w-full mt-6 py-3 text-sm font-medium opacity-50 hover:opacity-100 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

interface ContextChipProps {
  upload: ContextUpload;
  handleDeleteContext: (id: string) => void;
}

export function ContextChip({ upload, handleDeleteContext }: ContextChipProps) {
  const progress = upload.processingProgress || 0;
  const hue = Math.round(progress * 1.2);
  const gradientBg = `linear-gradient(90deg, hsl(${hue},80%,40%) 0%, hsl(${Math.min(hue + 30, 120)},80%,50%) ${progress}%, transparent ${progress}%)`;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 text-xs text-foreground/80 whitespace-nowrap transition-all hover:bg-white/10 shrink-0 min-w-[140px] max-w-[200px]">
      {/* Background progress indicator bar */}
      {!upload.processed && (
        <div 
          className="absolute inset-y-0 left-0 opacity-15"
          style={{ background: gradientBg, width: '100%' }}
        />
      )}
      <div className="relative z-10 flex items-center justify-between p-3 gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-1 rounded-md bg-white/10 shrink-0">
            {upload.processed ? (
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-medium truncate">{upload.fileName}</span>
            <span className="text-[9px] opacity-60">
              {upload.processed ? 'System memory synced' : `Embedding RAG indices... ${progress}%`}
            </span>
          </div>
        </div>
        <button
          onClick={() => handleDeleteContext(upload.id)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-destructive transition-all shrink-0 cursor-pointer"
          title="Remove context memory"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
