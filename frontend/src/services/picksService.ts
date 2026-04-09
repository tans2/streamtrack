import apiClient, { handleApiResponse, handleApiError, buildApiUrl } from './api';
import { AxiosError } from 'axios';

export interface Pick {
  id: string;
  user_id: string;
  show_id: string;
  note?: string | null;
  created_at: string;
  shows: {
    id: string;
    title: string;
    poster_path?: string | null;
    tmdb_id: number;
  };
  users?: {
    id: string;
    name: string;
  };
  // Flattened for convenience on feed items
  picker_name?: string;
}

class PicksService {
  async addPick(showId: string, note?: string): Promise<Pick> {
    try {
      const response = await apiClient.post(buildApiUrl('picks'), { showId, note });
      return handleApiResponse<Pick>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  async removePick(showId: string): Promise<void> {
    try {
      await apiClient.delete(buildApiUrl(`picks/${showId}`));
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  async getMyPicks(): Promise<Pick[]> {
    try {
      const response = await apiClient.get(buildApiUrl('picks/mine'));
      return handleApiResponse<Pick[]>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  async getFeed(): Promise<Pick[]> {
    try {
      const response = await apiClient.get(buildApiUrl('picks/feed'));
      const raw = handleApiResponse<any[]>(response);
      // Normalize: flatten users.name -> picker_name
      return raw.map((p) => ({
        ...p,
        picker_name: p.users?.name || 'Someone',
      }));
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }
}

export const picksService = new PicksService();
export default picksService;
