import { DatabaseService } from './database';
import { TMDBService } from './tmdb';
import { EmailService } from './email';
import crypto from 'crypto';

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
  nextEpisodeToAir?: {
    air_date: string;
    episode_number: number;
    season_number: number;
    name: string;
  } | null;
}

export class NotificationService {
  // Main entry point: poll shows and queue events for daily digest
  static async pollAndDetect(batchSize: number = 30): Promise<{
    showsPolled: number;
    newEpisodesFound: number;
    eventsQueued: number;
    errors: string[];
  }> {
    const results = {
      showsPolled: 0,
      newEpisodesFound: 0,
      eventsQueued: 0,
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

            // Queue events for daily digest instead of sending immediately
            const queuedCount = await this.queueEventsForShow(detection);
            results.eventsQueued += queuedCount;
          }

          // Queue upcoming release events if next episode is within 14 days
          if (detection?.nextEpisodeToAir) {
            const upcomingQueued = await this.queueUpcomingRelease(detection);
            results.eventsQueued += upcomingQueued;
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
      console.error('Error in pollAndDetect:', error);
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
            // Only notify about episodes that aired recently (within last 7 days)
            const airDate = episode.air_date ? new Date(episode.air_date) : null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            if (airDate && airDate <= today && airDate >= sevenDaysAgo) {
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
        newSeasonNumber,
        nextEpisodeToAir: showDetails.next_episode_to_air
      };

    } catch (error) {
      console.error(`Error detecting new episodes for ${showTitle}:`, error);
      return null;
    }
  }

  // Queue notification events for a show's new episodes (replaces sendNotificationsForShow)
  static async queueEventsForShow(detection: NewEpisodeDetection): Promise<number> {
    let queuedCount = 0;

    try {
      // Get users who should be notified for this show
      const users = await DatabaseService.getUsersToNotifyForShow(detection.showId);

      if (users.length === 0) {
        console.log(`No users to notify for ${detection.showTitle}`);
        return 0;
      }

      console.log(`Queueing events for ${users.length} users for ${detection.showTitle}`);

      const events: Array<{
        user_id: string;
        show_id: string;
        event_type: string;
        season_number?: number;
        episode_number?: number;
        episode_title?: string;
        air_date?: string;
        poster_path?: string;
        show_title: string;
      }> = [];

      for (const user of users) {
        const userObj = user as any;
        if (!userObj?.id || !userObj?.email_verified) continue;

        const prefs = userObj.notification_preferences || {};

        // Skip if user has paused all notifications
        if (prefs.pauseAll) continue;

        // Check if this is a season premiere (first episode of a new season)
        const isSeasonPremiere = detection.isNewSeason &&
          detection.newEpisodes.some(e =>
            e.season_number === detection.newSeasonNumber && e.episode_number === 1
          );

        if (isSeasonPremiere && detection.newSeasonNumber) {
          // Only queue if user has season premieres enabled
          if (prefs.seasonPremieres !== false) {
            events.push({
              user_id: userObj.id,
              show_id: detection.showId,
              event_type: 'season_premiere',
              season_number: detection.newSeasonNumber,
              episode_number: 1,
              episode_title: detection.newEpisodes.find(
                e => e.season_number === detection.newSeasonNumber && e.episode_number === 1
              )?.title,
              air_date: detection.newEpisodes[0]?.air_date,
              poster_path: detection.posterPath || undefined,
              show_title: detection.showTitle
            });
          }
        }

        // Queue individual episode events (non-premiere episodes)
        if (prefs.newEpisodes !== false) {
          for (const episode of detection.newEpisodes) {
            // Skip the premiere episode if we already queued it as a season premiere
            if (isSeasonPremiere &&
                episode.season_number === detection.newSeasonNumber &&
                episode.episode_number === 1) {
              continue;
            }

            events.push({
              user_id: userObj.id,
              show_id: detection.showId,
              event_type: 'new_episode',
              season_number: episode.season_number,
              episode_number: episode.episode_number,
              episode_title: episode.title,
              air_date: episode.air_date,
              poster_path: detection.posterPath || undefined,
              show_title: detection.showTitle
            });
          }
        }
      }

      // Bulk insert all events
      if (events.length > 0) {
        const result = await DatabaseService.bulkInsertPendingEvents(events);
        queuedCount = result.inserted;
        console.log(`Queued ${queuedCount} events for ${detection.showTitle}`);
      }

    } catch (error) {
      console.error(`Error queueing events for ${detection.showTitle}:`, error);
    }

    return queuedCount;
  }

