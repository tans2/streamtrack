'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface HuluProfile {
  id: string;
  email: string;
  displayName: string;
  profileName: string;
  connectedAt: string;
  lastSyncAt?: string;
  isActive: boolean;
}

interface HuluShow {
  huluId: string;
  title: string;
  currentSeason: number;
  currentEpisode: number;
  totalSeasons: number;
  totalEpisodes: number;
  lastWatched: string;
  nextEpisodeDate?: string;
  isCompleted: boolean;
  progressPercentage: number;
}

interface ApiStatus {
  remainingCalls: number;
  dailyLimit: number;
  resetTime: string;
}

export default function HuluPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<HuluProfile | null>(null);
  const [watchlist, setWatchlist] = useState<HuluShow[]>([]);
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user) {
      fetchHuluData();
    }
  }, [user]);

  const fetchHuluData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      // Fetch profile
      const profileResponse = await fetch('/api/hulu/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData.data);
        setIsConnected(true);
      }

      // Fetch watchlist
      const watchlistResponse = await fetch('/api/hulu/watchlist', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (watchlistResponse.ok) {
        const watchlistData = await watchlistResponse.json();
        setWatchlist(watchlistData.data);
      }

      // Fetch API status
      const statusResponse = await fetch('/api/hulu/api-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setApiStatus(statusData.data);
      }

    } catch (err) {
      console.error('Error fetching Hulu data:', err);
      setError('Failed to load Hulu data');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/hulu/auth/initiate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // In a real implementation, redirect to authUrl
        alert('Hulu OAuth initiated! (This is a demo - no real OAuth)');
        // Simulate successful connection
        setTimeout(() => {
          fetchHuluData();
        }, 1000);
      }
    } catch (err) {
      console.error('Error connecting to Hulu:', err);
      setError('Failed to connect to Hulu');
    }
  };

  const handleDisconnect = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/hulu/disconnect', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setIsConnected(false);
        setProfile(null);
        setWatchlist([]);
        setApiStatus(null);
      }
    } catch (err) {
      console.error('Error disconnecting from Hulu:', err);
      setError('Failed to disconnect from Hulu');
    }
  };

  const handleSyncProgress = async (show: HuluShow) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/hulu/sync-progress', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tmdbId: show.huluId.replace('hulu_', ''),
          currentSeason: show.currentSeason,
          currentEpisode: show.currentEpisode
        })
      });

      if (response.ok) {
        await fetchHuluData(); // Refresh data
      }
    } catch (err) {
      console.error('Error syncing progress:', err);
      setError('Failed to sync progress');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Hulu integration...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please log in to access Hulu integration.</p>
          <a href="/auth" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hulu Integration</h1>
                <p className="text-gray-600">Track your Hulu shows and progress</p>
              </div>
            </div>
            <div className="flex space-x-4">
              {isConnected ? (
                <button
                  onClick={handleDisconnect}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Connect Hulu
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* API Status */}
        {apiStatus && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">API Usage</h3>
                <p className="text-blue-700">
                  {apiStatus.remainingCalls} TMDB calls remaining today
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-600">
                  Resets: {new Date(apiStatus.resetTime).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${(apiStatus.remainingCalls / apiStatus.dailyLimit) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Profile Section */}
        {profile && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Hulu Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Display Name</p>
                <p className="font-medium">{profile.displayName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Profile Name</p>
                <p className="font-medium">{profile.profileName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{profile.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Connected</p>
                <p className="font-medium">
                  {new Date(profile.connectedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Watchlist Section */}
        {isConnected && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Your Hulu Watchlist</h2>
              <button
                onClick={fetchHuluData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>

            {watchlist.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-400 text-2xl">📺</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No shows in your Hulu watchlist</h3>
                <p className="text-gray-600 mb-4">
                  Add shows to your watchlist to track your progress here.
                </p>
                <a 
                  href="/search" 
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Browse Shows
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {watchlist.map((show) => (
                  <div key={show.huluId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{show.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        show.isCompleted 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {show.isCompleted ? 'Completed' : 'Watching'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Season {show.currentSeason}, Episode {show.currentEpisode}</span>
                        <span>{show.totalSeasons} seasons</span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${show.progressPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        {show.progressPercentage.toFixed(1)}% complete
                      </p>
                    </div>

                    {show.nextEpisodeDate && (
                      <div className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Next episode:</span>{' '}
                        {new Date(show.nextEpisodeDate).toLocaleDateString()}
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSyncProgress(show)}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                      >
                        Sync Progress
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-center space-x-4">
          <a 
            href="/profile" 
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
          >
            Back to Profile
          </a>
          <a 
            href="/search" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Search Shows
          </a>
        </div>
      </div>
    </div>
  );
}
