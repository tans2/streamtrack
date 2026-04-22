"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { staggerContainer, fadeInUp, fadeIn } from '@/lib/animations';
import { NavBar } from './ui/nav-bar';
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { watchGroupService, GroupDetail, GroupMember } from '@/services/watchGroupService';
import { picksService, Pick } from '@/services/picksService';
import { toast } from 'sonner';
import { Copy, Check, Trash2, LogOut, UserMinus, Crown, Users, ArrowLeft, UserPlus, Loader2, BarChart2, Mail, Sparkles } from 'lucide-react';

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
  const [addEmail, setAddEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [groupPicks, setGroupPicks] = useState<Pick[]>([]);

  const { user } = useAuth();
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
      // Load picks from group members
      loadGroupPicks(data.members.map(m => m.user_id));
    } catch (error: any) {
      console.error('Error loading group:', error);
      toast.error(error.message || 'Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  const loadGroupPicks = async (memberIds: string[]) => {
    try {
      const feed = await picksService.getFeed();
      // Filter feed to only members of this group
      const filtered = feed.filter(p => memberIds.includes(p.user_id));
      setGroupPicks(filtered);
    } catch {
      // silently fail — group picks are a bonus feature
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

  const handleAddMember = async () => {
    if (!group || !addEmail.trim()) return;
    setAddingMember(true);
    try {
      const result = await watchGroupService.addMemberByEmail(group.id, addEmail.trim());
      toast.success(`${result.name} added to the group`);
      setAddEmail('');
      loadGroup();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const isAdmin = group?.created_by === user?.id;

  // Sort members by progress (descending)
  const sortedMembers = group?.members
    ? [...group.members].sort((a, b) => {
        const progressA = (a.progress.current_season || 1) * 1000 + (a.progress.current_episode || 1);
        const progressB = (b.progress.current_season || 1) * 1000 + (b.progress.current_episode || 1);
        return progressB - progressA;
      })
    : [];

  // Current user's progress for relative comparison
  const myProgress = sortedMembers.find(m => m.user_id === user?.id);
  const myProgressValue = myProgress
    ? (myProgress.progress.current_season || 1) * 1000 + (myProgress.progress.current_episode || 1)
    : 0;

  const getRelativeLabel = (member: GroupMember) => {
    const memberValue = (member.progress.current_season || 1) * 1000 + (member.progress.current_episode || 1);
    if (member.user_id === user?.id) return null;

    const mySeason = myProgress?.progress.current_season || 1;
    const myEpisode = myProgress?.progress.current_episode || 1;
    const theirSeason = member.progress.current_season || 1;
    const theirEpisode = member.progress.current_episode || 1;

    if (memberValue === myProgressValue) {
      return { text: 'SAME PLACE', color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' };
    }

    if (theirSeason === mySeason) {
      const diff = Math.abs(theirEpisode - myEpisode);
      if (memberValue > myProgressValue) {
        return { text: 'LEADING THE PACK', color: 'text-green-500 bg-green-500/10 border-green-500/30' };
      } else {
        return { text: `${diff} EP BEHIND`, color: 'text-orange-500 bg-orange-500/10 border-orange-500/30' };
      }
    }

    if (memberValue > myProgressValue) {
      return { text: 'LEADING THE PACK', color: 'text-green-500 bg-green-500/10 border-green-500/30' };
    } else {
      return { text: 'CATCHING UP', color: 'text-muted-foreground bg-muted border-border' };
    }
  };

  const visibleMembers = showAllMembers ? sortedMembers : sortedMembers.slice(0, 4);

  const firstProgressValue = sortedMembers.length > 0
    ? (sortedMembers[0].progress.current_season || 1) * 1000 + (sortedMembers[0].progress.current_episode || 1)
    : 0;
  const allSynced = sortedMembers.length > 1 && sortedMembers.every(m => {
    const v = (m.progress.current_season || 1) * 1000 + (m.progress.current_episode || 1);
    return v === firstProgressValue;
  });

  if (loading) {
    return (
      <div className="min-h-screen text-foreground pb-20 md:pb-0">
        <NavBar
          variant="authenticated"
          actions={
            <Button variant="ghost" onClick={() => router.push('/profile')}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          }
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-muted rounded-2xl" />
            <div className="h-32 bg-muted rounded-2xl" />
            <div className="h-20 bg-muted rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen text-foreground pb-20 md:pb-0">
        <NavBar variant="authenticated" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-center">
          <p className="text-muted-foreground">Group not found.</p>
          <Button className="mt-4" onClick={() => router.push('/profile')}>Back to Watchlist</Button>
        </div>
      </div>
    );
  }

  const posterUrl = group.show.poster_path
    ? `https://image.tmdb.org/t/p/w342${group.show.poster_path}`
    : null;

  const genres: string[] = Array.isArray(group.show.genres) ? group.show.genres : [];

  return (
    <div className="min-h-screen text-foreground pb-20 md:pb-0">
      <NavBar
        variant="authenticated"
        actions={
          <Button
            variant="ghost"
            className="text-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => router.push('/profile')}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        }
      />

      <motion.div
        className="max-w-5xl mx-auto px-4 sm:px-6 py-8"
        variants={fadeIn}
        initial="hidden"
        animate="show"
      >
        {/* Hero Card */}
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex gap-0">
              {/* Poster */}
              {posterUrl && (
                <div className="w-32 sm:w-48 lg:w-56 flex-shrink-0">
                  <ImageWithFallback
                    src={posterUrl}
                    alt={group.show.title}
                    width={192}
                    height={288}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {/* Info */}
              <div className="flex-1 p-5 sm:p-8 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 mb-2">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span className="text-primary text-xs font-semibold uppercase tracking-widest">Active Watch Party</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{group.name}</h1>
                <p className="text-sm text-muted-foreground mb-5">
                  Currently bingeing: <span className="text-foreground font-medium">{group.show.title}</span>
                  {' '}•{' '}{group.members.length} member{group.members.length !== 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleCopyInvite}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5"
                    size="sm"
                  >
                    {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                    {copied ? 'Copied!' : 'Copy Invite Link'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Two-column layout — main content left/top, sidebar right/bottom */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">

          {/* Left / top on mobile — Sync Progress + Group Picks */}
          <div className="space-y-4">

            {/* Sync Progress */}
            <Card className="rounded-2xl">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Sync Progress</h3>
                  </div>
                  <span className="text-xs text-muted-foreground">Sorted by Progress</span>
                </div>

                {allSynced && (
                  <div className="mb-4 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                    <span className="text-xl">🎉</span>
                    <div>
                      <p className="text-sm font-semibold text-green-600">Everyone's in sync!</p>
                      <p className="text-xs text-muted-foreground">Your whole group is watching at the same place.</p>
                    </div>
                  </div>
                )}

                <motion.div
                  className="space-y-1"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                >
                  {visibleMembers.map((member, index) => {
                    const memberProgressValue = (member.progress.current_season || 1) * 1000 + (member.progress.current_episode || 1);
                    const isCurrentUser = member.user_id === user?.id;
                    const isBehind = memberProgressValue < myProgressValue;

                    const prevMember = index > 0 ? sortedMembers[index - 1] : null;
                    const prevProgressValue = prevMember
                      ? (prevMember.progress.current_season || 1) * 1000 + (prevMember.progress.current_episode || 1)
                      : Infinity;
                    const showSpoilerLine = isBehind && prevProgressValue >= myProgressValue && !isCurrentUser;

                    const relativeLabel = getRelativeLabel(member);

                    return (
                      <motion.div key={member.user_id} variants={fadeInUp}>
                        {showSpoilerLine && (
                          <div className="flex items-center gap-2 my-4">
                            <div className="flex-1 border-t border-dashed border-orange-400/50" />
                            <span className="text-[10px] text-orange-400 font-semibold uppercase tracking-widest px-2 flex items-center gap-1">
                              ⚠ Spoiler Line
                            </span>
                            <div className="flex-1 border-t border-dashed border-orange-400/50" />
                          </div>
                        )}
                        <div className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                          isCurrentUser ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/40'
                        }`}>
                          {/* Avatar */}
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                            isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-sm text-foreground truncate">
                                {member.name}
                              </span>
                              {isCurrentUser && (
                                <span className="text-xs text-muted-foreground">(You)</span>
                              )}
                              {member.role === 'admin' && (
                                <Crown className="w-3 h-3 text-amber-500 flex-shrink-0" />
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              S{member.progress.current_season || 1} • Ep {member.progress.current_episode || 1}
                            </span>
                          </div>

                          {/* Badge + admin remove */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {relativeLabel && (
                              <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${relativeLabel.color}`}>
                                {relativeLabel.text}
                              </span>
                            )}
                            {isAdmin && !isCurrentUser && (
                              <button
                                className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                onClick={() => handleRemoveMember(member.user_id, member.name)}
                                disabled={removingMember === member.user_id}
                              >
                                {removingMember === member.user_id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <UserMinus className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>

                {sortedMembers.length > 4 && (
                  <button
                    className="w-full text-center text-sm text-primary hover:text-primary/80 mt-4 pt-3 border-t border-border transition-colors"
                    onClick={() => setShowAllMembers(!showAllMembers)}
                  >
                    {showAllMembers
                      ? 'Show less'
                      : `View all ${sortedMembers.length} members`}
                  </button>
                )}
              </CardContent>
            </Card>

            {/* Group Picks */}
            {groupPicks.length > 0 && (
              <Card className="rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Group Picks
                    </p>
                  </div>
                  <motion.div
                    className="space-y-3"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                  >
                    {groupPicks.map(pick => (
                      <motion.div
                        key={pick.id}
                        variants={fadeInUp}
                        className="flex items-center gap-3"
                      >
                        <div className="w-9 flex-shrink-0">
                          <div className="aspect-[2/3] rounded-md overflow-hidden bg-muted">
                            {pick.shows?.poster_path ? (
                              <ImageWithFallback
                                src={`https://image.tmdb.org/t/p/w200${pick.shows.poster_path}`}
                                alt={pick.shows.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{pick.shows?.title}</p>
                          <p className="text-xs text-muted-foreground">picked by {pick.picker_name}</p>
                          {pick.note && (
                            <p className="text-xs text-muted-foreground italic mt-0.5 line-clamp-1">"{pick.note}"</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right / bottom on mobile — sidebar */}
          <div className="space-y-4">

            {/* Add New Scouts (admin only) */}
            {isAdmin && (
              <Card className="rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">Add New Scouts</h3>
                  </div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    Friend's Email Address
                  </label>
                  <div className="relative mb-3">
                    <Input
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      placeholder="scout@example.com"
                      className="pr-9 text-sm"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddMember(); }}
                    />
                    <Mail className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                    onClick={handleAddMember}
                    disabled={addingMember || !addEmail.trim()}
                  >
                    {addingMember ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Add'
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* About the Show */}
            <Card className="rounded-2xl">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  About the Show
                </p>
                {group.show.overview && (
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    {group.show.overview}
                  </p>
                )}
                {genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {genres.map((genre) => (
                      <Badge key={genre} variant="secondary" className="text-xs rounded-full px-2.5 py-0.5">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delete / Leave Group */}
            <div className="pt-1">
              {isAdmin ? (
                confirmDelete ? (
                  <div className="flex gap-2">
                    <Button variant="destructive" className="flex-1" onClick={handleDeleteGroup}>
                      Confirm Delete
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Delete Group
                  </Button>
                )
              ) : (
                confirmLeave ? (
                  <div className="flex gap-2">
                    <Button variant="destructive" className="flex-1" onClick={handleLeaveGroup}>
                      Confirm Leave
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => setConfirmLeave(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setConfirmLeave(true)}
                  >
                    <LogOut className="w-4 h-4 mr-1.5" />
                    Leave Group
                  </Button>
                )
              )}
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
