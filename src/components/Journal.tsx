"use client";
import { useState, useEffect } from 'react';
import { Sparkles, Lock, Eye, Send, Loader2, Calendar, BookOpen, ChevronLeft, ChevronRight, Flame, Star, Trophy } from 'lucide-react';
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
    tenantId: string | null;
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
    
    // Always render 6 rows (42 slots) so the calendar height remains perfectly fixed
    const trailingBlanksCount = 42 - (firstDayOfMonth + daysInMonth);
    const trailingBlanks = Array(Math.max(0, trailingBlanksCount)).fill(null);

    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

    const formatDate = (y: number, m: number, d: number) => {
        return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    };

    const entriesByDate = pastEntries.reduce((acc, entry) => {
        if (entry.date) acc[entry.date] = entry;
        return acc;
    }, {} as Record<string, JournalEntry>);

    // --- Gamification Stats ---
    const totalJournals = pastEntries.length;
    
    let currentStreak = 0;
    let checkDate = new Date();
    let hasCheckedToday = false;

    while (true) {
        const year = checkDate.getFullYear();
        const month = String(checkDate.getMonth() + 1).padStart(2, '0');
        const day = String(checkDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        if (entriesByDate[dateStr]) {
            currentStreak++;
            hasCheckedToday = true;
        } else if (!hasCheckedToday) {
            hasCheckedToday = true;
        } else {
            break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
    }

    const achievements = [
        { id: 'first_step', title: 'First Step', desc: 'Log your first journal entry', icon: <BookOpen className="w-5 h-5 text-blue-400" />, unlocked: totalJournals >= 1 },
        { id: 'consistent', title: 'Consistent', desc: 'Reach a 3-day journaling streak', icon: <Flame className="w-5 h-5 text-orange-400" />, unlocked: currentStreak >= 3 },
        { id: 'devoted', title: 'Devoted', desc: 'Log 10 total journal entries', icon: <Star className="w-5 h-5 text-yellow-400" />, unlocked: totalJournals >= 10 },
        { id: 'scholar', title: 'Scholar', desc: 'Log 30 total journal entries', icon: <Trophy className="w-5 h-5 text-purple-400" />, unlocked: totalJournals >= 30 },
    ];

    useEffect(() => {
        if (tenantId) fetchInitialData();
    }, [tenantId]);

    const fetchInitialData = async () => {
        if (!tenantId || !userId) return;
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
                        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                            {/* Left: Calendar */}
                            <div className="flex-1 p-4 md:p-8 rounded-3xl lg:max-w-xl w-full" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}>
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-xl font-semibold">{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h4>
                                <div className="flex gap-2">
                                    <button onClick={prevMonth} className="p-2 rounded-full hover:bg-muted/50 transition-colors border border-border/50"><ChevronLeft className="w-5 h-5" /></button>
                                    <button onClick={nextMonth} className="p-2 rounded-full hover:bg-muted/50 transition-colors border border-border/50"><ChevronRight className="w-5 h-5" /></button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-7 gap-1 md:gap-4 mb-4 text-center text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="opacity-70">{d}</div>)}
                            </div>
                            
                            <div className="grid grid-cols-7 gap-1 md:gap-4">
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
                                            className={`aspect-square rounded-xl md:rounded-2xl flex flex-col items-center justify-center relative transition-all ${
                                                entry 
                                                    ? 'bg-primary/20 text-primary hover:bg-primary/30 font-bold border border-primary/30 cursor-pointer hover:scale-105 hover:shadow-lg' 
                                                    : 'hover:bg-muted/20 text-foreground/70 cursor-default'
                                            } ${isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                                        >
                                            <span className="text-base md:text-xl">{day}</span>
                                            {entry && (
                                                <div className="absolute bottom-2 md:bottom-3 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary animate-pulse" />
                                            )}
                                        </div>
                                    )
                                })}
                                {trailingBlanks.map((_, i) => (
                                    <div key={`trailing-${i}`} className="aspect-square rounded-xl md:rounded-2xl bg-transparent" />
                                ))}
                            </div>
                            </div>
                            
                            {/* Right: Gamification Stats */}
                            <div className="flex-1 flex flex-col gap-6 w-full lg:w-auto">
                                {/* Top Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)' }}>
                                        <Flame className={`w-8 h-8 mb-2 ${currentStreak > 0 ? 'text-orange-500 animate-pulse' : 'text-muted-foreground opacity-50'}`} />
                                        <div className="text-3xl font-bold">{currentStreak}</div>
                                        <div className="text-sm text-muted-foreground font-medium uppercase tracking-widest mt-1">Day Streak</div>
                                    </div>
                                    <div className="p-6 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)' }}>
                                        <Star className="w-8 h-8 mb-2 text-yellow-500" />
                                        <div className="text-3xl font-bold">{totalJournals}</div>
                                        <div className="text-sm text-muted-foreground font-medium uppercase tracking-widest mt-1">Total Entries</div>
                                    </div>
                                </div>

                                {/* Single Achievement Display */}
                                <div className="w-full flex-1 p-5 rounded-3xl flex flex-col" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)' }}>
                                    <h4 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2 text-center w-full">
                                        <Trophy className="w-5 h-5 text-primary" /> Current Milestone
                                    </h4>
                                    <div className="flex-1 flex flex-col">
                                        {(() => {
                                            const displayAch = [...achievements].reverse().find(a => a.unlocked) || achievements[0];
                                            return (
                                                <div 
                                                    key={displayAch.id} 
                                                    className={`p-4 md:p-5 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all border flex-1 text-center ${displayAch.unlocked ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-muted/10 border-border/50 opacity-60 grayscale'}`}
                                                >
                                                    <div className={`p-4 rounded-full flex items-center justify-center [&>svg]:w-10 [&>svg]:h-10 ${displayAch.unlocked ? 'bg-background shadow-md' : 'bg-muted'}`}>
                                                        {displayAch.icon}
                                                    </div>
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <div className={`text-lg font-bold ${displayAch.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>{displayAch.title}</div>
                                                        <div className="text-xs text-muted-foreground">{displayAch.desc}</div>
                                                    </div>
                                                    {displayAch.unlocked ? (
                                                        <div className="mt-1 w-full max-w-[160px] flex items-center justify-center bg-primary/20 text-primary text-xs font-bold px-4 py-2 rounded-2xl animate-in zoom-in">
                                                            Unlocked
                                                        </div>
                                                    ) : (
                                                        <div className="mt-1 w-full max-w-[160px] flex items-center justify-center bg-background/50 border border-border/50 text-muted-foreground text-xs font-bold px-4 py-2 rounded-2xl">
                                                            Locked
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
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
