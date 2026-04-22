/**
 * Send private beta invite emails.
 *
 * Setup:
 *   cp src/scripts/send-beta-invite.example.ts src/scripts/send-beta-invite.ts
 *   # Edit RECIPIENTS and body content in the copy
 *   # send-beta-invite.ts is gitignored — your recipient list stays local
 *
 * Usage:
 *   DRY_RUN=true npx ts-node src/scripts/send-beta-invite.ts   # preview only
 *   npx ts-node src/scripts/send-beta-invite.ts                # send for real
 */

import dotenv from 'dotenv';
dotenv.config();

import { EmailService } from '../services/email';

const DRY_RUN = process.env.DRY_RUN === 'true';

// ─── Edit your recipients here ───────────────────────────────────────────────
const RECIPIENTS: Array<{ name: string; email: string }> = [
  // { name: 'Jane Smith', email: 'jane@example.com' },
];
// ─────────────────────────────────────────────────────────────────────────────

// ─── Edit your email body here ────────────────────────────────────────────────
// bodyHtml: shown inside the white card, after the greeting line.
// Use inline styles only — email clients strip <style> tags.
const bodyHtml = `
  <p style="margin: 12px 0; font-size: 15px; color: #555; line-height: 1.7;">
    <!-- YOUR CONTENT HERE -->
  </p>
`;

// bodyText: plain-text fallback (no HTML tags).
const bodyText = `
YOUR CONTENT HERE
`.trim();
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  if (RECIPIENTS.length === 0) {
    console.error('No recipients defined. Edit the RECIPIENTS array in this script.');
    process.exit(1);
  }

  console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Sending beta invites to ${RECIPIENTS.length} recipient(s)...\n`);

  let success = 0;
  let failed = 0;

  for (const recipient of RECIPIENTS) {
    if (DRY_RUN) {
      console.log(`[DRY RUN] Would send to: ${recipient.name} <${recipient.email}>`);
      success++;
      continue;
    }

    const result = await EmailService.sendBetaInvite(
      recipient.email,
      recipient.name,
      bodyHtml,
      bodyText
    );

    if (result.success) {
      console.log(`✓ Sent to ${recipient.name} <${recipient.email}> — messageId: ${result.messageId}`);
      success++;
    } else {
      console.error(`✗ Failed for ${recipient.email}: ${result.error}`);
      failed++;
    }

    // Small delay to stay within Resend rate limits
    if (!DRY_RUN) await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nDone. ${success} sent, ${failed} failed.`);
}

main().catch(console.error);
