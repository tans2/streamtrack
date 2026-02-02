// Vercel Cron Function: Poll episodes for new releases
// Configured to run every 6 hours via vercel.json

import type { VercelRequest, VercelResponse } from '@vercel/node';

// We need to import the services after they're built
// In production, this will use the compiled JS
const getNotificationService = async () => {
  try {
    // Try to import from the compiled dist directory
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

  // In development, allow without secret. In production, require it.
  if (process.env.NODE_ENV === 'production' && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron request');
      return res.status(401).json({ error: 'Unauthorized' });
    }
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

    // Poll shows for new episodes (30 shows per batch)
    const results = await NotificationService.pollAndNotify(30);

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
