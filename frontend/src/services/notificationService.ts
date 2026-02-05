import apiClient, { handleApiResponse, handleApiError, buildApiUrl } from './api';
import { AxiosError } from 'axios';

export interface NotificationPreferences {
  newEpisodes: boolean;
  seasonPremieres: boolean;
  friendActivity: boolean;
  weeklyDigest: boolean;
  upcomingReleases: boolean;
  pauseAll: boolean;
}

export interface NotificationPreferencesResponse {
  email: string;
  emailVerified: boolean;
  verificationSentAt: string | null;
  preferences: NotificationPreferences;
}

export interface NotificationHistoryItem {
  id: string;
  show_id: string;
  notification_type: 'new_episode' | 'season_premiere';
  season_number: number;
  episode_number: number;
  email_sent_at: string;
  shows?: {
    title: string;
    poster_path: string;
  };
}

class NotificationService {
  // Get notification preferences and email verification status
  async getPreferences(): Promise<NotificationPreferencesResponse> {
    try {
      const response = await apiClient.get(buildApiUrl('notifications/preferences'));
      return handleApiResponse<NotificationPreferencesResponse>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  // Update global notification preferences
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<{ preferences: NotificationPreferences }> {
    try {
      const response = await apiClient.put(buildApiUrl('notifications/preferences'), preferences);
      return handleApiResponse<{ preferences: NotificationPreferences }>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  // Toggle notifications for a specific show
  async toggleShowNotifications(showId: string, enabled: boolean): Promise<{ showId: string; notificationsEnabled: boolean }> {
    try {
      const response = await apiClient.put(buildApiUrl(`notifications/preferences/${showId}`), { enabled });
      return handleApiResponse<{ showId: string; notificationsEnabled: boolean }>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  // Send email verification
  async sendVerificationEmail(): Promise<{ message: string }> {
    try {
      const response = await apiClient.post(buildApiUrl('notifications/verify-email'));
      return handleApiResponse<{ message: string }>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  // Verify email with token (called from verification link)
  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.get(buildApiUrl(`notifications/verify/${token}`));
      if (response.data?.success) {
        return {
          message: response.data.message || 'Your email has been verified successfully!'
        };
      }
      throw new Error(response.data?.error || 'Failed to verify email');
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  // Get notification history
  async getHistory(limit: number = 50): Promise<NotificationHistoryItem[]> {
    try {
      const response = await apiClient.get(buildApiUrl('notifications/history'), {
        params: { limit }
      });
      return handleApiResponse<NotificationHistoryItem[]>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
