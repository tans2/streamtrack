import express from 'express';
import crypto from 'crypto';
import { authenticateToken } from './auth';
import { DatabaseService } from '../services/database';
import { EmailService } from '../services/email';
import { NotificationService } from '../services/notification';

const router = express.Router();

// Get user's notification preferences and email verification status
router.get('/preferences', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;

    // Get email verification status
    const emailStatus = await DatabaseService.getUserEmailStatus(userId);

    // Get user's notification preferences from user object
    const notificationPreferences = req.user.notification_preferences || {
      newEpisodes: true,
      seasonPremieres: true,
      friendActivity: false,
      weeklyDigest: false
    };

    res.json({
      success: true,
      data: {
        email: emailStatus?.email,
        emailVerified: emailStatus?.email_verified || false,
        verificationSentAt: emailStatus?.email_verification_sent_at,
        preferences: notificationPreferences
      }
    });
  } catch (error: any) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification preferences'
    });
  }
});

// Update global notification preferences
router.put('/preferences', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { newEpisodes, seasonPremieres, friendActivity, weeklyDigest } = req.body;

    // Build preferences object from provided values
    const preferences: any = {};
    if (newEpisodes !== undefined) preferences.newEpisodes = newEpisodes;
    if (seasonPremieres !== undefined) preferences.seasonPremieres = seasonPremieres;
    if (friendActivity !== undefined) preferences.friendActivity = friendActivity;
    if (weeklyDigest !== undefined) preferences.weeklyDigest = weeklyDigest;

    // Import AuthService to update preferences
    const { AuthService } = await import('../services/auth');

    const updatedUser = await AuthService.updatePreferences(userId, {
      notification_preferences: {
        ...req.user.notification_preferences,
        ...preferences
      }
    });

    res.json({
      success: true,
      data: {
        preferences: updatedUser?.notification_preferences
      }
    });
  } catch (error: any) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences'
    });
  }
});

// Toggle notifications for a specific show
router.put('/preferences/:showId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { showId } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'enabled must be a boolean value'
      });
    }

    const result = await DatabaseService.toggleShowNotifications(userId, showId, enabled);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Show not found in watchlist'
      });
    }

    res.json({
      success: true,
      data: {
        showId,
        notificationsEnabled: result.notifications_enabled
      }
    });
  } catch (error: any) {
    console.error('Error toggling show notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle show notifications'
    });
  }
});

// Send email verification
router.post('/verify-email', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const userName = req.user.name;

    // Check if already verified
    const emailStatus = await DatabaseService.getUserEmailStatus(userId);
    if (emailStatus?.email_verified) {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified'
      });
    }

    // Check rate limiting (don't send more than one verification email per 5 minutes)
    if (emailStatus?.email_verification_sent_at) {
      const sentAt = new Date(emailStatus.email_verification_sent_at);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (sentAt > fiveMinutesAgo) {
        return res.status(429).json({
          success: false,
          error: 'Verification email already sent recently. Please wait a few minutes before requesting another.'
        });
      }
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');

    // Save token to database
    await DatabaseService.setEmailVerificationToken(userId, token);

    // Send verification email
    const result = await EmailService.sendVerificationEmail(userEmail, userName, token);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to send verification email'
      });
    }

    res.json({
      success: true,
      message: 'Verification email sent! Please check your inbox.'
    });
  } catch (error: any) {
    console.error('Error sending verification email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send verification email'
    });
  }
});

// Verify email with token
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || token.length < 32) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification token'
      });
    }

    const result = await DatabaseService.verifyEmail(token);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: result.message
    });
  } catch (error: any) {
    console.error('Error verifying email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify email'
    });
  }
});

// Get user's notification history
router.get('/history', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const history = await DatabaseService.getUserNotificationHistory(userId, limit);

    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    console.error('Error getting notification history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification history'
    });
  }
});

// Manual trigger for polling (admin/testing only)
router.post('/poll', async (req, res) => {
  try {
    // Verify cron secret for manual triggers
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.authorization;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const batchSize = Math.min(parseInt(req.query.batch as string) || 30, 50);

    console.log('Manual poll trigger: polling episodes...');
    const results = await NotificationService.pollAndNotify(batchSize);

    res.json({
      success: true,
      data: results
    });
  } catch (error: any) {
    console.error('Error in manual poll:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to poll for episodes'
    });
  }
});

// Check a specific show for new episodes (for testing)
router.post('/check-show/:showId', authenticateToken, async (req: any, res) => {
  try {
    const { showId } = req.params;
    const { tmdbId } = req.body;

    if (!tmdbId) {
      return res.status(400).json({
        success: false,
        error: 'tmdbId is required'
      });
    }

    const result = await NotificationService.checkShowForNewEpisodes(showId, tmdbId);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error checking show for new episodes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check show for new episodes'
    });
  }
});

export default router;
