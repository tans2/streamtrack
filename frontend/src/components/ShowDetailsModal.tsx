"use client";

import { useState } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogClose 
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Star, Plus, Check, Loader2, X } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Show } from '@/services/showService';
import { watchlistService } from '@/services/watchlistService';
import { toast } from 'sonner';

interface ShowDetailsModalProps {
  show: Show | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShowDetailsModal({ show, isOpen, onClose }: ShowDetailsModalProps) {
  const [addingToWatchlist, setAddingToWatchlist] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  
  const { user } = useAuth();
  const router = useRouter();

  const handleAddToWatchlist = async () => {
    if (!user) {
      toast.error('Please sign in to add shows to your watchlist');
      router.push('/auth');
      return;
    }

    if (!show) return;

    setAddingToWatchlist(true);
    try {
      await watchlistService.addToWatchlist(show.tmdb_id);
      setRecentlyAdded(true);
      toast.success(`"${show.title}" added to your watchlist!`);
    } catch (error: any) {
      console.error('Add to watchlist error:', error);
      toast.error(error.message || 'Failed to add to watchlist');
    } finally {
      setAddingToWatchlist(false);
    }
  };

  const getPosterUrl = (posterPath?: string) => {
    if (!posterPath) return '';
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  };

  const getProviderNames = (providers: any[]) => {
    if (!providers || providers.length === 0) {
      return [];
    }
    return providers.map(p => p.provider_name);
  };

  const getAvailabilityType = (availability: any) => {
    const types = [];
    if (availability.flatrate?.length > 0) types.push('Subscription');
    if (availability.free?.length > 0) types.push('Free');
    if (availability.ads?.length > 0) types.push('With Ads');
    if (availability.rent?.length > 0) types.push('Rent');
    if (availability.buy?.length > 0) types.push('Buy');
    return types;
  };

  const getSelectedSeasonData = () => {
    if (!show?.seasonAvailability) return null;
    return show.seasonAvailability.find((season: any) => season.season === selectedSeason);
  };

  const getAvailableSeasons = () => {
    if (!show?.seasonAvailability) return [];
    return show.seasonAvailability.map((season: any) => season.season).sort((a: number, b: number) => a - b);
  };

  if (!show) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-foreground mb-2">
                {show.title}
              </DialogTitle>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-600 mr-1" />
                  <span>{show.rating?.toFixed(1) || 'N/A'}</span>
                </div>
                {show.year && <span>{show.year}</span>}
                {show.totalSeasons && <span>{show.totalSeasons} seasons</span>}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <div className="pr-4">
          <div className="space-y-6">
            {/* Show Overview */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-48 h-72 rounded-lg overflow-hidden bg-muted">
                  <ImageWithFallback
                    src={getPosterUrl(show.poster_path)}
                    alt={show.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-3">Overview</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {show.overview || 'No overview available.'}
                </p>
                
                {/* Add to Watchlist Button */}
                <div className="mt-4">
                  <Button
                    onClick={handleAddToWatchlist}
                    disabled={addingToWatchlist || recentlyAdded}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {addingToWatchlist ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : recentlyAdded ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    {recentlyAdded ? 'Added to Watchlist!' : 'Add to Watchlist'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Overall Availability */}
            {show.providers && show.providers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Overall Availability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {getProviderNames(show.providers).map((provider, idx) => (
                      <Badge key={idx} variant="outline" className="border-primary/50 text-foreground">
                        {provider}
                      </Badge>
                    ))}
                  </div>
                  {show.availability && (
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-2">Availability Types:</p>
                      <div className="flex flex-wrap gap-1">
                        {getAvailabilityType(show.availability).map((type, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Season Availability */}
            {show.seasonAvailability && show.seasonAvailability.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Season Availability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Season Selector */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-card-foreground">Select Season</label>
                      <Select
                        value={selectedSeason.toString()}
                        onValueChange={(value) => setSelectedSeason(parseInt(value))}
                      >
                        <SelectTrigger className="bg-input-background border-border text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableSeasons().map((seasonNum) => (
                            <SelectItem key={seasonNum} value={seasonNum.toString()}>
                              Season {seasonNum}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Selected Season Details */}
                    {(() => {
                      const seasonData = getSelectedSeasonData();
                      if (!seasonData) {
                        return (
                          <div className="border border-border rounded-lg p-4">
                            <p className="text-muted-foreground text-sm">
                              No streaming information available for Season {selectedSeason}.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="border border-border rounded-lg p-4">
                          <h4 className="font-semibold text-foreground mb-3">
                            Season {seasonData.season}
                          </h4>
                          
                          {seasonData.providers && seasonData.providers.length > 0 ? (
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                {seasonData.providers.map((provider: any, providerIdx: number) => (
                                  <Badge key={providerIdx} variant="outline" className="border-primary/50 text-foreground">
                                    {provider.name}
                                  </Badge>
                                ))}
                              </div>
                              
                              {seasonData.availability && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-2">Availability Types:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {getAvailabilityType(seasonData.availability).map((type: string, typeIdx: number) => (
                                      <Badge key={typeIdx} variant="secondary" className="text-xs">
                                        {type}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm">
                              No streaming information available for this season.
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Season Availability</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    No season availability information available for this show.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
