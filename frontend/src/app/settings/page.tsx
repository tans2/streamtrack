"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const REGIONS = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' }
];

const PLATFORMS = [
  { id: 'netflix', name: 'Netflix' },
  { id: 'hulu', name: 'Hulu' },
  { id: 'disney', name: 'Disney+' },
  { id: 'prime', name: 'Prime Video' },
  { id: 'hbo', name: 'HBO Max' },
  { id: 'peacock', name: 'Peacock' },
  { id: 'paramount', name: 'Paramount+' },
  { id: 'apple', name: 'Apple TV+' },
  { id: 'youtube', name: 'YouTube TV' },
  { id: 'tubi', name: 'Tubi' }
];

export default function SettingsPage() {
  const { user, updatePreferences, upgradeToPremium, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Form state
  const [region, setRegion] = useState(user?.region || 'US');
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>(user?.connected_platforms || []);
  const [notifications, setNotifications] = useState(user?.notification_preferences || {
    email: true,
    push: false,
    new_episodes: true,
    new_seasons: true
  });
  const [privacy, setPrivacy] = useState(user?.privacy_settings || {
    data_export_enabled: true,
    data_delete_enabled: true
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    
    setRegion(user.region);
    setConnectedPlatforms(user.connected_platforms);
    setNotifications(user.notification_preferences);
    setPrivacy(user.privacy_settings);
  }, [user, router]);

  const handleSave = async () => {
    setLoading(true);
    setMessage('');

    try {
      await updatePreferences({
        region,
        connected_platforms: connectedPlatforms,
        notification_preferences: notifications,
        privacy_settings: privacy
      });
      setMessage('Settings saved successfully!');
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    setMessage('');

    try {
      await upgradeToPremium();
      setMessage('Successfully upgraded to premium!');
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = (platformId: string) => {
    setConnectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  if (!user) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-blue-300 border-t-transparent rounded-full"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <button
            onClick={logout}
            className="btn-secondary"
          >
            Sign Out
          </button>
        </div>

        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-4">
            <a href="/profile" className="text-blue-400 hover:text-blue-300 font-medium">
              My Watchlist
            </a>
            <a href="/search" className="text-blue-400 hover:text-blue-300 font-medium">
              Search Shows
            </a>
            <span className="text-gray-500">Settings</span>
          </nav>
        </div>

        {message && (
          <div className={`p-3 rounded mb-6 ${
            message.includes('Error') 
              ? 'bg-red-900/40 border border-red-700 text-red-200' 
              : 'bg-green-900/40 border border-green-700 text-green-200'
          }`}>
            {message}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Account Info */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={user.name || ''}
                  disabled
                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Subscription</label>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    user.subscription_tier === 'premium' 
                      ? 'bg-yellow-900 text-yellow-200' 
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {user.subscription_tier === 'premium' ? 'Premium' : 'Free'}
                  </span>
                  {user.subscription_tier === 'free' && (
                    <button
                      onClick={handleUpgrade}
                      disabled={loading}
                      className="btn-primary text-sm"
                    >
                      Upgrade to Premium
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Region & Platforms */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Region & Platforms</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Home Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 outline-none focus:border-blue-500"
                >
                  {REGIONS.map(region => (
                    <option key={region.code} value={region.code}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Connected Platforms</label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map(platform => (
                    <label key={platform.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={connectedPlatforms.includes(platform.id)}
                        onChange={() => togglePlatform(platform.id)}
                        className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm">{platform.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Notifications</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={(e) => setNotifications(prev => ({ ...prev, email: e.target.checked }))}
                  className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                />
                <span>Email notifications</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.push}
                  onChange={(e) => setNotifications(prev => ({ ...prev, push: e.target.checked }))}
                  className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                />
                <span>Push notifications</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.new_episodes}
                  onChange={(e) => setNotifications(prev => ({ ...prev, new_episodes: e.target.checked }))}
                  className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                />
                <span>New episodes</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.new_seasons}
                  onChange={(e) => setNotifications(prev => ({ ...prev, new_seasons: e.target.checked }))}
                  className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                />
                <span>New seasons</span>
              </label>
            </div>
          </div>

          {/* Privacy */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Privacy Controls</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy.data_export_enabled}
                  onChange={(e) => setPrivacy(prev => ({ ...prev, data_export_enabled: e.target.checked }))}
                  className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                />
                <span>Allow data export</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy.data_delete_enabled}
                  onChange={(e) => setPrivacy(prev => ({ ...prev, data_delete_enabled: e.target.checked }))}
                  className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                />
                <span>Allow data deletion</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

