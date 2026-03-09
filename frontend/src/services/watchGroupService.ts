import apiClient, { handleApiResponse, handleApiError, buildApiUrl } from './api';
import { AxiosError } from 'axios';

export interface WatchGroup {
  id: string;
  name: string;
  show_id: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  member_count: number;
  shows: {
    id: string;
    tmdb_id: number;
    title: string;
    poster_path?: string;
  };
}

export interface GroupMember {
  user_id: string;
  name: string;
  role: 'admin' | 'member';
  joined_at: string;
  progress: {
    current_season: number;
    current_episode: number;
    watch_status: string;
  };
}

export interface GroupDetail {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  show: {
    id: string;
    tmdb_id: number;
    title: string;
    poster_path?: string;
    status: string;
    genres: any[];
    rating: number;
    number_of_seasons?: number;
    number_of_episodes?: number;
  };
  members: GroupMember[];
}

export interface GroupPreview {
  group_id: string;
  group_name: string;
  show: { id: string; tmdb_id: number; title: string; poster_path?: string };
  member_count: number;
  is_member: boolean;
}

class WatchGroupService {
  async createGroup(showId: string, name: string): Promise<WatchGroup> {
    try {
      const response = await apiClient.post(buildApiUrl('groups'), { showId, name });
      return handleApiResponse<WatchGroup>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  async getMyGroups(): Promise<WatchGroup[]> {
    try {
      const response = await apiClient.get(buildApiUrl('groups'));
      return handleApiResponse<WatchGroup[]>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  async getGroupDetails(groupId: string): Promise<GroupDetail> {
    try {
      const response = await apiClient.get(buildApiUrl(`groups/${groupId}`));
      return handleApiResponse<GroupDetail>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  async deleteGroup(groupId: string): Promise<void> {
    try {
      await apiClient.delete(buildApiUrl(`groups/${groupId}`));
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  async previewInvite(inviteCode: string): Promise<GroupPreview> {
    try {
      const response = await apiClient.get(buildApiUrl(`groups/invite/${inviteCode}`));
      return handleApiResponse<GroupPreview>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  async joinGroup(inviteCode: string): Promise<{ group: { id: string; name: string; show_id: string }; autoFollowed: boolean }> {
    try {
      const response = await apiClient.post(buildApiUrl('groups/join'), { inviteCode });
      return handleApiResponse<{ group: { id: string; name: string; show_id: string }; autoFollowed: boolean }>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  async leaveGroup(groupId: string): Promise<void> {
    try {
      await apiClient.delete(buildApiUrl(`groups/${groupId}/leave`));
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    try {
      await apiClient.delete(buildApiUrl(`groups/${groupId}/members/${userId}`));
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }
}

export const watchGroupService = new WatchGroupService();
export default watchGroupService;
