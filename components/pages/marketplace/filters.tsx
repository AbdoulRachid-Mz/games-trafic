
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { useState, useEffect } from "react";
import { Search, FilterX, Gamepad2, Trophy, Shield, Zap, Swords, Crown, Target, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { countries } from "@/lib/countries";

const POPULAR_GAMES = [
  "Efootball Pes",
  "Valorant",
  "League of Legends",
  "Fortnite",
  "CS:GO",
  "Apex Legends",
  "Call of Duty",
  "Overwatch",
  "Minecraft",
  "Genshin Impact",
  "PUBG",
];

const PLATFORMS = [
  { value: "PC", label: "PC", icon: "💻" },
  { value: "PLAYSTATION", label: "PlayStation", icon: "🎮" },
  { value: "XBOX", label: "Xbox", icon: "🎮" },
  { value: "NINTENDO_SWITCH", label: "Nintendo Switch", icon: "🎮" },
  { value: "MOBILE", label: "Mobile", icon: "📱" },
];

const ACCOUNT_RANKS = [
  { value: "IRON", label: "Iron", color: "text-gray-600" },
  { value: "BRONZE", label: "Bronze", color: "text-amber-700" },
  { value: "SILVER", label: "Silver", color: "text-gray-500" },
  { value: "GOLD", label: "Gold", color: "text-yellow-600" },
  { value: "PLATINUM", label: "Platinum", color: "text-cyan-600" },
  { value: "DIAMOND", label: "Diamond", color: "text-blue-600" },
  { value: "MASTER", label: "Master", color: "text-purple-600" },
  { value: "GRANDMASTER", label: "Grandmaster", color: "text-red-600" },
  { value: "CHALLENGER", label: "Challenger", color: "text-amber-500" },
];

const ACCOUNT_FEATURES = [
  { value: "verified", label: "Comptes vérifiés", icon: Shield },
  { value: "featured", label: "En vedette", icon: Trophy },
  { value: "instant", label: "Livraison instantanée", icon: Zap },
  { value: "negotiable", label: "Prix négociable", icon: Swords },
];

export function MarketplaceFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [levelRange, setLevelRange] = useState([1, 100]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedRanks, setSelectedRanks] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("popularity");

  // Initialiser les filtres depuis les paramètres URL
  useEffect(() => {
    if (searchParams.get("games")) {
      setSelectedGames(searchParams.get("games")?.split(",") || []);
    }
    if (searchParams.get("platforms")) {
      setSelectedPlatforms(searchParams.get("platforms")?.split(",") || []);
    }
    if (searchParams.get("ranks")) {
      setSelectedRanks(searchParams.get("ranks")?.split(",") || []);
    }
    if (searchParams.get("features")) {
      setSelectedFeatures(searchParams.get("features")?.split(",") || []);
    }
    if (searchParams.get("countries")) {
      setSelectedCountries(searchParams.get("countries")?.split(",") || []);
    }
    if (searchParams.get("minPrice")) {
      setPriceRange([Number(searchParams.get("minPrice")), priceRange[1]]);
    }
    if (searchParams.get("maxPrice")) {
      setPriceRange([priceRange[0], Number(searchParams.get("maxPrice"))]);
    }
    if (searchParams.get("minLevel")) {
      setLevelRange([Number(searchParams.get("minLevel")), levelRange[1]]);
    }
    if (searchParams.get("maxLevel")) {
      setLevelRange([levelRange[0], Number(searchParams.get("maxLevel"))]);
    }
    if (searchParams.get("sortBy")) {
      setSortBy(searchParams.get("sortBy") || "popularity");
    }
  }, [searchParams]);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (searchTerm) params.set("q", searchTerm);
    else params.delete("q");

    if (selectedGames.length > 0) params.set("games", selectedGames.join(","));
    else params.delete("games");

    if (selectedPlatforms.length > 0)
      params.set("platforms", selectedPlatforms.join(","));
    else params.delete("platforms");

    if (selectedRanks.length > 0)
      params.set("ranks", selectedRanks.join(","));
    else params.delete("ranks");

    if (selectedFeatures.length > 0)
      params.set("features", selectedFeatures.join(","));
    else params.delete("features");

    if (selectedCountries.length > 0)
      params.set("countries", selectedCountries.join(","));
    else params.delete("countries");

    params.set("minPrice", priceRange[0].toString());
    params.set("maxPrice", priceRange[1].toString());
    params.set("minLevel", levelRange[0].toString());
    params.set("maxLevel", levelRange[1].toString());
    params.set("sortBy", sortBy);

    router.replace(`/marketplace?${params.toString()}`, { scroll: false });
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedGames([]);
    setSelectedPlatforms([]);
    setSelectedRanks([]);
    setSelectedFeatures([]);
    setSelectedCountries([]);
    setPriceRange([0, 10000]);
    setLevelRange([1, 100]);
    setSortBy("popularity");
    router.replace("/marketplace", { scroll: false });
  };

  const hasActiveFilters =
    searchTerm ||
    selectedGames.length > 0 ||
    selectedPlatforms.length > 0 ||
    selectedRanks.length > 0 ||
    selectedFeatures.length > 0 ||
    selectedCountries.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 10000 ||
    levelRange[0] > 1 ||
    levelRange[1] < 100 ||
    sortBy !== "popularity";

  const toggleSelection = (
    value: string,
    list: string[],
    setter: (list: string[]) => void,
  ) => {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
    } else {
      setter([...list, value]);
    }
  };

  // Popular countries for gaming
  const popularCountries = countries.filter(c =>
    ["US", "FR", "DE", "GB", "CA", "AU", "BR", "JP", "KR"].includes(c.code)
  );

  return (
    <div className="space-y-6">
      <Card className="border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Gamepad2 className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Filtres Gaming</CardTitle>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 px-3 text-xs hover:text-primary"
              >
                <FilterX className="h-3.5 w-3.5 mr-1.5" />
                Tout effacer
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {/* Search */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Recherche</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nom du compte, jeu, rang..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              />
            </div>
          </div>

          <Separator />

          {/* Games */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Jeux populaires</Label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_GAMES.map((game) => (
                <Badge
                  key={game}
                  variant={selectedGames.includes(game) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all hover:scale-105 py-1.5",
                    selectedGames.includes(game)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-primary/10"
                  )}
                  onClick={() =>
                    toggleSelection(game, selectedGames, setSelectedGames)
                  }
                >
                  {game}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Platforms */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Plateformes</Label>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.value}
                  onClick={() =>
                    toggleSelection(
                      platform.value,
                      selectedPlatforms,
                      setSelectedPlatforms,
                    )
                  }
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 p-3 rounded-lg border transition-all hover:scale-105",
                    selectedPlatforms.includes(platform.value)
                      ? "bg-primary/10 border-primary text-primary font-medium"
                      : "hover:bg-muted"
                  )}
                >
                  <span className="text-xl">{platform.icon}</span>
                  <span className="text-xs font-medium">{platform.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Ranks */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Crown className="h-4 w-4" />
              Rangs
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {ACCOUNT_RANKS.map((rank) => (
                <button
                  key={rank.value}
                  onClick={() =>
                    toggleSelection(rank.value, selectedRanks, setSelectedRanks)
                  }
                  className={cn(
                    "p-2 rounded-lg border transition-all hover:scale-105 text-xs font-medium",
                    selectedRanks.includes(rank.value)
                      ? "bg-primary/10 border-primary text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  {rank.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Account Features */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Caractéristiques</Label>
            <div className="space-y-2">
              {ACCOUNT_FEATURES.map((feature) => (
                <div
                  key={feature.value}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02]",
                    selectedFeatures.includes(feature.value)
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted/50"
                  )}
                  onClick={() =>
                    toggleSelection(
                      feature.value,
                      selectedFeatures,
                      setSelectedFeatures,
                    )
                  }
                >
                  <Checkbox
                    id={`feature-${feature.value}`}
                    checked={selectedFeatures.includes(feature.value)}
                    onCheckedChange={() =>
                      toggleSelection(
                        feature.value,
                        selectedFeatures,
                        setSelectedFeatures,
                      )
                    }
                    className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <feature.icon
                    className={cn(
                      "h-4 w-4",
                      selectedFeatures.includes(feature.value)
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                  <label
                    htmlFor={`feature-${feature.value}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {feature.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Countries */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Globe className="h-4 w-4" />
              Pays des vendeurs
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {popularCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() =>
                    toggleSelection(country.code, selectedCountries, setSelectedCountries)
                  }
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all hover:scale-105",
                    selectedCountries.includes(country.code)
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted"
                  )}
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="text-xs">{country.code}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Price Range */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">Prix (GTC)</Label>
              <Badge variant="outline" className="font-mono text-xs">
                {priceRange[0]} - {priceRange[1]}
              </Badge>
            </div>
            <Slider
              defaultValue={[0, 10000]}
              max={20000}
              step={100}
              value={priceRange}
              onValueChange={setPriceRange}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 GTC</span>
              <span>20 000 GTC</span>
            </div>
          </div>

          <Separator />

          {/* Level Range */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium flex items-center gap-1">
                <Target className="h-4 w-4" />
                Niveau
              </Label>
              <Badge variant="outline" className="font-mono text-xs">
                {levelRange[0]} - {levelRange[1]}
              </Badge>
            </div>
            <Slider
              defaultValue={[1, 100]}
              max={100}
              min={1}
              step={1}
              value={levelRange}
              onValueChange={setLevelRange}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>100</span>
            </div>
          </div>

          <Separator />

          {/* Sort By */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Trier par</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "popularity", label: "Popularité", icon: Zap },
                { value: "newest", label: "Plus récent", icon: Swords },
                { value: "price_low", label: "Prix croissant", icon: Trophy },
                { value: "price_high", label: "Prix décroissant", icon: Crown },
              ].map((sort) => (
                <button
                  key={sort.value}
                  onClick={() => setSortBy(sort.value)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border transition-all hover:scale-105",
                    sortBy === sort.value
                      ? "bg-primary/10 border-primary text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  <sort.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{sort.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full mt-4"
            onClick={applyFilters}
            size="lg"
          >
            Appliquer les filtres
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {[
                  searchTerm ? 1 : 0,
                  selectedGames.length,
                  selectedPlatforms.length,
                  selectedRanks.length,
                  selectedFeatures.length,
                  selectedCountries.length,
                  priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0,
                  levelRange[0] > 1 || levelRange[1] < 100 ? 1 : 0,
                  sortBy !== "popularity" ? 1 : 0
                ].reduce((a, b) => a + b, 0)}
              </Badge>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
