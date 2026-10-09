// Vercel Cron Function: Poll episodes for new releases
// Configured to run every 6 hours via vercel.json

import crypto from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Fail closed: an unset CRON_SECRET must not make this endpoint public.
// Compared in constant time so the secret can't be recovered via timing.
function isAuthorisedCron(req: VercelRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const provided = Buffer.from(req.headers.authorization || '');
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
}

// We need to import the services after they're built
// In production, this will use the compiled JS
const getNotificationService = async () => {
  try {
    // Try to import from the compiled dist directory
    // @ts-ignore - compiled at build time; types not available during Vercel build
    const { NotificationService } = await import('../../dist/services/notification.js');
    return NotificationService;
  } catch (error) {
    console.error('Failed to import NotificationService:', error);
    return null;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify the cron secret to prevent unauthorized access
  if (!isAuthorisedCron(req)) {
    console.error('Unauthorized cron request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('Starting episode polling cron job...');
  const startTime = Date.now();

  try {
    const NotificationService = await getNotificationService();

    if (!NotificationService) {
      return res.status(500).json({
        error: 'NotificationService not available',
        message: 'The notification service could not be loaded'
      });
    }

    // Poll shows for new episodes and queue events for daily digest (30 shows per batch)
    const results = await NotificationService.pollAndDetect(30);

    const duration = Date.now() - startTime;

    console.log('Episode polling completed:', {
      duration: `${duration}ms`,
      ...results
    });

    return res.status(200).json({
      success: true,
      duration: `${duration}ms`,
      results
    });

  } catch (error: any) {
    console.error('Error in episode polling cron:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error occurred'
    });
  }
}
