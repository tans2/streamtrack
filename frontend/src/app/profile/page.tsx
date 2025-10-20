'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

type WatchlistItem = {
  id: string;
  watch_status: string;
  current_season: number;
  current_episode: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  shows: {
    id: string;
    tmdb_id: number;
    title: string;
    overview: string;
    poster_path: string;
    backdrop_path: string;
    first_air_date: string;
    last_air_date: string;
    status: string;
    type: string;
    genres: string[];
    rating: number;
    popularity: number;
    number_of_seasons?: number;
    number_of_episodes?: number;
  };
};

type WatchlistResponse = {
  success: boolean;
  data: WatchlistItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedShows, setSelectedShows] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');

  // Fetch watchlist
  const fetchWatchlist = async (status: string = 'all') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:5001/api/shows/watchlist?status=${status}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch watchlist');
      }

      const data: WatchlistResponse = await response.json();
      setWatchlist(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Update show status
  const updateShowStatus = async (showId: string, status: string, currentSeason?: number, currentEpisode?: number) => {
    try {
      const response = await fetch(`http://localhost:5001/api/shows/watchlist/${showId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          currentSeason,
          currentEpisode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update show status');
      }

      // Refresh watchlist
      fetchWatchlist(statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update show status');
    }
  };

  // Remove show from watchlist
  const removeShow = async (showId: string) => {
    try {
      const response = await fetch(`http://localhost:5001/api/shows/watchlist/${showId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove show');
      }

      // Refresh watchlist
      fetchWatchlist(statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove show');
    }
  };

  // Bulk actions
  const performBulkAction = async () => {
    if (selectedShows.size === 0 || !bulkAction) return;

    try {
      const response = await fetch('http://localhost:5001/api/shows/watchlist/bulk', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: bulkAction === 'remove' ? 'remove' : 'update_status',
          showIds: Array.from(selectedShows),
          status: bulkAction !== 'remove' ? bulkAction : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform bulk action');
      }

      // Clear selection and refresh
      setSelectedShows(new Set());
      setBulkAction('');
      fetchWatchlist(statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform bulk action');
    }
  };

  // Handle status filter change
  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    fetchWatchlist(newStatus);
  };

  // Handle show selection
  const toggleShowSelection = (showId: string) => {
    const newSelection = new Set(selectedShows);
    if (newSelection.has(showId)) {
      newSelection.delete(showId);
    } else {
      newSelection.add(showId);
    }
    setSelectedShows(newSelection);
  };

  // Select all shows
  const selectAllShows = () => {
    const allShowIds = new Set(watchlist.map(item => item.id));
    setSelectedShows(allShowIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedShows(new Set());
  };

  useEffect(() => {
    if (user && token) {
      fetchWatchlist(statusFilter);
    }
  }, [user, token, statusFilter]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h1>
          <p className="text-gray-600">You need to be logged in to view your profile.</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'want_to_watch': return 'bg-purple-100 text-purple-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'dropped': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'want_to_watch': return 'Want to Watch';
      case 'in_progress': return 'In Progress';
      case 'paused': return 'Paused';
      case 'completed': return 'Completed';
      case 'dropped': return 'Dropped';
      default: return status;
    }
  };

  const getProgressPercentage = (item: WatchlistItem) => {
    const totalEpisodes = item.shows.number_of_episodes;
    const totalSeasons = item.shows.number_of_seasons;
    
    if (!totalEpisodes || totalEpisodes === 0 || !totalSeasons || totalSeasons === 0) {
      // If we don't have episode data, estimate based on current season
      return Math.min((item.current_season / 10) * 100, 100); // Assume 10 seasons max
    }
    
    const episodesPerSeason = totalEpisodes / totalSeasons;
    const watchedEpisodes = (item.current_season - 1) * episodesPerSeason + item.current_episode;
    return Math.min((watchedEpisodes / totalEpisodes) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Watchlist</h1>
              <p className="text-gray-600 mt-2">Manage your favorite shows and track your progress</p>
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All Shows' },
              { value: 'want_to_watch', label: 'Want to Watch' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'paused', label: 'Paused' },
              { value: 'completed', label: 'Completed' },
              { value: 'dropped', label: 'Dropped' }
            ].map((status) => (
              <button
                key={status.value}
                onClick={() => handleStatusFilterChange(status.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Actions */}
        {watchlist.length > 0 && (
          <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedShows.size === watchlist.length}
                  onChange={selectedShows.size === watchlist.length ? clearSelection : selectAllShows}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">
                  {selectedShows.size} of {watchlist.length} selected
                </span>
              </div>
              
              {selectedShows.size > 0 && (
                <>
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Select action...</option>
                    <option value="want_to_watch">Mark as Want to Watch</option>
                    <option value="in_progress">Mark as In Progress</option>
                    <option value="paused">Mark as Paused</option>
                    <option value="completed">Mark as Completed</option>
                    <option value="dropped">Mark as Dropped</option>
                    <option value="remove">Remove from Watchlist</option>
                  </select>
                  
                  <button
                    onClick={performBulkAction}
                    disabled={!bulkAction}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply Action
                  </button>
                  
                  <button
                    onClick={clearSelection}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
                  >
                    Clear Selection
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading your watchlist...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && watchlist.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No shows in your watchlist</h3>
            <p className="text-gray-600 mb-4">
              {statusFilter === 'all' 
                ? "Start building your watchlist by searching for shows and adding them!"
                : `No shows with status "${statusFilter}" found.`
              }
            </p>
            <a
              href="/search"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Search for Shows
            </a>
          </div>
        )}

        {/* Debug Info */}
        {!loading && watchlist.length > 0 && (
          <div className="mb-4 p-2 bg-blue-100 text-blue-800 text-sm rounded">
            Debug: {watchlist.length} shows found. Container width: 100%. Grid: auto-fit, minmax(320px, 1fr), gap: 1.5rem
          </div>
        )}

        {/* Watchlist Grid */}
        {!loading && watchlist.length > 0 && (
          <div 
            className="grid gap-4"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.5rem',
              width: '100%'
            }}
          >
            {watchlist.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Show Poster */}
                <div className="relative">
                  <img
                    src={item.shows.poster_path 
                      ? `https://image.tmdb.org/t/p/w300${item.shows.poster_path}`
                      : '/placeholder-show.jpg'
                    }
                    alt={item.shows.title}
                    className="w-full h-48 object-cover"
                  />
                  
                  {/* Selection Checkbox */}
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={selectedShows.has(item.id)}
                      onChange={() => toggleShowSelection(item.id)}
                      className="rounded border-gray-300 bg-white"
                    />
                  </div>
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.watch_status)}`}>
                      {getStatusLabel(item.watch_status)}
                    </span>
                  </div>
                </div>

                {/* Show Info */}
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
                    {item.shows.title}
                  </h3>
                  
                  <div className="space-y-2 text-xs">
                    {/* Rating */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Rating:</span>
                      <span className="flex items-center font-medium">
                        <span className="text-yellow-400 mr-1">⭐</span>
                        {item.shows.rating?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                    
                    {/* Total Seasons */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Seasons:</span>
                      <span className="font-medium">{item.shows.number_of_seasons || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(getProgressPercentage(item))}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage(item)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Current Progress */}
                  <div className="mt-2">
                    <div className="text-xs text-gray-600 mb-1">Current:</div>
                    <div className="flex gap-1">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-0.5">S</label>
                        <input
                          type="number"
                          min="1"
                          max={item.shows.number_of_seasons || 99}
                          value={item.current_season}
                          onChange={(e) => updateShowStatus(item.id, item.watch_status, parseInt(e.target.value), item.current_episode)}
                          className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-0.5">E</label>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={item.current_episode}
                          onChange={(e) => updateShowStatus(item.id, item.watch_status, item.current_season, parseInt(e.target.value))}
                          className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-2 space-y-1">
                    <select
                      value={item.watch_status}
                      onChange={(e) => updateShowStatus(item.id, e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="want_to_watch">Want to Watch</option>
                      <option value="in_progress">In Progress</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                      <option value="dropped">Dropped</option>
                    </select>
                    
                    <button
                      onClick={() => removeShow(item.id)}
                      className="w-full px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Info */}
        {!loading && watchlist.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-600">
            Showing {watchlist.length} shows
          </div>
        )}
      </div>
    </div>
  );
}
