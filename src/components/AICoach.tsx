"use client";
import { useState } from 'react';
import { Brain, Zap, Search, MessageSquare, Clock, Tag, Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '../../api-client';
import { useAuth } from '../context/AuthContext';

type CoachMode = 'retrieval' | 'exploration';
type Message = {
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
  timestamp?: string;
};

export function AICoach() {
  const { activeTenantId, userId } = useAuth();
  const [mode, setMode] = useState<CoachMode>('retrieval');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'I\'m your relationship coach, here to help you navigate challenges and strengthen your connection. I have context from your shared journey and can work in two modes:\n\n**Retrieval Mode** for quick conflict de-escalation and immediate guidance.\n**Exploration Mode** for deep pattern analysis and relationship mapping.',
      timestamp: 'Coach Ready',
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState('');

  const retrievalExamples = [
    'Help me respond to this conflict',
    'Quick tips for tonight\'s conversation',
    'De-escalation strategies',
  ];

  const explorationExamples = [
    'Analyze our communication patterns',
    'Map recurring conflicts',
    'Identify relationship strengths',
  ];

  const handleSend = async () => {
    if (!input.trim() || isSending || !activeTenantId) return;

    setIsSending(true);
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const result = await apiClient.post('/rag/query', {
        tenantId: activeTenantId,
        query: input,
        mode,
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: result.answer,
        citations: result.sources?.slice(0, 3).map((s: any) => s.content.substring(0, 60) + '...'),
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Coach Error:', err);
      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting to your relationship history right now. Please try again in a moment.",
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeTenantId || !userId) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      setUploadStatus('error');
      return;
    }

    setUploadedFile(file);
    setUploadStatus('uploading');
    setUploadError('');

    try {
      const fileContent = await file.text();
      await apiClient.post('/coach/upload', {
        tenantId: activeTenantId,
        userId,
        fileName: file.name,
        fileContent,
        fileSize: file.size,
      });

      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
      setUploadStatus('error');
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Brain className="w-8 h-8 text-primary" aria-hidden="true" />
            <h1>AI Relationship Coach</h1>
          </div>
          <p className="text-muted-foreground">
            Context-aware guidance powered by your relationship history
          </p>
        </header>

        {/* Mode Selector */}
        <div
          className="mb-6 p-2 rounded-2xl inline-flex gap-2"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
          }}
          role="tablist"
        >
          <button
            onClick={() => setMode('retrieval')}
            className={`px-6 py-3 rounded-xl transition-all ${
              mode === 'retrieval'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'hover:bg-accent/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Retrieval Mode</span>
            </div>
            <div className="text-xs mt-1 opacity-80">Rapid conflict support</div>
          </button>

          <button
            onClick={() => setMode('exploration')}
            className={`px-6 py-3 rounded-xl transition-all ${
              mode === 'exploration'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'hover:bg-accent/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span>Exploration Mode</span>
            </div>
            <div className="text-xs mt-1 opacity-80">Deep pattern analysis</div>
          </button>
        </div>

        {/* Chat Interface */}
        <div
          className="rounded-3xl overflow-hidden mb-8"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="h-[500px] overflow-y-auto p-6 space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border shadow-sm'
                  } rounded-2xl p-4`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </div>

                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border/50">
                      <div className="flex flex-wrap gap-2">
                        {message.citations.map((citation, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground">
                            {citation}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {message.timestamp && (
                    <div className="mt-2 text-[10px] opacity-60 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {message.timestamp}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-border bg-card/50">
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={mode === 'retrieval' ? 'Ask for advice...' : 'Explore a pattern...'}
                className="flex-1 p-3 rounded-xl bg-input border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                rows={2}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                className="px-6 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center min-w-[60px]"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageSquare className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Examples */}
        <div className="mb-12">
          <h3 className="mb-4 text-sm text-muted-foreground uppercase tracking-wider font-semibold">Suggested Questions</h3>
          <div className="flex flex-wrap gap-3">
            {(mode === 'retrieval' ? retrievalExamples : explorationExamples).map((example, index) => (
              <button
                key={index}
                onClick={() => setInput(example)}
                className="px-4 py-2 rounded-lg bg-card border border-border hover:border-primary transition-all"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Upload Section (Relocated from Settings) */}
        <div
          className="p-8 rounded-3xl"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Upload className="w-6 h-6 text-primary" />
            <h2>Enhance My Context</h2>
          </div>

          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Upload your previous chat conversations (WhatsApp, iMessage, etc.) to help me analyze 
            your communication patterns and provide significantly deeper guidance based on your real history.
          </p>

          <div
            className="border-2 border-dashed border-border rounded-2xl p-8 text-center mb-4 hover:border-primary transition-colors cursor-pointer group"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <p className="mb-2 font-medium group-hover:text-primary transition-colors">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              Supports TXT, JSON, CSV files (Max 10MB)
            </p>
            <input
              id="file-upload"
              type="file"
              accept=".txt,.json,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {uploadStatus !== 'idle' && (
            <div
              className="p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2"
              style={{
                background: uploadStatus === 'success' ? 'var(--accent)' : uploadStatus === 'error' ? 'var(--destructive)' : 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              {uploadStatus === 'uploading' && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
              {uploadStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {uploadStatus === 'error' && <AlertCircle className="w-5 h-5 text-destructive" />}
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {uploadedFile?.name || 'Processing...'}
                </p>
                <p className="text-xs text-muted-foreground opacity-80">
                  {uploadStatus === 'uploading' && 'Securely uploading your chat history...'}
                  {uploadStatus === 'success' && 'Upload complete! These insights will be available in our future sessions.'}
                  {uploadStatus === 'error' && uploadError}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
