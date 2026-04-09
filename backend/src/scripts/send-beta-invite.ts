/**
 * Send private beta invite emails.
 *
 * Usage:
 *   npx ts-node src/scripts/send-beta-invite.ts
 *
 * Edit the RECIPIENTS list and BODY below before running.
 * Set DRY_RUN=true to preview without sending.
 */

import dotenv from 'dotenv';
dotenv.config();

import { EmailService } from '../services/email';

const DRY_RUN = process.env.DRY_RUN === 'true';

// ─── Edit your recipients here ───────────────────────────────────────────────
const RECIPIENTS: Array<{ name: string; email: string }> = [
  // { name: 'Lisa Bayindirli', email: 'lisabayindirli@gmail.com' },
  // { name: 'Amy Van Liew', email: 'vanliewamy@gmail.com' },
  // { name: 'Noah Bayindirli', email: 'noahbay7@gmail.com' },
  // { name: 'Owen Bayindirli', email: 'obayindirli@live.com' },
  // { name: 'Sophie Greenspon', email: 'sophk.green@gmail.com' },
  { name: 'Stephanie Tan', email: 'stephanietan616@gmail.com' },
  // { name: 'Michael Mahoney', email: 'michael.mahoney@microsoft.com' },
  // { name: 'TJ Guyton', email: 'tguyton@figma.com' },
  // { name: 'Kevin Boyle', email: 'kevincba17@gmail.com' },
];
// ─────────────────────────────────────────────────────────────────────────────

// ─── Edit your email body here ────────────────────────────────────────────────
const bodyHtml = `
  <p style="margin: 14px 0 18px 0; font-size: 15px; color: #444; line-height: 1.75;">
    <strong>(tldr: Try out Scout <a href="https://tvscout.vercel.app/" style="color: #CC5500;">here</a> and send feedback here in this thread. Thank you for your time and support (: )</strong>
  </p>

  <p style="margin: 14px 0; font-size: 15px; color: #555; line-height: 1.75;">
    If you have a few extra minutes, I'd love to tell you a little bit more about Scout ~
  </p>

  <p style="margin: 14px 0; font-size: 15px; color: #555; line-height: 1.75;">
    If you've ever gone to dinner with friends to find out they're all five episodes deep into something you didn't even know came back, this app is for you.
  </p>

  <p style="margin: 14px 0; font-size: 15px; color: #555; line-height: 1.75;">
    That's why I built Scout. No more commercials on cable to keep you in the loop. Shows just drop and life moves fast and suddenly you're the only one who hasn't seen it. I got tired of that feeling, and I heard enough people say the same thing that I figured it was worth building something to solve it.
  </p>

  <p style="margin: 14px 0; font-size: 15px; color: #555; line-height: 1.75;">
    Whether you're someone I know personally or someone who saw my LinkedIn post and thought "yeah, I could use that", the fact that you're here based on the idea itself and taking the time to try it out is something I can't thank you enough for.
  </p>

  <p style="margin: 24px 0 6px 0; font-size: 15px; color: #333; line-height: 1.75;">
    <strong>(Here's what Scout can do for you right now)</strong>
  </p>

  <p style="margin: 6px 0 14px 0; font-size: 15px; color: #555; line-height: 1.75;">
    Search any show and find out exactly where it's streaming. Add it to your personal watchlist and track where you're at. Turn on drop alerts and Scout will email you when a new season or episode lands. No more finding out late. If you want to watch something with friends or family, create a watch group so everyone can see where each other is at, catch up to debrief without spoilers, or plan a watch party.
  </p>

  <p style="margin: 14px 0; font-size: 15px; color: #555; line-height: 1.75;">
    Think of Scout as your TV sidekick. Scout keeps track of everything so you don't have to.
  </p>

  <p style="margin: 24px 0 6px 0; font-size: 15px; color: #333; line-height: 1.75;">
    <strong>(A small bonus)</strong>
  </p>

  <p style="margin: 6px 0 14px 0; font-size: 15px; color: #555; line-height: 1.75;">
    You also have something a little special in your hands right now, 5 invites to share with whoever you want watching alongside you (sent separately). The people you invite get private beta access, same as you. Choose your watch group well. Everyone who shares Scout during this beta period becomes an Original Scouter, a founding member badge that sticks around after we open the doors to everyone.
  </p>

  <p style="margin: 24px 0 6px 0; font-size: 15px; color: #333; line-height: 1.75;">
    <strong>(What's to come)</strong>
  </p>

  <p style="margin: 6px 0 14px 0; font-size: 15px; color: #555; line-height: 1.75;">
    This is the beginning. There's a lot more coming: show recommendations between friends, a deeper social layer that makes watching feel more connected without turning into another social media app. I want Scout to bring some genuine joy to something people already love doing. You're part of figuring out what that looks like.
  </p>

  <p style="margin: 14px 0; font-size: 15px; color: #555; line-height: 1.75;">
    Which brings me to one ask: tell me what you think. What's working, what's confusing, what's missing, what made you actually smile. I'm still building this and your experience right now shapes what Scout becomes. You can just reply to this email, I promise to read everything.
  </p>

  <p style="margin: 14px 0 10px 0; font-size: 15px; color: #555; line-height: 1.75;">
    Now, dive in: <a href="https://tvscout.vercel.app/" style="color: #CC5500; font-weight: 600;">tvscout.vercel.app</a>
  </p>

  <p style="margin: 10px 0 6px 0; font-size: 15px; color: #555; line-height: 1.75;">
    Thanks for being here. :)
  </p>

  <p style="margin: 6px 0; font-size: 15px; color: #555; line-height: 1.75;">
    Talk soon,<br>
    Stephanie<br>
    <span style="color: #999; font-size: 13px;">Founder, Scout</span>
  </p>
`;

