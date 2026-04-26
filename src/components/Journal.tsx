"use client";
import { useState, useEffect } from 'react';
import { Sparkles, Lock, Eye, Send, Loader2, Calendar, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '../../api-client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "./ui/dialog";

const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

type JournalProps = {
    userId: string;
    tenantId: string;
};

type JournalEntry = {
    id: string;
    userId: string;
    content: string;
    prompt: string | null;
    date: string | null;
    createdAt: string;
};

export function Journal({ userId, tenantId }: JournalProps) {
    const [yourAnswer, setYourAnswer] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [headerData, setHeaderData] = useState<{ userName: string, partnerName: string } | null>(null);
    const [pastEntries, setPastEntries] = useState<JournalEntry[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
    const [loadingHeader, setLoadingHeader] = useState(true);
    const [loadingEntries, setLoadingEntries] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        return { daysInMonth, firstDayOfMonth, year, month };
    };

    const { daysInMonth, firstDayOfMonth, year, month } = getDaysInMonth(currentMonth);
    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

    const formatDate = (y: number, m: number, d: number) => {
        return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    };

    const entriesByDate = pastEntries.reduce((acc, entry) => {
        let dateStr = entry.date;
        if (!dateStr) {
           const raw = Number(entry.createdAt);
           const ms = raw < 10000000000 ? raw * 1000 : raw;
           const d = new Date(ms);
           dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        acc[dateStr] = entry;
        return acc;
    }, {} as Record<string, JournalEntry>);

    useEffect(() => {
        fetchInitialData();
    }, [tenantId]);

    const fetchInitialData = async () => {
        try {
            setLoadingHeader(true);
            setLoadingEntries(true);

            const [header, entriesData] = await Promise.all([
                apiClient.getJournalPrompt(tenantId, userId),
                apiClient.getJournalEntries(tenantId, userId)
            ]);

            setHeaderData(header);
            setPastEntries(entriesData);

            // Check if user already submitted for today
            const todayStr = getLocalDateString();
            const alreadySubmitted = entriesData.some(e => {
                // Now using the 'date' field from backend if available
                return e.userId === userId && e.date === todayStr;
            });

            if (alreadySubmitted) {
                setHasSubmitted(true);
            }

        } catch (error) {
            console.error('Failed to fetch journal data:', error);
        } finally {
            setLoadingHeader(false);
            setLoadingEntries(false);
        }
    };

    const handleSubmit = async () => {
        if (!yourAnswer.trim() || !headerData) return;

        try {
            setIsSubmitting(true);
            const todayStr = getLocalDateString();

            await apiClient.createJournalEntry({
                tenantId,
                userId,
                content: yourAnswer,
                date: todayStr
            });

            setYourAnswer(''); // Clear input to allow adding more
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
                        <label htmlFor="your-response" className="block mb-3 text-muted-foreground">
                            Your Thoughts
                        </label>
                        <textarea
                            id="your-response"
                            className="w-full p-4 rounded-xl bg-background/50 border border-border text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-70"
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
                        className="w-full py-4 px-6 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 font-medium"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        {hasSubmitted ? "Add to Today's Reflection" : "Save Reflection"}
                    </button>
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
                        <div className="flex items-center justify-center h-64 bg-muted/20 rounded-3xl animate-pulse" />
                    ) : (
                        <div className="p-6 md:p-8 rounded-3xl" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}>
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-xl font-semibold">{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h4>
                                <div className="flex gap-2">
                                    <button onClick={prevMonth} className="p-2 rounded-full hover:bg-muted/50 transition-colors border border-border/50"><ChevronLeft className="w-5 h-5" /></button>
                                    <button onClick={nextMonth} className="p-2 rounded-full hover:bg-muted/50 transition-colors border border-border/50"><ChevronRight className="w-5 h-5" /></button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-7 gap-2 mb-4 text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="opacity-70">{d}</div>)}
                            </div>
                            
                            <div className="grid grid-cols-7 gap-2 md:gap-4">
                                {blanks.map((_, i) => (
                                    <div key={`blank-${i}`} className="aspect-square rounded-2xl bg-transparent" />
                                ))}
                                {days.map(day => {
                                    const dateStr = formatDate(year, month, day);
                                    const entry = entriesByDate[dateStr];
                                    const isToday = dateStr === getLocalDateString();
                                    
                                    return (
                                        <div 
                                            key={day} 
                                            onClick={() => entry && setSelectedEntry(entry)}
                                            className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all ${
                                                entry 
                                                    ? 'bg-primary/20 text-primary hover:bg-primary/30 font-bold border border-primary/30 cursor-pointer hover:scale-105 hover:shadow-lg' 
                                                    : 'hover:bg-muted/20 text-foreground/70 cursor-default'
                                            } ${isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                                        >
                                            <span className="text-lg md:text-xl">{day}</span>
                                            {entry && (
                                                <div className="absolute bottom-2 md:bottom-3 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary animate-pulse" />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Journal Detail Modal */}
            <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
                <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl rounded-3xl p-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                    
                    <DialogHeader className="p-8 pb-4">
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">
                                {selectedEntry?.date ? 
                                    (() => {
                                        const [y, m, d] = selectedEntry.date.split('-').map(Number);
                                        return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                                    })() : 
                                    selectedEntry && new Date(Number(selectedEntry.createdAt) * (Number(selectedEntry.createdAt) < 10000000000 ? 1000 : 1)).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                }
                            </span>
                        </div>
                        <DialogTitle className="text-2xl font-bold">Daily Reflection</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Your private thoughts from this day
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-8 pb-10 overflow-y-auto max-h-[60vh]">
                        <div className="relative">
                            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
                            <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap pl-6 italic font-serif">
                                "{selectedEntry?.content}"
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
