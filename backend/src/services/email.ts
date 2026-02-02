import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Email sender configuration
const FROM_EMAIL = process.env.EMAIL_FROM || 'Scout <notifications@scout.tv>';
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
              <h1 style="color: #7C3AED; margin: 0;">Scout</h1>
              <p style="color: #666; margin: 5px 0;">Track Your Shows</p>
            </div>

            <div style="background: #f9fafb; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
              <h2 style="margin-top: 0;">Hey ${name || 'there'}!</h2>
              <p>Thanks for signing up for Scout. To start receiving notifications about your favorite shows, please verify your email address.</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" style="background: #7C3AED; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">
                  Verify Email
                </a>
              </div>

              <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="color: #7C3AED; font-size: 14px; word-break: break-all;">${verifyUrl}</p>
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
              <h1 style="color: #7C3AED; margin: 0;">Scout</h1>
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
                    <h2 style="margin: 0 0 10px 0; color: #7C3AED;">${showTitle}</h2>
                    <p style="margin: 0; font-size: 18px; font-weight: 500;">${episodeInfo}</p>
                    <p style="margin: 10px 0 0 0; color: #666;">A new episode is now available!</p>
                  </td>
                </tr>
              </table>

              <div style="text-align: center; margin-top: 25px;">
                <a href="${FRONTEND_URL}/profile" style="background: #7C3AED; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">
                  View in Scout
                </a>
              </div>
            </div>

            <p style="color: #999; font-size: 12px; text-align: center;">
              You're receiving this because you have notifications enabled for ${showTitle}.<br>
              <a href="${FRONTEND_URL}/settings" style="color: #7C3AED;">Manage notification preferences</a>
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
              <h1 style="color: #7C3AED; margin: 0;">Scout</h1>
              <p style="color: #666; margin: 5px 0;">Season Premiere Alert</p>
            </div>

            <div style="background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); border-radius: 8px; padding: 30px; margin-bottom: 20px; color: white;">
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
                <a href="${FRONTEND_URL}/profile" style="background: white; color: #7C3AED; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">
                  View in Scout
                </a>
              </div>
            </div>

            <p style="color: #999; font-size: 12px; text-align: center;">
              You're receiving this because you have notifications enabled for ${showTitle}.<br>
              <a href="${FRONTEND_URL}/settings" style="color: #7C3AED;">Manage notification preferences</a>
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
}
