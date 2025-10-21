import { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { ArrowLeft, Crown, X, Loader2 } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

const availablePlatforms = [
  'Netflix', 'Hulu', 'Disney+', 'Prime Video', 'Paramount+', 
  'Peacock', 'HBO Max', 'Apple TV+', 'YouTube TV', 'Fubo TV'
];

const countries = ['US', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'Brazil'];

export default function SettingsPage({ onNavigate }: SettingsPageProps) {
  const [settings, setSettings] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: 'US',
    selectedPlatforms: [] as string[],
    notifications: {
      newEpisodes: true,
      seasonStart: true,
      friendActivity: false,
      weeklyDigest: true
    },
    privacy: {
      publicWatchlist: false,
      allowFriendRequests: true,
      shareWatchingStatus: true
    }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { user, updatePreferences, upgradeToPremium } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email,
        country: user.region,
        selectedPlatforms: user.connected_platforms || [],
        notifications: {
          newEpisodes: user.notification_preferences?.new_episodes ?? true,
          seasonStart: user.notification_preferences?.new_seasons ?? true,
          friendActivity: user.notification_preferences?.push ?? false,
          weeklyDigest: user.notification_preferences?.email ?? true
        },
        privacy: {
          publicWatchlist: user.privacy_settings?.data_export_enabled ?? false,
          allowFriendRequests: true, // Default value
          shareWatchingStatus: user.privacy_settings?.data_delete_enabled ?? true
        }
      }));
    }
  }, [user]);

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (category: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev] as Record<string, any>,
        [field]: value
      }
    }));
  };

  const togglePlatform = (platform: string) => {
    setSettings(prev => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platform)
        ? prev.selectedPlatforms.filter(p => p !== platform)
        : [...prev.selectedPlatforms, platform]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreferences({
        region: settings.country,
        connected_platforms: settings.selectedPlatforms,
        notification_preferences: {
          email: settings.notifications.weeklyDigest,
          push: settings.notifications.friendActivity,
          new_episodes: settings.notifications.newEpisodes,
          new_seasons: settings.notifications.seasonStart
        },
        privacy_settings: {
          data_export_enabled: settings.privacy.publicWatchlist,
          data_delete_enabled: settings.privacy.shareWatchingStatus
        }
      });
    } catch (error: any) {
      console.error('Save error:', error);
      // Error is already handled by AuthContext with toast
    } finally {
      setSaving(false);
    }
  };

  const handleUpgradePremium = async () => {
    setLoading(true);
    try {
      await upgradeToPremium();
    } catch (error: any) {
      console.error('Upgrade error:', error);
      // Error is already handled by AuthContext with toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-primary hover:text-primary hover:bg-primary/10 mr-4"
                onClick={() => router.push('/profile')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Profile
              </Button>
              <h1 className="text-2xl text-foreground">Settings</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Account Settings */}
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-card-foreground">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-card-foreground">Full Name</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-input-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-card-foreground">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    disabled
                    className="bg-input-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary opacity-50"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-card-foreground">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Leave blank to keep current password"
                    value={settings.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="bg-input-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-card-foreground">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={settings.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="bg-input-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-card-foreground">Country</Label>
                <Select value={settings.country} onValueChange={(value) => handleInputChange('country', value)}>
                  <SelectTrigger className="bg-input-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Premium Upgrade */}
          <Card className="bg-gradient-to-r from-secondary/20 to-primary/20 border-secondary shadow-lg">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center">
                <Crown className="w-5 h-5 mr-2 text-secondary" />
                Premium Upgrade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Unlock premium features like advanced notifications, group tracking with friends, 
                  and priority customer support.
                </p>
                <div className="flex items-center space-x-4">
                  <span className="text-2xl text-card-foreground">$4.99/month</span>
                  <Button 
                    className="bg-secondary hover:bg-secondary/90 text-foreground"
                    onClick={handleUpgradePremium}
                    disabled={loading || user?.subscription_tier === 'premium'}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : user?.subscription_tier === 'premium' ? (
                      'Premium Active'
                    ) : (
                      'Upgrade to Premium'
                    )}
                  </Button>
                </div>
                {user?.subscription_tier === 'premium' && (
                  <p className="text-sm text-green-600">✓ You have an active premium subscription</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Streaming Platforms */}
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-card-foreground">Streaming Platforms</CardTitle>
              <p className="text-muted-foreground">Select the platforms you have access to</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {availablePlatforms.map(platform => (
                  <div
                    key={platform}
                    onClick={() => togglePlatform(platform)}
                    className={`relative cursor-pointer p-3 rounded-lg border-2 transition-all ${
                      settings.selectedPlatforms.includes(platform)
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-muted hover:border-primary/50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-foreground text-sm">{platform}</div>
                    </div>
                    {settings.selectedPlatforms.includes(platform) && (
                      <div className="absolute -top-1 -right-1 bg-primary rounded-full p-1">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <p className="text-muted-foreground text-sm">Selected platforms:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {settings.selectedPlatforms.map(platform => (
                    <Badge 
                      key={platform} 
                      variant="outline" 
                      className="border-primary/50 text-foreground hover:border-primary"
                    >
                      {platform}
                      <X 
                        className="w-3 h-3 ml-1 cursor-pointer hover:text-primary" 
                        onClick={() => togglePlatform(platform)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-card-foreground">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-card-foreground">New Episode Releases</Label>
                  <p className="text-muted-foreground text-sm">Get notified when new episodes are available</p>
                </div>
                <Switch
                  checked={settings.notifications.newEpisodes}
                  onCheckedChange={(checked: boolean) => handleNestedChange('notifications', 'newEpisodes', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-card-foreground">Season Premieres</Label>
                  <p className="text-muted-foreground text-sm">Be the first to know when new seasons start</p>
                </div>
                <Switch
                  checked={settings.notifications.seasonStart}
                  onCheckedChange={(checked: boolean) => handleNestedChange('notifications', 'seasonStart', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-card-foreground">Friend Activity</Label>
                  <p className="text-muted-foreground text-sm">See what your friends are watching (Premium)</p>
                </div>
                <Switch
                  checked={settings.notifications.friendActivity}
                  onCheckedChange={(checked: boolean) => handleNestedChange('notifications', 'friendActivity', checked)}
                  disabled={user?.subscription_tier !== 'premium'}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-card-foreground">Weekly Digest</Label>
                  <p className="text-muted-foreground text-sm">Weekly summary of your watching activity</p>
                </div>
                <Switch
                  checked={settings.notifications.weeklyDigest}
                  onCheckedChange={(checked: boolean) => handleNestedChange('notifications', 'weeklyDigest', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Controls */}
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-card-foreground">Privacy & Sharing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-card-foreground">Public Watchlist</Label>
                  <p className="text-muted-foreground text-sm">Allow others to see your watchlist</p>
                </div>
                <Switch
                  checked={settings.privacy.publicWatchlist}
                  onCheckedChange={(checked: boolean) => handleNestedChange('privacy', 'publicWatchlist', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-card-foreground">Friend Requests</Label>
                  <p className="text-muted-foreground text-sm">Allow people to send you friend requests</p>
                </div>
                <Switch
                  checked={settings.privacy.allowFriendRequests}
                  onCheckedChange={(checked: boolean) => handleNestedChange('privacy', 'allowFriendRequests', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-card-foreground">Share Watching Status</Label>
                  <p className="text-muted-foreground text-sm">Let friends see what you're currently watching</p>
                </div>
                <Switch
                  checked={settings.privacy.shareWatchingStatus}
                  onCheckedChange={(checked: boolean) => handleNestedChange('privacy', 'shareWatchingStatus', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2"
              size="lg"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}