/**
 * Manually run the daily digest
 * Run with: npx ts-node src/scripts/run-digest.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { NotificationService } from '../services/notification';
import { supabase } from '../services/database';

async function runDigest() {
  console.log('='.repeat(60));
  console.log('RUNNING DAILY DIGEST');
  console.log('='.repeat(60));

  // Check pending events before
  console.log('\n📬 Pending events BEFORE digest:');
  const { data: eventsBefore } = await supabase
    .from('pending_notification_events')
    .select('*, users!inner(email)')
    .is('processed_at', null);

  if (eventsBefore && eventsBefore.length > 0) {
    console.log(`   Found ${eventsBefore.length} pending events:`);
    eventsBefore.forEach((e: any) => {
      console.log(`   - [${e.event_type}] "${e.show_title}" S${e.season_number}E${e.episode_number} → ${e.users?.email}`);
    });
  } else {
    console.log('   No pending events');
    return;
  }

  // Run the digest
  console.log('\n📧 Sending daily digests...');
  const results = await NotificationService.sendDailyDigests();

  console.log('\n✅ Results:');
  console.log(`   Users emailed: ${results.usersEmailed}`);
  console.log(`   Events sent: ${results.eventsSent}`);
  if (results.errors.length > 0) {
    console.log(`   Errors: ${results.errors.join(', ')}`);
  }

  // Check pending events after
  console.log('\n📬 Pending events AFTER digest:');
  const { data: eventsAfter } = await supabase
    .from('pending_notification_events')
    .select('*')
    .is('processed_at', null);

  console.log(`   ${eventsAfter?.length || 0} events remaining`);

  console.log('\n' + '='.repeat(60));
}

runDigest()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
