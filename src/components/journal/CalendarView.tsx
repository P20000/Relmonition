"use client";

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { JournalEntry } from './useJournal';

interface CalendarViewProps {
  currentMonth: Date;
  prevMonth: () => void;
  nextMonth: () => void;
  blanks: any[];
  days: number[];
  trailingBlanks: any[];
  year: number;
  month: number;
  formatDate: (y: number, m: number, d: number) => string;
  entriesByDate: Record<string, JournalEntry>;
  getLocalDateString: () => string;
  setSelectedEntry: (entry: JournalEntry) => void;
}

export function CalendarView({
  currentMonth,
  prevMonth,
  nextMonth,
  blanks,
  days,
  trailingBlanks,
  year,
  month,
  formatDate,
  entriesByDate,
  getLocalDateString,
  setSelectedEntry,
}: CalendarViewProps) {
  return (
    <div 
      className="flex-1 p-4 md:p-8 rounded-3xl lg:max-w-xl w-full" 
      style={{ 
        background: 'var(--glass-bg)', 
        backdropFilter: 'blur(20px)', 
        border: '1px solid var(--glass-border)', 
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' 
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-xl font-semibold">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h4>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth} 
            className="p-2 rounded-full hover:bg-muted/50 transition-colors border border-border/50 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={nextMonth} 
            className="p-2 rounded-full hover:bg-muted/50 transition-colors border border-border/50 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 md:gap-4 mb-4 text-center text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="opacity-70">{d}</div>
        ))}
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
          );
        })}
        {trailingBlanks.map((_, i) => (
          <div key={`trailing-${i}`} className="aspect-square rounded-xl md:rounded-2xl bg-transparent" />
        ))}
      </div>
    </div>
  );
}
