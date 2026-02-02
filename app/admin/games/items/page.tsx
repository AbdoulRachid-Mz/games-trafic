"use client";

import React, { useState } from "react";
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
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCcw,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useEntityList } from "@/hooks/use-entity-list";
// import { EntityList } from "@/components/admin/entity-list";
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
  DialogTrigger,
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

export default function GameItemsAdminPage() {
  const [selectedItem, setSelectedItem] =
    useState<GameItemWithRelations | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { data } = useGameItems();

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
    initialData: data?.pages.flatMap((page) => page.data),
    defaultLimit: 20,
    fetchMethod: "server-action",
    withRelations: true,
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
            `Item ${item.isActive ? "désactivé" : "activé"} avec succès`,
          );
          onRefresh();
        },
        onError: () => {
          toast.error("Erreur lors de la mise à jour du statut");
        },
      },
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
            `Item ${item.featured ? "retiré des" : "ajouté aux"} favoris`,
          );
          onRefresh();
        },
        onError: () => {
          toast.error("Erreur lors de la mise à jour");
        },
      },
    );
  };

  const getStatusBadge = (item: GameItem) => {
    if (item.isDeleted) return <Badge variant="destructive">Supprimé</Badge>;
    if (!item.isActive) return <Badge variant="outline">Inactif</Badge>;
    return (
      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
        Actif
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "COIN":
        return <Coins className="h-4 w-4 text-yellow-500" />;
      case "ITEM":
        return <Package className="h-4 w-4 text-blue-500" />;
      case "SKIN":
        return <Shield className="h-4 w-4 text-purple-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-400" />;
    }
  };

  // Stats pour l'en-tête
  const stats = [
    {
      label: "Total Items",
      value: total,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      label: "Coins / Cash",
      value: items?.filter((i: GameItem) => i.type === "COIN").length || 0,
      icon: Coins,
      color: "text-yellow-600",
      bg: "bg-yellow-100 dark:bg-yellow-900/20",
    },
    {
      label: "Items Vedettes",
      value: items?.filter((i: GameItem) => i.featured).length || 0,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/20",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Items de Jeu</h1>
          <p className="text-muted-foreground">
            Gérez les coins, skins et items disponibles pour les différents
            jeux.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => onRefresh()} variant="outline" size="icon">
            <RefreshCcw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button asChild>
            <a href="/admin/games/items/create">
              <Plus className="mr-2 h-4 w-4" /> Nouvel Item
            </a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {loading ? "..." : stat.value}
                </h3>
              </div>
              <div className={`${stat.bg} p-3 rounded-full`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3 text-start">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des items</CardTitle>
              <CardDescription>
                {total} items trouvés dans la base de données
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher un item..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Item</th>
                  <th className="px-4 py-3 text-left font-medium">Jeu</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 font-medium text-end">Prix (GTC)</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Disponibilité
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Statut</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        Chargement...
                      </td>
                    </tr>
                  ))
                ) : items?.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      Aucun item trouvé
                    </td>
                  </tr>
                ) : (
                  items?.map((item: GameItemWithRelations) => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 rounded-md">
                            <AvatarImage
                              src={item.icon || ""}
                              alt={item.name}
                            />
                            <AvatarFallback className="rounded-md">
                              <Package className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium flex items-center gap-1">
                              {item.name}
                              {item.featured && (
                                <CheckCircle2 className="h-3 w-3 text-yellow-500" />
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                              ID: {item.id.substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 rounded-full">
                            <AvatarImage
                              src={item.game?.profileImage || ""}
                              alt={item.game?.name}
                            />
                            <AvatarFallback>
                              <Gamepad2 className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">
                            {item.game?.name || "Jeu inconnu"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          <span className="text-xs uppercase font-semibold">
                            {item.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-end font-mono font-medium">
                        {item.priceGtc} GTC
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{item.processingTime || "24h"}</span>
                          <span className="mx-1">•</span>
                          <span
                            className={
                              item.availability === "AVAILABLE"
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {item.availability === "AVAILABLE"
                              ? "Dispo"
                              : "Rupture"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(item)}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
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
                              <a href={`/admin/games/items/edit?id=${item.id}`}>
                                <Edit className="mr-2 h-4 w-4" /> Modifier
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(item)}
                            >
                              <RefreshCcw className="mr-2 h-4 w-4" />
                              {item.isActive ? "Désactiver" : "Activer"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleFeatured(item)}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              {item.featured
                                ? "Retirer favori"
                                : "Mettre favori"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
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

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {page} sur {Math.ceil(total / limit)} ({total} items au
              total)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(total / limit) || loading}
              >
                Suivant <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Détails Item */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-7xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              Détails de l'item
            </DialogTitle>
            <DialogDescription>
              Informations complètes sur l'item sélectionné.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" /> Informations générales
                  </h4>
                  <div className="space-y-2 text-sm bg-muted/40 p-3 rounded-lg border">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nom:</span>
                      <span className="font-semibold">{selectedItem.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Jeu:</span>
                      <span className="font-semibold text-blue-600">
                        {selectedItem.game?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="secondary" className="text-[10px] py-0">
                        {selectedItem.type}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="font-mono text-[10px]">
                        {selectedItem.id}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-muted-foreground">Créé le:</span>
                      <span>
                        {format(
                          new Date(selectedItem.createdAt!),
                          "dd MMMM yyyy",
                          { locale: fr },
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Statut & Visibilité
                  </h4>
                  <div className="space-y-2 text-sm bg-muted/40 p-3 rounded-lg border">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">État:</span>
                      {getStatusBadge(selectedItem)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vedette:</span>
                      <span>{selectedItem.featured ? "Oui" : "Non"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Popularité:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">
                          {selectedItem.popularity}
                        </span>
                        <Eye className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Coins className="h-4 w-4" /> Tarification & Vente
                  </h4>
                  <div className="space-y-2 text-sm bg-muted/40 p-3 rounded-lg border">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Prix:</span>
                      <span className="text-lg font-bold text-green-600">
                        {selectedItem.priceGtc} GTC
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Taux de change:
                      </span>
                      <span className="font-mono">
                        {selectedItem.exchangeRate || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Commande Min:
                      </span>
                      <span>{selectedItem.minOrder}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Commande Max:
                      </span>
                      <span>{selectedItem.maxOrder}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Logistique
                  </h4>
                  <div className="space-y-2 text-sm bg-muted/40 p-3 rounded-lg border">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Disponibilité:
                      </span>
                      <Badge
                        variant={
                          selectedItem.availability === "AVAILABLE"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {selectedItem.availability}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Temps de traitement:
                      </span>
                      <span className="font-semibold">
                        {selectedItem.processingTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-full">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Edit className="h-4 w-4" /> Description
                </h4>
                <div className="text-sm bg-muted/40 p-4 rounded-lg border min-h-[80px]">
                  {selectedItem.description ||
                    "Aucune description fournie pour cet item."}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Fermer
            </Button>
            <Button asChild>
              <a href={`/admin/games/items/edit?id=${selectedItem?.id}`}>
                <Edit className="mr-2 h-4 w-4" /> Modifier l'item
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
