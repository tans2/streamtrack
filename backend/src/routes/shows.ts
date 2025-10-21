import express from 'express';
import { TMDBService } from '../services/tmdb';
import { DatabaseService } from '../services/database';
import { supabase } from '../services/database';
import { authenticateToken } from './auth';

const router = express.Router();

// ===== WATCHLIST MANAGEMENT ENDPOINTS =====

// Get user's watchlist
router.get('/watchlist', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const status = req.query.status as string; // 'watching', 'completed', 'dropped', 'all'
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    console.log(`Fetching watchlist for user ${userId}, status: ${status || 'all'}`);

    const watchlist = await DatabaseService.getUserWatchlist(userId, status, page, limit);
    
    res.json({
      success: true,
      data: watchlist,
      pagination: {
        page,
        limit,
        total: watchlist.length
      }
    });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch watchlist' });
  }
});

// Update show status in watchlist
router.put('/watchlist/:showId/status', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const showId = req.params.showId;
    const { status, currentSeason, currentEpisode, notes } = req.body;

    console.log(`Updating show ${showId} status for user ${userId}:`, { status, currentSeason, currentEpisode });

    const updated = await DatabaseService.updateShowStatus(userId, showId, {
      status,
      currentSeason,
      currentEpisode,
      notes
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Show not found in watchlist' });
    }

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Error updating show status:', error);
    res.status(500).json({ success: false, error: 'Failed to update show status' });
  }
});

// Remove show from watchlist
router.delete('/watchlist/:showId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const showId = req.params.showId;

    console.log(`Removing show ${showId} from watchlist for user ${userId}`);

    const removed = await DatabaseService.removeFromWatchlist(userId, showId);

    if (!removed) {
      return res.status(404).json({ success: false, error: 'Show not found in watchlist' });
    }

    res.json({
      success: true,
      message: 'Show removed from watchlist'
    });
  } catch (error) {
    console.error('Error removing show from watchlist:', error);
    res.status(500).json({ success: false, error: 'Failed to remove show from watchlist' });
  }
});

// Bulk update watchlist
router.put('/watchlist/bulk', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { action, showIds, status } = req.body; // action: 'update_status', 'remove'

    console.log(`Bulk ${action} for user ${userId}:`, { showIds, status });

    let results;
    if (action === 'update_status') {
      results = await DatabaseService.bulkUpdateStatus(userId, showIds, status);
    } else if (action === 'remove') {
      results = await DatabaseService.bulkRemoveFromWatchlist(userId, showIds);
    } else {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    res.json({
      success: true,
      data: results,
      message: `Bulk ${action} completed`
    });
  } catch (error) {
    console.error('Error in bulk watchlist operation:', error);
    res.status(500).json({ success: false, error: 'Failed to perform bulk operation' });
  }
});

// Get popular shows from TMDB
router.get('/popular', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const result = await TMDBService.getPopularShows(page, limit);
    
    res.json({
      success: true,
      data: result.shows,
      pagination: {
        page: result.page,
        total_pages: result.total_pages,
        total_results: result.total_results
      }
    });
  } catch (error) {
    console.error('Error fetching popular shows:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular shows'
    });
  }
});

// Search shows
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const result = await TMDBService.searchShows(query, page, limit);

    // Control how much season data we fetch to avoid timeouts/rate limits
    const seasonMode = ((req.query.seasonMode as string) || 'compact').toLowerCase();
    const maxShowsForSeasons = seasonMode === 'all' ? result.shows.length : seasonMode === 'none' ? 0 : Math.min(result.shows.length, 5);
    
    res.json({
      success: true,
      data: result.shows,
      pagination: {
        page: result.page,
        total_pages: result.total_pages,
        total_results: result.total_results
      }
    });
  } catch (error) {
    console.error('Error searching shows:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search shows'
    });
  }
});

