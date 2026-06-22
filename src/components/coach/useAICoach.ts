"use client";

import { useState, useEffect, useRef } from 'react';
import { apiClient, getBaseUrl } from '../../../api-client';
import { useAuth } from '../../context/AuthContext';

export type CoachMode = 'retrieval' | 'exploration';

export type Message = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
  timestamp?: string;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
};

export type ContextUpload = {
  id: string;
  fileName: string;
  fileSize: number;
  processed: boolean;
  processingProgress: number;
  createdAt: string;
};

export type ChatError = {
  message: string;
  details?: string;
  type?: string;
  status?: number;
  action?: 'send' | 'regenerate' | 'edit';
  payload?: string;
} | null;

export function useAICoach() {
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
  
  const [chatError, setChatError] = useState<ChatError>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [contextUploads, setContextUploads] = useState<ContextUpload[]>([]);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const isUpdatingFromStream = useRef(false);

  // Load conversions and context uploads on mount/tenant changes
  useEffect(() => {
    if (activeTenantId && userId) {
      loadConversations();
      loadContextUploads();
    }
  }, [activeTenantId, userId]);

  // Load message history on activeSessionId change
  useEffect(() => {
    if (activeSessionId && !isUpdatingFromStream.current) {
      loadMessages(activeSessionId);
    } else if (!activeSessionId) {
      setMessages([{
        role: 'assistant',
        content: '# Welcome to your AI Coach\n\nI\'m here to provide empathetic guidance grounded in your shared history. Select a past conversation or start a new one to begin.\n\n* **Retrieval Mode**: Best for rapid de-escalation and specific advice.\n* **Exploration Mode**: Best for deep pattern analysis and long-term growth.',
        timestamp: 'Coach Ready',
      }]);
    }
    isUpdatingFromStream.current = false;
  }, [activeSessionId]);

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

  const processStream = async (response: Response, action?: 'send' | 'regenerate' | 'edit', payload?: string) => {
    const reader = response.body?.getReader();
    if (!reader) return;

    setIsStreaming(true);
    const decoder = new TextDecoder();
    let accumulatedContent = '';
    let currentEvent = 'message';

    // Skeleton assistant message
    const assistantMsg: Message = { role: 'assistant', content: '', timestamp: 'Thinking...' };
    setMessages(prev => [...prev.filter(m => m.timestamp !== 'Thinking...'), assistantMsg]);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          if (line.startsWith('event:')) {
            currentEvent = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            const dataStr = line.substring(5).trim();
            try {
              const data = JSON.parse(dataStr);
              if (currentEvent === 'session') {
                isUpdatingFromStream.current = true;
                setActiveSessionId(data.sessionId);
                loadConversations();
              } else if (currentEvent === 'error') {
                setChatError({
                  message: data.error || 'LLM generation failed',
                  details: data.details || 'No additional details provided.',
                  type: 'Generation Error',
                  action,
                  payload
                });
                setMessages(prev => prev.filter(m => m.timestamp !== 'Thinking...'));
              } else {
                // message event
                if (data.chunk) {
                  accumulatedContent += data.chunk;
                  setMessages(prev => {
                    const updated = [...prev];
                    const thinkingIdx = updated.findIndex(m => m.timestamp === 'Thinking...');
                    if (thinkingIdx !== -1) {
                      updated[thinkingIdx] = {
                        role: 'assistant',
                        content: accumulatedContent,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      };
                    } else {
                      updated[updated.length - 1] = {
                        ...updated[updated.length - 1],
                        content: accumulatedContent,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      };
                    }
                    return updated;
                  });
                }
              }
            } catch (e) {
              // Ignore partial JSON
            }
            currentEvent = 'message';
          }
        }
      }
    } catch (streamErr: any) {
      console.error('Error reading stream:', streamErr);
      setChatError({
        message: streamErr.message || 'Stream connection interrupted',
        details: 'The connection to the stream was lost mid-generation.',
        type: 'Stream Connection Error',
        action,
        payload
      });
      setMessages(prev => prev.filter(m => m.timestamp !== 'Thinking...'));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSend = async (customQuery?: string) => {
    const query = customQuery || input;
    if (!query.trim() || isSending || isStreaming || !activeTenantId) return;

    setChatError(null);
    setIsSending(true);
    if (!customQuery) setInput('');
    
    if (!customQuery) {
      setMessages(prev => [...prev, {
        role: 'user',
        content: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${getBaseUrl(activeTenantId || undefined)}/coach/chat/stream`, {
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

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: response.statusText || `HTTP error ${response.status}` };
        }
        const err = new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
        (err as any).status = response.status;
        throw err;
      }
      await processStream(response, 'send', query);
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
        setChatError({
          message: err.message || 'Failed to connect to AI Coach.',
          details: err.stack || 'Check your internet connection or server configurations.',
          type: 'Connection / Server Error',
          status: err.status || 500,
          action: 'send',
          payload: query
        });
        setMessages(prev => prev.filter(m => m.timestamp !== 'Thinking...'));
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
    setChatError(null);
    setIsSending(true);

    try {
      const response = await fetch(`${getBaseUrl(activeTenantId || undefined)}/coach/chat/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId,
          sessionId: activeSessionId,
          mode,
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: response.statusText || `HTTP error ${response.status}` };
        }
        const err = new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
        (err as any).status = response.status;
        throw err;
      }

      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant') return prev.slice(0, -1);
        return prev;
      });

      await processStream(response, 'regenerate');
    } catch (err: any) {
      console.error('Regeneration failed', err);
      setChatError({
        message: err.message || 'Failed to regenerate response.',
        details: err.stack || 'Check your internet connection or server configurations.',
        type: 'Regeneration Error',
        status: err.status || 500,
        action: 'regenerate'
      });
      setMessages(prev => prev.filter(m => m.timestamp !== 'Thinking...'));
    } finally {
      setIsSending(false);
    }
  };

  const handleEdit = async () => {
    if (!editInput.trim() || isSending || isStreaming || !activeSessionId) return;
    setChatError(null);
    setIsSending(true);
    setIsEditing(null);

    try {
      const response = await fetch(`${getBaseUrl(activeTenantId || undefined)}/coach/chat/edit`, {
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

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: response.statusText || `HTTP error ${response.status}` };
        }
        const err = new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
        (err as any).status = response.status;
        throw err;
      }

      setMessages(prev => {
        const lastUserIdx = [...prev].reverse().findIndex(m => m.role === 'user');
        if (lastUserIdx === -1) return prev;
        const slicePoint = prev.length - 1 - lastUserIdx;
        const newHistory = prev.slice(0, slicePoint);
        return [...newHistory, { role: 'user', content: editInput, timestamp: 'Edited' }];
      });

      await processStream(response, 'edit', editInput);
    } catch (err: any) {
      console.error('Edit failed', err);
      setChatError({
        message: err.message || 'Failed to submit edited prompt.',
        details: err.stack || 'Check your internet connection or server configurations.',
        type: 'Edit Prompt Error',
        status: err.status || 500,
        action: 'edit',
        payload: editInput
      });
      setMessages(prev => prev.filter(m => m.timestamp !== 'Thinking...'));
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
        fileContent = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(pendingFile);
        });
      } else {
        fileContent = await pendingFile.text();
      }

      await apiClient.uploadChatHistory({
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
      setTimeout(() => setUploadStatus('idle'), 2000);
      setTimeout(() => loadContextUploads(), 5000);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
      setUploadStatus('error');
    }
  };

  return {
    mode,
    setMode,
    messages,
    input,
    setInput,
    isSending,
    isStreaming,
    conversations,
    activeSessionId,
    setActiveSessionId,
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
    showStrategyModal,
    setShowStrategyModal,
    pendingFile,
    uploadStatus,
    uploadError,
    handleSend,
    handleStop,
    handleRegenerate,
    handleEdit,
    handleDeleteConversation,
    handleDeleteContext,
    startNewConversation,
    handleFileSelection,
    executeUpload,
  };
}
