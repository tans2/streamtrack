import { DatabaseService } from './database';

export interface ProgressSyncData {
  userId: string;
  showId: string;
  platform: 'netflix' | 'hulu' | 'disney' | 'prime' | 'hbo';
  currentSeason: number;
  currentEpisode: number;
  lastWatched: string;
  notes?: string;
}

export class ProgressSyncService {
  // Sync progress from a specific platform
  static async syncFromPlatform(data: ProgressSyncData) {
    try {
      console.log(`Syncing progress from ${data.platform} for user ${data.userId}`);
      
      // Update the user's show progress
      const result = await DatabaseService.updateShowStatus(data.userId, data.showId, {
        status: 'watching',
        currentSeason: data.currentSeason,
        currentEpisode: data.currentEpisode,
        notes: data.notes
      });

      if (result) {
        // Log the sync for analytics
        await this.logSyncEvent(data);
        return { success: true, data: result };
      }

      return { success: false, error: 'Failed to update progress' };
    } catch (error) {
      console.error('Error syncing progress:', error);
      return { success: false, error: 'Sync failed' };
    }
  }

  // Bulk sync progress for multiple shows
  static async bulkSyncFromPlatform(userId: string, platform: string, shows: ProgressSyncData[]) {
    try {
      console.log(`Bulk syncing ${shows.length} shows from ${platform} for user ${userId}`);
      
      const results = await Promise.allSettled(
        shows.map(show => this.syncFromPlatform({ ...show, userId, platform: platform as any }))
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;

      return {
        success: true,
        data: {
          total: shows.length,
          successful,
          failed,
          results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: 'Unknown error' })
        }
      };
    } catch (error) {
      console.error('Error bulk syncing progress:', error);
      return { success: false, error: 'Bulk sync failed' };
    }
  }

  // Get sync history for a user
  static async getSyncHistory(userId: string, platform?: string) {
    try {
      // This would query a sync_logs table in a real implementation
      // For now, return mock data
      return {
        success: true,
        data: [
          {
            id: '1',
            platform: 'netflix',
            showsUpdated: 5,
            syncedAt: new Date().toISOString(),
            status: 'success'
          },
          {
            id: '2',
            platform: 'hulu',
            showsUpdated: 3,
            syncedAt: new Date(Date.now() - 86400000).toISOString(),
            status: 'success'
          }
        ]
      };
    } catch (error) {
      console.error('Error getting sync history:', error);
      return { success: false, error: 'Failed to get sync history' };
    }
  }

  // Log sync events for analytics
  private static async logSyncEvent(data: ProgressSyncData) {
    try {
      // In a real implementation, this would log to a sync_logs table
      console.log(`Sync event logged: ${data.platform} - ${data.showId} - S${data.currentSeason}E${data.currentEpisode}`);
    } catch (error) {
      console.error('Error logging sync event:', error);
    }
  }

  // Get platform-specific sync instructions
  static getPlatformInstructions(platform: string) {
    const instructions = {
      netflix: {
        title: 'Netflix Sync Instructions',
        steps: [
          '1. Go to your Netflix viewing activity',
          '2. Find the show you want to sync',
          '3. Note the current season and episode',
          '4. Enter the details in our app',
          '5. Click "Sync Progress"'
        ],
        note: 'Netflix doesn\'t provide API access, so manual input is required.'
      },
      hulu: {
        title: 'Hulu Sync Instructions',
        steps: [
          '1. Go to your Hulu watchlist',
          '2. Find the show you want to sync',
          '3. Note the current season and episode',
          '4. Enter the details in our app',
          '5. Click "Sync Progress"'
        ],
        note: 'Hulu doesn\'t provide API access, so manual input is required.'
      },
      disney: {
        title: 'Disney+ Sync Instructions',
        steps: [
          '1. Go to your Disney+ continue watching',
          '2. Find the show you want to sync',
          '3. Note the current season and episode',
          '4. Enter the details in our app',
          '5. Click "Sync Progress"'
        ],
        note: 'Disney+ doesn\'t provide API access, so manual input is required.'
      },
      prime: {
        title: 'Prime Video Sync Instructions',
        steps: [
          '1. Go to your Prime Video watchlist',
          '2. Find the show you want to sync',
          '3. Note the current season and episode',
          '4. Enter the details in our app',
          '5. Click "Sync Progress"'
        ],
        note: 'Prime Video doesn\'t provide API access, so manual input is required.'
      },
      hbo: {
        title: 'HBO Max Sync Instructions',
        steps: [
          '1. Go to your HBO Max continue watching',
          '2. Find the show you want to sync',
          '3. Note the current season and episode',
          '4. Enter the details in our app',
          '5. Click "Sync Progress"'
        ],
        note: 'HBO Max doesn\'t provide API access, so manual input is required.'
      }
    };

    return instructions[platform as keyof typeof instructions] || {
      title: 'Platform Sync Instructions',
      steps: ['Manual input required for this platform'],
      note: 'This platform doesn\'t provide API access.'
    };
  }
}

export default ProgressSyncService;

