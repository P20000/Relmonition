"use client";

import React from 'react';
import { Sparkles, Calendar } from 'lucide-react';
import { useJournal } from './journal/useJournal';
import { CalendarView } from './journal/CalendarView';
import { JournalPromptCard } from './journal/JournalPromptCard';
import { JournalEntryHistory } from './journal/JournalEntryHistory';

type JournalProps = {
  userId: string;
  tenantId: string | null;
};

export function Journal({ userId, tenantId }: JournalProps) {
  const {
    yourAnswer,
    setYourAnswer,
    hasSubmitted,
    headerData,
    pastEntries,
    selectedEntry,
    setSelectedEntry,
    loadingHeader,
    loadingEntries,
    isSubmitting,
    currentMonth,
    prevMonth,
    nextMonth,
    days,
    blanks,
    trailingBlanks,
    year,
    month,
    formatDate,
    entriesByDate,
    totalJournals,
    currentStreak,
    handleSubmit,
    getLocalDateString,
  } = useJournal({ userId, tenantId });

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Sparkles className="w-8 h-8 text-primary" aria-hidden="true" />
            <h1 className="leading-none">Daily Reflection</h1>
          </div>
          <p className="text-muted-foreground">
            Your private space for reflection and AI-powered growth
          </p>
        </header>

        {/* Today's Prompt Card */}
        <JournalPromptCard 
          loadingHeader={loadingHeader}
          headerData={headerData}
          yourAnswer={yourAnswer}
          setYourAnswer={setYourAnswer}
          isSubmitting={isSubmitting}
          hasSubmitted={hasSubmitted}
          handleSubmit={handleSubmit}
        />

        {/* Previous Entries Section */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="text-xl leading-none">Reflection History</h3>
            </div>
          </div>

          {loadingEntries ? (
            <div className="flex items-center justify-center h-64 bg-muted/20 rounded-3xl animate-pulse" />
          ) : (
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              {/* Left: Calendar View */}
              <CalendarView 
                currentMonth={currentMonth}
                prevMonth={prevMonth}
                nextMonth={nextMonth}
                blanks={blanks}
                days={days}
                trailingBlanks={trailingBlanks}
                year={year}
                month={month}
                formatDate={formatDate}
                entriesByDate={entriesByDate}
                getLocalDateString={getLocalDateString}
                setSelectedEntry={setSelectedEntry}
              />
              
              {/* Right: Gamification Stats & Entry Modals */}
              <JournalEntryHistory 
                pastEntries={pastEntries}
                selectedEntry={selectedEntry}
                setSelectedEntry={setSelectedEntry}
                currentStreak={currentStreak}
                totalJournals={totalJournals}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
