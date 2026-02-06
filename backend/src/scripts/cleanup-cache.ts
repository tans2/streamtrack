/**
 * Clean up future episodes from the cache
 * Run with: npx ts-node src/scripts/cleanup-cache.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../services/database';

async function cleanupCache() {
  console.log('='.repeat(60));
  console.log('CLEANING UP FUTURE EPISODES FROM CACHE');
  console.log('='.repeat(60));

  const today = new Date().toISOString().split('T')[0];
  console.log(`\n📅 Today's date: ${today}`);
  console.log(`   Deleting episodes with air_date > ${today}`);

  // Count before
  const { count: totalBefore } = await supabase
    .from('episode_cache')
    .select('*', { count: 'exact', head: true });

  const { count: futureBefore } = await supabase
    .from('episode_cache')
    .select('*', { count: 'exact', head: true })
    .gt('air_date', today);

  console.log(`\n📊 BEFORE cleanup:`);
  console.log(`   Total episodes in cache: ${totalBefore}`);
  console.log(`   Future episodes to delete: ${futureBefore}`);

  // Delete future episodes
  const { data: deleted, error } = await supabase
    .from('episode_cache')
    .delete()
    .gt('air_date', today)
    .select();

  if (error) {
    console.log(`\n❌ Error: ${error.message}`);
    return;
  }

  console.log(`\n✅ Deleted ${deleted?.length || 0} future episodes`);

  // Show some examples of what was deleted
  if (deleted && deleted.length > 0) {
    console.log(`\n📋 Sample of deleted episodes:`);
    const samples = deleted.slice(0, 10);
    for (const ep of samples) {
      // Get show title
      const { data: show } = await supabase
        .from('shows')
        .select('title')
        .eq('id', ep.show_id)
        .single();

      console.log(`   - "${show?.title || 'Unknown'}" S${ep.season_number}E${ep.episode_number} (${ep.air_date})`);
    }
    if (deleted.length > 10) {
      console.log(`   ... and ${deleted.length - 10} more`);
    }
  }

  // Count after
  const { count: totalAfter } = await supabase
    .from('episode_cache')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 AFTER cleanup:`);
  console.log(`   Total episodes in cache: ${totalAfter}`);

  console.log('\n' + '='.repeat(60));
}

cleanupCache()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