const bodyText = `
(tldr: Try out Scout here — https://tvscout.vercel.app/ — and send feedback here in this thread. Thank you for your time and support :)

If you have a few extra minutes, I'd love to tell you a little bit more about Scout ~

If you've ever gone to dinner with friends to find out they're all five episodes deep into something you didn't even know came back, this app is for you.

That's why I built Scout. No more commercials on cable to keep you in the loop. Shows just drop and life moves fast and suddenly you're the only one who hasn't seen it. I got tired of that feeling, and I heard enough people say the same thing that I figured it was worth building something to solve it.

Whether you're someone I know personally or someone who saw my LinkedIn post and thought "yeah, I could use that", the fact that you're here based on the idea itself and taking the time to try it out is something I can't thank you enough for.

(Here's what Scout can do for you right now)

Search any show and find out exactly where it's streaming. Add it to your personal watchlist and track where you're at. Turn on drop alerts and Scout will email you when a new season or episode lands. No more finding out late. If you want to watch something with friends or family, create a watch group so everyone can see where each other is at, catch up to debrief without spoilers, or plan a watch party.

Think of Scout as your TV sidekick. Scout keeps track of everything so you don't have to.

(A small bonus)

You also have something a little special in your hands right now, 5 invites to share with whoever you want watching alongside you (sent separately). The people you invite get private beta access, same as you. Choose your watch group well. Everyone who shares Scout during this beta period becomes an Original Scouter, a founding member badge that sticks around after we open the doors to everyone.

(What's to come)

This is the beginning. There's a lot more coming: show recommendations between friends, a deeper social layer that makes watching feel more connected without turning into another social media app. I want Scout to bring some genuine joy to something people already love doing. You're part of figuring out what that looks like.

Which brings me to one ask: tell me what you think. What's working, what's confusing, what's missing, what made you actually smile. I'm still building this and your experience right now shapes what Scout becomes. You can just reply to this email, I promise to read everything.

Now, dive in: https://tvscout.vercel.app/

Thanks for being here. :)

Talk soon,
Stephanie
Founder, Scout
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
