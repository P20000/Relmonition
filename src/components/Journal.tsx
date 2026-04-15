"use client";
import { useState, useEffect } from 'react';
import { Sparkles, Lock, Eye, Send, Loader2, Calendar } from 'lucide-react';
import { apiClient } from '../../api-client';

type JournalProps = {
    userId: string;
    tenantId: string;
};

type JournalEntry = {
    id: string;
    userId: string;
    content: string;
    prompt: string | null;
    createdAt: string;
};

export function Journal({ userId, tenantId }: JournalProps) {
    const [yourAnswer, setYourAnswer] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [showReveal, setShowReveal] = useState(false);
    const [dailyPrompt, setDailyPrompt] = useState<{ prompt: string; date: string } | null>(null);
    const [pastEntries, setPastEntries] = useState<JournalEntry[]>([]);
    const [loadingPrompt, setLoadingPrompt] = useState(true);
    const [loadingEntries, setLoadingEntries] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const partnerAnswerMock = "When you texted me that silly meme during my stressful meeting. It was exactly what I needed - you always know how to make me smile even when we're apart. It reminded me that you're thinking about me throughout the day.";

    useEffect(() => {
        fetchInitialData();
    }, [tenantId]);

    const fetchInitialData = async () => {
        try {
            setLoadingPrompt(true);
            setLoadingEntries(true);

            const [promptData, entriesData] = await Promise.all([
                apiClient.getJournalPrompt(),
                apiClient.getJournalEntries(tenantId)
            ]);

            setDailyPrompt(promptData);
            setPastEntries(entriesData);

            // Check if user already submitted for today
            const todayStr = new Date().toLocaleDateString();
            const alreadySubmitted = entriesData.some(e =>
                e.userId === userId &&
                new Date(e.createdAt).toLocaleDateString() === todayStr
            );

            if (alreadySubmitted) {
                setHasSubmitted(true);
                setShowReveal(true);
            }

        } catch (error) {
            console.error('Failed to fetch journal data:', error);
        } finally {
            setLoadingPrompt(false);
            setLoadingEntries(false);
        }
    };

    const handleSubmit = async () => {
        if (!yourAnswer.trim() || !dailyPrompt) return;

        try {
            setIsSubmitting(true);
            await apiClient.createJournalEntry({
                tenantId,
                userId,
                content: yourAnswer,
                prompt: dailyPrompt.prompt
            });

            setHasSubmitted(true);
            // Re-fetch to update history
            const updatedEntries = await apiClient.getJournalEntries(tenantId);
            setPastEntries(updatedEntries);

            setTimeout(() => setShowReveal(true), 500);
        } catch (error) {
            console.error('Failed to submit entry:', error);
            alert('Failed to save your reflection. Please try again.');
        } finally {
            setIsSubmitting(false);
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
                        Today's Question · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>

                    {loadingPrompt ? (
                        <div className="flex items-center gap-3 h-12 mb-8 animate-pulse bg-muted rounded-xl px-4" />
                    ) : (
                        <h2 className="mb-8">{dailyPrompt?.prompt}</h2>
                    )}

                    {/* Your Response */}
                    <div className="mb-6">
                        <label htmlFor="your-response" className="block mb-3 text-muted-foreground">
                            Your Response
                        </label>
                        <textarea
                            id="your-response"
                            className="w-full p-4 rounded-xl bg-background/50 border border-border text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-70"
                            rows={6}
                            placeholder="Share your thoughts..."
                            value={yourAnswer}
                            onChange={(e) => setYourAnswer(e.target.value)}
                            disabled={hasSubmitted || isSubmitting}
                        />
                        <div className="mt-2 text-xs text-muted-foreground">
                            {!hasSubmitted ? "Your partner's response will be revealed once you submit yours." : "Reflection saved successfully."}
                        </div>
                    </div>

                    {/* Submit Button */}
                    {!hasSubmitted && (
                        <button
                            onClick={handleSubmit}
                            disabled={!yourAnswer.trim() || isSubmitting || loadingPrompt}
                            className="w-full py-4 px-6 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            Submit & Reveal Partner's Response
                        </button>
                    )}
                </div>

                {/* Partner's Response - Locked/Revealed State */}
                <div
                    className={`p-8 rounded-3xl transition-all duration-500 ${hasSubmitted ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4'
                        }`}
                    style={{
                        background: 'var(--glass-bg)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid var(--glass-border)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <div className="mb-4 flex items-center justify-between">
                        <label className="text-muted-foreground font-medium">
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
                        className={`relative transition-all duration-700 ${showReveal ? 'blur-none' : 'blur-xl select-none pointer-events-none'
                            }`}
                    >
                        <div className="p-6 rounded-xl bg-background/30 border border-border">
                            <p className="leading-relaxed italic text-muted-foreground">
                                {partnerAnswerMock}
                                <span className="block not-italic text-xs mt-4 text-muted-foreground/60">
                                    [Demo Response: Dynamic partner fetch coming soon]
                                </span>
                            </p>
                        </div>

                        {!showReveal && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <Lock className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground">
                                        {!hasSubmitted ? 'Submit your response to reveal' : 'Revealing...'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Previous Entries Section */}
                <div className="mt-16">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            <h3 className="text-xl">Reflection History</h3>
                        </div>
                    </div>

                    {loadingEntries ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : pastEntries.length === 0 ? (
                        <div className="text-center p-12 rounded-2xl bg-muted/30 border border-dashed border-border">
                            <p className="text-muted-foreground text-sm">No reflections yet. Start your journey today!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pastEntries.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="p-5 rounded-xl text-left transition-all hover:border-primary/50 group"
                                    style={{
                                        background: 'var(--card)',
                                        border: '1px solid var(--border)',
                                    }}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="text-xs font-medium text-primary py-1 px-2 bg-primary/10 rounded-md">
                                            {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                                            {entry.userId === userId ? 'Yours' : 'Partner'}
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium mb-2 line-clamp-1">{entry.prompt}</p>
                                    <p className="text-sm text-muted-foreground line-clamp-2 italic">"{entry.content}"</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
