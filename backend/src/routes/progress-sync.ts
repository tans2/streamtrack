import express from 'express';
import { ProgressSyncService } from '../services/progress-sync';
import { authenticateToken } from './auth';

const router = express.Router();

// ===== PROGRESS SYNC ROUTES =====

// Sync progress from a specific platform
router.post('/sync', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { showId, platform, currentSeason, currentEpisode, lastWatched, notes } = req.body;
    
    if (!showId || !platform || !currentSeason || !currentEpisode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: showId, platform, currentSeason, currentEpisode'
      });
    }

    const syncData = {
      userId,
      showId,
      platform: platform.toLowerCase(),
      currentSeason: parseInt(currentSeason),
      currentEpisode: parseInt(currentEpisode),
      lastWatched: lastWatched || new Date().toISOString(),
      notes
    };

    const result = await ProgressSyncService.syncFromPlatform(syncData);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: 'Progress synced successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error syncing progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync progress'
    });
  }
});

// Bulk sync progress from a platform
router.post('/bulk-sync', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { platform, shows } = req.body;
    
    if (!platform || !Array.isArray(shows) || shows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: platform, shows array'
      });
    }

    const result = await ProgressSyncService.bulkSyncFromPlatform(userId, platform, shows);
    
    res.json({
      success: true,
      data: result.data,
      message: `Bulk sync completed: ${result.data?.successful || 0}/${result.data?.total || 0} shows synced`
    });
  } catch (error) {
    console.error('Error bulk syncing progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk sync progress'
    });
  }
});

// Get sync history for a user
router.get('/history', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { platform } = req.query;
    
    const result = await ProgressSyncService.getSyncHistory(userId, platform);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error getting sync history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync history'
    });
  }
});

// Get platform-specific sync instructions
router.get('/instructions/:platform', authenticateToken, async (req: any, res) => {
  try {
    const { platform } = req.params;
    
    const instructions = ProgressSyncService.getPlatformInstructions(platform);
    
    res.json({
      success: true,
      data: instructions
    });
  } catch (error) {
    console.error('Error getting platform instructions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get platform instructions'
    });
  }
});

// Get available platforms for sync
router.get('/platforms', authenticateToken, async (req: any, res) => {
  try {
    const platforms = [
      {
        id: 'netflix',
        name: 'Netflix',
        color: '#E50914',
        icon: '📺',
        hasOAuth: false,
        requiresManualInput: true
      },
      {
        id: 'hulu',
        name: 'Hulu',
        color: '#1CE783',
        icon: '🎬',
        hasOAuth: false,
        requiresManualInput: true
      },
      {
        id: 'disney',
        name: 'Disney+',
        color: '#113CCF',
        icon: '🏰',
        hasOAuth: false,
        requiresManualInput: true
      },
      {
        id: 'prime',
        name: 'Prime Video',
        color: '#00A8E1',
        icon: '📦',
        hasOAuth: false,
        requiresManualInput: true
      },
      {
        id: 'hbo',
        name: 'HBO Max',
        color: '#8B5CF6',
        icon: '🎭',
        hasOAuth: false,
        requiresManualInput: true
      }
    ];
    
    res.json({
      success: true,
      data: platforms
    });
  } catch (error) {
    console.error('Error getting platforms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get platforms'
    });
  }
});

export default router;
