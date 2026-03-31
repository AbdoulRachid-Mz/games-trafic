// app/admin/guides/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Edit,
  Trash2,
  BookOpen,
  TrendingUp,
  EyeOff,
  CheckCircle,
  XCircle,
  Filter,
  Plus,
} from "lucide-react";
import { EntityList } from "@/components/shared/entity-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { useEntityList } from "@/hooks/use-entity-list";
import { StatCard } from "@/components/admin/stat-card";
import { useDeleteGuide, useRestoreGuide } from "@/hooks/use-guides";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminGuidesPage() {
  const router = useRouter();
  const [selectedGuide, setSelectedGuide] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Utiliser le hook entity list pour les guides
  const {
    data: guides,
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
  } = useEntityList({
    entityType: "guides",
    defaultFilters: {
      isDeleted: false,
      withRelations: true,
    },
    defaultLimit: 20,
  });

  // Mutations
  const deleteGuide = useDeleteGuide();
  const restoreGuide = useRestoreGuide();

  // Rendu d'une carte guide
  const renderGuideCard = (guide: any, viewMode: "grid" | "list" | "table") => {
    const isGrid = viewMode === "grid";
    const isList = viewMode === "list";

    if (viewMode === "table") {
      return (
        <tr className="border-b hover:bg-muted/50">
          <td className="p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <Typography variant="body-sm" weight="medium" className="truncate max-w-xs">
                  {guide.title}
                </Typography>
                <Typography variant="caption2" theme="muted">
                  {guide.category}
                </Typography>
              </div>
            </div>
          </td>
          <td className="p-4">
            <Badge variant="outline">{guide.category}</Badge>
          </td>
          <td className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <Typography variant="body-sm">{guide.viewCount || 0}</Typography>
            </div>
          </td>
          <td className="p-4">
            <div className="flex items-center gap-2">
              {guide.steps?.length > 0 ? (
                <Badge variant="outline">{guide.steps.length} étapes</Badge>
              ) : (
                <Badge variant="secondary">Aucune étape</Badge>
              )}
            </div>
          </td>
          <td className="p-4">
            <Badge variant={guide.isActive ? "default" : "secondary"}>
              {guide.isActive ? "Actif" : "Inactif"}
            </Badge>
          </td>
          <td className="p-4">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedGuide(guide);
                  setViewDialogOpen(true);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/admin/guides/edit/${guide.id}`)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (confirm("Supprimer ce guide ?")) {
                    deleteGuide.mutate(guide.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <Card className={isList ? "flex p-3" : "h-full p-3"}>
        <CardContent className={`p-4 ${isList ? "flex-1" : ""}`}>
          <div className="flex flex-col h-full">
            {/* En-tête */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Typography
                    variant={isList ? "h4" : "h3"}
                    weight="bold"
                    className="line-clamp-2"
                  >
                    {guide.title}
                  </Typography>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{guide.category}</Badge>
                    <Badge variant={guide.isActive ? "default" : "secondary"}>
                      {guide.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {guide.description && (
              <Typography
                variant="body-sm"
                theme="muted"
                className={`${isGrid ? "line-clamp-3" : ""} mb-4`}
              >
                {guide.description}
              </Typography>
            )}

            {/* Statistiques */}
            <div className="flex items-center gap-4 mt-auto pt-4 border-t">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <Typography variant="body-sm">{guide.viewCount || 0}</Typography>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <Typography variant="body-sm">
                  {guide.steps?.length || 0} étapes
                </Typography>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Button
                size="sm"
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setSelectedGuide(guide);
                  setViewDialogOpen(true);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Voir
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => router.push(`/admin/guides/edit/${guide.id}`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Éditer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Rendu de l'en-tête du tableau
  const renderTableHeader = () => (
    <tr className="border-b">
      <th className="text-left p-4">Guide</th>
      <th className="text-left p-4">Catégorie</th>
      <th className="text-left p-4">Vues</th>
      <th className="text-left p-4">Étapes</th>
      <th className="text-left p-4">Statut</th>
      <th className="text-left p-4">Actions</th>
    </tr>
  );

  // Rendu des statistiques
  const renderStats = () => {
    const activeGuides = guides?.filter((g: any) => g.isActive).length || 0;
    const guidesWithSteps = guides?.filter((g: any) => g.steps?.length > 0).length || 0;
    const totalViews = guides?.reduce((sum: number, g: any) => sum + (g.viewCount || 0), 0) || 0;

    return (
      <>
        <StatCard
          title="Guides Actifs"
          value={activeGuides}
          icon={CheckCircle}
          iconClassName="bg-green-500/10 text-green-500"
        />
        <StatCard
          title="Avec étapes"
          value={guidesWithSteps}
          icon={BookOpen}
          iconClassName="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          title="Vues totales"
          value={totalViews}
          icon={TrendingUp}
          iconClassName="bg-primary/10 text-primary"
        />
      </>
    );
  };

  // Rendu de l'état vide
  const renderEmptyState = () => (
    <div className="text-center py-12">
      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <Typography variant="h4" theme="muted" className="mb-2">
        Aucun guide trouvé
      </Typography>
      <Typography variant="body-sm" theme="muted" className="mb-6 max-w-md mx-auto">
        Commencez par créer votre premier guide pour aider les utilisateurs
      </Typography>
      <Button onClick={() => router.push("/admin/guides/create")}>
        <Plus className="h-4 w-4 mr-2" />
        Créer un guide
      </Button>
    </div>
  );

  return (
    <>
      <EntityList
        title="Guides"
        description="Gérez les guides qui aident vos utilisateurs"
        entityType="guides"
        data={guides}
        total={total}
        loading={loading}
        error={error}
        page={page}
        limit={limit}
        searchTerm={searchTerm}
        filters={filters}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSearchChange={setSearchTerm}
        onFilterChange={setFilters}
        onAdd={() => router.push("/admin/guides/create")}
        onRefresh={onRefresh}
        onResetFilters={onResetFilters}
        renderCard={renderGuideCard}
        renderTableHeader={renderTableHeader}
        renderStats={renderStats}
        renderEmptyState={renderEmptyState}
        availableFilters={[
          {
            key: "category",
            label: "Catégorie",
            type: "select",
            options: [
              { value: "all", label: "Toutes" },
              { value: "getting-started", label: "Premiers pas" },
              { value: "shops", label: "Boutiques" },
              { value: "tournaments", label: "Tournois" },
              { value: "wallet", label: "Portefeuille" },
              { value: "products", label: "Produits" },
              { value: "security", label: "Sécurité" },
              { value: "vip", label: "VIP" },
              { value: "technical", label: "Technique" },
            ],
          },
          {
            key: "isActive",
            label: "Statut",
            type: "select",
            options: [
              { value: "all", label: "Tous" },
              { value: "true", label: "Actifs" },
              { value: "false", label: "Inactifs" },
            ],
          },
          {
            key: "hasSteps",
            label: "Avec étapes",
            type: "boolean",
          },
        ]}
        sortOptions={[
          { key: "title", label: "Titre" },
          { key: "viewCount", label: "Vues" },
          { key: "createdAt", label: "Date création" },
          { key: "updatedAt", label: "Date modification" },
        ]}
        showStats={true}
        showSearch={true}
        showFilters={true}
        showViewToggle={true}
        showExport={true}
        showAddButton={true}
      />

      {/* Dialog de visualisation du guide */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[80vh]">
          {selectedGuide && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <DialogTitle>{selectedGuide.title}</DialogTitle>
                </div>
                <DialogDescription>
                  {selectedGuide.category} • {selectedGuide.steps?.length || 0} étapes
                </DialogDescription>
              </DialogHeader>
              
              <ScrollArea className="pr-4">
                <div className="space-y-6">
                  {/* Description */}
                  {selectedGuide.description && (
                    <Typography variant="body-base" className="text-muted-foreground">
                      {selectedGuide.description}
                    </Typography>
                  )}

                  {/* Statistiques */}
                  <div className="flex items-center gap-6 p-4 bg-muted/30 rounded-lg">
                    <div className="text-center">
                      <Typography variant="h3" weight="bold">
                        {selectedGuide.viewCount || 0}
                      </Typography>
                      <Typography variant="caption2" theme="muted">
                        Vues
                      </Typography>
                    </div>
                    <div className="text-center">
                      <Typography variant="h3" weight="bold">
                        {selectedGuide.steps?.length || 0}
                      </Typography>
                      <Typography variant="caption2" theme="muted">
                        Étapes
                      </Typography>
                    </div>
                    <div className="text-center">
                      <Typography variant="h3" weight="bold">
                        {selectedGuide.isActive ? "Actif" : "Inactif"}
                      </Typography>
                      <Typography variant="caption2" theme="muted">
                        Statut
                      </Typography>
                    </div>
                  </div>

                  {/* Étapes */}
                  <div className="space-y-4">
                    <Typography variant="h4" weight="semibold">
                      Étapes du guide
                    </Typography>
                    {selectedGuide.steps?.map((step: any, index: number) => (
                      <Card key={index} className="relative">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Badge variant="outline" className="flex-shrink-0">
                              Étape {index + 1}
                            </Badge>
                            <div className="flex-1 space-y-3">
                              <Typography variant="h5" weight="medium">
                                {step.title}
                              </Typography>
                              <Typography variant="body-base" className="whitespace-pre-wrap">
                                {step.content}
                              </Typography>
                              {step.images?.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                  {step.images.map((image: string, imgIndex: number) => (
                                    <img
                                      key={imgIndex}
                                      src={image}
                                      alt={`Image étape ${index + 1}`}
                                      className="rounded-lg w-full h-32 object-cover"
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </ScrollArea>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/admin/guides/edit/${selectedGuide.id}`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Éditer
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Supprimer ce guide ?")) {
                      deleteGuide.mutate(selectedGuide.id);
                      setViewDialogOpen(false);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}