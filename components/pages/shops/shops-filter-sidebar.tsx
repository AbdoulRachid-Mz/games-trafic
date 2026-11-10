// components/pages/shops/shops-filter-sidebar.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
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
import { getShopStats } from "@/actions/shops";
import { getCategoriesByEntityType } from "@/actions/categories";

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

  // Catégories RÉELLES applicables aux boutiques — plus de liste hardcodée.
  const { data: realCategories } = useQuery({
    queryKey: ["categories", "SHOP"],
    queryFn: () => getCategoriesByEntityType("SHOP"),
  });

  // Statistiques RÉELLES (agrégées serveur sur TOUTES les boutiques) —
  // PROMPT §10.5 : pas de counts hardcodés.
  const { data: shopStats } = useQuery({
    queryKey: ["shops-stats", "sidebar"],
    queryFn: () => getShopStats(),
  });

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
                  {(realCategories || []).find(
                    (c) => c.id === filters.category,
                  )?.name ?? "Catégorie"}
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
                {(realCategories || []).map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
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

      {/* Statistiques rapides — RÉELLES (agrégées serveur) */}
      <Card>
        <CardContent className="p-4">
          <Typography variant="body-base" weight="semibold" className="mb-3">
            Statistiques
          </Typography>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Typography variant="body-sm" theme="muted">
                Boutiques actives
              </Typography>
              <Badge variant="secondary">{shopStats?.active ?? "…"}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <Typography variant="body-sm" theme="muted">
                Vérifiées
              </Typography>
              <Badge variant="secondary">{shopStats?.verified ?? "…"}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <Typography variant="body-sm" theme="muted">
                En vedette
              </Typography>
              <Badge variant="secondary">{shopStats?.featured ?? "…"}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <Typography variant="body-sm" theme="muted">
                Produits en vente
              </Typography>
              <Badge variant="secondary">{shopStats?.totalProducts ?? "…"}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
