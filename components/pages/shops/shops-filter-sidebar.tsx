// components/pages/shops/shops-filter-sidebar.tsx
"use client";

import { Filter, MapPin, Shield, Tag, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ShopsFilterSidebarProps {
  filters: any;
  updateFilter: (key: string, value: any) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

export function ShopsFilterSidebar({
  filters,
  updateFilter,
  resetFilters,
  hasActiveFilters,
}: ShopsFilterSidebarProps) {
  const countries = [
    "France",
    "Belgique",
    "Suisse",
    "Canada",
    "États-Unis",
    "Royaume-Uni",
    "Allemagne",
    "Espagne",
    "Italie",
  ];

  const categories = [
    { value: "gaming", label: "🎮 Gaming", count: 42 },
    { value: "esports", label: "🏆 eSports", count: 18 },
    { value: "digital", label: "💻 Digital", count: 56 },
    { value: "collectibles", label: "🃏 Collection", count: 23 },
    { value: "services", label: "🔧 Services", count: 34 },
    { value: "hardware", label: "⚙️ Hardware", count: 15 },
  ];

  return (
    <div className="space-y-4">
      <Card className="sticky top-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-7 text-sm"
              >
                <X className="h-3 w-3 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Catégorie */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Catégorie
              </Label>
              {filters.category && (
                <Badge variant="outline" className="text-xs">
                  {
                    categories
                      .find((c) => c.value === filters.category)
                      ?.label.split(" ")[1]
                  }
                </Badge>
              )}
            </div>
            <Select
              value={filters.category || "all"}
              onValueChange={(value) =>
                updateFilter("category", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{category.label}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {category.count}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pays */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Pays
              </Label>
              {filters.country && (
                <Badge variant="outline" className="text-xs">
                  {filters.country}
                </Badge>
              )}
            </div>
            <Select
              value={filters.country || "all"}
              onValueChange={(value) =>
                updateFilter("country", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les pays</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Statut vérifié */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Statut vérifié
              </Label>
              <Switch
                checked={filters.verified || false}
                onCheckedChange={(checked) =>
                  updateFilter("verified", checked || undefined)
                }
              />
            </div>
            <Typography variant="body-sm" theme="muted">
              Ne montrer que les boutiques vérifiées
            </Typography>
          </div>

          <Separator />

          {/* Suggestions géolocalisées */}
          <div>
            <Typography
              variant="body-base"
              weight="semibold"
              className="mb-3 flex items-center gap-2"
            >
              <MapPin className="h-4 w-4 text-primary" />
              Près de chez vous
            </Typography>
            <div className="space-y-2">
              {["France", "Belgique", "Suisse"].map((country) => (
                <Button
                  key={country}
                  variant="ghost"
                  className="w-full justify-start text-sm h-8"
                  onClick={() => updateFilter("country", country)}
                >
                  <MapPin className="h-3 w-3 mr-2" />
                  {country}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <Card>
        <CardContent className="p-4">
          <Typography variant="body-base" weight="semibold" className="mb-3">
            Statistiques
          </Typography>
          <div className="space-y-2">
            {categories.slice(0, 3).map((category) => (
              <div
                key={category.value}
                className="flex items-center justify-between"
              >
                <Typography variant="body-sm" theme="muted">
                  {category.label.split(" ")[1]}
                </Typography>
                <Badge variant="secondary">{category.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
