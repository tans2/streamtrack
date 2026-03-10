"use client";

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { watchGroupService } from '@/services/watchGroupService';
import { WatchlistItem } from '@/services/watchlistService';
import { toast } from 'sonner';
import { Loader2, Copy, Check } from 'lucide-react';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  watchlist: WatchlistItem[];
  onCreated: () => void;
}

export default function CreateGroupDialog({
  open,
  onOpenChange,
  watchlist,
  onCreated,
}: CreateGroupDialogProps) {
  const [selectedShowId, setSelectedShowId] = useState<string>('');
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedItem = watchlist.find(w => w.show_id === selectedShowId);

  // Auto-fill group name when show is selected
  useEffect(() => {
    if (selectedItem) {
      setName(`${selectedItem.shows.title} Watch Group`);
    }
  }, [selectedShowId]);

  const handleCreate = async () => {
    if (!selectedShowId) {
      toast.error('Please select a show');
      return;
    }
    if (!name.trim()) {
      toast.error('Group name is required');
      return;
    }
    setCreating(true);
    try {
      const group = await watchGroupService.createGroup(selectedShowId, name.trim());
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
    setSelectedShowId('');
    setName('');
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
              : 'Pick a show and create a group to watch together.'}
          </DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="space-y-4">
            {selectedItem && (
              <div className="flex items-center gap-3">
                {selectedItem.shows.poster_path && (
                  <div className="w-10 flex-shrink-0">
                    <ImageWithFallback
                      src={`https://image.tmdb.org/t/p/w200${selectedItem.shows.poster_path}`}
                      alt={selectedItem.shows.title}
                      width={40}
                      height={60}
                      className="rounded w-full"
                    />
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{name}</p>
                  <p className="text-xs text-muted-foreground">{selectedItem.shows.title}</p>
                </div>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Invite Link</Label>
              <div className="flex items-center gap-2">
                <Input value={inviteLink} readOnly className="text-xs" />
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Show</Label>
              <Select value={selectedShowId} onValueChange={setSelectedShowId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a show..." />
                </SelectTrigger>
                <SelectContent>
                  {watchlist.map(item => (
                    <SelectItem key={item.show_id} value={item.show_id}>
                      {item.shows.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedItem && (
              <div className="flex items-center gap-3">
                {selectedItem.shows.poster_path && (
                  <div className="w-12 flex-shrink-0">
                    <ImageWithFallback
                      src={`https://image.tmdb.org/t/p/w200${selectedItem.shows.poster_path}`}
                      alt={selectedItem.shows.title}
                      width={48}
                      height={72}
                      className="rounded w-full"
                    />
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{selectedItem.shows.title}</p>
                </div>
              </div>
            )}

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
                disabled={creating || !selectedShowId || !name.trim()}
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
