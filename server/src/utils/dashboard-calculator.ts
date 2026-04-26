export interface DailyInteraction {
  date: Date;
  positiveCount: number;
  negativeCount: number;
  bidsCount: number;
  repairsCount: number;
  totalEntries: number;
}

export interface DailyMood {
  moodValue: number;
  createdAt: Date;
}

export interface GottmanRatioResult {
  ratio: number;
  sampleWarning?: boolean;
}

export interface TrendResult {
  trend: number | null;
  trendStatus?: 'INSUFFICIENT_DATA';
}

/**
 * Calculates Gottman Ratio over a window of interactions.
 * Core Formula: TotalPositive / max(1, TotalNegative)
 */
export function calculateGottmanRatio(interactions: DailyInteraction[]): GottmanRatioResult {
  const totalPositive = interactions.reduce((sum, i) => sum + (i.positiveCount || 0), 0);
  const totalNegative = interactions.reduce((sum, i) => sum + (i.negativeCount || 0), 0);
  
  const sampleWarning = totalNegative < 3;
  
  let ratio: number;
  if (totalNegative === 0) {
    ratio = totalPositive;
  } else {
    ratio = Number((totalPositive / Math.max(1, totalNegative)).toFixed(1));
  }
  
  return sampleWarning ? { ratio, sampleWarning: true } : { ratio };
}

/**
 * 7-day Exponential Moving Average of mood logs
 */
export function calculateEMA(moods: DailyMood[]): { score: number, moodSource?: 'DEFAULT' } {
  if (!moods || moods.length === 0) {
    return { score: 50, moodSource: 'DEFAULT' }; // Fallback to 5 (neutral) scaled to 100
  }
  
  // Sort chronologically (oldest first)
  const sortedMoods = [...moods].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  
  const alpha = 0.3;
  let ema = sortedMoods[0].moodValue; // Initialize EMA with first value
  
  for (let i = 1; i < sortedMoods.length; i++) {
    ema = (alpha * sortedMoods[i].moodValue) + ((1 - alpha) * ema);
  }
  
  return { score: Math.round(ema * 10) };
}

/**
 * Calculates interaction score incorporating bids and repairs.
 */
export function calculateInteractionScore(interactions: DailyInteraction[]): number {
  const totalPositive = interactions.reduce((sum, i) => sum + (i.positiveCount || 0), 0);
  const totalNegative = interactions.reduce((sum, i) => sum + (i.negativeCount || 0), 0);
  const totalBids = interactions.reduce((sum, i) => sum + (i.bidsCount || 0), 0);
  const totalRepairs = interactions.reduce((sum, i) => sum + (i.repairsCount || 0), 0);
  
  const totalInteractions = totalPositive + totalNegative;
  
  if (totalInteractions === 0) {
    return 50;
  }
  
  const baseRatio = totalPositive / Math.max(1, totalInteractions);
  const bidFactor = totalBids / Math.max(1, totalInteractions);
  const repairFactor = totalRepairs / Math.max(1, totalInteractions);
  
  const rawScore = ((baseRatio * 0.8) + (bidFactor * 0.1) + (repairFactor * 0.1)) * 100;
  return Math.min(100, rawScore);
}

/**
 * Final connection health score calculation
 */
export function calculateHealthScore(interactions: DailyInteraction[], moods: DailyMood[]): number {
  const interactionScore = calculateInteractionScore(interactions);
  const moodResult = calculateEMA(moods);
  
  const finalScore = Math.round((interactionScore * 0.7) + (moodResult.score * 0.3));
  return Math.min(100, finalScore);
}

/**
 * Calculates trend over two 7-day halves.
 */
export function calculateTrend(interactions: DailyInteraction[], moods: DailyMood[]): TrendResult {
  // Sort interactions chronologically
  const sortedInteractions = [...interactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Determine midpoint (assuming max 14 days, split into 7)
  const olderHalf = sortedInteractions.slice(0, 7);
  const latestHalf = sortedInteractions.slice(-7);
  
  if (olderHalf.length < 3 || latestHalf.length < 3) {
    return { trend: null, trendStatus: 'INSUFFICIENT_DATA' };
  }
  
  // We should split moods into older and latest halves based on the dates of the interactions
  // Or simply rely on the date ranges.
  // The simplest is to split moods by the midpoint date of interactions
  const midpointDate = latestHalf[0].date;
  const olderMoods = moods.filter(m => new Date(m.createdAt) < new Date(midpointDate));
  const latestMoods = moods.filter(m => new Date(m.createdAt) >= new Date(midpointDate));
  
  const olderScore = calculateHealthScore(olderHalf, olderMoods);
  const latestScore = calculateHealthScore(latestHalf, latestMoods);
  
  return { trend: latestScore - olderScore };
}
