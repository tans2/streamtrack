import { DatabaseService } from './database';
import { TMDBService } from './tmdb';
import { EmailService } from './email';

interface Episode {
  season_number: number;
  episode_number: number;
  title?: string;
  air_date?: string;
}

interface NewEpisodeDetection {
  showId: string;
  tmdbId: number;
  showTitle: string;
  posterPath: string | null;
  newEpisodes: Episode[];
  isNewSeason: boolean;
  newSeasonNumber?: number;
}

export class NotificationService {
  // Main entry point: poll shows and send notifications
  static async pollAndNotify(batchSize: number = 30): Promise<{
    showsPolled: number;
    newEpisodesFound: number;
    notificationsSent: number;
    errors: string[];
  }> {
    const results = {
      showsPolled: 0,
      newEpisodesFound: 0,
      notificationsSent: 0,
      errors: [] as string[]
    };

    try {
      // Get shows that are due for polling
      const showsDueForPolling = await DatabaseService.getShowsDueForPolling(batchSize);

      if (showsDueForPolling.length === 0) {
        // No shows with poll status, initialize for tracked shows
        const trackedShows = await DatabaseService.getTrackedShows();
        console.log(`Initializing poll status for ${trackedShows.length} tracked shows`);

        for (const show of trackedShows.slice(0, batchSize)) {
          await DatabaseService.initializePollStatus(show.id, show.tmdb_id);
        }

        // Re-fetch after initialization
        const newShowsDue = await DatabaseService.getShowsDueForPolling(batchSize);
        if (newShowsDue.length === 0) {
          console.log('No shows to poll');
          return results;
        }
        showsDueForPolling.push(...newShowsDue);
      }

      console.log(`Polling ${showsDueForPolling.length} shows for new episodes`);

      for (const pollStatus of showsDueForPolling) {
        const show = pollStatus.shows as any;
        if (!show) continue;

        try {
          results.showsPolled++;

          // Detect new episodes for this show
          const detection = await this.detectNewEpisodes(
            show.id,
            show.tmdb_id,
            show.title,
            pollStatus.last_known_season || 0,
            pollStatus.last_known_episode || 0
          );

          if (detection && detection.newEpisodes.length > 0) {
            results.newEpisodesFound += detection.newEpisodes.length;
            console.log(`Found ${detection.newEpisodes.length} new episodes for ${show.title}`);

            // Send notifications to users tracking this show
            const sentCount = await this.sendNotificationsForShow(detection);
            results.notificationsSent += sentCount;
          }

          // Update poll status with latest known episode
          const latestEpisode = detection?.newEpisodes[detection.newEpisodes.length - 1];
          await DatabaseService.updatePollStatus(
            show.id,
            latestEpisode?.season_number || pollStatus.last_known_season || 0,
            latestEpisode?.episode_number || pollStatus.last_known_episode || 0
          );

        } catch (error: any) {
          const errorMsg = `Error polling ${show.title}: ${error.message}`;
          console.error(errorMsg);
          results.errors.push(errorMsg);

          // Update poll status with error
          await DatabaseService.updatePollStatus(
            show.id,
            pollStatus.last_known_season || 0,
            pollStatus.last_known_episode || 0,
            error.message
          );
        }

        // Rate limiting: small delay between TMDB requests
        await this.delay(250);
      }

    } catch (error: any) {
      console.error('Error in pollAndNotify:', error);
      results.errors.push(error.message);
    }

    return results;
  }

  // Detect new episodes for a show by comparing TMDB data with cache
  static async detectNewEpisodes(
    showId: string,
    tmdbId: number,
    showTitle: string,
    lastKnownSeason: number,
    lastKnownEpisode: number
  ): Promise<NewEpisodeDetection | null> {
    try {
      // Get show details from TMDB to get total seasons
      const showDetails = await TMDBService.getShowDetails(tmdbId);
      if (!showDetails) {
        console.log(`Could not fetch details for show ${tmdbId}`);
        return null;
      }

      const totalSeasons = showDetails.number_of_seasons || 0;
      const newEpisodes: Episode[] = [];
      let isNewSeason = false;
      let newSeasonNumber: number | undefined;

      // Check if there's a new season
      if (totalSeasons > lastKnownSeason) {
        isNewSeason = true;
        newSeasonNumber = totalSeasons;
      }

      // Fetch episodes for relevant seasons (last known + any new)
      const seasonsToCheck = [];
      if (lastKnownSeason > 0) {
        seasonsToCheck.push(lastKnownSeason);
      }
      if (isNewSeason && newSeasonNumber) {
        seasonsToCheck.push(newSeasonNumber);
      }
      // Always check the latest season if not already included
      if (!seasonsToCheck.includes(totalSeasons) && totalSeasons > 0) {
        seasonsToCheck.push(totalSeasons);
      }

      // Get cached episodes
      const cachedEpisodes = await DatabaseService.getEpisodeCache(showId);
      const cachedKeys = new Set(
        cachedEpisodes.map(e => `${e.season_number}-${e.episode_number}`)
      );

      // Fetch and compare episodes from TMDB
      const episodesToCache: any[] = [];

      for (const seasonNum of seasonsToCheck) {
        const seasonData = await TMDBService.getShowSeasons(tmdbId, seasonNum);
        if (!seasonData || !seasonData.episodes) continue;

        for (const episode of seasonData.episodes) {
          const key = `${seasonNum}-${episode.episode_number}`;

          // Prepare for caching
          episodesToCache.push({
            show_id: showId,
            tmdb_id: tmdbId,
            season_number: seasonNum,
            episode_number: episode.episode_number,
            title: episode.title,
            air_date: episode.air_date
          });

          // Check if this is a new episode
          if (!cachedKeys.has(key)) {
            // Only notify about episodes that have aired (or will air today)
            const airDate = episode.air_date ? new Date(episode.air_date) : null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (airDate && airDate <= today) {
              // This is a newly detected aired episode
              if (seasonNum > lastKnownSeason ||
                  (seasonNum === lastKnownSeason && episode.episode_number > lastKnownEpisode)) {
                newEpisodes.push({
                  season_number: seasonNum,
                  episode_number: episode.episode_number,
                  title: episode.title,
                  air_date: episode.air_date
                });
              }
            }
          }
        }

        // Rate limit between season fetches
        await this.delay(100);
      }

      // Cache all episodes we found
      if (episodesToCache.length > 0) {
        await DatabaseService.upsertEpisodeCache(episodesToCache);
      }

      return {
        showId,
        tmdbId,
        showTitle,
        posterPath: showDetails.poster_path,
        newEpisodes,
        isNewSeason,
        newSeasonNumber
      };

    } catch (error) {
      console.error(`Error detecting new episodes for ${showTitle}:`, error);
      return null;
    }
  }

