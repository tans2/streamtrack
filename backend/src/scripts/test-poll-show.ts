/**
 * Test script for polling a specific show with the fixed detection logic
 * Run with: npx ts-node src/scripts/test-poll-show.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { TMDBService } from '../services/tmdb';
import { supabase } from '../services/database';
import { NotificationService } from '../services/notification';

const TMDB_ID = 129500; // Next Level Chef

async function testPollShow() {
  console.log('='.repeat(60));
  console.log('TESTING POLL FOR "Next Level Chef"');
  console.log('='.repeat(60));

  // 1. Get show from database
  const { data: show, error: showError } = await supabase
    .from('shows')
    .select('*')
    .eq('tmdb_id', TMDB_ID)
    .single();

  if (showError || !show) {
    console.log('❌ Show not found in database');
    return;
  }

  console.log(`\n📺 Show: ${show.title} (ID: ${show.id})`);

  // 2. Get current poll status
  const { data: pollStatus } = await supabase
    .from('episode_poll_status')
    .select('*')
    .eq('show_id', show.id)
    .single();

  console.log(`\n📊 Current poll status:`);
  console.log(`   Last known: S${pollStatus?.last_known_season}E${pollStatus?.last_known_episode}`);

  // 3. Run the detection
  console.log(`\n🔍 Running detection with FIXED logic...`);
  const detection = await NotificationService.checkShowForNewEpisodes(show.id, TMDB_ID);

  if (!detection) {
    console.log('❌ Detection failed');
    return;
  }

  console.log(`\n✅ Detection results:`);
  console.log(`   New episodes found: ${detection.newEpisodes.length}`);

  if (detection.newEpisodes.length > 0) {
    console.log(`   Episodes:`);
    detection.newEpisodes.forEach(ep => {
      console.log(`     - S${ep.season_number}E${ep.episode_number}: "${ep.title}" (${ep.air_date})`);
    });

    // 4. Queue events
    console.log(`\n📬 Queueing notification events...`);
    const queuedCount = await NotificationService.queueEventsForShow(detection);
    console.log(`   Queued ${queuedCount} events`);

    // 5. Update poll status
    const latestEpisode = detection.newEpisodes[detection.newEpisodes.length - 1];
    console.log(`\n📝 Updating poll status to S${latestEpisode.season_number}E${latestEpisode.episode_number}...`);

    const { error: updateError } = await supabase
      .from('episode_poll_status')
      .update({
        last_known_season: latestEpisode.season_number,
        last_known_episode: latestEpisode.episode_number,
        last_polled_at: new Date().toISOString(),
        next_poll_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
      })
      .eq('show_id', show.id);

    if (updateError) {
      console.log(`   ❌ Error: ${updateError.message}`);
    } else {
      console.log(`   ✅ Poll status updated`);
    }
  } else {
    console.log(`   No new episodes to notify about`);
  }

  // 6. Check pending events
  console.log(`\n📋 Checking pending events for this show...`);
  const { data: events } = await supabase
    .from('pending_notification_events')
    .select('*')
    .eq('show_id', show.id)
    .is('processed_at', null);

  if (events && events.length > 0) {
    console.log(`   Found ${events.length} pending events:`);
    events.forEach(e => {
      console.log(`     - [${e.event_type}] S${e.season_number}E${e.episode_number}`);
    });
  } else {
    console.log(`   No pending events`);
  }

  console.log('\n' + '='.repeat(60));
}

testPollShow()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
