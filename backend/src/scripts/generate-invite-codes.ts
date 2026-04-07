/**
 * Generates beta invite codes and inserts them into the beta_invites table.
 *
 * Usage:
 *   npx ts-node src/scripts/generate-invite-codes.ts [count] [--email user@example.com]
 *
 * Examples:
 *   npx ts-node src/scripts/generate-invite-codes.ts 50
 *   npx ts-node src/scripts/generate-invite-codes.ts 1 --email friend@example.com
 */

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateCode(): string {
  // 8 uppercase alphanumeric characters, easy to type
  return crypto.randomBytes(5).toString('hex').toUpperCase().slice(0, 8);
}

async function main() {
  const args = process.argv.slice(2);
  const count = parseInt(args[0]) || 10;
  const emailIdx = args.indexOf('--email');
  const email = emailIdx !== -1 ? args[emailIdx + 1] : null;

  const codes = Array.from({ length: count }, () => ({
    code: generateCode(),
    email: email || null,
  }));

  const { data, error } = await supabase
    .from('beta_invites')
    .insert(codes)
    .select('code');

  if (error) {
    console.error('Error inserting codes:', error.message);
    process.exit(1);
  }

  console.log(`\n✅ Generated ${data.length} invite code${data.length !== 1 ? 's' : ''}:\n`);
  data.forEach(({ code }) => console.log(`  ${code}`));
  console.log('');
}

main();
