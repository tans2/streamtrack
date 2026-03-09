"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { staggerContainer, fadeInUp, fadeIn } from '@/lib/animations';
import { NavBar } from './ui/nav-bar';
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { watchGroupService, GroupDetail, GroupMember } from '@/services/watchGroupService';
import { toast } from 'sonner';
import { Copy, Check, Trash2, LogOut, UserMinus, Crown, Users, ArrowLeft } from 'lucide-react';

interface GroupDetailPageProps {
  groupId: string;
  onNavigate: (page: string) => void;
}

export default function GroupDetailPage({ groupId, onNavigate }: GroupDetailPageProps) {
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  const { user, logout } = useAuth();
  const router = useRouter();

  const FRONTEND_URL = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    loadGroup();
  }, [groupId]);

  const loadGroup = async () => {
    setLoading(true);
    try {
      const data = await watchGroupService.getGroupDetails(groupId);
      setGroup(data);
    } catch (error: any) {
      console.error('Error loading group:', error);
      toast.error(error.message || 'Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!group) return;
    const link = `${FRONTEND_URL}/groups/join?code=${group.invite_code}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Invite link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteGroup = async () => {
    if (!group) return;
    try {
      await watchGroupService.deleteGroup(group.id);
      toast.success('Group deleted');
      router.push('/profile');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete group');
    }
  };

  const handleLeaveGroup = async () => {
    if (!group) return;
    try {
      await watchGroupService.leaveGroup(group.id);
      toast.success('Left group');
      router.push('/profile');
    } catch (error: any) {
      toast.error(error.message || 'Failed to leave group');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!group) return;
    setRemovingMember(memberId);
    try {
      await watchGroupService.removeMember(group.id, memberId);
      toast.success(`${memberName} removed from group`);
      loadGroup();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member');
    } finally {
      setRemovingMember(null);
    }
  };

  const isAdmin = group?.created_by === user?.id;

  // Sort members by progress (descending) for spoiler line
  const sortedMembers = group?.members
    ? [...group.members].sort((a, b) => {
        const progressA = (a.progress.current_season || 1) * 1000 + (a.progress.current_episode || 1);
        const progressB = (b.progress.current_season || 1) * 1000 + (b.progress.current_episode || 1);
        return progressB - progressA;
      })
    : [];

  // Find current user's position for spoiler line
  const myProgress = sortedMembers.find(m => m.user_id === user?.id);
  const myProgressValue = myProgress
    ? (myProgress.progress.current_season || 1) * 1000 + (myProgress.progress.current_episode || 1)
    : 0;

  // Calculate total episodes for progress bar
  const totalEpisodes = group?.show?.number_of_episodes || 0;

  const getProgressPercent = (member: GroupMember) => {
    if (totalEpisodes <= 0) return 0;
    // Rough estimate: sum episodes across seasons up to current
    const watched = ((member.progress.current_season || 1) - 1) * (totalEpisodes / (group?.show?.number_of_seasons || 1)) + (member.progress.current_episode || 1);
    return Math.min(100, Math.round((watched / totalEpisodes) * 100));
  };

  if (loading) {
    return (
      <div className="min-h-screen text-foreground">
        <NavBar
          variant="authenticated"
          pageTitle="Watch Group"
          actions={
            <Button variant="ghost" onClick={() => router.push('/profile')}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          }
        />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen text-foreground">
        <NavBar variant="authenticated" pageTitle="Watch Group" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 text-center">
          <p className="text-muted-foreground">Group not found.</p>
          <Button className="mt-4" onClick={() => router.push('/profile')}>Back to Watchlist</Button>
        </div>
      </div>
    );
  }

  const posterUrl = group.show.poster_path
    ? `https://image.tmdb.org/t/p/w200${group.show.poster_path}`
    : null;

  return (
    <div className="min-h-screen text-foreground">
      <NavBar
        variant="authenticated"
        pageTitle={group.name}
        actions={
          <>
            <Button
              variant="ghost"
              className="text-foreground hover:text-primary hover:bg-primary/10"
              onClick={() => router.push('/profile')}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </>
        }
      />

      <motion.div
        className="max-w-2xl mx-auto px-4 sm:px-6 py-8"
        variants={fadeIn}
        initial="hidden"
        animate="show"
      >
        {/* Group Header */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex gap-4">
              {posterUrl && (
                <div className="w-16 sm:w-20 flex-shrink-0">
                  <ImageWithFallback
                    src={posterUrl}
                    alt={group.show.title}
                    width={80}
                    height={120}
                    className="rounded-lg w-full"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">{group.show.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  <Users className="w-4 h-4 inline mr-1" />
                  {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                </p>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyInvite}
                    className="text-xs"
                  >
                    {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copied ? 'Copied!' : 'Copy Invite Link'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Member Progress */}
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Member Progress
        </h3>

        <motion.div
          className="space-y-3"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {sortedMembers.map((member, index) => {
            const memberProgressValue = (member.progress.current_season || 1) * 1000 + (member.progress.current_episode || 1);
            const isCurrentUser = member.user_id === user?.id;
            const isBehind = memberProgressValue < myProgressValue;
            const isAhead = memberProgressValue > myProgressValue;

            // Insert spoiler line before the first member who is behind you
            const prevMember = index > 0 ? sortedMembers[index - 1] : null;
            const prevProgressValue = prevMember
              ? (prevMember.progress.current_season || 1) * 1000 + (prevMember.progress.current_episode || 1)
              : Infinity;
            const showSpoilerLine = isBehind && prevProgressValue >= myProgressValue && !isCurrentUser;

            return (
              <motion.div key={member.user_id} variants={fadeInUp}>
                {showSpoilerLine && (
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 border-t-2 border-dashed border-orange-400/50" />
                    <span className="text-xs text-orange-400 font-medium px-2">spoiler line</span>
                    <div className="flex-1 border-t-2 border-dashed border-orange-400/50" />
                  </div>
                )}
                <Card className={`${isCurrentUser ? 'ring-1 ring-primary/50 bg-primary/5' : ''}`}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                        isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {member.name}{isCurrentUser ? ' (you)' : ''}
                          </span>
                          {member.role === 'admin' && (
                            <Crown className="w-3 h-3 text-amber-500 flex-shrink-0" />
                          )}
                          {isAhead && !isCurrentUser && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-500/50 text-green-600">Ahead</Badge>
                          )}
                          {isBehind && !isCurrentUser && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-orange-500/50 text-orange-600">Behind</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            S{member.progress.current_season || 1} E{member.progress.current_episode || 1}
                          </span>
                          {totalEpisodes > 0 && (
                            <Progress value={getProgressPercent(member)} className="h-1.5 flex-1" />
                          )}
                        </div>
                      </div>

                      {/* Admin remove button */}
                      {isAdmin && !isCurrentUser && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                          onClick={() => handleRemoveMember(member.user_id, member.name)}
                          disabled={removingMember === member.user_id}
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Group Actions */}
        <div className="mt-8 pt-6 border-t border-border flex gap-3">
          {isAdmin ? (
            confirmDelete ? (
              <div className="flex gap-2 w-full">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDeleteGroup}
                >
                  Confirm Delete
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Group
              </Button>
            )
          ) : (
            confirmLeave ? (
              <div className="flex gap-2 w-full">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleLeaveGroup}
                >
                  Confirm Leave
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmLeave(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setConfirmLeave(true)}
              >
                <LogOut className="w-4 h-4 mr-1" />
                Leave Group
              </Button>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
}
