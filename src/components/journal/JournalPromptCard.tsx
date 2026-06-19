"use client";

import React from 'react';
import { Loader2, Send } from 'lucide-react';

interface JournalPromptCardProps {
  loadingHeader: boolean;
  headerData: { userName: string; partnerName: string } | null;
  yourAnswer: string;
  setYourAnswer: (val: string) => void;
  isSubmitting: boolean;
  hasSubmitted: boolean;
  handleSubmit: () => void;
}

export function JournalPromptCard({
  loadingHeader,
  headerData,
  yourAnswer,
  setYourAnswer,
  isSubmitting,
  hasSubmitted,
  handleSubmit,
}: JournalPromptCardProps) {
  return (
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
        Today · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </div>

      {loadingHeader ? (
        <div className="flex items-center gap-3 h-12 mb-8 animate-pulse bg-muted rounded-xl px-4" />
      ) : (
        <h2 className="mb-8 text-2xl md:text-3xl leading-snug">
          Hi {headerData?.userName}, write your journal and tell me how you felt about {headerData?.partnerName} today
        </h2>
      )}

      {/* Your Response */}
      <div className="mb-6">
        <label htmlFor="your-response" className="block mb-3 text-muted-foreground text-sm font-medium">
          Your Thoughts
        </label>
        <textarea
          id="your-response"
          className="w-full p-4 rounded-2xl bg-background/50 border border-border text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-70"
          rows={6}
          placeholder="Share your feelings..."
          value={yourAnswer}
          onChange={(e) => setYourAnswer(e.target.value)}
          disabled={isSubmitting}
        />
        <div className="mt-2 text-xs text-muted-foreground">
          {hasSubmitted ? "Reflection saved! You can add more to today's entry anytime." : "Take a moment to center yourself."}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!yourAnswer.trim() || isSubmitting || loadingHeader}
        className="w-full py-4 px-6 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 font-medium cursor-pointer"
      >
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        {hasSubmitted ? "Add to Today's Reflection" : "Save Reflection"}
      </button>
    </div>
  );
}