  // Queue upcoming release events for a show (next episode within 14 days)
  static async queueUpcomingRelease(detection: NewEpisodeDetection): Promise<number> {
    if (!detection.nextEpisodeToAir?.air_date) return 0;

    const airDate = new Date(detection.nextEpisodeToAir.air_date);
    const now = new Date();
    const fourteenDaysFromNow = new Date();
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

    // Only queue if the next episode airs within 14 days and hasn't aired yet
    if (airDate <= now || airDate > fourteenDaysFromNow) return 0;

    try {
      const users = await DatabaseService.getUsersToNotifyForShow(detection.showId);
      const events: Array<{
        user_id: string;
        show_id: string;
        event_type: string;
        season_number?: number;
        episode_number?: number;
        episode_title?: string;
        air_date?: string;
        poster_path?: string;
        show_title: string;
      }> = [];

      for (const user of users) {
        const userObj = user as any;
        if (!userObj?.id || !userObj?.email_verified) continue;

        const prefs = userObj.notification_preferences || {};
        if (prefs.pauseAll || prefs.upcomingReleases === false) continue;

        events.push({
          user_id: userObj.id,
          show_id: detection.showId,
          event_type: 'upcoming_release',
          season_number: detection.nextEpisodeToAir!.season_number,
          episode_number: detection.nextEpisodeToAir!.episode_number,
          episode_title: detection.nextEpisodeToAir!.name,
          air_date: detection.nextEpisodeToAir!.air_date,
          poster_path: detection.posterPath || undefined,
          show_title: detection.showTitle
        });
      }

      if (events.length > 0) {
        const result = await DatabaseService.bulkInsertPendingEvents(events);
        return result.inserted;
      }
    } catch (error) {
      console.error(`Error queueing upcoming release for ${detection.showTitle}:`, error);
    }

    return 0;
  }

  // Send daily digest emails to all users with pending events
  static async sendDailyDigests(): Promise<{
    usersEmailed: number;
    eventsSent: number;
    errors: string[];
  }> {
    const results = {
      usersEmailed: 0,
      eventsSent: 0,
      errors: [] as string[]
    };

    try {
      // Get all users with pending events
      const users = await DatabaseService.getUsersWithPendingEvents();

      if (users.length === 0) {
        console.log('No users with pending events for digest');
        return results;
      }

      console.log(`Sending daily digests to ${users.length} users`);
      const today = new Date().toISOString().split('T')[0];

      for (const user of users) {
        try {
          // Skip if user has paused all notifications
          const prefs = (user as any).notification_preferences || {};
          if (prefs.pauseAll) {
            console.log(`Skipping ${(user as any).email} - notifications paused`);
            continue;
          }

          // Skip if digest already sent today
          const alreadySent = await DatabaseService.hasDigestBeenSent((user as any).id, today);
          if (alreadySent) {
            console.log(`Digest already sent to ${(user as any).email} for ${today}`);
            continue;
          }

          // Fetch all pending events for this user
          const events = await DatabaseService.getPendingEventsForUser((user as any).id);
          if (events.length === 0) continue;

          // Group events by type
          const newEpisodes = events
            .filter(e => e.event_type === 'new_episode')
            .map(e => ({
              showTitle: e.show_title,
              posterPath: e.poster_path,
              seasonNumber: e.season_number,
              episodeNumber: e.episode_number,
              episodeTitle: e.episode_title,
              showId: e.show_id
            }));

          const newSeasons = events
            .filter(e => e.event_type === 'season_premiere' || e.event_type === 'show_premiere')
            .map(e => ({
              showTitle: e.show_title,
              posterPath: e.poster_path,
              seasonNumber: e.season_number,
              airDate: e.air_date,
              showId: e.show_id
            }));

          const upcomingReleases = events
            .filter(e => e.event_type === 'upcoming_release')
            .map(e => ({
              showTitle: e.show_title,
              posterPath: e.poster_path,
              airDate: e.air_date || '',
              episodeInfo: e.episode_title
                ? `S${e.season_number}E${e.episode_number}: "${e.episode_title}"`
                : `Season ${e.season_number}, Episode ${e.episode_number}`,
              showId: e.show_id
            }));

          // Send digest email
          const emailResult = await EmailService.sendDailyDigest(
            (user as any).email,
            (user as any).name || 'there',
            { newEpisodes, newSeasons, upcomingReleases }
          );

          if (emailResult.success) {
            // Mark events as processed
            const digestId = crypto.randomUUID();
            const eventIds = events.map(e => e.id);
            await DatabaseService.markEventsProcessed(eventIds, digestId);

            // Log the digest
            await DatabaseService.logDigest(
              (user as any).id,
              today,
              events.length,
              emailResult.messageId
            );

            results.usersEmailed++;
            results.eventsSent += events.length;
            console.log(`Digest sent to ${(user as any).email}: ${events.length} events`);
          } else {
            console.error(`Failed to send digest to ${(user as any).email}: ${emailResult.error}`);
            results.errors.push(`Failed to send to ${(user as any).email}: ${emailResult.error}`);
          }

        } catch (error: any) {
          console.error(`Error processing digest for user:`, error);
          results.errors.push(error.message);
        }

        // Small delay between users
        await this.delay(100);
      }

    } catch (error: any) {
      console.error('Error in sendDailyDigests:', error);
      results.errors.push(error.message);
    }

    return results;
  }

