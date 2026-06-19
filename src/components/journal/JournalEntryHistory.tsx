"use client";

import React from 'react';
import { Flame, Star, Trophy, BookOpen, Calendar } from 'lucide-react';
import { JournalEntry } from './useJournal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";

interface JournalEntryHistoryProps {
  pastEntries: JournalEntry[];
  selectedEntry: JournalEntry | null;
  setSelectedEntry: (entry: JournalEntry | null) => void;
  currentStreak: number;
  totalJournals: number;
}

export function JournalEntryHistory({
  pastEntries,
  selectedEntry,
  setSelectedEntry,
  currentStreak,
  totalJournals,
}: JournalEntryHistoryProps) {
  const achievements = [
    { id: 'first_step', title: 'First Step', desc: 'Log your first journal entry', icon: <BookOpen className="w-5 h-5 text-blue-400" />, unlocked: totalJournals >= 1 },
    { id: 'consistent', title: 'Consistent', desc: 'Reach a 3-day journaling streak', icon: <Flame className="w-5 h-5 text-orange-400" />, unlocked: currentStreak >= 3 },
    { id: 'devoted', title: 'Devoted', desc: 'Log 10 total journal entries', icon: <Star className="w-5 h-5 text-yellow-400" />, unlocked: totalJournals >= 10 },
    { id: 'scholar', title: 'Scholar', desc: 'Log 30 total journal entries', icon: <Trophy className="w-5 h-5 text-purple-400" />, unlocked: totalJournals >= 30 },
  ];

  return (
    <>
      {/* Gamification Stats */}
      <div className="flex-1 flex flex-col gap-6 w-full lg:w-auto">
        {/* Top Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div 
            className="p-6 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden" 
            style={{ 
              background: 'var(--glass-bg)', 
              backdropFilter: 'blur(20px)', 
              border: '1px solid var(--glass-border)', 
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)' 
            }}
          >
            <Flame className={`w-8 h-8 mb-2 ${currentStreak > 0 ? 'text-orange-500 animate-pulse' : 'text-muted-foreground opacity-50'}`} />
            <div className="text-3xl font-bold">{currentStreak}</div>
            <div className="text-sm text-muted-foreground font-medium uppercase tracking-widest mt-1">Day Streak</div>
          </div>
          
          <div 
            className="p-6 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden" 
            style={{ 
              background: 'var(--glass-bg)', 
              backdropFilter: 'blur(20px)', 
              border: '1px solid var(--glass-border)', 
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)' 
            }}
          >
            <Star className="w-8 h-8 mb-2 text-yellow-500" />
            <div className="text-3xl font-bold">{totalJournals}</div>
            <div className="text-sm text-muted-foreground font-medium uppercase tracking-widest mt-1">Total Entries</div>
          </div>
        </div>

        {/* Milestone Display */}
        <div 
          className="w-full flex-1 p-5 rounded-3xl flex flex-col" 
          style={{ 
            background: 'var(--glass-bg)', 
            backdropFilter: 'blur(20px)', 
            border: '1px solid var(--glass-border)', 
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)' 
          }}
        >
          <h4 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2 text-center w-full">
            <Trophy className="w-5 h-5 text-primary" /> Current Milestone
          </h4>
          <div className="flex-1 flex flex-col">
            {(() => {
              const displayAch = [...achievements].reverse().find(a => a.unlocked) || achievements[0];
              return (
                <div 
                  key={displayAch.id} 
                  className={`p-4 md:p-5 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all border flex-1 text-center ${
                    displayAch.unlocked 
                      ? 'bg-primary/5 border-primary/20 shadow-sm' 
                      : 'bg-muted/10 border-border/50 opacity-60 grayscale'
                  }`}
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
    </>
  );
}
