import { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import {
  Crown, Loader2, Mail, CheckCircle2, AlertCircle,
  Play, PauseCircle, Lock, ChevronRight, User, KeyRound, Globe, BarChart2, Tv, Users, Calendar,
  Copy, Check, Gift
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { NavBar } from './ui/nav-bar';
import { SignOutButton } from './ui/sign-out-button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { notificationService } from '@/services/notificationService';
import { authService } from '@/services/authService';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from './ui/alert-dialog';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

const availablePlatforms = [
  'Netflix', 'Hulu', 'Disney+', 'Prime Video', 'Paramount+',
  'Peacock', 'HBO Max', 'Apple TV+', 'YouTube TV', 'Fubo TV'
].filter((platform, index, self) => self.indexOf(platform) === index);

const countries = ['US', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'Brazil'];

// Reusable section label
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-3 px-1">
      {children}
    </p>
  );
}

// Reusable icon pill
function IconPill({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
      {children}
    </div>
  );
}

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
      weeklyDigest: true,
      upcomingReleases: true,
      pauseAll: false
    },
    privacy: {
      publicWatchlist: false,
      allowFriendRequests: true,
      shareWatchingStatus: true
    }
  });
  const [saving, setSaving] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [referralData, setReferralData] = useState<{ referral_code: string | null; referrals: { name: string; joined_at: string }[]; count: number } | null>(null);
  const [copiedReferral, setCopiedReferral] = useState(false);

  const { user, updatePreferences, logout } = useAuth();
  const router = useRouter();

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await authService.deleteAccount();
      logout();
      router.push('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account');
      setDeletingAccount(false);
    }
  };

  useEffect(() => {
    if (user) {
      const uniquePlatforms = Array.from(new Set(user.connected_platforms || []));
      setSettings(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email,
        country: user.region,
        selectedPlatforms: uniquePlatforms,
        notifications: {
          newEpisodes: user.notification_preferences?.new_episodes ?? true,
          seasonStart: user.notification_preferences?.new_seasons ?? true,
          friendActivity: user.notification_preferences?.push ?? false,
          weeklyDigest: user.notification_preferences?.email ?? true,
          upcomingReleases: user.notification_preferences?.upcoming_releases ?? true,
          pauseAll: user.notification_preferences?.pause_all ?? false
        },
        privacy: {
          publicWatchlist: user.privacy_settings?.data_export_enabled ?? false,
          allowFriendRequests: true,
          shareWatchingStatus: user.privacy_settings?.data_delete_enabled ?? true
        }
      }));
      loadNotificationPreferences();
      loadReferrals();
    }
  }, [user]);

  const loadReferrals = async () => {
    try {
      const data = await authService.getReferrals();
      setReferralData(data);
    } catch (err) {
      console.error('[Scout] loadReferrals failed:', err);
    }
  };

  const handleCopyReferralCode = async () => {
    if (!referralData?.referral_code) return;
    await navigator.clipboard.writeText(referralData.referral_code);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const loadNotificationPreferences = async () => {
    try {
      const prefs = await notificationService.getPreferences();
      setEmailVerified(prefs.emailVerified);
      setSettings(prev => ({
        ...prev,
        notifications: {
          newEpisodes: prefs.preferences.newEpisodes ?? prev.notifications.newEpisodes,
          seasonStart: prefs.preferences.seasonPremieres ?? prev.notifications.seasonStart,
          friendActivity: prefs.preferences.friendActivity ?? prev.notifications.friendActivity,
          weeklyDigest: prefs.preferences.weeklyDigest ?? prev.notifications.weeklyDigest,
          upcomingReleases: prefs.preferences.upcomingReleases ?? prev.notifications.upcomingReleases,
          pauseAll: prefs.preferences.pauseAll ?? prev.notifications.pauseAll
        }
      }));
    } catch (error) {
      console.log('Could not load notification preferences');
    }
  };

  const handleSendVerificationEmail = async () => {
    setSendingVerification(true);
    try {
      await notificationService.sendVerificationEmail();
      toast.success('Verification email sent! Check your inbox.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification email');
    } finally {
      setSendingVerification(false);
    }
  };

  const handleNotificationChange = async (field: string, value: boolean) => {
    handleNestedChange('notifications', field, value);
    const fieldMap: Record<string, string> = {
      newEpisodes: 'newEpisodes',
      seasonStart: 'seasonPremieres',
      friendActivity: 'friendActivity',
      weeklyDigest: 'weeklyDigest',
      upcomingReleases: 'upcomingReleases',
      pauseAll: 'pauseAll'
    };
    const apiField = fieldMap[field];
    if (!apiField) return;
    setSavingNotifications(true);
    try {
      await notificationService.updatePreferences({ [apiField]: value });
    } catch (error: any) {
      handleNestedChange('notifications', field, !value);
      toast.error('Failed to update notification preference');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
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
    setSettings(prev => {
      const current = Array.from(new Set(prev.selectedPlatforms));
      const updated = current.includes(platform)
        ? current.filter(p => p !== platform)
        : [...current, platform];
      return { ...prev, selectedPlatforms: updated };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const uniquePlatforms = Array.from(new Set(settings.selectedPlatforms));
      await updatePreferences({
        region: settings.country,
        connected_platforms: uniquePlatforms,
        notification_preferences: {
          email: settings.notifications.weeklyDigest,
          push: settings.notifications.friendActivity,
          new_episodes: settings.notifications.newEpisodes,
          new_seasons: settings.notifications.seasonStart,
          upcoming_releases: settings.notifications.upcomingReleases,
          pause_all: settings.notifications.pauseAll
        },
        privacy_settings: {
          data_export_enabled: settings.privacy.publicWatchlist,
          data_delete_enabled: settings.privacy.shareWatchingStatus
        }
      });
    } catch (error: any) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen text-foreground pb-20 md:pb-0">
      <NavBar
        variant="authenticated"
        pageTitle="Settings"
      />

      <div className="container mx-auto px-3 sm:px-6 py-6 sm:py-10 max-w-2xl">
        <div className="space-y-8">

          {/* ACCOUNT */}
          <div>
            <SectionLabel>Account</SectionLabel>
            <Card>
              <CardContent className="p-0 divide-y divide-border">

                {/* Email Verification */}
                <div className="flex items-center gap-3 p-4">
                  <IconPill><Mail className="w-4 h-4 text-primary" /></IconPill>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Email Verification</p>
                    <p className="text-xs text-muted-foreground truncate">{settings.email}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {emailVerified ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-500/10 border border-green-500/30 px-2.5 py-1 rounded-full font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSendVerificationEmail}
                        disabled={sendingVerification}
                        className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10 text-xs h-7 rounded-full"
                      >
                        {sendingVerification ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Verify Email
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Full Name */}
                <div className="flex items-center gap-3 p-4">
                  <IconPill><User className="w-4 h-4 text-primary" /></IconPill>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Full Name</p>
                    <Input
                      value={settings.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="h-8 text-sm bg-input-background border-border"
                    />
                  </div>
                </div>

                {/* Change Password */}
                <div className="flex items-start gap-3 p-4">
                  <IconPill><KeyRound className="w-4 h-4 text-primary" /></IconPill>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Change Password</p>
                      <p className="text-xs text-muted-foreground">Leave blank to keep current</p>
                    </div>
                    <Input
                      type="password"
                      placeholder="New password"
                      value={settings.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="h-8 text-sm bg-input-background border-border"
                    />
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={settings.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="h-8 text-sm bg-input-background border-border"
                    />
                  </div>
                </div>

                {/* Region */}
                <div className="flex items-center gap-3 p-4">
                  <IconPill><Globe className="w-4 h-4 text-primary" /></IconPill>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Region</p>
                    <Select value={settings.country} onValueChange={(value) => handleInputChange('country', value)}>
                      <SelectTrigger className="h-8 text-sm bg-input-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map(country => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Save account changes */}
                <div className="flex justify-end p-4">
                  <Button
                    onClick={handleSave}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
                    size="sm"
                    disabled={saving}
                  >
                    {saving ? (
                      <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Saving...</>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* REFERRAL CODE */}
          {referralData?.referral_code && (
            <div>
              <SectionLabel>Referral Code</SectionLabel>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <IconPill><Gift className="w-4 h-4 text-primary" /></IconPill>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Your Code</p>
                      <p className="text-xs text-muted-foreground">Share with friends to invite them to Scout</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-muted rounded-xl px-4 py-3">
                      <p className="text-lg font-bold tracking-widest text-foreground">{referralData.referral_code}</p>
                    </div>
                    <button
                      onClick={handleCopyReferralCode}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors flex-shrink-0"
                    >
                      {copiedReferral ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      {copiedReferral ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  {referralData.count > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                        {referralData.count} {referralData.count === 1 ? 'person' : 'people'} joined
                      </p>
                      <div className="space-y-1">
                        {referralData.referrals.map((r, i) => (
                          <p key={i} className="text-sm text-foreground">{r.name}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* PREFERENCES */}
          <div>
            <SectionLabel>Preferences</SectionLabel>
            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {/* Pause All */}
                <div className="flex items-center gap-3 p-4">
                  <IconPill><PauseCircle className="w-4 h-4 text-primary" /></IconPill>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Pause All</p>
                    <p className="text-xs text-muted-foreground">Temporarily pause all notifications</p>
                  </div>
                  <Switch
                    checked={settings.notifications.pauseAll}
                    onCheckedChange={(checked: boolean) => handleNotificationChange('pauseAll', checked)}
                    disabled={!emailVerified || savingNotifications}
                  />
                </div>

                <div className={settings.notifications.pauseAll ? 'opacity-50 pointer-events-none' : ''}>
                  {/* New Episodes */}
                  <div className="flex items-center gap-3 p-4 border-b border-border">
                    <IconPill><Play className="w-4 h-4 text-primary" /></IconPill>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">New Episodes</p>
                      <p className="text-xs text-muted-foreground">Alerts for your followed shows</p>
                    </div>
                    <Switch
                      checked={settings.notifications.newEpisodes}
                      onCheckedChange={(checked: boolean) => handleNotificationChange('newEpisodes', checked)}
                      disabled={!emailVerified || savingNotifications || settings.notifications.pauseAll}
                    />
                  </div>

                  {/* Upcoming Releases */}
                  <div className="flex items-center gap-3 p-4 border-b border-border">
                    <IconPill><Calendar className="w-4 h-4 text-primary" /></IconPill>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Upcoming Releases</p>
                      <p className="text-xs text-muted-foreground">Stay ahead of the trend</p>
                    </div>
                    <Switch
                      checked={settings.notifications.upcomingReleases}
                      onCheckedChange={(checked: boolean) => handleNotificationChange('upcomingReleases', checked)}
                      disabled={!emailVerified || savingNotifications || settings.notifications.pauseAll}
                    />
                  </div>

                  {/* Season Premieres */}
                  <div className="flex items-center gap-3 p-4 border-b border-border">
                    <IconPill><Tv className="w-4 h-4 text-primary" /></IconPill>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Season Premieres</p>
                      <p className="text-xs text-muted-foreground">Be first when new seasons start</p>
                    </div>
                    <Switch
                      checked={settings.notifications.seasonStart}
                      onCheckedChange={(checked: boolean) => handleNotificationChange('seasonStart', checked)}
                      disabled={!emailVerified || savingNotifications || settings.notifications.pauseAll}
                    />
                  </div>

                  {/* Friend Activity — Coming Soon */}
                  <div className="flex items-center gap-3 p-4 border-b border-border opacity-50">
                    <IconPill><Users className="w-4 h-4 text-primary" /></IconPill>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Friend Activity</p>
                      <p className="text-xs text-muted-foreground">Coming soon</p>
                    </div>
                    <Switch checked={false} disabled />
                  </div>

                  {/* Weekly Digest — Coming Soon */}
                  <div className="flex items-center gap-3 p-4 opacity-50">
                    <IconPill><BarChart2 className="w-4 h-4 text-primary" /></IconPill>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Weekly Digest</p>
                      <p className="text-xs text-muted-foreground">Coming soon</p>
                    </div>
                    <Switch checked={false} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* STREAMING PLATFORMS */}
          <div>
            <SectionLabel>Streaming Platforms</SectionLabel>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-3">Select the platforms you have access to</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {availablePlatforms.map(platform => (
                    <div
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`relative cursor-pointer p-3 rounded-xl border-2 transition-all text-center text-sm ${
                        settings.selectedPlatforms.includes(platform)
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-muted hover:border-primary/50 text-muted-foreground'
                      }`}
                    >
                      {platform}
                      {settings.selectedPlatforms.includes(platform) && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleSave}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
                    size="sm"
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PREMIUM */}
          <div>
            <SectionLabel>Premium</SectionLabel>
            <Card className="bg-gradient-to-r from-secondary/10 to-primary/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <IconPill><Crown className="w-4 h-4 text-primary" /></IconPill>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-foreground">Premium</p>
                      <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Advanced notifications, group tracking, and priority support are in development.
                    </p>
                    <Button size="sm" className="rounded-full" disabled>
                      Coming Soon
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PRIVACY & SECURITY */}
          <div>
            <SectionLabel>Privacy &amp; Security</SectionLabel>
            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {/* Privacy Policy row */}
                <button
                  className="flex items-center gap-3 p-4 w-full text-left hover:bg-muted/40 transition-colors"
                  onClick={() => window.open('/privacy', '_blank')}
                >
                  <IconPill><Lock className="w-4 h-4 text-primary" /></IconPill>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Privacy Policy</p>
                    <p className="text-xs text-muted-foreground">Manage your data</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>

                {/* Terms of Service row */}
                <button
                  className="flex items-center gap-3 p-4 w-full text-left hover:bg-muted/40 transition-colors"
                  onClick={() => window.open('/terms', '_blank')}
                >
                  <IconPill><Lock className="w-4 h-4 text-primary" /></IconPill>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Terms of Service</p>
                    <p className="text-xs text-muted-foreground">Beta terms &amp; conditions</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>

                {/* Existing switches — disabled, coming soon */}
                <div className="opacity-75">
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">Public Watchlist</p>
                      <p className="text-xs text-muted-foreground">Allow others to see your watchlist</p>
                    </div>
                    <Switch
                      checked={settings.privacy.publicWatchlist}
                      onCheckedChange={(checked: boolean) => handleNestedChange('privacy', 'publicWatchlist', checked)}
                      disabled
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">Friend Requests</p>
                      <p className="text-xs text-muted-foreground">Allow people to send you friend requests</p>
                    </div>
                    <Switch
                      checked={settings.privacy.allowFriendRequests}
                      onCheckedChange={(checked: boolean) => handleNestedChange('privacy', 'allowFriendRequests', checked)}
                      disabled
                    />
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Share Watching Status</p>
                      <p className="text-xs text-muted-foreground">Let friends see what you're currently watching</p>
                    </div>
                    <Switch
                      checked={settings.privacy.shareWatchingStatus}
                      onCheckedChange={(checked: boolean) => handleNestedChange('privacy', 'shareWatchingStatus', checked)}
                      disabled
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ACCOUNT ACTIONS */}
          <div>
            <SectionLabel>Account Actions</SectionLabel>
            <SignOutButton
              variant="outline"
              className="w-full border-border text-foreground hover:bg-muted/60 rounded-xl h-11"
            />
          </div>

          {/* DANGER ZONE */}
          <div>
            <SectionLabel>Danger Zone</SectionLabel>
            <Card className="border-destructive/30 bg-destructive/5 rounded-2xl">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-4">
                  Permanently deletes your account, watchlist, groups, and all associated data. This cannot be undone.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl h-11"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>

      {/* Delete Account Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your watchlist, groups, preferences, and all associated data.
              This action <strong>cannot be undone</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAccount}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
            >
              {deletingAccount ? 'Deleting…' : 'Delete My Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
