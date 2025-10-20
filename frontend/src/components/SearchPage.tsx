import { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowLeft, Search, Star, Plus } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface SearchPageProps {
  onNavigate: (page: string) => void;
}

// Mock show data
const mockShows = [
  {
    id: 1,
    title: "Stranger Things",
    rating: 8.7,
    platform: "Netflix",
    country: "US",
    tier: "subscription",
    poster: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=450&fit=crop"
  },
  {
    id: 2,
    title: "The Mandalorian",
    rating: 8.8,
    platform: "Disney+",
    country: "US",
    tier: "subscription",
    poster: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=450&fit=crop"
  },
  {
    id: 3,
    title: "The Boys",
    rating: 8.4,
    platform: "Prime Video",
    country: "US",
    tier: "subscription",
    poster: "https://images.unsplash.com/photo-1489599613113-21046ce2c11b?w=300&h=450&fit=crop"
  },
  {
    id: 4,
    title: "House of the Dragon",
    rating: 8.2,
    platform: "HBO Max",
    country: "US",
    tier: "subscription",
    poster: "https://images.unsplash.com/photo-1533613220915-609f661a6fe1?w=300&h=450&fit=crop"
  },
  {
    id: 5,
    title: "Ted Lasso",
    rating: 8.9,
    platform: "Apple TV+",
    country: "US",
    tier: "subscription",
    poster: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=450&fit=crop"
  },
  {
    id: 6,
    title: "Yellowstone",
    rating: 8.6,
    platform: "Paramount+",
    country: "US",
    tier: "subscription",
    poster: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=300&h=450&fit=crop"
  }
];

const platforms = ['All Platforms', 'Netflix', 'Disney+', 'Prime Video', 'HBO Max', 'Apple TV+', 'Paramount+', 'Hulu', 'Peacock', 'YouTube TV', 'Fubo TV'];
const countries = ['US', 'UK', 'Canada', 'Australia', 'Germany', 'France'];
const tiers = ['any', 'subscription', 'free', 'with ads', 'rent', 'buy'];

export default function SearchPage({ onNavigate }: SearchPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('All Platforms');
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [selectedTier, setSelectedTier] = useState('any');
  const [filteredShows, setFilteredShows] = useState(mockShows);

  const handleSearch = () => {
    let filtered = mockShows.filter(show => 
      show.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (selectedPlatform !== 'All Platforms') {
      filtered = filtered.filter(show => show.platform === selectedPlatform);
    }

    if (selectedTier !== 'any') {
      filtered = filtered.filter(show => show.tier === selectedTier);
    }

    setFilteredShows(filtered);
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
                onClick={() => onNavigate('landing')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl text-foreground">Search Shows</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                className="text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => onNavigate('profile')}
              >
                My Watchlist
              </Button>
              <Button 
                variant="ghost" 
                className="text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => onNavigate('settings')}
              >
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Search Form */}
        <Card className="bg-card border-border shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="search" className="text-card-foreground">Search by Title</Label>
                <Input
                  id="search"
                  placeholder="Enter show title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-input-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-card-foreground">Platform</Label>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger className="bg-input-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map(platform => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-card-foreground">Country</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
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
              
              <div className="space-y-2">
                <Label className="text-card-foreground">Subscription Tier</Label>
                <Select value={selectedTier} onValueChange={setSelectedTier}>
                  <SelectTrigger className="bg-input-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiers.map(tier => (
                      <SelectItem key={tier} value={tier}>
                        {tier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleSearch}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div>
          <h2 className="text-xl mb-6 text-foreground">Search Results ({filteredShows.length} shows found)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredShows.map(show => (
              <Card key={show.id} className="bg-card border-border hover:border-primary transition-colors shadow-lg">
                <CardContent className="p-4">
                  <div className="aspect-[2/3] mb-4 rounded-lg overflow-hidden bg-muted">
                    <ImageWithFallback 
                      src={show.poster}
                      alt={show.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-card-foreground mb-2">{show.title}</h3>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-600 mr-1" />
                      <span className="text-muted-foreground">{show.rating}</span>
                    </div>
                    <Badge variant="outline" className="border-primary/50 text-foreground">
                      {show.platform}
                    </Badge>
                  </div>
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Watchlist
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}