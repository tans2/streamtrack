'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

type NetflixProfile = {
  id: string;
  email: string;
  displayName: string;
  profileName: string;
  avatarUrl?: string;
  connectedAt: string;
  lastSyncAt?: string;
  isActive: boolean;
};

type NetflixShow = {
  netflixId: string;
  title: string;
  currentSeason: number;
  currentEpisode: number;
  totalSeasons: number;
  totalEpisodes: number;
  lastWatched: string;
  nextEpisodeDate?: string;
  isCompleted: boolean;
};

export default function NetflixPage() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<NetflixProfile | null>(null);
  const [watchlist, setWatchlist] = useState<NetflixShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if Netflix is connected
  const checkConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5001/api/netflix/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Error checking Netflix connection:', err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Connect to Netflix
  const connectNetflix = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      const response = await fetch('http://localhost:5001/api/netflix/auth/initiate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initiate Netflix connection');
      }

      const data = await response.json();
      
      // In a real implementation, this would redirect to Netflix OAuth
      // For now, we'll simulate the connection
      alert('Netflix OAuth would open here. For demo purposes, we\'ll simulate a successful connection.');
      
      // Simulate successful connection
      setTimeout(() => {
        checkConnection();
        setIsConnecting(false);
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Netflix');
      setIsConnecting(false);
    }
  };

  // Disconnect from Netflix
  const disconnectNetflix = async () => {
    try {
      setError(null);
      
      const response = await fetch('http://localhost:5001/api/netflix/disconnect', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect from Netflix');
      }

      setProfile(null);
      setWatchlist([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect from Netflix');
    }
  };

  // Fetch Netflix watchlist
  const fetchWatchlist = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/netflix/watchlist', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWatchlist(data.data);
      }
    } catch (err) {
      console.error('Error fetching Netflix watchlist:', err);
    }
  };

  // Sync progress for a show
  const syncProgress = async (tmdbId: number, currentSeason: number, currentEpisode: number) => {
    try {
      const response = await fetch('http://localhost:5001/api/netflix/sync-progress', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tmdbId,
          currentSeason,
          currentEpisode
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync progress');
      }

      // Refresh watchlist
      fetchWatchlist();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync progress');
    }
  };

  useEffect(() => {
    if (user && token) {
      checkConnection();
    }
  }, [user, token]);

  useEffect(() => {
    if (profile?.isActive) {
      fetchWatchlist();
    }
  }, [profile]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h1>
          <p className="text-gray-600">You need to be logged in to connect your Netflix account.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressPercentage = (show: NetflixShow) => {
    if (show.isCompleted) return 100;
    const totalEpisodes = show.totalEpisodes;
    const watchedEpisodes = (show.currentSeason - 1) * (totalEpisodes / show.totalSeasons) + show.currentEpisode;
    return Math.min((watchedEpisodes / totalEpisodes) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Netflix Integration</h1>
              <p className="text-gray-600 mt-2">Connect your Netflix account to sync episode progress</p>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/profile" className="text-blue-600 hover:text-blue-800 font-medium">
                ← Back to Watchlist
              </a>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="mt-2 text-gray-600">Loading Netflix connection...</p>
          </div>
        )}

        {/* Connection Status */}
        {!loading && (
          <div className="mb-8">
            {profile ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">N</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Connected to Netflix
                      </h3>
                      <p className="text-gray-600">
                        {profile.displayName} • {profile.profileName}
                      </p>
                      <p className="text-sm text-gray-500">
                        Connected on {formatDate(profile.connectedAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={disconnectNetflix}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">N</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Connect Your Netflix Account
                </h3>
                <p className="text-gray-600 mb-6">
                  Sync your episode progress and get notifications for new episodes
                </p>
                <button
                  onClick={connectNetflix}
                  disabled={isConnecting}
                  className="px-6 py-3 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Netflix'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Netflix Watchlist */}
        {profile?.isActive && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Netflix Shows</h2>
            
            {watchlist.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-600">No shows found in your Netflix watchlist</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {watchlist.map((show) => (
                  <div key={show.netflixId} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{show.title}</h3>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex justify-between">
                          <span>Current:</span>
                          <span>S{show.currentSeason}E{show.currentEpisode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total:</span>
                          <span>{show.totalSeasons} seasons, {show.totalEpisodes} episodes</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last watched:</span>
                          <span>{formatDate(show.lastWatched)}</span>
                        </div>
                        {show.nextEpisodeDate && (
                          <div className="flex justify-between">
                            <span>Next episode:</span>
                            <span className="text-blue-600">{formatDate(show.nextEpisodeDate)}</span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(getProgressPercentage(show))}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getProgressPercentage(show)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          show.isCompleted 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {show.isCompleted ? 'Completed' : 'In Progress'}
                        </span>
                        
                        <button
                          onClick={() => syncProgress(123, show.currentSeason, show.currentEpisode)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200"
                        >
                          Sync Progress
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Features Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Netflix Integration Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-red-600 text-sm">✓</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Episode Progress Sync</h4>
                <p className="text-sm text-gray-600">Automatically sync your current episode progress</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-red-600 text-sm">✓</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Release Notifications</h4>
                <p className="text-sm text-gray-600">Get notified when new episodes are released</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-red-600 text-sm">✓</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Availability Check</h4>
                <p className="text-sm text-gray-600">See which shows are available on Netflix</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-red-600 text-sm">✓</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Progress Tracking</h4>
                <p className="text-sm text-gray-600">Track your viewing progress across all shows</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
