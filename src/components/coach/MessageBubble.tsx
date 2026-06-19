"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Edit3, RotateCcw, Clock } from 'lucide-react';
import { Message } from './useAICoach';
import { ThinkingIndicator } from './ThinkingIndicator';

interface MessageBubbleProps {
  message: Message;
  index: number;
  isLastPrompt: boolean;
  isStreaming: boolean;
  isSending: boolean;
  isEditing: string | null;
  setIsEditing: (id: string | null) => void;
  editInput: string;
  setEditInput: (content: string) => void;
  handleEdit: () => void;
  handleRegenerate: () => void;
}

export function MessageBubble({
  message,
  index,
  isLastPrompt,
  isStreaming,
  isSending,
  isEditing,
  setIsEditing,
  editInput,
  setEditInput,
  handleEdit,
  handleRegenerate,
}: MessageBubbleProps) {
  const msgId = message.id || `msg-${index}`;
  const isMsgEditing = isEditing === msgId;

  return (
    <div className="pb-8">
      <div className={`flex animate-in fade-in slide-in-from-bottom-3 duration-300 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-[85%] group relative ${
            message.role === 'user'
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10'
              : 'bg-card border border-border shadow-sm'
          } ${isMsgEditing ? 'w-full' : ''} rounded-2xl p-5`}
        >
          {/* Message Content */}
          <div className="leading-relaxed text-sm">
            {isMsgEditing ? (
              <div className="space-y-3">
                <textarea 
                  value={editInput}
                  onChange={(e) => setEditInput(e.target.value)}
                  className="w-full bg-primary-foreground/10 text-primary-foreground p-3 rounded-lg border border-primary-foreground/20 focus:outline-none"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button onClick={handleEdit} className="px-3 py-1.5 bg-background text-primary text-xs font-bold rounded-md cursor-pointer">
                    Save & Regenerate
                  </button>
                  <button onClick={() => setIsEditing(null)} className="px-3 py-1.5 text-xs font-medium text-primary-foreground/70 cursor-pointer">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              message.content === '' && message.timestamp === 'Thinking...' ? (
                <ThinkingIndicator />
              ) : (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({children}) => <p className="mb-3 last:mb-0">{children}</p>,
                    ul: ({children}) => <ul className="list-disc ml-4 mb-3 space-y-1">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal ml-4 mb-3 space-y-1">{children}</ol>,
                    li: ({children}) => <li>{children}</li>,
                    strong: ({children}) => <span className="font-bold text-inherit">{children}</span>,
                    code: ({children}) => <code className="bg-black/10 dark:bg-white/10 px-1 rounded text-xs">{children}</code>,
                    blockquote: ({children}) => <blockquote className="border-l-4 border-primary/30 pl-4 italic my-2">{children}</blockquote>
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )
            )}
          </div>

          {/* Prompt Controls (Latest Only) */}
          {isLastPrompt && !isStreaming && !isSending && !isMsgEditing && (
            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-primary-foreground/10 animate-in fade-in">
              <button 
                onClick={() => { setIsEditing(msgId); setEditInput(message.content); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 text-primary-foreground/90 hover:text-primary-foreground transition-all text-xs font-medium cursor-pointer"
                title="Edit Prompt"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
              <button 
                onClick={handleRegenerate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 text-primary-foreground/90 hover:text-primary-foreground transition-all text-xs font-medium cursor-pointer"
                title="Regenerate Response"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {message.timestamp && message.timestamp !== 'Thinking...' && (
            <div className="mt-3 text-[10px] opacity-60 flex items-center gap-1 font-medium uppercase tracking-wider">
              <Clock className="w-3 h-3" />
              {message.timestamp}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
