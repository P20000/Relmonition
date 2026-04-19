"use client";
import { useState, useEffect, useRef } from 'react';
import { 
  Brain, Zap, Search, MessageSquare, Clock, Tag, Upload, 
  FileText, Loader2, CheckCircle, AlertCircle, Plus, 
  History, Pause, RotateCcw, Edit3, Square, Send, ChevronRight,
  Trash2, Database, RefreshCcw, Activity, Layers, X
} from 'lucide-react';
import { apiClient } from '../../api-client';
import { useAuth } from '../context/AuthContext';

type CoachMode = 'retrieval' | 'exploration';
type Message = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
  timestamp?: string;
};

type Conversation = {
  id: string;
  title: string;
  createdAt: string;
};

type ContextUpload = {
  id: string;
  fileName: string;
  fileSize: number;
  processed: boolean;
  processingProgress: number;
  createdAt: string;
};

export function AICoach() {
  const { activeTenantId, userId } = useAuth();
  const [mode, setMode] = useState<CoachMode>('retrieval');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null); // messageId being edited
  const [editInput, setEditInput] = useState('');
  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [contextUploads, setContextUploads] = useState<ContextUpload[]>([]);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isUpdatingFromStream = useRef(false);

  const glassCard = {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(20px)',
    border: '1px solid var(--glass-border)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  };

  // ─── Initial Load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTenantId && userId) {
      loadConversations();
      loadContextUploads();
    }
  }, [activeTenantId, userId]);

  useEffect(() => {
    // DO NOT reload messages if we just set the sessionId during a stream
    // This prevented user messages from disappearing when starting new chats
    if (activeSessionId && !isUpdatingFromStream.current) {
      loadMessages(activeSessionId);
    } else if (!activeSessionId) {
      setMessages([{
        role: 'assistant',
        content: 'I\'m your relationship coach. Select a past conversation or start a new one to begin.\n\n**Retrieval Mode** for rapid de-escalation.\n**Exploration Mode** for deep pattern analysis.',
        timestamp: 'Coach Ready',
      }]);
    }
    // Reset the guard
    isUpdatingFromStream.current = false;
  }, [activeSessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const data = await apiClient.get(`/coach/sessions/${activeTenantId}?userId=${userId}`);
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const data = await apiClient.get(`/coach/sessions/${activeTenantId}/${sessionId}/messages`);
      setMessages(data.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })));
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  const loadContextUploads = async () => {
    if (!activeTenantId) return;
    try {
      const data = await apiClient.get(`/coach/upload-status/${activeTenantId}`);
      setContextUploads(data);
    } catch (err) {
      console.error('Failed to load context uploads', err);
    }
  };

  // ─── Deletion Logic ────────────────────────────────────────────────────────
  const handleDeleteContext = async (uploadId: string) => {
    if (!window.confirm('Are you sure you want to delete this context fragment? This will remove its knowledge from the AI.')) return;
    
    try {
      await apiClient.delete(`/coach/context/${activeTenantId}/${uploadId}`);
      loadContextUploads();
    } catch (err) {
      console.error('Deletion failed', err);
    }
  };

  // ─── Streaming Logic ──────────────────────────────────────────────────────
  const processStream = async (response: Response) => {
    const reader = response.body?.getReader();
    if (!reader) return;

    setIsStreaming(true);
    const decoder = new TextDecoder();
    let accumulatedContent = '';

    // Skeleton assistant message
    const assistantMsg: Message = { role: 'assistant', content: '', timestamp: 'Thinking...' };
    setMessages(prev => [...prev.filter(m => m.timestamp !== 'Thinking...'), assistantMsg]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.chunk) {
              accumulatedContent += data.chunk;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: accumulatedContent,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                return updated;
              });
            }
          } catch (e) { /* partial json ignored */ }
        } else if (line.startsWith('event: session')) {
          const nextLine = lines[lines.indexOf(line) + 1];
          if (nextLine?.startsWith('data: ')) {
            const sessionData = JSON.parse(nextLine.substring(6));
            isUpdatingFromStream.current = true;
            setActiveSessionId(sessionData.sessionId);
            loadConversations();
          }
        }
      }
    }
    setIsStreaming(false);
  };

  const handleSend = async (customQuery?: string) => {
    const query = customQuery || input;
    if (!query.trim() || isSending || isStreaming || !activeTenantId) return;

    setIsSending(true);
    if (!customQuery) setInput('');
    
    // Add user message to UI immediately
    if (!customQuery) {
        setMessages(prev => [...prev, {
          role: 'user',
          content: query,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/coach/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId,
          userId,
          sessionId: activeSessionId,
          query,
          mode,
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error('Stream failed');
      await processStream(response);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages(prev => [...prev, { role: 'assistant', content: '... (Generation Paused)', timestamp: 'Stopped' }]);
      } else {
        console.error('Coach Error:', err);
      }
    } finally {
      setIsSending(false);
      setIsStreaming(false);
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
  };

  const handleRegenerate = async () => {
    if (isSending || isStreaming || !activeSessionId) return;
    setIsSending(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/coach/chat/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId,
          sessionId: activeSessionId,
          mode,
        })
      });

      // Remove last assistant message from UI to refresh it
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant') return prev.slice(0, -1);
        return prev;
      });

      await processStream(response);
    } catch (err) {
      console.error('Regeneration failed', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleEdit = async () => {
    if (!editInput.trim() || isSending || isStreaming || !activeSessionId) return;
    setIsSending(true);
    setIsEditing(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/coach/chat/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId,
          sessionId: activeSessionId,
          newQuery: editInput,
          mode,
        })
      });

      // Reset messages to the new point
      setMessages(prev => {
        // Find last user index and slice up to there
        const lastUserIdx = [...prev].reverse().findIndex(m => m.role === 'user');
        if (lastUserIdx === -1) return prev;
        const slicePoint = prev.length - 1 - lastUserIdx;
        const newHistory = prev.slice(0, slicePoint);
        return [...newHistory, { role: 'user', content: editInput, timestamp: 'Edited' }];
      });

      await processStream(response);
    } catch (err) {
      console.error('Edit failed', err);
    } finally {
      setIsSending(false);
    }
  };

  const startNewConversation = () => {
    setActiveSessionId(null);
    setMessages([{
      role: 'assistant',
      content: 'Starting new conversation. How can I help you and your partner today?',
      timestamp: 'New Stream'
    }]);
    setIsHistoryOpen(false);
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      setUploadStatus('error');
      return;
    }

    setPendingFile(file);
    setShowStrategyModal(true);
  };

  const executeUpload = async (strategy: 'append' | 'replace') => {
    if (!pendingFile || !activeTenantId || !userId) return;

    setUploadStatus('uploading');
    setUploadError('');
    setShowStrategyModal(false);

    try {
      let fileContent: string;
      
      if (pendingFile.name.endsWith('.zip')) {
        // Read as Base64 for ZIP files
        fileContent = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Strip the data URL prefix (e.g., data:application/zip;base64,)
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(pendingFile);
        });
      } else {
        // Read as plain text for .txt and .json
        fileContent = await pendingFile.text();
      }

      await apiClient.post('/coach/upload', {
        tenantId: activeTenantId,
        userId,
        fileName: pendingFile.name,
        fileContent,
        fileSize: pendingFile.size,
        strategy
      });

      setUploadStatus('success');
      setPendingFile(null);
      loadContextUploads();
      
      // Auto-refresh context status after a few seconds to check 'processed' flag
      setTimeout(() => loadContextUploads(), 5000);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
      setUploadStatus('error');
    }
  };

  // ─── Render Helpers ───────────────────────────────────────────────────────
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

  return (
    <div className="min-h-screen flex">
      {/* Strategy Choice Modal */}
      {showStrategyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="max-w-md w-full mx-4 p-8 rounded-3xl border border-border shadow-2xl bg-card">
              <div className="flex justify-between items-start mb-6">
                <div>
                   <h3 className="text-xl font-bold tracking-tight">Update Relationship Context</h3>
                   <p className="text-sm text-muted-foreground mt-1">How would you like to handle {pendingFile?.name}?</p>
                </div>
                <button onClick={() => setShowStrategyModal(false)} className="p-2 -mr-2 rounded-full hover:bg-accent opacity-50"><X className="w-5 h-5"/></button>
              </div>

              <div className="grid gap-4">
                 <button 
                   onClick={() => executeUpload('append')}
                   className="flex items-start gap-4 p-5 rounded-2xl border border-border hover:border-primary hover:bg-primary/5 text-left transition-all group"
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
                   className="flex items-start gap-4 p-5 rounded-2xl border border-border hover:border-destructive hover:bg-destructive/5 text-left transition-all group"
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
                className="w-full mt-6 py-3 text-sm font-medium opacity-50 hover:opacity-100"
              >
                Cancel
              </button>
           </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isHistoryOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsHistoryOpen(false)}
        />
      )}

      {/* Sidebar: Conversations */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-80 border-r border-border h-screen overflow-y-auto p-6 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block ${
          isHistoryOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'var(--card)' }}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">History</h2>
          </div>
          <button 
            onClick={startNewConversation}
            className="p-2 rounded-full hover:bg-accent text-primary transition-colors"
            title="New Chat"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setActiveSessionId(c.id);
                setIsHistoryOpen(false);
              }}
              className={`w-full text-left p-4 rounded-2xl transition-all group relative border ${
                activeSessionId === c.id 
                ? 'bg-primary/10 border-primary/20 text-primary' 
                : 'hover:bg-accent/40 border-transparent hover:border-border'
              }`}
            >
              <div className="font-medium text-sm truncate mb-1 pr-4">{c.title}</div>
              <div className="text-[10px] opacity-60 uppercase tracking-widest">{new Date(c.createdAt).toLocaleDateString()}</div>
              {activeSessionId === c.id && <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" />}
            </button>
          ))}
          {conversations.length === 0 && (
            <div className="text-center py-10 opacity-30">
              <MessageSquare className="w-10 h-10 mx-auto mb-2" />
              <p className="text-xs">No conversations yet</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8 flex justify-between items-start">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors"
                title="Toggle History"
              >
                <History className="w-6 h-6" />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <h1>AI Relationship Coach</h1>
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
                 className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === 'retrieval' ? 'bg-background shadow-sm' : 'opacity-50 hover:opacity-100'}`}
               >
                 Retrieval
               </button>
               <button 
                 onClick={() => setMode('exploration')}
                 className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === 'exploration' ? 'bg-background shadow-sm' : 'opacity-50 hover:opacity-100'}`}
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
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
              {messages.map((message, index) => {
                const isLastPrompt = message.role === 'user' && message.content === lastUserMessage?.content;
                
                return (
                  <div
                    key={index}
                    className={`flex animate-in fade-in slide-in-from-bottom-3 duration-300 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] group relative ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10'
                          : 'bg-card border border-border shadow-sm'
                      } ${isEditing === message.id ? 'w-full' : ''} rounded-2xl p-5`}
                    >
                      {/* Message Content */}
                      <div className="whitespace-pre-wrap leading-relaxed text-sm">
                        {isEditing === message.id ? (
                           <div className="space-y-3">
                              <textarea 
                                value={editInput}
                                onChange={(e) => setEditInput(e.target.value)}
                                className="w-full bg-primary-foreground/10 text-primary-foreground p-3 rounded-lg border border-primary-foreground/20 focus:outline-none"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <button onClick={handleEdit} className="px-3 py-1.5 bg-background text-primary text-xs font-bold rounded-md">Save & Regenerate</button>
                                <button onClick={() => setIsEditing(null)} className="px-3 py-1.5 text-xs font-medium text-primary-foreground/70">Cancel</button>
                              </div>
                           </div>
                        ) : (
                          message.content
                        )}
                      </div>

                      {/* Prompt Controls (Latest Only) */}
                      {isLastPrompt && !isStreaming && !isSending && !isEditing && (
                        <div className="absolute -bottom-4 right-2 flex gap-1 animate-in zoom-in-50">
                           <button 
                             onClick={() => { setIsEditing(message.id || 'last'); setEditInput(message.content); }}
                             className="p-1.5 rounded-lg bg-card border border-border text-muted-foreground hover:text-primary transition-colors shadow-sm"
                             title="Edit Prompt"
                           >
                             <Edit3 className="w-3.5 h-3.5" />
                           </button>
                           <button 
                             onClick={handleRegenerate}
                             className="p-1.5 rounded-lg bg-card border border-border text-muted-foreground hover:text-primary transition-colors shadow-sm"
                             title="Regenerate Response"
                           >
                             <RotateCcw className="w-3.5 h-3.5" />
                           </button>
                        </div>
                      )}

                      {message.timestamp && (
                        <div className="mt-3 text-[10px] opacity-60 flex items-center gap-1 font-medium uppercase tracking-wider">
                          <Clock className="w-3 h-3" />
                          {message.timestamp}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-6 border-t border-border bg-card/30 backdrop-blur-sm">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
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
                    className="w-full p-4 pr-12 rounded-2xl bg-input/50 border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm min-h-[56px] max-h-32"
                    rows={1}
                    disabled={isSending || isStreaming}
                  />
                  {isStreaming ? (
                    <button
                      onClick={handleStop}
                      className="absolute right-3 bottom-3 p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors animate-pulse"
                      title="Stop Generation"
                    >
                      <Square className="w-4 h-4 fill-current" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isSending}
                      className="absolute right-3 bottom-3 p-2 rounded-xl bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-30"
                    >
                       {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Context Management Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
             {/* Upload Block */}
             <div className="p-8 rounded-3xl" style={glassCard}>
                <div className="flex items-center gap-3 mb-4">
                   <Upload className="w-5 h-5 text-primary" />
                   <h2 className="text-lg font-semibold tracking-tight">Enhance Context</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Upload WhatsApp or iMessage logs to provide the AI with deep semantic memory of your history.
                </p>
                <button 
                  onClick={() => document.getElementById('chat-history-upload')?.click()}
                  className="w-full py-8 rounded-2xl border-2 border-dashed border-border hover:border-primary transition-all flex flex-col items-center gap-2 group relative overflow-hidden"
                >
                   {uploadStatus === 'uploading' ? (
                     <>
                       <Loader2 className="w-8 h-8 text-primary animate-spin" />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Uploading...</span>
                     </>
                   ) : (
                     <>
                       <Database className="w-8 h-8 opacity-30 group-hover:opacity-100 group-hover:text-primary transition-all group-hover:scale-110" />
                       <span className="text-[10px] font-bold opacity-60 group-hover:opacity-100 uppercase tracking-widest">Select TXT/JSON Log</span>
                     </>
                   )}
                   <input 
                    id="chat-history-upload" 
                    type="file" 
                    className="hidden" 
                    accept=".txt,.json,.zip" 
                    onChange={handleFileSelection} 
                    disabled={uploadStatus === 'uploading'}
                  />
                </button>
                {uploadStatus === 'success' && <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] text-center font-bold uppercase tracking-wider animate-in slide-in-from-top-2">Upload confirmed! Processing...</div>}
                {uploadStatus === 'error' && <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center font-medium">{uploadError}</div>}
             </div>

             {/* Existing Context List */}
             <div className="p-8 rounded-3xl" style={glassCard}>
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-3">
                      <Layers className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold tracking-tight">Level 1 Context</h2>
                   </div>
                   <div className="text-[10px] font-bold text-primary px-2 py-1 rounded bg-primary/10 uppercase tracking-widest">
                      {contextUploads.filter(u => u.processed).length} Active
                   </div>
                </div>
                
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                   {contextUploads.map((u) => (
                      <div key={u.id} className="relative p-5 rounded-3xl bg-accent/20 border border-white/5 overflow-hidden group transition-all hover:bg-accent/30">
                         {/* Main Content */}
                         <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4 overflow-hidden">
                               <div className={`p-2.5 rounded-2xl ${u.processed ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
                                  {u.processed ? (
                                    <Activity className="w-5 h-5" />
                                  ) : (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                  )}
                               </div>
                               <div className="overflow-hidden">
                                  <div className="text-sm font-semibold truncate text-white/90">{u.fileName}</div>
                                  <div className="text-[10px] opacity-40 font-bold uppercase tracking-widest mt-0.5">
                                    {(u.fileSize / 1024).toFixed(1)} KB • {new Date(u.createdAt).toLocaleDateString()}
                                  </div>
                               </div>
                            </div>
                            <button 
                              onClick={() => handleDeleteContext(u.id)}
                              className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                            >
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>

                         {/* Progress Section (Full Width at Bottom) */}
                         {!u.processed && (
                           <div className="mt-5 space-y-2 relative z-10">
                              <div className="flex items-center justify-between text-[10px] uppercase tracking-tighter font-black">
                                 <span className="text-muted-foreground/60">Processing Context...</span>
                                 <span className="text-primary tabular-nums">{u.processingProgress || 0}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                 <div 
                                   className="h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_12px_rgba(var(--primary),0.4)]" 
                                   style={{ 
                                     width: `${u.processingProgress || 0}%`,
                                     background: 'linear-gradient(90deg, var(--primary) 0%, #ff00ff 100%)' 
                                   }} 
                                 />
                              </div>
                           </div>
                         )}
                      </div>
                   ))}
                   {contextUploads.length === 0 && (
                     <div className="flex flex-col items-center justify-center py-8 opacity-20">
                        <Database className="w-8 h-8 mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Empty Semantic Memory</span>
                     </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
