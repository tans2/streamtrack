import express from 'express';
import { HuluService } from '../services/hulu';
import { authenticateToken } from './auth';

const router = express.Router();

// ===== HULU INTEGRATION ROUTES =====

// Initiate Hulu OAuth flow
router.post('/auth/initiate', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`Initiating Hulu auth for user ${userId}`);
    
    const { authUrl, state } = await HuluService.initiateAuth(userId);
    
    res.json({
      success: true,
      data: {
        authUrl,
        state
      }
    });
  } catch (error) {
    console.error('Error initiating Hulu auth:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initiate Hulu authentication' 
    });
  }
});

// Handle Hulu OAuth callback
router.post('/auth/callback', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { authCode, state } = req.body;
    
    if (!authCode || !state) {
      return res.status(400).json({
        success: false,
        error: 'Missing auth code or state'
      });
    }
    
    console.log(`Handling Hulu callback for user ${userId}`);
    
    const userProfile = await HuluService.getUserProfile(authCode, state);
    
    res.json({
      success: true,
      data: {
        user: userProfile,
        message: 'Hulu account connected successfully'
      }
    });
  } catch (error) {
    console.error('Error handling Hulu callback:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to connect Hulu account' 
    });
  }
});

// Get user's Hulu profile
router.get('/profile', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`Getting Hulu profile for user ${userId}`);
    
    // In a real implementation, this would fetch from database
    const profile = {
      id: `hulu_${userId}`,
      email: `user${userId}@hulu.com`,
      displayName: 'Hulu User',
      profileName: 'Main Profile',
      connectedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
      isActive: true
    };
    
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error getting Hulu profile:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get Hulu profile' 
    });
  }
});

// Sync episode progress for a show
router.post('/sync-progress', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { tmdbId, currentSeason, currentEpisode } = req.body;
    
    if (!tmdbId || !currentSeason || !currentEpisode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: tmdbId, currentSeason, currentEpisode'
      });
    }
    
    console.log(`Syncing Hulu progress for user ${userId}, show ${tmdbId}`);
    
    const progress = await HuluService.syncProgress(userId, tmdbId, currentSeason, currentEpisode);
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'Show not available on Hulu or sync failed'
      });
    }
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error syncing Hulu progress:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to sync Hulu progress' 
    });
  }
});

// Get user's Hulu watchlist
router.get('/watchlist', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`Getting Hulu watchlist for user ${userId}`);
    
    const watchlist = await HuluService.getUserWatchlist(userId);
    
    res.json({
      success: true,
      data: watchlist
    });
  } catch (error) {
    console.error('Error getting Hulu watchlist:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get Hulu watchlist' 
    });
  }
});

// Check if a show is available on Hulu
router.get('/availability/:tmdbId', async (req: any, res) => {
  try {
    const { tmdbId } = req.params;
    const { country = 'US' } = req.query;
    
    console.log(`Checking Hulu availability for TMDB ID: ${tmdbId}`);
    
    const isAvailable = await HuluService.isShowAvailable(parseInt(tmdbId), country);
    
    res.json({
      success: true,
      data: {
        tmdbId: parseInt(tmdbId),
        isAvailable,
        country
      }
    });
  } catch (error) {
    console.error('Error checking Hulu availability:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check Hulu availability' 
    });
  }
});

// Get next episode release date
router.get('/next-episode/:tmdbId', async (req: any, res) => {
  try {
    const { tmdbId } = req.params;
    const { season, episode } = req.query;
    
    if (!season || !episode) {
      return res.status(400).json({
        success: false,
        error: 'Missing season or episode parameters'
      });
    }
    
    console.log(`Getting next episode date for TMDB ${tmdbId}, S${season}E${episode}`);
    
    const nextEpisodeDate = await HuluService.getNextEpisodeDate(
      parseInt(tmdbId), 
      parseInt(season), 
      parseInt(episode)
    );
    
    res.json({
      success: true,
      data: {
        tmdbId: parseInt(tmdbId),
        currentSeason: parseInt(season),
        currentEpisode: parseInt(episode),
        nextEpisodeDate
      }
    });
  } catch (error) {
    console.error('Error getting next episode date:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get next episode date' 
    });
  }
});

// Disconnect Hulu account
router.delete('/disconnect', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`Disconnecting Hulu account for user ${userId}`);
    
    const success = await HuluService.disconnectAccount(userId);
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to disconnect Hulu account'
      });
    }
    
    res.json({
      success: true,
      message: 'Hulu account disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting Hulu account:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to disconnect Hulu account' 
    });
  }
});

// Get API usage status
router.get('/api-status', authenticateToken, async (req: any, res) => {
  try {
    const remainingCalls = HuluService.getRemainingApiCalls();
    
    res.json({
      success: true,
      data: {
        remainingCalls,
        dailyLimit: 1000,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting API status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get API status'
    });
  }
});

export default router;
