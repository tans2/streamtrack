import express from 'express';
import { NetflixService } from '../services/netflix';
import { authenticateToken } from './auth';

const router = express.Router();

// ===== NETFLIX INTEGRATION ROUTES =====

// Initiate Netflix OAuth flow
router.post('/auth/initiate', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`Initiating Netflix auth for user ${userId}`);
    
    const { authUrl, state } = await NetflixService.initiateAuth(userId);
    
    res.json({
      success: true,
      data: {
        authUrl,
        state
      }
    });
  } catch (error) {
    console.error('Error initiating Netflix auth:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initiate Netflix authentication' 
    });
  }
});

// Handle Netflix OAuth callback
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
    
    console.log(`Handling Netflix callback for user ${userId}`);
    
    const userProfile = await NetflixService.getUserProfile(authCode, state);
    
    // In a real implementation, you would save this to the database
    // For now, we'll just return the profile
    
    res.json({
      success: true,
      data: {
        user: userProfile,
        message: 'Netflix account connected successfully'
      }
    });
  } catch (error) {
    console.error('Error handling Netflix callback:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to connect Netflix account' 
    });
  }
});

// Get user's Netflix profile
router.get('/profile', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`Getting Netflix profile for user ${userId}`);
    
    // In a real implementation, this would fetch from database
    const profile = {
      id: `netflix_${userId}`,
      email: `user${userId}@netflix.com`,
      displayName: 'Netflix User',
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
    console.error('Error getting Netflix profile:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get Netflix profile' 
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
    
    console.log(`Syncing Netflix progress for user ${userId}, show ${tmdbId}`);
    
    const progress = await NetflixService.syncProgress(userId, tmdbId, currentSeason, currentEpisode);
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'Show not available on Netflix or sync failed'
      });
    }
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error syncing Netflix progress:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to sync Netflix progress' 
    });
  }
});

// Get user's Netflix watchlist
router.get('/watchlist', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`Getting Netflix watchlist for user ${userId}`);
    
    const watchlist = await NetflixService.getUserWatchlist(userId);
    
    res.json({
      success: true,
      data: watchlist
    });
  } catch (error) {
    console.error('Error getting Netflix watchlist:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get Netflix watchlist' 
    });
  }
});

// Check if a show is available on Netflix
router.get('/availability/:tmdbId', async (req: any, res) => {
  try {
    const { tmdbId } = req.params;
    const { country = 'US' } = req.query;
    
    console.log(`Checking Netflix availability for TMDB ID: ${tmdbId}`);
    
    const isAvailable = await NetflixService.isShowAvailable(parseInt(tmdbId), country);
    
    res.json({
      success: true,
      data: {
        tmdbId: parseInt(tmdbId),
        isAvailable,
        country
      }
    });
  } catch (error) {
    console.error('Error checking Netflix availability:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check Netflix availability' 
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
    
    const nextEpisodeDate = await NetflixService.getNextEpisodeDate(
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

// Disconnect Netflix account
router.delete('/disconnect', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`Disconnecting Netflix account for user ${userId}`);
    
    const success = await NetflixService.disconnectAccount(userId);
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to disconnect Netflix account'
      });
    }
    
    res.json({
      success: true,
      message: 'Netflix account disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting Netflix account:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to disconnect Netflix account' 
    });
  }
});

// Get API usage status
router.get('/api-status', authenticateToken, async (req: any, res) => {
  try {
    const remainingCalls = NetflixService.getRemainingApiCalls();
    
    res.json({
      success: true,
      data: {
        remainingCalls,
        dailyLimit: 99,
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