// Universal Search with provider filters and disambiguation
router.get('/universal-search', async (req, res) => {
  try {
    const query = (req.query.q as string)?.trim();
    const country = (req.query.country as string) || 'US';
    const providers = (req.query.providers as string)?.split(',').filter(Boolean) || [];
    const subscription = (req.query.subscription as string) || 'any'; // flatrate|free|ads|rent|buy|any
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }

    // Parse query for year disambiguation (e.g., "The Office 2005" or "The Office (2005)")
    const yearMatch = query.match(/(.+?)\s*(?:\((\d{4})\)|(\d{4}))$/);
    const searchTitle = yearMatch ? yearMatch[1].trim() : query;
    const searchYear = yearMatch ? (yearMatch[2] || yearMatch[3]) : null;

    // Search TMDB with the cleaned title
    const result = await TMDBService.searchShows(searchTitle, page, limit);

    // Control how much season data we fetch to avoid timeouts/rate limits
    const seasonMode = ((req.query.seasonMode as string) || 'compact').toLowerCase();
    const maxShowsForSeasons = seasonMode === 'all' ? result.shows.length : seasonMode === 'none' ? 0 : Math.min(result.shows.length, 5);

    // For each show, fetch providers and filter by requested criteria
    const enriched = await Promise.all(
      result.shows.map(async (show: any, index: number) => {
        const providersData = await TMDBService.getWatchProviders(show.tmdb_id, country);

        // Apply provider filters
        const availability = providersData.availability;
        const pool = subscription === 'any' ?
          ([] as any[]).concat(availability.flatrate, availability.free, availability.ads, availability.rent, availability.buy) :
          (availability as any)[subscription] || [];

        const providerIds = new Set((pool || []).map((p: any) => String(p.id)));
        const hasProviderMatch = providers.length === 0 || providers.some((p) => providerIds.has(String(p)));

        // Get show details and season availability for a limited number of results to keep responses fast
        let totalSeasons = 0;
        let seasonAvailability = [] as any[];
        if (index < maxShowsForSeasons) {
          try {
            const showDetails = await TMDBService.getShowDetails(show.tmdb_id);
            totalSeasons = showDetails?.number_of_seasons || 0;
            
            if (seasonMode !== 'none' && totalSeasons > 0) {
              const seasonPromises: Promise<any>[] = [];
              for (let season = 1; season <= totalSeasons; season++) {
                seasonPromises.push(
                  TMDBService.getSeasonWatchProviders(show.tmdb_id, season, country)
                    .catch(error => {
                      console.warn(`Could not fetch season ${season} data for show ${show.tmdb_id}:`, error);
                      return null;
                    })
                );
              }

              const seasonResults = await Promise.all(seasonPromises);
              seasonAvailability = seasonResults
                .filter(result => result && result.providers.length > 0)
                .map(result => result!);
            }
          } catch (error) {
            console.warn(`Could not fetch season data for show ${show.tmdb_id}:`, error);
          }
        }

        // Calculate title match score for intelligent ranking
        const showTitle = show.title.toLowerCase();
        const searchTitleLower = searchTitle.toLowerCase();
        let titleMatchScore = 0;
        
        // Exact match gets highest score
        if (showTitle === searchTitleLower) {
          titleMatchScore = 100;
        }
        // Starts with search term gets high score
        else if (showTitle.startsWith(searchTitleLower)) {
          titleMatchScore = 80;
        }
        // Contains search term gets medium score
        else if (showTitle.includes(searchTitleLower)) {
          titleMatchScore = 60;
        }
        // Word boundary matches get lower score
        else if (showTitle.split(/\s+/).some((word: string) => word.startsWith(searchTitleLower))) {
          titleMatchScore = 40;
        }
        // Partial word matches get lowest score
        else if (showTitle.split(/\s+/).some((word: string) => word.includes(searchTitleLower))) {
          titleMatchScore = 20;
        }

        // Year disambiguation bonus
        const showYear = show.first_air_date ? String(show.first_air_date).slice(0, 4) : null;
        let yearBonus = 0;
        if (searchYear && showYear) {
          if (showYear === searchYear) {
            yearBonus = 30; // Exact year match
          } else if (Math.abs(parseInt(showYear) - parseInt(searchYear)) <= 2) {
            yearBonus = 10; // Close year match
          }
        }

        const finalScore = titleMatchScore + yearBonus;

        return {
          ...show,
          year: showYear,
          totalSeasons: totalSeasons || undefined,
          providers: providersData.providers,
          availability: providersData.availability,
          seasonAvailability,
          matchesFilters: hasProviderMatch,
          titleMatchScore: finalScore
        };
      })
    );

    // Normalize and filter results
    const filtered = enriched.filter((item) => item.matchesFilters);

    // Disambiguation key: title + year
    const byKey: Record<string, any> = {};
    for (const item of filtered) {
      const key = `${item.title}|${item.year || ''}`;
      if (!byKey[key]) {
        byKey[key] = { ...item, tmdb_ids: new Set([item.tmdb_id]) };
      } else {
        byKey[key].tmdb_ids.add(item.tmdb_id);
        // Merge providers
        const merge = (arr1: any[], arr2: any[]) => {
          const map = new Map<string, any>();
          [...arr1, ...arr2].forEach((p: any) => map.set(String(p.id), p));
          return Array.from(map.values());
        };
        byKey[key].providers = merge(byKey[key].providers, item.providers);
        byKey[key].availability = {
          flatrate: merge(byKey[key].availability.flatrate, item.availability.flatrate),
          free: merge(byKey[key].availability.free, item.availability.free),
          ads: merge(byKey[key].availability.ads, item.availability.ads),
          rent: merge(byKey[key].availability.rent, item.availability.rent),
          buy: merge(byKey[key].availability.buy, item.availability.buy)
        };
      }
    }

    const normalized = Object.values(byKey).map((item: any) => ({
      ...item,
      tmdb_ids: Array.from(item.tmdb_ids)
    }));

    // Sort by title match score (highest first), then by popularity
    const sorted = normalized.sort((a: any, b: any) => {
      if (a.titleMatchScore !== b.titleMatchScore) {
        return b.titleMatchScore - a.titleMatchScore;
      }
      return (b.popularity || 0) - (a.popularity || 0);
    });

    res.json({
      success: true,
      data: sorted,
      pagination: {
        page: result.page,
        total_pages: result.total_pages,
        total_results: result.total_results
      },
      searchInfo: {
        originalQuery: query,
        searchTitle: searchTitle,
        searchYear: searchYear
      }
    });
  } catch (error) {
    console.error('Error in universal search:', error);
    res.status(500).json({ success: false, error: 'Failed to perform universal search' });
  }
});

