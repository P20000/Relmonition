"use client";

import { useState, useEffect } from 'react';
import { apiClient } from '../../../api-client';

export type JournalEntry = {
  id: string;
  userId: string;
  content: string;
  prompt: string | null;
  date: string | null;
  createdAt: string;
};

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface UseJournalProps {
  userId: string;
  tenantId: string | null;
}

export function useJournal({ userId, tenantId }: UseJournalProps) {
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

  // Streak calculation logic
  const totalJournals = pastEntries.length;
  let currentStreak = 0;
  let checkDate = new Date();
  let hasCheckedToday = false;

  while (true) {
    const checkYear = checkDate.getFullYear();
    const checkMonth = String(checkDate.getMonth() + 1).padStart(2, '0');
    const checkDay = String(checkDate.getDate()).padStart(2, '0');
    const dateStr = `${checkYear}-${checkMonth}-${checkDay}`;
    
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

      const todayStr = getLocalDateString();
      const alreadySubmitted = entriesData.some(e => e.userId === userId && e.date === todayStr);

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
    if (!yourAnswer.trim() || !headerData || !tenantId) return;

    try {
      setIsSubmitting(true);
      const todayStr = getLocalDateString();

      await apiClient.createJournalEntry({
        tenantId,
        userId,
        content: yourAnswer,
        date: todayStr
      });

      setYourAnswer('');
      setHasSubmitted(true);
      
      const updatedEntries = await apiClient.getJournalEntries(tenantId, userId);
      setPastEntries(updatedEntries);
    } catch (error: any) {
      console.error('Failed to submit entry:', error);
      alert(`Failed to save your reflection: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
  };
}
