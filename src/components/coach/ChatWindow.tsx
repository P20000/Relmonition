"use client";

import React, { useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { 
  Brain, Plus, Square, Send, History, AlertCircle, RotateCcw, X, Database, Loader2 
} from 'lucide-react';
import { Message, Conversation, ContextUpload, ChatError, CoachMode } from './useAICoach';
import { MessageBubble } from './MessageBubble';

const glassCard = {
  background: 'var(--glass-bg)',
  backdropFilter: 'blur(20px)',
  border: '1px solid var(--glass-border)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
};

interface ChatWindowProps {
  mode: CoachMode;
  setMode: (mode: CoachMode) => void;
  messages: Message[];
  input: string;
  setInput: (val: string) => void;
  isSending: boolean;
  isStreaming: boolean;
  activeSessionId: string | null;
  isEditing: string | null;
  setIsEditing: (id: string | null) => void;
  editInput: string;
  setEditInput: (val: string) => void;
  chatError: ChatError;
  setChatError: (err: ChatError) => void;
  showErrorDetails: boolean;
  setShowErrorDetails: (show: boolean) => void;
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  contextUploads: ContextUpload[];
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  uploadError: string;
  handleSend: (customQuery?: string) => Promise<void>;
  handleStop: () => void;
  handleRegenerate: () => Promise<void>;
  handleEdit: () => Promise<void>;
  handleFileSelection: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDeleteContext: (uploadId: string) => Promise<void>;
}

export function ChatWindow({
  mode,
  setMode,
  messages,
  input,
  setInput,
  isSending,
  isStreaming,
  activeSessionId,
  isEditing,
  setIsEditing,
  editInput,
  setEditInput,
  chatError,
  setChatError,
  showErrorDetails,
  setShowErrorDetails,
  isHistoryOpen,
  setIsHistoryOpen,
  contextUploads,
  uploadStatus,
  uploadError,
  handleSend,
  handleStop,
  handleRegenerate,
  handleEdit,
  handleFileSelection,
  handleDeleteContext,
}: ChatWindowProps) {
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

  return (
    <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
      <div className="max-w-5xl">
        {/* Header */}
        <header className="mb-8 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors cursor-pointer"
              title="Toggle History"
            >
              <History className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h1 className="leading-none">AI Relationship Coach</h1>
              </div>
              <p className="text-muted-foreground text-sm">
                Empathetic guidance grounded in your shared history
              </p>
            </div>
          </div>
          {/* Mode Switcher */}
          <div className="bg-muted p-1 rounded-xl flex gap-1">
            <button 
              onClick={() => setMode('retrieval')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mode === 'retrieval' ? 'bg-background shadow-sm' : 'opacity-50 hover:opacity-100'}`}
            >
              Retrieval
            </button>
            <button 
              onClick={() => setMode('exploration')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mode === 'exploration' ? 'bg-background shadow-sm' : 'opacity-50 hover:opacity-100'}`}
            >
              Exploration
            </button>
          </div>
        </header>

        {/* Chat Messages */}
        <div
          className="rounded-3xl overflow-hidden mb-6 flex flex-col h-[650px]"
          style={glassCard}
        >
          <div className="flex-1 overflow-hidden p-4 md:p-6">
            <Virtuoso
              data={messages}
              initialTopMostItemIndex={messages.length - 1}
              followOutput="smooth"
              className="h-full custom-scrollbar"
              itemContent={(index, message) => {
                const isLastPrompt = message.role === 'user' && message.content === lastUserMessage?.content;
                return (
                  <MessageBubble 
                    key={message.id || `msg-${index}`}
                    message={message}
                    index={index}
                    isLastPrompt={isLastPrompt}
                    isStreaming={isStreaming}
                    isSending={isSending}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    editInput={editInput}
                    setEditInput={setEditInput}
                    handleEdit={handleEdit}
                    handleRegenerate={handleRegenerate}
                  />
                );
              }}
            />
          </div>

          {chatError && (
            <div className="mx-4 md:mx-6 mb-4 p-4 rounded-2xl border border-destructive/20 bg-destructive/5 backdrop-blur-md flex flex-col gap-2 shadow-lg animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-destructive/10 text-destructive shrink-0 mt-0.5 animate-pulse">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                      {chatError.type || 'Error Occurred'}
                      {chatError.status && (
                        <span className="px-1.5 py-0.5 rounded bg-destructive/15 text-destructive text-[10px] font-mono font-bold">
                          {chatError.status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {chatError.message}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setChatError(null)} 
                  className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {chatError.details && (
                <div className="mt-1">
                  <button 
                    onClick={() => setShowErrorDetails(!showErrorDetails)}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showErrorDetails ? 'Hide details' : 'Show troubleshooting details'}
                  </button>
                  {showErrorDetails && (
                    <pre className="mt-2 p-3 bg-black/40 border border-white/10 rounded-xl font-mono text-[10px] text-red-300 overflow-x-auto max-h-36 custom-scrollbar whitespace-pre-wrap leading-relaxed shadow-inner">
                      {chatError.details}
                    </pre>
                  )}
                </div>
              )}

              <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-destructive/10">
                <button 
                  onClick={() => setChatError(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                >
                  Dismiss
                </button>
                {chatError.action && (
                  <button 
                    onClick={() => {
                      const act = chatError.action;
                      const pay = chatError.payload;
                      setChatError(null);
                      if (act === 'send') {
                        handleSend(pay);
                      } else if (act === 'regenerate') {
                        handleRegenerate();
                      } else if (act === 'edit') {
                        if (pay) setEditInput(pay);
                        handleEdit();
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retry Failed Action
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <div className="p-4 md:p-6 border-t border-border bg-card/30 backdrop-blur-sm flex flex-col gap-3">
            {/* Context Bar */}
            {(contextUploads.length > 0 || uploadStatus === 'uploading' || uploadStatus === 'error') && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {uploadStatus === 'uploading' && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium animate-pulse shrink-0">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Uploading...
                  </div>
                )}
                {uploadStatus === 'error' && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium shrink-0">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {uploadError}
                  </div>
                )}
                {contextUploads.map((u) => {
                  const progress = u.processingProgress || 0;
                  const hue = Math.round(progress * 1.2);
                  const gradientBg = `linear-gradient(90deg, hsl(${hue},80%,40%) 0%, hsl(${Math.min(hue + 30, 120)},80%,50%) ${progress}%, transparent ${progress}%)`;
                  return (
                    <div key={u.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 text-xs text-foreground/80 whitespace-nowrap transition-all hover:bg-white/10 shrink-0 min-w-[140px] max-w-[200px]">
                      {!u.processed && (
                        <div
                          className="absolute inset-0 opacity-20 transition-all duration-700"
                          style={{ background: gradientBg }}
                        />
                      )}
                      {u.processed && (
                        <div className="absolute inset-0 opacity-15" style={{ background: 'linear-gradient(90deg, hsl(120,80%,40%), hsl(140,80%,50%))' }} />
                      )}
                      <div className="relative z-10 flex items-center gap-2 px-3 py-2">
                        {u.processed
                          ? <Database className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          : <Loader2 className="w-3.5 h-3.5 text-red-400 animate-spin shrink-0" />
                        }
                        <span className="truncate flex-1">{u.fileName}</span>
                        {!u.processed && (
                          <span className="font-bold tabular-nums" style={{ color: `hsl(${hue},80%,65%)` }}>{progress}%</span>
                        )}
                        <button
                          onClick={() => handleDeleteContext(u.id)}
                          className="p-0.5 rounded-full hover:bg-destructive/30 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      {!u.processed && (
                        <div className="relative z-10 h-[2px] w-full bg-white/5">
                          <div
                            className="h-full transition-all duration-700"
                            style={{
                              width: `${progress}%`,
                              background: `linear-gradient(90deg, hsl(0,80%,50%), hsl(${hue},80%,55%))`
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Unified Input Block */}
            <div className="flex items-stretch rounded-2xl border border-border bg-input/50 overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-all">
              {/* Attachment Button */}
              <button
                onClick={() => document.getElementById('chat-history-upload')?.click()}
                className="flex items-center justify-center px-4 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors flex-shrink-0 border-r border-border cursor-pointer"
                title="Enhance Context"
                disabled={uploadStatus === 'uploading'}
              >
                <Plus className="w-5 h-5" />
                <input 
                  id="chat-history-upload" 
                  type="file" 
                  className="hidden" 
                  accept=".txt,.json,.zip" 
                  onChange={handleFileSelection} 
                  disabled={uploadStatus === 'uploading'}
                />
              </button>

              {/* Textarea */}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={mode === 'retrieval' ? 'Ask for guidance...' : 'Explore patterns...'}
                className="flex-1 py-4 px-4 bg-transparent resize-none focus:outline-none text-sm leading-6 min-h-[56px] max-h-32 custom-scrollbar border-0"
                rows={1}
                disabled={isSending || isStreaming}
              />

              {/* Send / Stop Button */}
              <div className="flex items-center px-3 flex-shrink-0 border-l border-border">
                {isStreaming || isSending ? (
                  <button
                    onClick={handleStop}
                    className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all animate-pulse flex items-center justify-center cursor-pointer"
                    title="Stop Generation"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim()}
                    className="p-2 rounded-xl bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-30 flex items-center justify-center cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