  // Send notifications for a show's new episodes
  static async sendNotificationsForShow(detection: NewEpisodeDetection): Promise<number> {
    let sentCount = 0;

    try {
      // Get users who should be notified for this show
      const users = await DatabaseService.getUsersToNotifyForShow(detection.showId);

      if (users.length === 0) {
        console.log(`No users to notify for ${detection.showTitle}`);
        return 0;
      }

      console.log(`Sending notifications to ${users.length} users for ${detection.showTitle}`);

      for (const user of users) {
        const userObj = user as any;
        if (!userObj?.email || !userObj?.email_verified) continue;

        try {
          // Check if this is a season premiere (first episode of a new season)
          const seasonPremiere = detection.isNewSeason &&
            detection.newEpisodes.some(e =>
              e.season_number === detection.newSeasonNumber && e.episode_number === 1
            );

          if (seasonPremiere && detection.newSeasonNumber) {
            // Send season premiere notification
            const alreadySent = await DatabaseService.hasNotificationBeenSent(
              userObj.id,
              detection.showId,
              'season_premiere',
              detection.newSeasonNumber,
              1
            );

            if (!alreadySent) {
              const result = await EmailService.sendSeasonPremiereNotification(
                userObj.email,
                userObj.name || 'there',
                detection.showTitle,
                detection.newSeasonNumber,
                detection.newEpisodes[0]?.air_date || null,
                detection.posterPath
              );

              if (result.success) {
                await DatabaseService.logNotification(
                  userObj.id,
                  detection.showId,
                  'season_premiere',
                  detection.newSeasonNumber,
                  1,
                  result.messageId
                );
                sentCount++;
              }
            }
          } else {
            // Send individual episode notifications (batch them if multiple)
            // For now, send one notification for the latest episode
            const latestEpisode = detection.newEpisodes[detection.newEpisodes.length - 1];
            if (!latestEpisode) continue;

            const alreadySent = await DatabaseService.hasNotificationBeenSent(
              userObj.id,
              detection.showId,
              'new_episode',
              latestEpisode.season_number,
              latestEpisode.episode_number
            );

            if (!alreadySent) {
              const result = await EmailService.sendNewEpisodeNotification(
                userObj.email,
                userObj.name || 'there',
                detection.showTitle,
                latestEpisode.season_number,
                latestEpisode.episode_number,
                latestEpisode.title || null,
                detection.posterPath
              );

              if (result.success) {
                await DatabaseService.logNotification(
                  userObj.id,
                  detection.showId,
                  'new_episode',
                  latestEpisode.season_number,
                  latestEpisode.episode_number,
                  result.messageId
                );
                sentCount++;
              }
            }
          }

        } catch (error: any) {
          console.error(`Error sending notification to ${userObj.email}:`, error);
        }

        // Small delay between sending to different users
        await this.delay(50);
      }

    } catch (error) {
      console.error(`Error sending notifications for ${detection.showTitle}:`, error);
    }

    return sentCount;
  }

  // Utility: delay helper for rate limiting
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Manual trigger: check a specific show for new episodes
  static async checkShowForNewEpisodes(showId: string, tmdbId: number): Promise<NewEpisodeDetection | null> {
    // Get show details
    const showDetails = await TMDBService.getShowDetails(tmdbId);
    if (!showDetails) return null;

    // Get current poll status or initialize
    const pollStatus = await DatabaseService.initializePollStatus(showId, tmdbId);

    return this.detectNewEpisodes(
      showId,
      tmdbId,
      showDetails.title,
      pollStatus?.last_known_season || 0,
      pollStatus?.last_known_episode || 0
    );
  }
}
