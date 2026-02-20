/**
 * Debug script for investigating daily digest issues
 * Run with: npx ts-node src/scripts/debug-digest.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { TMDBService } from '../services/tmdb';
import { supabase } from '../services/database';

const SHOW_NAME = 'Next Level Chef';

async function debugShow() {
  console.log('='.repeat(60));
  console.log(`DEBUGGING: "${SHOW_NAME}"`);
  console.log('='.repeat(60));

  // 1. Search TMDB for the show
  console.log('\n📺 Step 1: Searching TMDB...');
  const searchResult = await TMDBService.searchShows(SHOW_NAME, 1, 5);

  if (searchResult.shows.length === 0) {
    console.log('❌ Show not found on TMDB');
    return;
  }

  const tmdbShow = searchResult.shows[0];
  console.log(`Found: "${tmdbShow.title}" (TMDB ID: ${tmdbShow.tmdb_id})`);

  // 2. Get show details from TMDB
  console.log('\n📋 Step 2: Getting show details from TMDB...');
  const showDetails = await TMDBService.getShowDetails(tmdbShow.tmdb_id);

  if (!showDetails) {
    console.log('❌ Could not fetch show details');
    return;
  }

  console.log(`Status: ${showDetails.status}`);
  console.log(`Seasons: ${showDetails.number_of_seasons}`);
  console.log(`Last episode aired: ${JSON.stringify(showDetails.last_episode_to_air, null, 2)}`);
  console.log(`Next episode to air: ${JSON.stringify(showDetails.next_episode_to_air, null, 2)}`);

  // 3. Get latest season episodes from TMDB
  console.log('\n📅 Step 3: Getting latest season episodes...');
  const latestSeason = showDetails.number_of_seasons;
  const seasonData = await TMDBService.getShowSeasons(tmdbShow.tmdb_id, latestSeason);

  if (seasonData) {
    console.log(`Season ${latestSeason} has ${seasonData.episodes.length} episodes:`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    seasonData.episodes.forEach((ep: any) => {
      const airDate = ep.air_date ? new Date(ep.air_date) : null;
      const isRecent = airDate && airDate <= today && airDate >= sevenDaysAgo;
      const marker = isRecent ? '🆕' : '  ';
      console.log(`  ${marker} S${latestSeason}E${ep.episode_number}: "${ep.title}" - ${ep.air_date || 'TBA'}`);
    });

    console.log(`\n📆 Date range for "recent" episodes: ${sevenDaysAgo.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);
  }

  // 4. Check if show exists in our database
  console.log('\n🗄️ Step 4: Checking our database...');
  const { data: dbShow, error: dbShowError } = await supabase
    .from('shows')
    .select('*')
    .eq('tmdb_id', tmdbShow.tmdb_id)
    .single();

  if (dbShowError || !dbShow) {
    console.log('❌ Show NOT in our database - needs to be added first');
    return;
  }

  console.log(`✅ Found in database: ID = ${dbShow.id}`);

  // 5. Check episode_poll_status
  console.log('\n📊 Step 5: Checking episode_poll_status...');
  const { data: pollStatus, error: pollError } = await supabase
    .from('episode_poll_status')
    .select('*')
    .eq('show_id', dbShow.id)
    .single();

  if (pollError || !pollStatus) {
    console.log('❌ No poll status found - show has never been polled!');
    console.log('   This means pollAndDetect() never processed this show.');
  } else {
    console.log(`✅ Poll status found:`);
    console.log(`   Last polled: ${pollStatus.last_polled_at}`);
    console.log(`   Last known: S${pollStatus.last_known_season}E${pollStatus.last_known_episode}`);
    console.log(`   Last error: ${pollStatus.last_error || 'none'}`);
    console.log(`   Next poll due: ${pollStatus.next_poll_at}`);
  }

  // 6. Check episode_cache
  console.log('\n💾 Step 6: Checking episode_cache...');
  const { data: cachedEpisodes, error: cacheError } = await supabase
    .from('episode_cache')
    .select('*')
    .eq('show_id', dbShow.id)
    .order('season_number', { ascending: true })
    .order('episode_number', { ascending: true });

  if (cacheError || !cachedEpisodes || cachedEpisodes.length === 0) {
    console.log('❌ No episodes in cache - episodes have never been detected');
  } else {
    console.log(`✅ Found ${cachedEpisodes.length} episodes in cache:`);
    cachedEpisodes.forEach((ep: any) => {
      console.log(`   S${ep.season_number}E${ep.episode_number}: "${ep.title}" - ${ep.air_date}`);
    });
  }

  // 7. Check pending_notification_events
  console.log('\n📬 Step 7: Checking pending_notification_events...');
  const { data: pendingEvents, error: pendingError } = await supabase
    .from('pending_notification_events')
    .select('*')
    .eq('show_id', dbShow.id)
    .is('processed_at', null);

  if (pendingError) {
    console.log(`❌ Error querying pending events: ${pendingError.message}`);
  } else if (!pendingEvents || pendingEvents.length === 0) {
    console.log('❌ No pending events for this show');
  } else {
    console.log(`✅ Found ${pendingEvents.length} pending events:`);
    pendingEvents.forEach((event: any) => {
      console.log(`   [${event.event_type}] S${event.season_number}E${event.episode_number} - created: ${event.created_at}`);
    });
  }

  // 8. Check user_shows to see who's tracking this show
  console.log('\n👥 Step 8: Checking who is tracking this show...');
  const { data: trackers, error: trackersError } = await supabase
    .from('user_shows')
    .select(`
      user_id,
      notifications_enabled,
      users!inner (
        id,
        email,
        email_verified,
        notification_preferences
      )
    `)
    .eq('show_id', dbShow.id)
    .eq('is_following', true);

  if (trackersError) {
    console.log(`❌ Error: ${trackersError.message}`);
  } else if (!trackers || trackers.length === 0) {
    console.log('❌ No users tracking this show');
  } else {
    console.log(`✅ ${trackers.length} user(s) tracking this show:`);
    trackers.forEach((t: any) => {
      const user = t.users;
      console.log(`   - ${user.email}`);
      console.log(`     Email verified: ${user.email_verified}`);
      console.log(`     Show notifications: ${t.notifications_enabled !== false}`);
      console.log(`     Global prefs: ${JSON.stringify(user.notification_preferences || {})}`);
    });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  if (!pollStatus) {
    console.log('🔴 ISSUE: Show has no poll status - never been polled');
    console.log('   FIX: The show needs to be in episode_poll_status table');
  } else if (!cachedEpisodes || cachedEpisodes.length === 0) {
    console.log('🔴 ISSUE: No episodes cached - polling may have failed');
  } else if (!pendingEvents || pendingEvents.length === 0) {
    console.log('🟡 No pending events - either:');
    console.log('   1. No new episodes detected (already in cache)');
    console.log('   2. Episodes aired > 7 days ago (outside detection window)');
    console.log('   3. Poll hasn\'t run since new episodes aired');
  }
}

async function checkAllPendingEvents() {
  console.log('\n' + '='.repeat(60));
  console.log('ALL PENDING NOTIFICATION EVENTS');
  console.log('='.repeat(60));

  const { data: events, error } = await supabase
    .from('pending_notification_events')
    .select(`
      *,
      users!inner (email, name)
    `)
    .is('processed_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  if (!events || events.length === 0) {
    console.log('No pending events in the queue.');
    return;
  }

  console.log(`Found ${events.length} pending events:\n`);
  events.forEach((event: any) => {
    console.log(`[${event.event_type}] "${event.show_title}" S${event.season_number}E${event.episode_number}`);
    console.log(`   User: ${event.users?.email}`);
    console.log(`   Created: ${event.created_at}`);
    console.log('');
  });
}

async function checkTrackedShows() {
  console.log('\n' + '='.repeat(60));
  console.log('TRACKED SHOWS vs POLL STATUS');
  console.log('='.repeat(60));

  // Get all shows being tracked by any user
  const { data: trackedShows, error: trackedError } = await supabase
    .from('user_shows')
    .select(`
      show_id,
      shows!inner (
        id,
        tmdb_id,
        title
      )
    `)
    .eq('is_following', true);

  if (trackedError) {
    console.log(`❌ Error: ${trackedError.message}`);
    return;
  }

  // Deduplicate shows
  const uniqueShows = new Map();
  trackedShows?.forEach((t: any) => {
    uniqueShows.set(t.show_id, t.shows);
  });

  console.log(`Total tracked shows: ${uniqueShows.size}`);

  // Check poll status for each
  let withPollStatus = 0;
  let withoutPollStatus = 0;

  for (const [showId, show] of uniqueShows) {
    const { data: pollStatus } = await supabase
      .from('episode_poll_status')
      .select('*')
      .eq('show_id', showId)
      .single();

    if (pollStatus) {
      withPollStatus++;
    } else {
      withoutPollStatus++;
      console.log(`❌ Missing poll status: "${show.title}" (ID: ${showId})`);
    }
  }

  console.log(`\n✅ Shows with poll status: ${withPollStatus}`);
  console.log(`❌ Shows WITHOUT poll status: ${withoutPollStatus}`);
}

// Run the debug
async function main() {
  try {
    await debugShow();
    await checkAllPendingEvents();
    await checkTrackedShows();
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

main();
