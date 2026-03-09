"use client";

import { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { watchGroupService } from '@/services/watchGroupService';
import { toast } from 'sonner';
import { Loader2, Copy, Check } from 'lucide-react';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showId: string;
  showTitle: string;
  showPosterPath?: string;
  onCreated: () => void;
}

export default function CreateGroupDialog({
  open,
  onOpenChange,
  showId,
  showTitle,
  showPosterPath,
  onCreated,
}: CreateGroupDialogProps) {
  const [name, setName] = useState(`${showTitle} Watch Group`);
  const [creating, setCreating] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const posterUrl = showPosterPath
    ? `https://image.tmdb.org/t/p/w200${showPosterPath}`
    : null;

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Group name is required');
      return;
    }
    setCreating(true);
    try {
      const group = await watchGroupService.createGroup(showId, name.trim());
      const link = `${window.location.origin}/groups/join?code=${group.invite_code}`;
      setInviteLink(link);
      toast.success('Watch group created!');
      onCreated();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('Invite link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setInviteLink(null);
    setCopied(false);
    setName(`${showTitle} Watch Group`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{inviteLink ? 'Group Created!' : 'Create Watch Group'}</DialogTitle>
          <DialogDescription>
            {inviteLink
              ? 'Share this link with friends to invite them.'
              : `Create a watch group for ${showTitle}.`}
          </DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input value={inviteLink} readOnly className="text-xs" />
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {posterUrl && (
                <div className="w-12 flex-shrink-0">
                  <ImageWithFallback
                    src={posterUrl}
                    alt={showTitle}
                    width={48}
                    height={72}
                    className="rounded w-full"
                  />
                </div>
              )}
              <div>
                <p className="font-medium text-sm">{showTitle}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Friday Night Crew"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button
                onClick={handleCreate}
                disabled={creating || !name.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    Creating...
                  </>
                ) : (
                  'Create Group'
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
