// Vercel Cron Function: Send daily digest emails
// Triggered by GitHub Actions daily at 1pm UTC (8am EST)

import type { VercelRequest, VercelResponse } from '@vercel/node';

const getNotificationService = async () => {
  try {
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
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;

  if (process.env.NODE_ENV === 'production' && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron request');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  console.log('Starting daily digest cron job...');
  const startTime = Date.now();

  try {
    const NotificationService = await getNotificationService();

    if (!NotificationService) {
      return res.status(500).json({
        error: 'NotificationService not available',
        message: 'The notification service could not be loaded'
      });
    }

    const results = await NotificationService.sendDailyDigests();

    const duration = Date.now() - startTime;

    console.log('Daily digest completed:', {
      duration: `${duration}ms`,
      ...results
    });

    return res.status(200).json({
      success: true,
      duration: `${duration}ms`,
      results
    });

  } catch (error: any) {
    console.error('Error in daily digest cron:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error occurred'
    });
  }
}
