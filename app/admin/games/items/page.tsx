"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Info,
  Gamepad2,
  Coins,
  Shield,
  Zap,
  Gem,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCcw,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  List,
  Sparkles,
} from "lucide-react";
import { useEntityList } from "@/hooks/use-entity-list";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  useDeleteGameItem,
  useGameItems,
  useUpdateGameItem,
} from "@/hooks/use-games";
import { GameItemWithRelations, GameItem } from "@/database/schema";
import { toast } from "sonner";
import { GameItemVisual } from "@/components/pages/games/game-item-visual";
import { cn } from "@/lib/utils";

export default function GameItemsAdminPage() {
  const [selectedItem, setSelectedItem] =
    useState<GameItemWithRelations | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const {
    data: items,
    loading,
    error,
    page,
    limit,
    searchTerm,
    filters,
    total,
    setPage,
    setLimit,
    setSearchTerm,
    setFilters,
    onRefresh,
    onResetFilters,
  } = useEntityList<GameItemWithRelations>({
    entityType: "game-items",
    defaultFilters: {
      isDeleted: false,
    },
    defaultLimit: 20,
  });

  const { mutate: deleteItem } = useDeleteGameItem();
  const { mutate: updateItem } = useUpdateGameItem();

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet item ?")) {
      deleteItem(id, {
        onSuccess: () => {
          toast.success("Item supprimé avec succès");
          onRefresh();
        },
        onError: () => {
          toast.error("Erreur lors de la suppression");
        },
      });
    }
  };

  const handleToggleStatus = async (item: GameItem) => {
    updateItem(
      {
        id: item.id,
        data: { isActive: !item.isActive },
      },
      {
        onSuccess: () => {
          toast.success(
            `Item ${item.isActive ? "désactivé" : "activé"} avec succès`
          );
          onRefresh();
        },
        onError: () => {
          toast.error("Erreur lors de la mise à jour du statut");
        },
      }
    );
  };

  const handleToggleFeatured = async (item: GameItem) => {
    updateItem(
      {
        id: item.id,
        data: { featured: !item.featured },
      },
      {
        onSuccess: () => {
          toast.success(
            `Item ${item.featured ? "retiré des" : "ajouté aux"} favoris`
          );
          onRefresh();
        },
        onError: () => {
          toast.error("Erreur lors de la mise à jour");
        },
      }
    );
  };

  const getStatusBadge = (item: GameItem) => {
    if (item.isDeleted) return <Badge variant="destructive" className="text-[10px]">Supprimé</Badge>;
    if (!item.isActive) return <Badge variant="secondary" className="text-[10px]">Inactif</Badge>;
    return (
      <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/25 text-[10px]">
        Actif
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "COIN":
        return <Coins className="h-3.5 w-3.5 text-amber-500" />;
      case "ITEM":
        return <Package className="h-3.5 w-3.5 text-blue-500" />;
      case "SKIN":
        return <Shield className="h-3.5 w-3.5 text-purple-500" />;
      case "EQUIPMENT":
        return <Zap className="h-3.5 w-3.5 text-emerald-500" />;
      case "CURRENCY":
        return <Gem className="h-3.5 w-3.5 text-rose-500" />;
      default:
        return <Package className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const filteredItems = (items || []).filter((item: GameItemWithRelations) => {
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    return true;
  });

  // Stats pour l'en-tête
  const stats = [
    {
      label: "Total Items",
      value: total,
      icon: Package,
      color: "text-blue-500",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Coins & Devises",
      value: items?.filter((i: GameItem) => i.type === "COIN" || i.type === "CURRENCY").length || 0,
      icon: Coins,
      color: "text-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Items Vedettes",
      value: items?.filter((i: GameItem) => i.featured).length || 0,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* En-tête de page flexible */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-start">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-black uppercase tracking-wider mb-1">
            <Sparkles className="h-3 w-3" />
            Marketplace Admin
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            Items de Jeu
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Gérez les monnaies, skins et équipements avec leurs visuels 3D.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <Button
            onClick={() => onRefresh()}
            variant="outline"
            size="icon"
            className="rounded-xl border-border/60 hover:bg-muted"
          >
            <RefreshCcw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button asChild className="flex-1 sm:flex-none rounded-xl font-black uppercase tracking-wider text-xs shadow-lg shadow-primary/20">
            <Link href="/admin/games/items/create">
              <Plus className="mr-2 h-4 w-4" /> Nouvel Item
            </Link>
          </Button>
        </div>
      </div>

      {/* Cartes de statistiques responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="rounded-2xl border-border/60 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </p>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
                  {loading ? "..." : stat.value}
                </h3>
              </div>
              <div className={cn("p-3 rounded-2xl border", stat.bg)}>
                <stat.icon className={cn("h-5 w-5 sm:h-6 sm:w-6", stat.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Carte principale avec filtres et contenu */}
      <Card className="rounded-2xl border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-6 pb-3 text-start border-b border-border/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base sm:text-lg font-black uppercase tracking-tight">
                Catalogue des Items
              </CardTitle>
              <CardDescription className="text-xs">
                {total} items enregistrés sur la plateforme
              </CardDescription>
            </div>

            {/* Barre de recherche et sélecteur de type */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher par nom..."
                  className="pl-9 h-9 text-xs rounded-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtre par type */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { value: "all", label: "Tous" },
                  { value: "COIN", label: "Coins" },
                  { value: "ITEM", label: "Items" },
                  { value: "SKIN", label: "Skins" },
                  { value: "EQUIPMENT", label: "Équip." },
                  { value: "CURRENCY", label: "Devises" },
                ].map((tf) => (
                  <Button
                    key={tf.value}
                    type="button"
                    variant={typeFilter === tf.value ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-[11px] rounded-lg px-2.5 font-bold uppercase tracking-wider shrink-0"
                    onClick={() => setTypeFilter(tf.value)}
                  >
                    {tf.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* VUE MOBILE (< 768px) : Cartes tactiles ultra-lisibles */}
          <div className="block md:hidden divide-y divide-border/40">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
                Chargement des items...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Aucun item ne correspond à vos critères.
              </div>
            ) : (
              filteredItems.map((item: GameItemWithRelations) => (
                <div key={item.id} className="p-4 space-y-3 text-start hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-muted/40 border border-border/50 shrink-0 flex items-center justify-center p-1">
                        {item.icon ? (
                          <img
                            src={item.icon}
                            alt={item.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm truncate flex items-center gap-1.5">
                          {item.name}
                          {item.featured && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          )}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <Gamepad2 className="h-3 w-3" />
                          {item.game?.name || "Jeu non spécifié"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-black text-sm text-primary">
                        {item.priceGtc} <span className="text-[10px]">GTC</span>
                      </div>
                      <div className="mt-0.5">{getStatusBadge(item)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/30">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {item.type}
                      </Badge>
                      <span className="text-[10px]">~{item.processingTime || "Instant"}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          setSelectedItem(item);
                          setIsDetailOpen(true);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> Détails
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        asChild
                      >
                        <Link href={`/admin/games/items/edit?id=${item.id}`}>
                          <Edit className="h-3.5 w-3.5 mr-1" /> Modifier
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* VUE TABLETTE & DESKTOP (>= 768px) : Tableau avec overflow horizontal contrôlé */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-muted/40 border-b border-border/50 text-muted-foreground font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Item</th>
                  <th className="px-4 py-3 text-left">Jeu</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-right">Prix (GTC)</th>
                  <th className="px-4 py-3 text-left">Délai / Dispo</th>
                  <th className="px-4 py-3 text-center">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                        Chargement des items...
                      </td>
                    </tr>
                  ))
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Aucun item trouvé
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item: GameItemWithRelations) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-background border border-border/50 shrink-0 flex items-center justify-center p-1">
                            {item.icon ? (
                              <img
                                src={item.icon}
                                alt={item.name}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground/30" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold flex items-center gap-1 truncate text-foreground">
                              {item.name}
                              {item.featured && (
                                <CheckCircle2 className="h-3 w-3 text-amber-500 shrink-0" />
                              )}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ID: {item.id.substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5 rounded-md">
                            <AvatarImage src={item.game?.profileImage || ""} />
                            <AvatarFallback>
                              <Gamepad2 className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold truncate max-w-[140px]">
                            {item.game?.name || "Jeu inconnu"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider bg-muted/40">
                          {getTypeIcon(item.type)}
                          {item.type}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-primary font-mono text-sm">
                        {item.priceGtc} GTC
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{item.processingTime || "Instant"}</span>
                          <span className="mx-0.5">•</span>
                          <span
                            className={
                              item.availability === "AVAILABLE"
                                ? "text-emerald-500 font-semibold"
                                : "text-rose-500 font-semibold"
                            }
                          >
                            {item.availability === "AVAILABLE" ? "Dispo" : "Rupture"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(item)}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedItem(item);
                                setIsDetailOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" /> Voir Détails
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/games/items/edit?id=${item.id}`}>
                                <Edit className="mr-2 h-4 w-4" /> Modifier
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(item)}>
                              <RefreshCcw className="mr-2 h-4 w-4" />
                              {item.isActive ? "Désactiver" : "Activer"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleFeatured(item)}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              {item.featured ? "Retirer favori" : "Mettre favori"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-rose-500 focus:text-rose-500"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination responsive */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border/40">
            <div className="text-xs text-muted-foreground">
              Page {page} sur {Math.max(1, Math.ceil(total / limit))} ({total} items au total)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-xs"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1 || loading}
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-xs"
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(total / limit) || loading}
              >
                Suivant <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Détails Item avec GameItemVisual */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-background/95 backdrop-blur-xl border-border/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tight">
              <Package className="h-5 w-5 text-primary" />
              Détails de l'item
            </DialogTitle>
            <DialogDescription className="text-xs">
              Vue complète de l'item avec rendu visuel immersif.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6 py-2">
              {/* Visuel immersif en tête */}
              <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden border border-border/50 shadow-md">
                <GameItemVisual
                  item={selectedItem}
                  mode="card"
                  withGTBranding={true}
                />
              </div>

              {/* Grille d'informations compacte et fluide */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-card border border-border/40 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Nom & Jeu
                  </span>
                  <p className="font-black text-sm">{selectedItem.name}</p>
                  <p className="text-muted-foreground">{selectedItem.game?.name || "Jeu non spécifié"}</p>
                </div>

                <div className="p-3 rounded-xl bg-card border border-border/40 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Tarification
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-black text-base text-primary">{selectedItem.priceGtc}</span>
                    <span className="font-bold text-xs text-primary/70">GTC</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Délai estimé: {selectedItem.processingTime || "Instant"}</p>
                </div>
              </div>

              {/* Description */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 space-y-1 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Description
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedItem.description || "Aucune description détaillée enregistrée pour cet item."}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/40">
            <Button variant="outline" className="w-full sm:w-auto text-xs rounded-xl" onClick={() => setIsDetailOpen(false)}>
              Fermer
            </Button>
            {selectedItem && (
              <Button asChild className="w-full sm:w-auto text-xs rounded-xl font-bold">
                <Link href={`/admin/games/items/edit?id=${selectedItem.id}`}>
                  <Edit className="mr-1.5 h-3.5 w-3.5" /> Modifier cet item
                </Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
