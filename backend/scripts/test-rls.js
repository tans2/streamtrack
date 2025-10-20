// RLS verification script
// Run with: node scripts/test-rls.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceKey) {
  console.error('Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const anon = createClient(supabaseUrl, anonKey);
const service = createClient(supabaseUrl, serviceKey);

function logResult(label, ok, extra) {
  const status = ok ? 'PASS' : 'FAIL';
  console.log(`${ok ? '✅' : '❌'} ${status} - ${label}${extra ? ` ${extra}` : ''}`);
}

async function run() {
  console.log('🧪 Testing RLS policies...\n');

  // Prepare test show row
  const testTmdbId = 9999999;
  const testShow = {
    tmdb_id: testTmdbId,
    title: 'RLS Test Show',
    overview: 'Test row for RLS validation',
    status: 'planned',
    type: 'tv',
    genres: ['test'],
    rating: 0.0,
    popularity: 0.0,
  };

  // 1) With anon key: SELECT from shows should work (publicly readable)
  try {
    const { error } = await anon.from('shows').select('tmdb_id').limit(1);
    logResult('Anon SELECT from shows should succeed', !error);
    if (error) console.error(error);
  } catch (e) {
    logResult('Anon SELECT from shows should succeed', false, `(${e.message})`);
  }

  // 2) With anon key: INSERT into shows should fail (restricted to service role)
  try {
    const { error } = await anon.from('shows').insert(testShow).select().single();
    if (!error) {
      logResult('Anon INSERT into shows should fail', false, '(unexpectedly succeeded)');
    } else {
      logResult('Anon INSERT into shows should fail', true);
    }
  } catch (e) {
    // Supabase SDK may throw when RLS blocks write
    logResult('Anon INSERT into shows should fail', true);
  }

  // 3) With service role: UPSERT into shows should succeed
  let insertedRowId = null;
  try {
    const { data, error } = await service
      .from('shows')
      .upsert(testShow, { onConflict: 'tmdb_id' })
      .select()
      .single();
    const ok = !error && data && data.tmdb_id === testTmdbId;
    if (ok) insertedRowId = data.id;
    logResult('Service role UPSERT into shows should succeed', ok);
    if (error) console.error(error);
  } catch (e) {
    logResult('Service role UPSERT into shows should succeed', false, `(${e.message})`);
  }

  // 4) With anon key: SELECT from users should return 0 rows without JWT (filtered by RLS)
  try {
    const { data, error } = await anon.from('users').select('id').limit(1);
    const ok = !error && Array.isArray(data) && data.length === 0;
    logResult('Anon SELECT from users without JWT returns 0 rows (RLS filters)', ok);
    if (error) console.error(error);
  } catch (e) {
    logResult('Anon SELECT from users without JWT returns 0 rows (RLS filters)', false, `(${e.message})`);
  }

  // 5) With anon key: SELECT from user_shows should return 0 rows without JWT (filtered by RLS)
  try {
    const { data, error } = await anon.from('user_shows').select('user_id').limit(1);
    const ok = !error && Array.isArray(data) && data.length === 0;
    logResult('Anon SELECT from user_shows without JWT returns 0 rows (RLS filters)', ok);
    if (error) console.error(error);
  } catch (e) {
    logResult('Anon SELECT from user_shows without JWT returns 0 rows (RLS filters)', false, `(${e.message})`);
  }

  // Cleanup: delete test show using service role
  if (insertedRowId) {
    try {
      const { error } = await service.from('shows').delete().eq('tmdb_id', testTmdbId);
      logResult('Cleanup: delete test show with service role', !error);
      if (error) console.error(error);
    } catch (e) {
      logResult('Cleanup: delete test show with service role', false, `(${e.message})`);
    }
  }

  console.log('\n🎉 RLS test complete.');
}

run().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});


