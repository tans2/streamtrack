import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Email sender configuration
const FROM_EMAIL = process.env.EMAIL_FROM || 'Scout <notifications@scout.stephaniet.dev>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  // Check if email service is configured
  static isConfigured(): boolean {
    return !!resend;
  }

  // Send email verification
  static async sendVerificationEmail(
    to: string,
    name: string,
    token: string
  ): Promise<EmailResult> {
    if (!resend) {
      console.warn('Email service not configured - RESEND_API_KEY missing');
      return { success: false, error: 'Email service not configured' };
    }

    const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [to],
        subject: 'Verify your email for Scout',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #CC5500; margin: 0;">Scout</h1>
              <p style="color: #666; margin: 5px 0;">Track Your Shows</p>
            </div>

            <div style="background: #f9fafb; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
              <h2 style="margin-top: 0;">Hey ${name || 'there'}!</h2>
              <p>Thanks for signing up for Scout. To start receiving notifications about your favorite shows, please verify your email address.</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" style="background: #CC5500; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">
                  Verify Email
                </a>
              </div>

              <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="color: #CC5500; font-size: 14px; word-break: break-all;">${verifyUrl}</p>
            </div>

            <p style="color: #999; font-size: 12px; text-align: center;">
              If you didn't sign up for Scout, you can safely ignore this email.
            </p>
          </body>
          </html>
        `,
        text: `
Hey ${name || 'there'}!

Thanks for signing up for Scout. To start receiving notifications about your favorite shows, please verify your email address.

Click this link to verify: ${verifyUrl}

If you didn't sign up for Scout, you can safely ignore this email.
        `.trim()
      });

      if (error) {
        console.error('Resend error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.id };
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      return { success: false, error: error.message || 'Failed to send email' };
    }
  }

  // Send new episode notification
  static async sendNewEpisodeNotification(
    to: string,
    name: string,
    showTitle: string,
    seasonNumber: number,
    episodeNumber: number,
    episodeTitle: string | null,
    posterUrl: string | null
  ): Promise<EmailResult> {
    if (!resend) {
      console.warn('Email service not configured - RESEND_API_KEY missing');
      return { success: false, error: 'Email service not configured' };
    }

    const episodeInfo = episodeTitle
      ? `S${seasonNumber}E${episodeNumber}: "${episodeTitle}"`
      : `Season ${seasonNumber}, Episode ${episodeNumber}`;

    const posterImage = posterUrl
      ? `https://image.tmdb.org/t/p/w200${posterUrl}`
      : null;

    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [to],
        subject: `New Episode: ${showTitle} - ${episodeInfo}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #CC5500; margin: 0;">Scout</h1>
              <p style="color: #666; margin: 5px 0;">New Episode Alert</p>
            </div>

            <div style="background: #f9fafb; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
              <table style="width: 100%;">
                <tr>
                  ${posterImage ? `
                  <td style="width: 100px; vertical-align: top; padding-right: 20px;">
                    <img src="${posterImage}" alt="${showTitle}" style="width: 100px; border-radius: 6px;">
                  </td>
                  ` : ''}
                  <td style="vertical-align: top;">
                    <h2 style="margin: 0 0 10px 0; color: #CC5500;">${showTitle}</h2>
                    <p style="margin: 0; font-size: 18px; font-weight: 500;">${episodeInfo}</p>
                    <p style="margin: 10px 0 0 0; color: #666;">A new episode is now available!</p>
                  </td>
                </tr>
              </table>

              <div style="text-align: center; margin-top: 25px;">
                <a href="${FRONTEND_URL}/profile" style="background: #CC5500; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">
                  View in Scout
                </a>
              </div>
            </div>

            <p style="color: #999; font-size: 12px; text-align: center;">
              You're receiving this because you have notifications enabled for ${showTitle}.<br>
              <a href="${FRONTEND_URL}/settings" style="color: #CC5500;">Manage notification preferences</a>
            </p>
          </body>
          </html>
        `,
        text: `
New Episode Available!

${showTitle}
${episodeInfo}

A new episode is now available! Open Scout to update your watch progress.

${FRONTEND_URL}/profile

---
You're receiving this because you have notifications enabled for ${showTitle}.
Manage your preferences: ${FRONTEND_URL}/settings
        `.trim()
      });

      if (error) {
        console.error('Resend error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.id };
    } catch (error: any) {
      console.error('Error sending new episode notification:', error);
      return { success: false, error: error.message || 'Failed to send email' };
    }
  }

  // Send season premiere notification
  static async sendSeasonPremiereNotification(
    to: string,
    name: string,
    showTitle: string,
    seasonNumber: number,
    premiereDate: string | null,
    posterUrl: string | null
  ): Promise<EmailResult> {
    if (!resend) {
      console.warn('Email service not configured - RESEND_API_KEY missing');
      return { success: false, error: 'Email service not configured' };
    }

    const posterImage = posterUrl
      ? `https://image.tmdb.org/t/p/w200${posterUrl}`
      : null;

    const dateInfo = premiereDate
      ? `premiering ${new Date(premiereDate).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })}`
      : 'coming soon';

    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [to],
        subject: `Season ${seasonNumber} of ${showTitle} is here!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #CC5500; margin: 0;">Scout</h1>
              <p style="color: #666; margin: 5px 0;">Season Premiere Alert</p>
            </div>

            <div style="background: linear-gradient(135deg, #CC5500 0%, #993D00 100%); border-radius: 8px; padding: 30px; margin-bottom: 20px; color: white;">
              <table style="width: 100%;">
                <tr>
                  ${posterImage ? `
                  <td style="width: 100px; vertical-align: top; padding-right: 20px;">
                    <img src="${posterImage}" alt="${showTitle}" style="width: 100px; border-radius: 6px;">
                  </td>
                  ` : ''}
                  <td style="vertical-align: top;">
                    <p style="margin: 0; font-size: 14px; opacity: 0.9;">NEW SEASON</p>
                    <h2 style="margin: 5px 0 10px 0; color: white;">${showTitle}</h2>
                    <p style="margin: 0; font-size: 24px; font-weight: 700;">Season ${seasonNumber}</p>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">${dateInfo}</p>
                  </td>
                </tr>
              </table>

              <div style="text-align: center; margin-top: 25px;">
                <a href="${FRONTEND_URL}/profile" style="background: white; color: #CC5500; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">
                  View in Scout
                </a>
              </div>
            </div>

            <p style="color: #999; font-size: 12px; text-align: center;">
              You're receiving this because you have notifications enabled for ${showTitle}.<br>
              <a href="${FRONTEND_URL}/settings" style="color: #CC5500;">Manage notification preferences</a>
            </p>
          </body>
          </html>
        `,
        text: `
New Season Alert!

${showTitle}
Season ${seasonNumber} - ${dateInfo}

A new season is available! Open Scout to start tracking your progress.

${FRONTEND_URL}/profile

---
You're receiving this because you have notifications enabled for ${showTitle}.
Manage your preferences: ${FRONTEND_URL}/settings
        `.trim()
      });

      if (error) {
        console.error('Resend error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.id };
    } catch (error: any) {
      console.error('Error sending season premiere notification:', error);
      return { success: false, error: error.message || 'Failed to send email' };
    }
  }

  // Send password reset email
  static async sendPasswordResetEmail(
    to: string,
    name: string,
    token: string
  ): Promise<EmailResult> {
    if (!resend) {
      console.warn('Email service not configured - RESEND_API_KEY missing');
      return { success: false, error: 'Email service not configured' };
    }

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [to],
        subject: 'Reset your Scout password',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #CC5500; margin: 0;">Scout</h1>
              <p style="color: #666; margin: 5px 0;">Password Reset</p>
            </div>

            <div style="background: #f9fafb; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
              <h2 style="margin-top: 0;">Hey ${name || 'there'}!</h2>
              <p>We received a request to reset your password. Click the button below to create a new password.</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: #CC5500; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">
                  Reset Password
                </a>
              </div>

              <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="color: #CC5500; font-size: 14px; word-break: break-all;">${resetUrl}</p>

              <p style="color: #dc2626; font-size: 14px; margin-top: 20px;">
                <strong>This link expires in 1 hour.</strong>
              </p>
            </div>

            <p style="color: #999; font-size: 12px; text-align: center;">
              If you didn't request a password reset, you can safely ignore this email.<br>
              Your password will remain unchanged.
            </p>
          </body>
          </html>
        `,
        text: `
Hey ${name || 'there'}!

We received a request to reset your password. Click the link below to create a new password:

${resetUrl}

This link expires in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        `.trim()
      });

      if (error) {
        console.error('Resend error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.id };
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message || 'Failed to send email' };
    }
  }

  // Send private beta invite email
  static async sendBetaInvite(
    to: string,
    name: string,
    bodyHtml: string,
    bodyText: string
  ): Promise<EmailResult> {
    if (!resend) {
      console.warn('Email service not configured - RESEND_API_KEY missing');
      return { success: false, error: 'Email service not configured' };
    }

    // Beta invite always uses production URL since it's run locally
    const BETA_APP_URL = 'https://tvscout.vercel.app';

    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [to],
        subject: `Scout Private Beta Access`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #fafafa;">

            <!-- Header -->
            <div style="text-align: center; padding: 28px 0 20px 0;">
              <table style="margin: 0 auto;"><tr>
                <td style="vertical-align: middle; padding-right: 10px;">
                  <img src="${BETA_APP_URL}/logo.png" alt="Scout" width="36" height="36" style="display: block; border-radius: 8px;">
                </td>
                <td style="vertical-align: middle;">
                  <span style="color: #CC5500; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Scout</span>
                </td>
              </tr></table>
            </div>

            <!-- Hero -->
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d1200 100%); border-radius: 12px; padding: 36px 32px; margin-bottom: 20px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; letter-spacing: 3px; color: #CC5500; text-transform: uppercase;">Private Beta</p>
              <h1 style="margin: 0 0 12px 0; font-size: 28px; font-weight: 700; color: #ffffff; line-height: 1.2;">Your TV sidekick is ready.</h1>
              <p style="margin: 0; font-size: 15px; color: #aaa; line-height: 1.6;">Track every show, never miss a drop, and watch in sync with friends.</p>
            </div>

            <!-- Body -->
            <div style="background: #ffffff; border-radius: 12px; padding: 32px; margin-bottom: 20px; border: 1px solid #eee;">
              <p style="margin: 0 0 4px 0; font-size: 16px; color: #333;">Hey ${name || 'there'},</p>

              ${bodyHtml}

              <!-- CTA -->
              <div style="text-align: center; margin-top: 32px;">
                <a href="${BETA_APP_URL}" style="background: #CC5500; color: white; padding: 14px 40px; border-radius: 100px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; letter-spacing: 0.2px;">
                  Open Scout →
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding: 8px 0 20px 0;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #bbb;">
                Stephanie Tan &nbsp;·&nbsp;
                <a href="${BETA_APP_URL}" style="color: #bbb; text-decoration: none;">scout.stephaniet.dev</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #ccc;">
                You're receiving this because you signed up for Scout's private beta.<br>
                No longer interested? Just reply to this email and I'll remove you.
              </p>
            </div>

          </body>
          </html>
        `,
        text: `
Hey ${name || 'there'},

${bodyText}

Open Scout: ${BETA_APP_URL}

---
Stephanie Tan · scout.stephaniet.dev
You're receiving this because you signed up for Scout's private beta.
No longer interested? Just reply to this email and I'll remove you.
        `.trim()
      });

      if (error) {
        console.error('Resend error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.id };
    } catch (error: any) {
      console.error('Error sending beta invite:', error);
      return { success: false, error: error.message || 'Failed to send email' };
    }
  }

  // Send daily digest notification email
  static async sendDailyDigest(
    to: string,
    name: string,
    digestData: {
      newEpisodes: Array<{
        showTitle: string;
        posterPath: string | null;
        showId: string;
        providers?: string | null;
        episodeSummary: string;
        latestSeason: number;
        latestEpisode: number;
      }>;
      newSeasons: Array<{
        showTitle: string;
        posterPath: string | null;
        seasonNumber: number;
        airDate: string | null;
        showId: string;
        providers?: string | null;
      }>;
      upcomingReleases: Array<{
        showTitle: string;
        posterPath: string | null;
        airDate: string;
        episodeInfo: string;
        showId: string;
        providers?: string | null;
      }>;
      groupActivity?: Array<{
        showTitle: string;
        posterPath: string | null;
        memberUpdate: string;
        showId: string;
      }>;
    }
  ): Promise<EmailResult> {
    if (!resend) {
      console.warn('Email service not configured - RESEND_API_KEY missing');
      return { success: false, error: 'Email service not configured' };
    }

    const { newEpisodes, newSeasons, upcomingReleases, groupActivity = [] } = digestData;
    const totalUpdates = newEpisodes.length + newSeasons.length + upcomingReleases.length + groupActivity.length;

    if (totalUpdates === 0) {
      return { success: false, error: 'No events to include in digest' };
    }

    const subject = totalUpdates === 1
      ? '1 update from your watchlist today'
      : `${totalUpdates} updates from your watchlist today`;

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    // Build new episodes section (grouped by show)
    const newEpisodesHtml = newEpisodes.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #CC5500; margin: 0 0 15px 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #CC5500; padding-bottom: 8px;">New Episodes</h3>
        ${newEpisodes.map(ep => {
          const posterImage = ep.posterPath ? `https://image.tmdb.org/t/p/w200${ep.posterPath}` : null;
          const updateUrl = `${FRONTEND_URL}/profile?action=update&showId=${ep.showId}&season=${ep.latestSeason}&episode=${ep.latestEpisode}`;
          const viewUrl = `${FRONTEND_URL}/profile?showId=${ep.showId}`;
          const platformInfo = ep.providers ? `<p style="margin: 0 0 8px 0; font-size: 12px; color: #888;">Available on: ${ep.providers}</p>` : '';

          return `
            <table style="width: 100%; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
              <tr>
                ${posterImage ? `
                <td style="width: 60px; vertical-align: top; padding-right: 15px;">
                  <img src="${posterImage}" alt="${ep.showTitle}" style="width: 60px; border-radius: 4px;">
                </td>
                ` : ''}
                <td style="vertical-align: top;">
                  <p style="margin: 0 0 4px 0; font-weight: 600; font-size: 15px; color: #333;">${ep.showTitle}</p>
                  <p style="margin: 0 0 4px 0; font-size: 14px; color: #666;">${ep.episodeSummary}</p>
                  ${platformInfo}
                  <div>
                    <a href="${updateUrl}" style="background: #CC5500; color: white; padding: 6px 16px; border-radius: 4px; text-decoration: none; font-size: 13px; font-weight: 500; display: inline-block; margin-right: 8px;">Update Status</a>
                    <a href="${viewUrl}" style="color: #CC5500; text-decoration: none; font-size: 13px; font-weight: 500;">View Show</a>
                  </div>
                </td>
              </tr>
            </table>
          `;
        }).join('')}
      </div>
    ` : '';

    // Build new seasons section
    const newSeasonsHtml = newSeasons.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #CC5500; margin: 0 0 15px 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #CC5500; padding-bottom: 8px;">New Seasons</h3>
        ${newSeasons.map(season => {
          const posterImage = season.posterPath ? `https://image.tmdb.org/t/p/w200${season.posterPath}` : null;
          const dateInfo = season.airDate
            ? new Date(season.airDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : 'Now available';
          const viewUrl = `${FRONTEND_URL}/profile?showId=${season.showId}`;
          const platformInfo = season.providers ? `<p style="margin: 0 0 8px 0; font-size: 12px; color: #888;">Available on: ${season.providers}</p>` : '';

          return `
            <table style="width: 100%; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
              <tr>
                ${posterImage ? `
                <td style="width: 60px; vertical-align: top; padding-right: 15px;">
                  <img src="${posterImage}" alt="${season.showTitle}" style="width: 60px; border-radius: 4px;">
                </td>
                ` : ''}
                <td style="vertical-align: top;">
                  <p style="margin: 0 0 4px 0; font-weight: 600; font-size: 15px; color: #333;">${season.showTitle}</p>
                  <p style="margin: 0 0 4px 0; font-size: 14px; color: #666;">Season ${season.seasonNumber}</p>
                  <p style="margin: 0 0 4px 0; font-size: 13px; color: #999;">${dateInfo}</p>
                  ${platformInfo}
                  <a href="${viewUrl}" style="color: #CC5500; text-decoration: none; font-size: 13px; font-weight: 500;">View Show</a>
                </td>
              </tr>
            </table>
          `;
        }).join('')}
      </div>
    ` : '';

    // Build upcoming releases section
    const upcomingHtml = upcomingReleases.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #CC5500; margin: 0 0 15px 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #CC5500; padding-bottom: 8px;">Coming Up (Next 2 Weeks)</h3>
        ${upcomingReleases.map(upcoming => {
          const posterImage = upcoming.posterPath ? `https://image.tmdb.org/t/p/w200${upcoming.posterPath}` : null;
          const dateStr = new Date(upcoming.airDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          const viewUrl = `${FRONTEND_URL}/profile?showId=${upcoming.showId}`;
          const platformText = upcoming.providers ? ` on ${upcoming.providers}` : '';

          return `
            <table style="width: 100%; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 12px;">
              <tr>
                ${posterImage ? `
                <td style="width: 40px; vertical-align: top; padding-right: 12px;">
                  <img src="${posterImage}" alt="${upcoming.showTitle}" style="width: 40px; border-radius: 4px;">
                </td>
                ` : ''}
                <td style="vertical-align: top;">
                  <p style="margin: 0; font-size: 14px;">
                    <a href="${viewUrl}" style="color: #333; text-decoration: none; font-weight: 600;">${upcoming.showTitle}</a>
                    <span style="color: #999;"> &middot; </span>
                    <span style="color: #666; font-size: 13px;">${upcoming.episodeInfo}</span>
                  </p>
                  <p style="margin: 2px 0 0 0; font-size: 12px; color: #CC5500; font-weight: 500;">${dateStr}${platformText}</p>
                </td>
              </tr>
            </table>
          `;
        }).join('')}
      </div>
    ` : '';

    // Build group activity section
    const groupActivityHtml = groupActivity.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #CC5500; margin: 0 0 15px 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #CC5500; padding-bottom: 8px;">Watch Group Activity</h3>
        ${groupActivity.map(activity => {
          const posterImage = activity.posterPath ? `https://image.tmdb.org/t/p/w200${activity.posterPath}` : null;
          const viewUrl = `${FRONTEND_URL}/profile?showId=${activity.showId}`;

          return `
            <table style="width: 100%; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 12px;">
              <tr>
                ${posterImage ? `
                <td style="width: 40px; vertical-align: top; padding-right: 12px;">
                  <img src="${posterImage}" alt="${activity.showTitle}" style="width: 40px; border-radius: 4px;">
                </td>
                ` : ''}
                <td style="vertical-align: top;">
                  <p style="margin: 0; font-size: 14px;">
                    <a href="${viewUrl}" style="color: #333; text-decoration: none; font-weight: 600;">${activity.showTitle}</a>
                  </p>
                  <p style="margin: 2px 0 0 0; font-size: 13px; color: #666;">${activity.memberUpdate}</p>
                </td>
              </tr>
            </table>
          `;
        }).join('')}
      </div>
    ` : '';

    // Build plaintext version
    const plaintext = [
      `Hey ${name}! Here's your watchlist update for ${today}.`,
      '',
      ...(newEpisodes.length > 0 ? [
        '--- NEW EPISODES ---',
        ...newEpisodes.map(ep => {
          const platform = ep.providers ? ` (on ${ep.providers})` : '';
          return `${ep.showTitle} - ${ep.episodeSummary}${platform}`;
        }),
        ''
      ] : []),
      ...(newSeasons.length > 0 ? [
        '--- NEW SEASONS ---',
        ...newSeasons.map(s => {
          const platform = s.providers ? ` (on ${s.providers})` : '';
          return `${s.showTitle} - Season ${s.seasonNumber}${platform}`;
        }),
        ''
      ] : []),
      ...(upcomingReleases.length > 0 ? [
        '--- COMING UP (NEXT 2 WEEKS) ---',
        ...upcomingReleases.map(u => {
          const dateStr = new Date(u.airDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const platform = u.providers ? ` on ${u.providers}` : '';
          return `${u.showTitle} - ${u.episodeInfo} (${dateStr}${platform})`;
        }),
        ''
      ] : []),
      ...(groupActivity && groupActivity.length > 0 ? [
        '--- WATCH GROUP ACTIVITY ---',
        ...groupActivity.map(a => `${a.showTitle} - ${a.memberUpdate}`),
        ''
      ] : []),
      `View your watchlist: ${FRONTEND_URL}/profile`,
      `Manage preferences: ${FRONTEND_URL}/settings`
    ].join('\n');

    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #fafafa;">
            <div style="text-align: center; margin-bottom: 24px;">
              <table style="margin: 0 auto;"><tr>
                <td style="vertical-align: middle; padding-right: 10px;">
                  <img src="${FRONTEND_URL}/logo.png" alt="Scout" width="36" height="36" style="display: block; border-radius: 6px;">
                </td>
                <td style="vertical-align: middle;">
                  <h1 style="color: #CC5500; margin: 0; font-size: 28px; line-height: 1;">Scout</h1>
                </td>
              </tr></table>
              <p style="color: #999; margin: 8px 0 0 0; font-size: 13px;">Watchlist Digest</p>
            </div>

            <div style="background: #ffffff; border-radius: 8px; padding: 30px; margin-bottom: 20px; border: 1px solid #eee;">
              <p style="margin: 0 0 20px 0; font-size: 15px; color: #666;">
                Hey ${name}! Here's what's happening with your shows today.
              </p>

              ${newEpisodesHtml}
              ${newSeasonsHtml}
              ${upcomingHtml}
              ${groupActivityHtml}

              <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                <a href="${FRONTEND_URL}/profile" style="background: #CC5500; color: white; padding: 10px 28px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block; font-size: 14px;">
                  Open Watchlist
                </a>
              </div>
            </div>

            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              You're receiving this because you have notifications enabled.<br>
              <a href="${FRONTEND_URL}/settings" style="color: #CC5500;">Manage notification preferences</a>
            </p>
          </body>
          </html>
        `,
        text: plaintext
      });

      if (error) {
        console.error('Resend error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.id };
    } catch (error: any) {
      console.error('Error sending daily digest:', error);
      return { success: false, error: error.message || 'Failed to send digest email' };
    }
  }
}
