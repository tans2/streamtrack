import apiClient, { handleApiResponse, handleApiError, buildApiUrl } from './api';
import { AxiosError } from 'axios';

export interface User {
  id: string;
  email: string;
  name?: string;
  subscription_tier: 'free' | 'premium';
  region: string;
  connected_platforms: string[];
  notification_preferences: {
    email: boolean;
    push: boolean;
    new_episodes: boolean;
    new_seasons: boolean;
  };
  privacy_settings: {
    data_export_enabled: boolean;
    data_delete_enabled: boolean;
  };
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  initialShows?: number[];
}

export interface UpdatePreferencesRequest {
  region?: string;
  connected_platforms?: string[];
  notification_preferences?: Partial<User['notification_preferences']>;
  privacy_settings?: Partial<User['privacy_settings']>;
}

class AuthService {
  // Login user with email and password
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await apiClient.post(buildApiUrl('auth/login'), {
        email,
        password,
      });
      return handleApiResponse<LoginResponse>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  // Register new user
  async register(email: string, password: string, name?: string, initialShows?: number[]): Promise<LoginResponse> {
    try {
      const response = await apiClient.post(buildApiUrl('auth/register'), {
        email,
        password,
        name,
        initialShows,
      });
      return handleApiResponse<LoginResponse>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get(buildApiUrl('auth/me'));
      return handleApiResponse<User>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  // Update user preferences
  async updatePreferences(updates: UpdatePreferencesRequest): Promise<User> {
    try {
      const response = await apiClient.put(buildApiUrl('auth/preferences'), updates);
      return handleApiResponse<User>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  // Upgrade to premium
  async upgradeToPremium(): Promise<User> {
    try {
      const response = await apiClient.post(buildApiUrl('auth/upgrade-premium'));
      return handleApiResponse<User>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  // Get user's followed shows
  async getUserShows(): Promise<any[]> {
    try {
      const response = await apiClient.get(buildApiUrl('auth/shows'));
      return handleApiResponse<any[]>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  // Logout (client-side token removal)
  async logout(): Promise<void> {
    try {
      await apiClient.post(buildApiUrl('auth/logout'));
    } catch (error) {
      // Even if the API call fails, we should still clear the local token
      console.warn('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('streamtrack_token');
    }
  }
}

export const authService = new AuthService();
export default authService;
