"use client";

import { useState, useEffect, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NavBar } from '@/components/ui/nav-bar';
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { watchGroupService, GroupPreview } from '@/services/watchGroupService';
import { toast } from 'sonner';
import { Users, Loader2, ArrowRight } from 'lucide-react';

interface PublicPreview {
  groupName: string;
  showTitle: string | null;
  showPosterPath: string | null;
  memberCount: number;
}

function JoinGroupContent() {
  const [publicPreview, setPublicPreview] = useState<PublicPreview | null>(null);
  const [authPreview, setAuthPreview] = useState<GroupPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  // Always load public preview first — no auth required
  useEffect(() => {
    if (!code) {
      setError('No invite code provided');
      setLoading(false);
      return;
    }
    loadPublicPreview();
  }, [code]);

  // Once we know user is authenticated, load the full preview
  useEffect(() => {
    if (!authLoading && user && code) {
      loadAuthPreview();
    }
  }, [user, authLoading, code]);

  const loadPublicPreview = async () => {
    if (!code) return;
    try {
      const data = await watchGroupService.publicPreviewInvite(code);
      setPublicPreview(data);
    } catch {
      setError('Invalid or expired invite link');
    } finally {
      setLoading(false);
    }
  };

  const loadAuthPreview = async () => {
    if (!code) return;
    try {
      const data = await watchGroupService.previewInvite(code);
      setAuthPreview(data);
    } catch {
      // silently fall back to public preview
    }
  };

  const handleJoin = async () => {
    if (!code) return;
    setJoining(true);
    try {
      const result = await watchGroupService.joinGroup(code);
      toast.success(result.autoFollowed ? 'Joined group and added show to your watchlist!' : 'Joined group!');
      router.push(`/groups/${result.group.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to join group');
      setJoining(false);
    }
  };

  const posterUrl = publicPreview?.showPosterPath
    ? `https://image.tmdb.org/t/p/w342${publicPreview.showPosterPath}`
    : null;

  const redirectBase = `/groups/join?code=${code}`;

  if (loading || authLoading) {
    return (
      <div className="min-h-screen text-foreground">
        <NavBar variant="landing" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen text-foreground">
        <NavBar variant="landing" />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => router.push('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  // Authenticated user — already a member
  if (user && authPreview?.is_member) {
    return (
      <div className="min-h-screen text-foreground">
        <NavBar variant="authenticated" />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">You're already a member of this group.</p>
          <Button onClick={() => router.push(`/groups/${authPreview.group_id}`)}>Open Group</Button>
        </div>
      </div>
    );
  }

  // Authenticated user — show join UI
  if (user && publicPreview) {
    return (
      <div className="min-h-screen text-foreground">
        <NavBar variant="authenticated" />
        <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">You've been invited to join</p>
              {posterUrl && (
                <div className="w-24 mx-auto mb-4">
                  <ImageWithFallback
                    src={posterUrl}
                    alt={publicPreview.showTitle || 'Show'}
                    width={96}
                    height={144}
                    className="rounded-lg w-full"
                  />
                </div>
              )}
              <h2 className="text-xl font-bold text-foreground">{publicPreview.groupName}</h2>
              {publicPreview.showTitle && (
                <p className="text-sm text-muted-foreground mt-1">{publicPreview.showTitle}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                <Users className="w-3 h-3 inline mr-1" />
                {publicPreview.memberCount} member{publicPreview.memberCount !== 1 ? 's' : ''}
              </p>
              <Button
                className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                size="lg"
                onClick={handleJoin}
                disabled={joining}
              >
                {joining ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Joining...</> : 'Join Group'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Unauthenticated user — compelling invite landing page
  return (
    <div className="min-h-screen text-foreground">
      <NavBar variant="landing" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 items-center">
          {/* Poster */}
          {posterUrl && (
            <div className="flex-shrink-0">
              <div className="w-40 sm:w-52 rounded-2xl overflow-hidden shadow-xl">
                <ImageWithFallback
                  src={posterUrl}
                  alt={publicPreview?.showTitle || 'Show'}
                  width={208}
                  height={312}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Invite info */}
          <div className="text-center sm:text-left">
            <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              You're invited
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-2">
              Join <span className="text-primary">{publicPreview?.groupName}</span>
            </h1>
            {publicPreview?.showTitle && (
              <p className="text-lg text-muted-foreground mb-3">
                Currently watching <span className="text-foreground font-medium">{publicPreview.showTitle}</span>
              </p>
            )}
            <p className="text-sm text-muted-foreground mb-8">
              <Users className="w-3.5 h-3.5 inline mr-1.5" />
              {publicPreview?.memberCount} member{(publicPreview?.memberCount ?? 0) !== 1 ? 's' : ''} already watching
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8"
                onClick={() => router.push(`/signup?redirect=${encodeURIComponent(redirectBase)}`)}
              >
                Create Account to Join
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8"
                onClick={() => router.push(`/auth?redirect=${encodeURIComponent(redirectBase)}`)}
              >
                Sign In
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-5">
              Scout is a free TV tracking app. No credit card required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JoinGroupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <JoinGroupContent />
    </Suspense>
  );
}
