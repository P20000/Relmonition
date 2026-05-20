import { CookieOptions } from 'express';

export interface CookieConfigOptions {
  isProduction: boolean;
  cookieDomain?: string; // e.g., '.relmonition.com'
}

/**
 * Generates secure cookie options for auth tokens.
 * Compatible with Next.js (localhost:3000) ↔ Express (localhost:3001) dev flow.
 */
export const getAuthCookieConfig = (
  options: CookieConfigOptions,
  maxAgeMs: number
): CookieOptions => {
  const { isProduction, cookieDomain } = options;
  
  return {
    httpOnly: true,
    secure: isProduction, // Requires HTTPS in prod; false for localhost dev
    sameSite: isProduction ? 'strict' : 'lax', // 'lax' allows cross-port localhost
    maxAge: maxAgeMs,
    path: '/',
    domain: isProduction 
      ? cookieDomain || '.relmonition.com' 
      : undefined, // localhost doesn't need domain; cookies work across ports
  };
};

/**
 * Cookie TTL constants
 */
export const COOKIE_TTL = {
  ACCESS: 7 * 24 * 60 * 60 * 1000, // 7 days matching original session lifespan
} as const;