  // Legacy: Send notifications immediately (kept for rollback safety)
  static async sendNotificationsForShow(detection: NewEpisodeDetection): Promise<number> {
    let sentCount = 0;

    try {
      const users = await DatabaseService.getUsersToNotifyForShow(detection.showId);
      if (users.length === 0) return 0;

      for (const user of users) {
        const userObj = user as any;
        if (!userObj?.email || !userObj?.email_verified) continue;

        try {
          const seasonPremiere = detection.isNewSeason &&
            detection.newEpisodes.some(e =>
              e.season_number === detection.newSeasonNumber && e.episode_number === 1
            );

          if (seasonPremiere && detection.newSeasonNumber) {
            const alreadySent = await DatabaseService.hasNotificationBeenSent(
              userObj.id, detection.showId, 'season_premiere', detection.newSeasonNumber, 1
            );
            if (!alreadySent) {
              const result = await EmailService.sendSeasonPremiereNotification(
                userObj.email, userObj.name || 'there', detection.showTitle,
                detection.newSeasonNumber, detection.newEpisodes[0]?.air_date || null,
                detection.posterPath
              );
              if (result.success) {
                await DatabaseService.logNotification(
                  userObj.id, detection.showId, 'season_premiere',
                  detection.newSeasonNumber, 1, result.messageId
                );
                sentCount++;
              }
            }
          } else {
            const latestEpisode = detection.newEpisodes[detection.newEpisodes.length - 1];
            if (!latestEpisode) continue;
            const alreadySent = await DatabaseService.hasNotificationBeenSent(
              userObj.id, detection.showId, 'new_episode',
              latestEpisode.season_number, latestEpisode.episode_number
            );
            if (!alreadySent) {
              const result = await EmailService.sendNewEpisodeNotification(
                userObj.email, userObj.name || 'there', detection.showTitle,
                latestEpisode.season_number, latestEpisode.episode_number,
                latestEpisode.title || null, detection.posterPath
              );
              if (result.success) {
                await DatabaseService.logNotification(
                  userObj.id, detection.showId, 'new_episode',
                  latestEpisode.season_number, latestEpisode.episode_number,
                  result.messageId
                );
                sentCount++;
              }
            }
          }
        } catch (error: any) {
          console.error(`Error sending notification to ${userObj.email}:`, error);
        }
        await this.delay(50);
      }
    } catch (error) {
      console.error(`Error sending notifications for ${detection.showTitle}:`, error);
    }

    return sentCount;
  }

  // Legacy: kept for rollback
  static async pollAndNotify(batchSize: number = 30) {
    console.warn('pollAndNotify is deprecated - use pollAndDetect + sendDailyDigests instead');
    return this.pollAndDetect(batchSize);
  }

  // Utility: delay helper for rate limiting
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Manual trigger: check a specific show for new episodes
  static async checkShowForNewEpisodes(showId: string, tmdbId: number): Promise<NewEpisodeDetection | null> {
    const showDetails = await TMDBService.getShowDetails(tmdbId);
    if (!showDetails) return null;

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