// Get show details by TMDB ID
router.get('/:tmdbId', async (req, res) => {
  try {
    const tmdbId = parseInt(req.params.tmdbId);
    
    if (isNaN(tmdbId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid TMDB ID'
      });
    }
    
    // First check if we have it in our database
    let show = await DatabaseService.getShowByTmdbId(tmdbId);
    
    // If not in database, fetch from TMDB
    if (!show) {
      show = await TMDBService.getShowDetails(tmdbId);
      
      // Save to database for future use
      if (show) {
        await DatabaseService.upsertShow(show);
      }
    }
    
    if (!show) {
      return res.status(404).json({
        success: false,
        error: 'Show not found'
      });
    }
    
    res.json({
      success: true,
      data: show
    });
  } catch (error) {
    console.error('Error fetching show details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch show details'
    });
  }
});

// Get trending shows
router.get('/trending/daily', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const shows = await TMDBService.getTrendingShows(limit);
    
    res.json({
      success: true,
      data: shows
    });
  } catch (error) {
    console.error('Error fetching trending shows:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending shows'
    });
  }
});

// Get shows by genre
router.get('/genre/:genreId', async (req, res) => {
  try {
    const genreId = parseInt(req.params.genreId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    if (isNaN(genreId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid genre ID'
      });
    }
    
    const result = await TMDBService.getShowsByGenre(genreId, page, limit);
    
    res.json({
      success: true,
      data: result.shows,
      pagination: {
        page: result.page,
        total_pages: result.total_pages,
        total_results: result.total_results
      }
    });
  } catch (error) {
    console.error('Error fetching shows by genre:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shows by genre'
    });
  }
});

