"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavBar } from '@/components/ui/nav-bar';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { watchGroupService, WatchGroup } from '@/services/watchGroupService';
import { watchlistService, WatchlistItem } from '@/services/watchlistService';
import ProtectedRoute from '@/components/ProtectedRoute';
import CreateGroupDialog from '@/components/CreateGroupDialog';

function GroupsPageContent() {
  const router = useRouter();
  const [groups, setGroups] = useState<WatchGroup[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const loadGroups = async () => {
    try {
      const data = await watchGroupService.getMyGroups();
      setGroups(data);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [groupsData, watchlistData] = await Promise.all([
          watchGroupService.getMyGroups(),
          watchlistService.getWatchlist(),
        ]);
        setGroups(groupsData);
        setWatchlist(watchlistData.filter(item => item.watch_status === 'watching'));
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen text-foreground pb-20 md:pb-0">
      <NavBar variant="authenticated" pageTitle="Groups" />

      <div className="max-w-2xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Watch Groups
          </h1>
          <Button
            onClick={() => setShowCreateGroup(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Group
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 bg-card/50 rounded-2xl border border-border/50">
            <img src="/logo.png" alt="Scout" className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p className="font-medium text-foreground mb-1">No groups yet</p>
            <p className="text-sm text-muted-foreground mb-6">Watch shows with friends and stay in sync.</p>
            <Button
              onClick={() => setShowCreateGroup(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Start a Group
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map(group => {
              const posterUrl = group.shows?.poster_path
                ? `https://image.tmdb.org/t/p/w200${group.shows.poster_path}`
                : null;
              return (
                <div
                  key={group.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/groups/${group.id}`)}
                >
                  {posterUrl && (
                    <div className="w-10 flex-shrink-0">
                      <ImageWithFallback
                        src={posterUrl}
                        alt={group.shows?.title || ''}
                        width={40}
                        height={60}
                        className="rounded-lg w-full"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{group.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{group.shows?.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <Users className="w-3 h-3 inline mr-1" />
                      {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateGroupDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        watchlist={watchlist}
        onCreated={() => loadGroups()}
      />
    </div>
  );
}

export default function GroupsPage() {
  return (
    <ProtectedRoute>
      <GroupsPageContent />
    </ProtectedRoute>
  );
}
