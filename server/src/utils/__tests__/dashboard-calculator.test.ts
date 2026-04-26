import { describe, it, expect } from 'vitest';
import {
  calculateGottmanRatio,
  calculateEMA,
  calculateInteractionScore,
  calculateHealthScore,
  calculateTrend,
  DailyInteraction,
  DailyMood
} from '../dashboard-calculator';

describe('dashboard-calculator', () => {
  describe('calculateGottmanRatio', () => {
    it('handles zero negatives', () => {
      const interactions: DailyInteraction[] = [
        { date: new Date(), positiveCount: 10, negativeCount: 0, bidsCount: 0, repairsCount: 0, totalEntries: 10 }
      ];
      const result = calculateGottmanRatio(interactions);
      expect(result.ratio).toBe(10);
      expect(result.sampleWarning).toBe(true);
    });

    it('handles normal calculation with sample warning', () => {
      const interactions: DailyInteraction[] = [
        { date: new Date(), positiveCount: 10, negativeCount: 2, bidsCount: 0, repairsCount: 0, totalEntries: 12 }
      ];
      const result = calculateGottmanRatio(interactions);
      expect(result.ratio).toBe(5);
      expect(result.sampleWarning).toBe(true);
    });

    it('handles normal calculation without sample warning', () => {
      const interactions: DailyInteraction[] = [
        { date: new Date(), positiveCount: 15, negativeCount: 3, bidsCount: 0, repairsCount: 0, totalEntries: 18 }
      ];
      const result = calculateGottmanRatio(interactions);
      expect(result.ratio).toBe(5);
      expect(result.sampleWarning).toBeUndefined();
    });
  });

  describe('calculateEMA', () => {
    it('handles missing data', () => {
      const result = calculateEMA([]);
      expect(result.score).toBe(50);
      expect(result.moodSource).toBe('DEFAULT');
    });

    it('calculates EMA chronologically', () => {
      const moods: DailyMood[] = [
        { moodValue: 5, createdAt: new Date('2023-01-01') },
        { moodValue: 8, createdAt: new Date('2023-01-02') },
        { moodValue: 2, createdAt: new Date('2023-01-03') }
      ];
      // Formula:
      // Init: 5
      // Day 2: 0.3*8 + 0.7*5 = 2.4 + 3.5 = 5.9
      // Day 3: 0.3*2 + 0.7*5.9 = 0.6 + 4.13 = 4.73
      // Result scaled: round(4.73 * 10) = 47
      const result = calculateEMA(moods);
      expect(result.score).toBe(47);
    });
  });

  describe('calculateInteractionScore', () => {
    it('calculates correctly with zero data', () => {
      expect(calculateInteractionScore([])).toBe(50);
    });

    it('calculates with base, bids, and repairs', () => {
      const interactions: DailyInteraction[] = [
        { date: new Date(), positiveCount: 8, negativeCount: 2, bidsCount: 5, repairsCount: 2, totalEntries: 10 }
      ];
      // totalPos: 8, totalNeg: 2 => total: 10
      // baseRatio: 8/10 = 0.8
      // bidFactor: 5/10 = 0.5
      // repairFactor: 2/10 = 0.2
      // interactionScore: ((0.8*0.8) + (0.5*0.1) + (0.2*0.1))*100 = (0.64 + 0.05 + 0.02)*100 = 71
      expect(calculateInteractionScore(interactions)).toBeCloseTo(71);
    });
  });

  describe('calculateTrend', () => {
    it('returns INSUFFICIENT_DATA if older or latest half has < 3 entries', () => {
      const interactions = [
        { date: new Date('2023-01-01'), positiveCount: 1, negativeCount: 0, bidsCount: 0, repairsCount: 0, totalEntries: 1 },
        { date: new Date('2023-01-02'), positiveCount: 1, negativeCount: 0, bidsCount: 0, repairsCount: 0, totalEntries: 1 },
      ];
      const result = calculateTrend(interactions, []);
      expect(result.trendStatus).toBe('INSUFFICIENT_DATA');
      expect(result.trend).toBeNull();
    });

    it('calculates valid trend', () => {
      // Create 14 entries. Older half: 7, Latest half: 7
      const interactions = Array.from({ length: 14 }, (_, i) => ({
        date: new Date(`2023-01-${(i + 1).toString().padStart(2, '0')}`),
        positiveCount: i < 4 ? 5 : 8, // older has 5 pos, latest has 8 pos
        negativeCount: 1,
        bidsCount: 2,
        repairsCount: 1,
        totalEntries: 6
      }));
      const moods: DailyMood[] = Array.from({ length: 14 }, (_, i) => ({
        createdAt: new Date(`2023-01-${(i + 1).toString().padStart(2, '0')}`),
        moodValue: 7
      }));

      const result = calculateTrend(interactions, moods);
      expect(result.trend).toBeDefined();
      expect(result.trendStatus).toBeUndefined();
      expect(typeof result.trend).toBe('number');
    });
  });
});
