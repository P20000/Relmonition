
/**
 * Utility for robust AI service calls with exponential backoff and jitter.
 * Designed to handle transient 503 (High Demand) and 429 (Rate Limit) errors.
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
};

export async function callWithRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts, initialDelayMs, maxDelayMs } = { ...DEFAULT_OPTIONS, ...options };
  
  const startTime = Date.now();
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts!; attempt++) {
    const attemptStartTime = Date.now();
    try {
      const result = await fn();
      const totalDuration = Date.now() - startTime;
      const attemptDuration = Date.now() - attemptStartTime;
      
      if (totalDuration > 1000) {
        console.log(`[AI Telemetry] Success after ${attempt} attempt(s). Total: ${totalDuration}ms (Last attempt: ${attemptDuration}ms)`);
      }
      return result;
    } catch (error: any) {
      lastError = error;
      const attemptDuration = Date.now() - attemptStartTime;
      
      // Check if the error is transient
      const isTransient = 
        error.status === 503 || 
        error.status === 429 || 
        error.message?.includes('503') || 
        error.message?.includes('429') ||
        error.message?.includes('high demand') ||
        error.message?.includes('timeout') ||
        error.status === 408;

      console.warn(`[AI Telemetry] Attempt ${attempt} failed after ${attemptDuration}ms: ${error.message?.split('\n')[0]}`);

      if (!isTransient || attempt === maxAttempts) {
        throw error;
      }

      const delay = Math.min(initialDelayMs! * Math.pow(2, attempt - 1), maxDelayMs!);
      const jitter = delay * 0.2 * (Math.random() * 2 - 1);
      const finalDelay = delay + jitter;

      console.warn(`[AI Utils] Retrying in ${Math.round(finalDelay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }
  
  throw lastError;
}
