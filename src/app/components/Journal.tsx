import { useState } from 'react';
import { Sparkles, Lock, Eye, Send } from 'lucide-react';

export function Journal() {
  const [yourAnswer, setYourAnswer] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showReveal, setShowReveal] = useState(false);

  const todayPrompt = "What small moment from today made you feel most connected to your partner?";
  const partnerAnswer = "When you texted me that silly meme during my stressful meeting. It was exactly what I needed - you always know how to make me smile even when we're apart. It reminded me that you're thinking about me throughout the day.";

  const handleSubmit = () => {
    if (yourAnswer.trim()) {
      setHasSubmitted(true);
      setTimeout(() => setShowReveal(true), 500);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Sparkles className="w-8 h-8 text-primary" aria-hidden="true" />
            <h1>Daily Reflection</h1>
          </div>
          <p className="text-muted-foreground">
            Share your thoughts, discover your partner's perspective
          </p>
        </header>

        {/* Today's Prompt Card */}
        <div
          className="p-8 rounded-3xl mb-8"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="mb-2 text-sm text-muted-foreground">
            Today's Question · April 5, 2026
          </div>
          <h2 className="mb-8">{todayPrompt}</h2>

          {/* Your Response */}
          <div className="mb-6">
            <label htmlFor="your-response" className="block mb-3 text-muted-foreground">
              Your Response
            </label>
            <textarea
              id="your-response"
              className="w-full p-4 rounded-xl bg-input-background border border-border text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              rows={6}
              placeholder="Share your thoughts..."
              value={yourAnswer}
              onChange={(e) => setYourAnswer(e.target.value)}
              disabled={hasSubmitted}
              aria-describedby="response-instructions"
            />
            <div id="response-instructions" className="mt-2 text-xs text-muted-foreground">
              {!hasSubmitted ? 'Your partner\'s response will be revealed once you submit yours.' : ''}
            </div>
          </div>

          {/* Submit Button */}
          {!hasSubmitted && (
            <button
              onClick={handleSubmit}
              disabled={!yourAnswer.trim()}
              className="w-full py-3 px-6 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Submit your response"
            >
              <Send className="w-5 h-5" aria-hidden="true" />
              Submit & Reveal Partner's Response
            </button>
          )}
        </div>

        {/* Partner's Response - Locked/Revealed State */}
        <div
          className={`p-8 rounded-3xl transition-all duration-500 ${
            hasSubmitted ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4'
          }`}
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <label className="text-muted-foreground">
              Partner's Response
            </label>
            {!hasSubmitted && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4" aria-hidden="true" />
                Locked
              </div>
            )}
            {hasSubmitted && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <Eye className="w-4 h-4" aria-hidden="true" />
                Revealed
              </div>
            )}
          </div>

          <div
            className={`relative transition-all duration-700 ${
              showReveal ? 'blur-none' : 'blur-xl select-none pointer-events-none'
            }`}
          >
            <div className="p-6 rounded-xl bg-card/50 border border-border">
              <p className="leading-relaxed">{partnerAnswer}</p>
            </div>

            {/* Locked Overlay */}
            {!showReveal && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
                  <p className="text-muted-foreground">
                    {!hasSubmitted ? 'Submit your response to reveal' : 'Revealing...'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Prompt After Reveal */}
        {showReveal && (
          <div
            className="mt-6 p-6 rounded-2xl text-center animate-[fadeIn_0.5s_ease-in]"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-sm text-muted-foreground mb-4">
              Want to continue this conversation?
            </p>
            <button
              className="py-2 px-6 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              aria-label="Start a conversation about this topic"
            >
              Start a Conversation
            </button>
          </div>
        )}

        {/* Previous Entries Preview */}
        <div className="mt-12">
          <h3 className="mb-4">Previous Reflections</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { date: 'April 4', question: 'What are you most grateful for about your partner today?' },
              { date: 'April 3', question: 'Describe a moment when you felt truly heard by your partner.' },
            ].map((entry, index) => (
              <button
                key={index}
                className="p-4 rounded-xl text-left transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                }}
                aria-label={`View entry from ${entry.date}`}
              >
                <div className="text-sm text-muted-foreground mb-2">{entry.date}</div>
                <div className="text-sm line-clamp-2">{entry.question}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
