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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { Virtuoso } from 'react-virtuoso';

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
  
  const ThinkingIndicator = () => (
    <div className="flex items-center gap-2 py-1">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 bg-primary rounded-full"
            animate={{ 
              y: [0, -4, 0],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{ 
              duration: 0.8, 
              repeat: Infinity, 
              delay: i * 0.15 
            }}
          />
        ))}
      </div>
      <motion.span 
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
        className="text-xs font-medium text-muted-foreground"
      >
        Thinking...
      </motion.span>
    </div>
  );

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
  const chatContainerRef = useRef<HTMLDivElement>(null);
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
        content: '# Welcome to your AI Coach\n\nI\'m here to provide empathetic guidance grounded in your shared history. Select a past conversation or start a new one to begin.\n\n* **Retrieval Mode**: Best for rapid de-escalation and specific advice.\n* **Exploration Mode**: Best for deep pattern analysis and long-term growth.',
        timestamp: 'Coach Ready',
      }]);
    }
    // Reset the guard
    isUpdatingFromStream.current = false;
  }, [activeSessionId]);

    // Virtuoso handles auto-scrolling natively via followOutput

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

  const handleDeleteConversation = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this chat history?')) return;
    
    try {
      await apiClient.delete(`/coach/sessions/${activeTenantId}/${sessionId}`);
      if (activeSessionId === sessionId) {
        startNewConversation();
      } else {
        loadConversations();
      }
    } catch (err) {
      console.error('Chat deletion failed', err);
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `https://api.relmonition.dpdns.org/${activeTenantId || '001'}/api/v1`}/coach/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId,
          userId,
          sessionId: activeSessionId,
          query,
          mode,
        }),
        signal: abortControllerRef.current.signal,
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Stream failed');
      await processStream(response);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant' && (last.content === '' || last.timestamp === 'Thinking...')) {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: '... (Generation Paused)', timestamp: 'Stopped' };
            return updated;
          }
          return [...prev, { role: 'assistant', content: '... (Generation Paused)', timestamp: 'Stopped' }];
        });
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `https://api.relmonition.dpdns.org/${activeTenantId || '001'}/api/v1`}/coach/chat/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId,
          sessionId: activeSessionId,
          mode,
        }),
        credentials: 'include'
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `https://api.relmonition.dpdns.org/${activeTenantId || '001'}/api/v1`}/coach/chat/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId,
          sessionId: activeSessionId,
          newQuery: editInput,
          mode,
        }),
        credentials: 'include'
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
      content: '### New Conversation Started\n\nHow can I help you and your partner today? I have access to your **journal history** and **uploaded context** to provide the most relevant advice.',
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
      // Auto-dismiss the success flash after 2 seconds
      setTimeout(() => setUploadStatus('idle'), 2000);
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
    <div className="min-h-screen bg-transparent flex justify-center">
      <div className="w-full max-w-[1600px] flex relative">
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
            className="p-2 rounded-full bg-primary text-primary-foreground hover:scale-105 transition-all shadow-lg shadow-primary/20"
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
              className={`w-full text-left p-4 rounded-2xl transition-all group relative border flex items-center justify-between ${
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

      {/* Main Chat Area */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <div className="max-w-5xl">
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
            <div className="flex-1 overflow-hidden p-4 md:p-6">
              <Virtuoso
                data={messages}
                initialTopMostItemIndex={messages.length - 1}
                followOutput="smooth"
                className="h-full custom-scrollbar"
                itemContent={(index, message) => {
                  const isLastPrompt = message.role === 'user' && message.content === lastUserMessage?.content;
                  const msgId = message.id || `msg-${index}`;
                  
                  return (
                    <div className="pb-8">
                      <div className={`flex animate-in fade-in slide-in-from-bottom-3 duration-300 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] group relative ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10'
                              : 'bg-card border border-border shadow-sm'
                          } ${isEditing === msgId ? 'w-full' : ''} rounded-2xl p-5`}
                        >
                          {/* Message Content */}
                          <div className="leading-relaxed text-sm">
                            {isEditing === msgId ? (
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
                          {isLastPrompt && !isStreaming && !isSending && !isEditing && (
                            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-primary-foreground/10 animate-in fade-in">
                               <button 
                                 onClick={() => { setIsEditing(msgId); setEditInput(message.content); }}
                                 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 text-primary-foreground/90 hover:text-primary-foreground transition-all text-xs font-medium"
                                 title="Edit Prompt"
                               >
                                 <Edit3 className="w-3.5 h-3.5" /> Edit
                               </button>
                               <button 
                                 onClick={handleRegenerate}
                                 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 text-primary-foreground/90 hover:text-primary-foreground transition-all text-xs font-medium"
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
                }}
              />
            </div>

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
                    // Gradient: 0% = red, 100% = green interpolated via hue
                    const hue = Math.round(progress * 1.2); // 0 → 0 (red), 100 → 120 (green)
                    const gradientBg = `linear-gradient(90deg, hsl(${hue},80%,40%) 0%, hsl(${Math.min(hue + 30, 120)},80%,50%) ${progress}%, transparent ${progress}%)`;
                    return (
                      <div key={u.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 text-xs text-foreground/80 whitespace-nowrap transition-all hover:bg-white/10 shrink-0 min-w-[140px] max-w-[200px]">
                        {/* Progress bar track */}
                        {!u.processed && (
                          <div
                            className="absolute inset-0 opacity-20 transition-all duration-700"
                            style={{ background: gradientBg }}
                          />
                        )}
                        {u.processed && (
                          <div className="absolute inset-0 opacity-15" style={{ background: 'linear-gradient(90deg, hsl(120,80%,40%), hsl(140,80%,50%))' }} />
                        )}
                        {/* Content */}
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
                            className="p-0.5 rounded-full hover:bg-destructive/30 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        {/* Thin progress line at the bottom */}
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
                  className="flex items-center justify-center px-4 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors flex-shrink-0 border-r border-border"
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
                  className="flex-1 py-4 px-4 bg-transparent resize-none focus:outline-none text-sm leading-6 min-h-[56px] max-h-32 custom-scrollbar"
                  rows={1}
                  disabled={isSending || isStreaming}
                />

                {/* Send / Stop Button */}
                <div className="flex items-center px-3 flex-shrink-0 border-l border-border">
                  {isStreaming || isSending ? (
                    <button
                      onClick={handleStop}
                      className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all animate-pulse flex items-center justify-center"
                      title="Stop Generation"
                    >
                      <Square className="w-4 h-4 fill-current" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSend()}
                      disabled={!input.trim()}
                      className="p-2 rounded-xl bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-30 flex items-center justify-center"
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
      </div>
    </div>
  );
}
