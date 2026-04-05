import { useState } from 'react';
import { Brain, Zap, Search, MessageSquare, Clock, Tag } from 'lucide-react';

type CoachMode = 'retrieval' | 'exploration';
type Message = {
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
  timestamp?: string;
};

export function AICoach() {
  const [mode, setMode] = useState<CoachMode>('retrieval');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'I\'m your relationship coach, here to help you navigate challenges and strengthen your connection. I have context from your shared journey and can work in two modes:\n\n**Retrieval Mode** for quick conflict de-escalation and immediate guidance.\n**Exploration Mode** for deep pattern analysis and relationship mapping.',
      timestamp: '2:34 PM',
    },
  ]);
  const [input, setInput] = useState('');

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

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };

    setMessages([...messages, userMessage]);

    // Simulate AI response based on mode
    setTimeout(() => {
      let response: Message;

      if (mode === 'retrieval') {
        response = {
          role: 'assistant',
          content: 'Based on your previous discussions about this topic, here are three immediate strategies you can use:\n\n1. **Acknowledge emotions first** - Your partner responds well when feelings are validated before solutions are discussed.\n\n2. **Use "we" language** - Past successful resolutions happened when you framed challenges as shared problems.\n\n3. **Request a 10-minute break** - Your conflict history shows better outcomes when you take brief pauses to regulate emotions.',
          citations: ['Communication patterns - Feb 2026', 'Conflict resolution - March 15', 'Relationship map'],
          timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        };
      } else {
        response = {
          role: 'assistant',
          content: 'I\'ve analyzed your communication patterns over the past 3 months. Here\'s what I\'m noticing:\n\n**Primary Pattern**: Most conflicts arise on weekday evenings between 6-8 PM, often related to logistics and planning.\n\n**Underlying Theme**: There appears to be a recurring tension around "mental load" distribution. Your partner often raises concerns about planning responsibilities.\n\n**Strength to Leverage**: You both show excellent repair attempts within 24 hours. Your follow-up conversations consistently demonstrate empathy and willingness to compromise.\n\nWould you like me to explore any of these patterns more deeply?',
          citations: ['14 past conflicts analyzed', 'Communication frequency data', 'Sentiment analysis - 90 days'],
          timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        };
      }

      setMessages(prev => [...prev, response]);
    }, 1500);

    setInput('');
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
          aria-label="Coaching modes"
        >
          <button
            onClick={() => setMode('retrieval')}
            className={`px-6 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              mode === 'retrieval'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'hover:bg-accent/50'
            }`}
            role="tab"
            aria-selected={mode === 'retrieval'}
            aria-controls="chat-panel"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" aria-hidden="true" />
              <span>Retrieval Mode</span>
            </div>
            <div className="text-xs mt-1 opacity-80">Rapid conflict support</div>
          </button>

          <button
            onClick={() => setMode('exploration')}
            className={`px-6 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              mode === 'exploration'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'hover:bg-accent/50'
            }`}
            role="tab"
            aria-selected={mode === 'exploration'}
            aria-controls="chat-panel"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" aria-hidden="true" />
              <span>Exploration Mode</span>
            </div>
            <div className="text-xs mt-1 opacity-80">Deep pattern analysis</div>
          </button>
        </div>

        {/* Chat Interface */}
        <div
          id="chat-panel"
          className="rounded-3xl overflow-hidden mb-6"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
          role="tabpanel"
        >
          {/* Messages Container */}
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
                      : 'bg-card border border-border'
                  } rounded-2xl p-4`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </div>

                  {/* Citations/Memory Indicators */}
                  {message.citations && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                        <Tag className="w-3 h-3" aria-hidden="true" />
                        Referenced from:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {message.citations.map((citation, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent-foreground"
                          >
                            {citation}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  {message.timestamp && (
                    <div className="mt-2 flex items-center gap-1 text-xs opacity-60">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {message.timestamp}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-border">
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
                placeholder={
                  mode === 'retrieval'
                    ? 'Describe your current situation...'
                    : 'What patterns would you like to explore?'
                }
                className="flex-1 p-3 rounded-xl bg-input border border-border text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                rows={2}
                aria-label="Message input"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-6 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="Send message"
              >
                <MessageSquare className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="mb-4 text-sm text-muted-foreground">
            {mode === 'retrieval' ? 'Quick Assistance' : 'Explore Topics'}
          </h3>
          <div className="flex flex-wrap gap-3">
            {(mode === 'retrieval' ? retrievalExamples : explorationExamples).map((example, index) => (
              <button
                key={index}
                onClick={() => setInput(example)}
                className="px-4 py-2 rounded-lg bg-card border border-border hover:border-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Context Indicator */}
        <div
          className="mt-8 p-4 rounded-xl text-sm"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <div className="font-medium mb-1">Context Available</div>
              <div className="text-muted-foreground">
                I have access to your relationship map, past reflections, and communication patterns
                to provide personalized guidance that grows with your journey together.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
