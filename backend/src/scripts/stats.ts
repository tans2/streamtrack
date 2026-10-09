/**
 * Scout activation & engagement snapshot.
 *
 *   npx ts-node src/scripts/stats.ts
 *
 * Answers the Phase 0 question: "is anyone actually using this?"
 *
 * Two caveats worth remembering when reading the output:
 *  - Engagement before migration 010 is a WRITE-based proxy. It counts users who
 *    changed something, and is blind to anyone who opened Scout just to look.
 *    last_seen_at fixes this going forward but cannot be backfilled.
 *  - user_shows.updated_at is overwritten in place, so the "recently active"
 *    numbers reflect only each user's most recent touch, never a history.
 */

import dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../services/database';

const DAY = 24 * 60 * 60 * 1000;
const since = (days: number) => new Date(Date.now() - days * DAY).toISOString();

function bar(n: number, total: number, width = 24): string {
  if (!total) return ''.padEnd(width, '·');
  const filled = Math.round((n / total) * width);
  return '█'.repeat(filled).padEnd(width, '·');
}

function pct(n: number, total: number): string {
  if (!total) return ' n/a';
  return `${Math.round((n / total) * 100)}%`.padStart(4);
}

async function countRows(table: string, column = '*'): Promise<number> {
  const { count, error } = await supabase.from(table).select(column, { count: 'exact', head: true });
  if (error) {
    console.error(`   ! ${table}: ${error.message}`);
    return 0;
  }
  return count || 0;
}

/** Distinct user_ids in a table. Fine at current scale; caps at 10k rows. */
async function distinctUsers(table: string): Promise<Set<string>> {
  const { data, error } = await supabase.from(table).select('user_id').limit(10000);
  if (error) {
    console.error(`   ! ${table}: ${error.message}`);
    return new Set();
  }
  return new Set((data || []).map((r: any) => r.user_id).filter(Boolean));
}

async function main() {
  const line = '='.repeat(62);
  console.log(`\n${line}\n  SCOUT — ACTIVATION & ENGAGEMENT SNAPSHOT\n  ${new Date().toISOString()}\n${line}`);

  // ---------- Signups ----------
  const totalUsers = await countRows('users', 'id');
  const { count: new7 } = await supabase
    .from('users').select('id', { count: 'exact', head: true }).gte('created_at', since(7));
  const { count: new30 } = await supabase
    .from('users').select('id', { count: 'exact', head: true }).gte('created_at', since(30));

  console.log('\n▸ SIGNUPS');
  console.log(`   Total users .............. ${totalUsers}`);
  console.log(`   New in last 7 days ....... ${new7 || 0}`);
  console.log(`   New in last 30 days ...... ${new30 || 0}`);

  // ---------- Activation funnel ----------
  const withShows = await distinctUsers('user_shows');
  const inGroups = await distinctUsers('watch_group_members');
  const withPicks = await distinctUsers('picks');

  console.log('\n▸ ACTIVATION FUNNEL  (share of all users)');
  console.log(`   Added a show ....... ${pct(withShows.size, totalUsers)}  ${bar(withShows.size, totalUsers)}  ${withShows.size}`);
  console.log(`   Joined a group ..... ${pct(inGroups.size, totalUsers)}  ${bar(inGroups.size, totalUsers)}  ${inGroups.size}`);
  console.log(`   Made a pick ........ ${pct(withPicks.size, totalUsers)}  ${bar(withPicks.size, totalUsers)}  ${withPicks.size}`);
  console.log('\n   Hypothesis to test: "joined a group" is the activation moment.');
  console.log('   If group members retain far better than non-members, onboarding');
  console.log('   should drive at a group rather than email verification.');

  // ---------- Groups: the growth unit ----------
  const totalGroups = await countRows('watch_groups', 'id');
  const { data: memberRows } = await supabase
    .from('watch_group_members').select('group_id').limit(10000);

  const perGroup = new Map<string, number>();
  (memberRows || []).forEach((r: any) => perGroup.set(r.group_id, (perGroup.get(r.group_id) || 0) + 1));
  const sizes = Array.from(perGroup.values());
  const avgSize = sizes.length ? (sizes.reduce((a, b) => a + b, 0) / sizes.length).toFixed(1) : '0';
  const multiMember = sizes.filter(s => s > 1).length;

  console.log('\n▸ WATCH GROUPS  (your growth unit)');
  console.log(`   Groups created ........... ${totalGroups}`);
  console.log(`   Average members/group .... ${avgSize}`);
  console.log(`   Groups with >1 member .... ${multiMember} of ${sizes.length}`);
  if (sizes.length && multiMember === 0) {
    console.log('   ⚠ Every group is a party of one — the social loop is not starting.');
  }

  // ---------- Engagement ----------
  console.log('\n▸ ENGAGEMENT');

  const { data: seenRows, error: seenErr } = await supabase
    .from('users').select('last_seen_at').not('last_seen_at', 'is', null).limit(10000);

  if (seenErr) {
    console.log('   last_seen_at not available — run migration 010 first.');
    console.log(`   (${seenErr.message})`);
  } else {
    const stamps = (seenRows || []).map((r: any) => new Date(r.last_seen_at).getTime());
    const activeWithin = (days: number) => stamps.filter(t => Date.now() - t < days * DAY).length;
    console.log(`   Seen in last 1 day ....... ${activeWithin(1)}`);
    console.log(`   Seen in last 7 days ...... ${activeWithin(7)}   ${pct(activeWithin(7), totalUsers)} of all users`);
    console.log(`   Seen in last 30 days ..... ${activeWithin(30)}   ${pct(activeWithin(30), totalUsers)} of all users`);
    console.log('   (Seeded from created_at by migration 010 — only meaningful');
    console.log('    once the app has been live with this tracking for a week.)');
  }

  const { data: touched } = await supabase
    .from('user_shows').select('user_id').gte('updated_at', since(7)).limit(10000);
  const writers7 = new Set((touched || []).map((r: any) => r.user_id)).size;
  console.log(`\n   Write-based proxy: ${writers7} user(s) changed a show in 7 days`);
  console.log('   Undercounts anyone who only browsed — treat as a floor.');

  // ---------- Referrals ----------
  const { count: referred } = await supabase
    .from('users').select('id', { count: 'exact', head: true }).not('referred_by_user_id', 'is', null);

  console.log('\n▸ REFERRALS');
  console.log(`   Users who arrived via a referral code .... ${referred || 0}`);
  console.log(`   Share of all signups .................... ${pct(referred || 0, totalUsers)}`);

  // ---------- Digest reach ----------
  const digests7 = await countRows('digest_log', 'id');
  console.log('\n▸ EMAIL');
  console.log(`   Digest emails logged (all time) .......... ${digests7}`);
  console.log('   Opens/clicks are NOT tracked here. Enable open + click tracking');
  console.log('   in the Resend dashboard — resend_message_id is already stored in');
  console.log('   digest_log, so engagement can then be joined back to users.');

  console.log(`\n${line}\n`);
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Stats failed:', err);
    process.exit(1);
  });
