"use client";

import React from 'react';
import { History, Plus, MessageSquare, Trash2 } from 'lucide-react';
import { Conversation } from './useAICoach';

interface ChatHistorySidebarProps {
  conversations: Conversation[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  handleDeleteConversation: (sessionId: string, e: React.MouseEvent) => void;
  startNewConversation: () => void;
}

export function ChatHistorySidebar({
  conversations,
  activeSessionId,
  setActiveSessionId,
  isHistoryOpen,
  setIsHistoryOpen,
  handleDeleteConversation,
  startNewConversation,
}: ChatHistorySidebarProps) {
  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-50 w-80 overflow-y-auto p-6 transition-all duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:block lg:rounded-[2rem] border border-white/10 shadow-2xl custom-scrollbar ${
        isHistoryOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(30px)' }}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Chat History</h2>
        </div>
        <button 
          onClick={startNewConversation}
          className="p-2 rounded-full bg-primary text-primary-foreground hover:scale-105 transition-all shadow-lg shadow-primary/20 cursor-pointer"
          title="New Chat"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setActiveSessionId(c.id);
              setIsHistoryOpen(false);
            }}
            className={`w-full text-left p-4 rounded-2xl transition-all group relative border flex items-center justify-between cursor-pointer ${
              activeSessionId === c.id 
              ? 'bg-primary/20 border-primary/30 text-primary shadow-inner' 
              : 'bg-background/30 hover:bg-background/60 border-white/5 hover:border-white/10'
            }`}
          >
            <div className="overflow-hidden flex-1">
              <div className="font-medium text-sm truncate mb-1 pr-4 text-foreground/90">{c.title}</div>
              <div className="text-[10px] opacity-60 uppercase tracking-widest">{new Date(c.createdAt).toLocaleDateString()}</div>
            </div>
            
            <div className="flex items-center gap-1">
              <div 
                onClick={(e) => handleDeleteConversation(c.id, e)}
                className={`p-2 transition-all rounded-xl ${activeSessionId === c.id ? 'opacity-100 text-primary hover:bg-primary/20 hover:text-destructive' : 'opacity-0 text-muted-foreground group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10'}`}
                title="Delete Chat"
              >
                <Trash2 className="w-4 h-4" />
              </div>
            </div>
          </button>
        ))}
        {conversations.length === 0 && (
          <div className="text-center py-10 opacity-40">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No past conversations</p>
            <p className="text-xs mt-1">Start a new chat above</p>
          </div>
        )}
      </div>
    </aside>
  );
}
