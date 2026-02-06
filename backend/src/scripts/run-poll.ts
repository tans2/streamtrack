/**
 * Manually run the episode polling cron
 * Run with: npx ts-node src/scripts/run-poll.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { NotificationService } from '../services/notification';
import { supabase } from '../services/database';

async function runPoll() {
  console.log('='.repeat(60));
  console.log('RUNNING EPISODE POLLING');
  console.log('='.repeat(60));

  // Check poll status before
  console.log('\n📊 Poll status BEFORE:');
  const { count: pollCountBefore } = await supabase
    .from('episode_poll_status')
    .select('*', { count: 'exact', head: true });
  console.log(`   Shows with poll status: ${pollCountBefore}`);

  // Get tracked shows count
  const { data: trackedShows } = await supabase
    .from('user_shows')
    .select('show_id')
    .eq('is_following', true);

  const uniqueShowIds = new Set(trackedShows?.map(t => t.show_id) || []);
  console.log(`   Total tracked shows: ${uniqueShowIds.size}`);
  console.log(`   Missing poll status: ${uniqueShowIds.size - (pollCountBefore || 0)}`);

  // Run the poll with a larger batch size to initialize more shows
  console.log('\n🔄 Running pollAndDetect (batch size: 60)...');
  const results = await NotificationService.pollAndDetect(60);

  console.log('\n✅ Results:');
  console.log(`   Shows polled: ${results.showsPolled}`);
  console.log(`   New episodes found: ${results.newEpisodesFound}`);
  console.log(`   Events queued: ${results.eventsQueued}`);
  if (results.errors.length > 0) {
    console.log(`   Errors (${results.errors.length}):`);
    results.errors.slice(0, 5).forEach(e => console.log(`     - ${e}`));
    if (results.errors.length > 5) {
      console.log(`     ... and ${results.errors.length - 5} more`);
    }
  }

  // Check poll status after
  console.log('\n📊 Poll status AFTER:');
  const { count: pollCountAfter } = await supabase
    .from('episode_poll_status')
    .select('*', { count: 'exact', head: true });
  console.log(`   Shows with poll status: ${pollCountAfter}`);
  console.log(`   Newly initialized: ${(pollCountAfter || 0) - (pollCountBefore || 0)}`);

  // Check pending events
  console.log('\n📬 Pending events after poll:');
  const { data: events } = await supabase
    .from('pending_notification_events')
    .select('*')
    .is('processed_at', null);

  if (events && events.length > 0) {
    console.log(`   Found ${events.length} pending events`);
  } else {
    console.log('   No pending events');
  }

  console.log('\n' + '='.repeat(60));
}

runPoll()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
