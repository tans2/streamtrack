import crypto from 'crypto';
import type { Request, Response } from 'express';

/**
 * Guards privileged cron/admin endpoints.
 *
 * Two properties matter here:
 *  1. Fail CLOSED — an unset CRON_SECRET must never mean "no auth required".
 *     The previous `if (cronSecret && ...)` form skipped the check entirely
 *     when the env var was missing, which silently made these endpoints public.
 *  2. Constant-time comparison, so a caller can't recover the secret byte by
 *     byte from response-timing differences.
 *
 * Returns true when the caller is authorised. When it returns false it has
 * already written the response — callers should simply `return`.
 */
export function verifyCronSecret(req: Request, res: Response): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[Scout] CRON_SECRET is not configured — rejecting privileged request');
    res.status(503).json({ success: false, error: 'Service not configured' });
    return false;
  }

  const provided = Buffer.from(req.headers.authorization || '');
  const expected = Buffer.from(`Bearer ${cronSecret}`);

  // timingSafeEqual throws on length mismatch, so length is checked first.
  const authorised =
    provided.length === expected.length && crypto.timingSafeEqual(provided, expected);

  if (!authorised) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return false;
  }

  return true;
}