// Quick Add: upsert show by TMDB ID and follow for a user
router.post('/:tmdbId/quick-add', authenticateToken, async (req: any, res) => {
  try {
    const tmdbId = parseInt(req.params.tmdbId);
    const userId = req.user.id; // Get user ID from authenticated token

    if (isNaN(tmdbId)) {
      return res.status(400).json({ success: false, error: 'Invalid TMDB ID' });
    }

    console.log(`Quick add: TMDB ID ${tmdbId}, User ID ${userId}`);

    // Fetch details from TMDB and upsert into DB
    const details = await TMDBService.getShowDetails(tmdbId);
    if (!details) {
      console.log(`TMDB show not found for ID ${tmdbId}`);
      return res.status(404).json({ success: false, error: 'TMDB show not found' });
    }

    console.log('TMDB details fetched:', { title: details.title, tmdb_id: details.tmdb_id });

    // Map TMDB status to our database expected values
    const mapStatus = (tmdbStatus: string) => {
      const status = (tmdbStatus || 'unknown').toLowerCase();
      switch (status) {
        case 'ended':
        case 'canceled':
        case 'cancelled':
          return 'ended';
        default:
          // For all other statuses (returning series, in production, etc.), use 'ended' as fallback
          // This ensures we don't violate any database constraints
          return 'ended';
      }
    };

    // Ensure the show data has the correct structure for upsert
    const showData = {
      tmdb_id: details.tmdb_id,
      title: details.title,
      overview: details.overview || '',
      poster_path: details.poster_path,
      backdrop_path: details.backdrop_path,
      first_air_date: details.first_air_date,
      last_air_date: details.last_air_date,
      status: mapStatus(details.status),
      type: details.type || 'tv',
      genres: Array.isArray(details.genres) ? details.genres : [],
      rating: parseFloat(details.rating) || 0,
      popularity: parseFloat(details.popularity) || 0
    };

    console.log('Show data prepared for upsert:', showData);

    const upserted = await DatabaseService.upsertShow(showData);
    if (!upserted) {
      console.log('Failed to upsert show to database');
      return res.status(500).json({ success: false, error: 'Failed to save show to database' });
    }

    console.log('Show upserted successfully:', { id: upserted.id, title: upserted.title });

    // Check if show is already in user's watchlist (including soft-deleted records)
    const { data: existingFollow } = await supabase
      .from('user_shows')
      .select('id, is_following')
      .eq('user_id', userId)
      .eq('show_id', upserted.id)
      .single();

    if (existingFollow) {
      // If the record exists but is_following is false, restore it
      if (!existingFollow.is_following) {
        const { error: updateError } = await supabase
          .from('user_shows')
          .update({ 
            is_following: true,
            watch_status: 'plan_to_watch',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingFollow.id);

        if (updateError) {
          console.error('Error restoring watchlist item:', updateError);
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to restore show to watchlist' 
          });
        }

        return res.json({
          success: true,
          data: {
            show: upserted,
            followed: { id: existingFollow.id, is_following: true },
            message: `"${upserted.title}" has been restored to your watchlist.`
          }
        });
      } else {
        // Show is already actively being followed
        return res.status(400).json({ 
          success: false, 
          error: `"${upserted.title}" is already in your watchlist.` 
        });
      }
    }

    // Follow for the user
    const followed = await DatabaseService.followShow(userId, upserted.id);
    if (!followed) {
      console.log('Failed to follow show for user');
      return res.status(500).json({ success: false, error: 'Failed to add show to watchlist' });
    }

    console.log('Show added to user watchlist successfully');

    return res.json({ success: true, data: { show: upserted, followed } });
  } catch (error) {
    console.error('Error in quick-add:', error);
    res.status(500).json({ success: false, error: 'Failed to quick add show' });
  }
});

export default router;
