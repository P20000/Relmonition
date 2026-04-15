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
    const [dailyPrompt, setDailyPrompt] = useState<{ prompt: string; date: string } | null>(null);
    const [pastEntries, setPastEntries] = useState<JournalEntry[]>([]);
    const [loadingPrompt, setLoadingPrompt] = useState(true);
    const [loadingEntries, setLoadingEntries] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);


    useEffect(() => {
        fetchInitialData();
    }, [tenantId]);

    const fetchInitialData = async () => {
        try {
            setLoadingPrompt(true);
            setLoadingEntries(true);

            const [promptData, entriesData] = await Promise.all([
                apiClient.getJournalPrompt(),
                apiClient.getJournalEntries(tenantId, userId)
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
            const updatedEntries = await apiClient.getJournalEntries(tenantId, userId);
            setPastEntries(updatedEntries);
        } catch (error: any) {
            console.error('Failed to submit entry:', error);
            alert(`Failed to save your reflection: ${error.message}`);
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
                        Your private space for reflection and AI-powered growth
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
                            {!hasSubmitted ? "Take a moment to center yourself." : "Reflection saved successfully."}
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
                            Save Reflection
                        </button>
                    )}
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
