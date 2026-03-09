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
import { Users, Loader2 } from 'lucide-react';

function JoinGroupContent() {
  const [preview, setPreview] = useState<GroupPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  useEffect(() => {
    if (!code) {
      setError('No invite code provided');
      setLoading(false);
      return;
    }

    if (!user) {
      // Preserve invite code through auth flow
      router.push(`/auth?redirect=/groups/join?code=${code}`);
      return;
    }

    loadPreview();
  }, [code, user]);

  const loadPreview = async () => {
    if (!code) return;
    setLoading(true);
    try {
      const data = await watchGroupService.previewInvite(code);
      setPreview(data);
    } catch (err: any) {
      setError(err.message || 'Invalid invite link');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!code) return;
    setJoining(true);
    try {
      const result = await watchGroupService.joinGroup(code);
      if (result.autoFollowed) {
        toast.success('Joined group and added show to your watchlist!');
      } else {
        toast.success('Joined group!');
      }
      router.push(`/groups/${result.group.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to join group');
      setJoining(false);
    }
  };

  const posterUrl = preview?.show?.poster_path
    ? `https://image.tmdb.org/t/p/w200${preview.show.poster_path}`
    : null;

  return (
    <div className="min-h-screen text-foreground">
      <NavBar variant="auth" backHref="/" backLabel="Back" />

      <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
        {loading ? (
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground mt-4">Loading invite...</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => router.push('/')}>Go Home</Button>
          </div>
        ) : preview?.is_member ? (
          <div className="text-center">
            <p className="text-muted-foreground mb-4">You're already a member of this group.</p>
            <Button onClick={() => router.push(`/groups/${preview.group_id}`)}>
              Open Group
            </Button>
          </div>
        ) : preview ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">You've been invited to join</p>

              {posterUrl && (
                <div className="w-24 mx-auto mb-4">
                  <ImageWithFallback
                    src={posterUrl}
                    alt={preview.show.title}
                    width={96}
                    height={144}
                    className="rounded-lg w-full"
                  />
                </div>
              )}

              <h2 className="text-xl font-bold text-foreground">{preview.group_name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{preview.show.title}</p>
              <p className="text-xs text-muted-foreground mt-2">
                <Users className="w-3 h-3 inline mr-1" />
                {preview.member_count} member{preview.member_count !== 1 ? 's' : ''}
              </p>

              <Button
                className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
                onClick={handleJoin}
                disabled={joining}
              >
                {joining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Joining...
                  </>
                ) : (
                  'Join Group'
                )}
              </Button>
            </CardContent>
          </Card>
        ) : null}
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
