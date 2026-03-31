// app/admin/games/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Gamepad2,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Globe,
  Tag,
  Monitor,
  Plus,
} from "lucide-react";
import { EntityList } from "@/components/shared/entity-list";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { useEntityList } from "@/hooks/use-entity-list";
import { useDeleteGame, useGames, useUpdateGame } from "@/hooks/use-games";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Game } from "@/database/schema";
import Image from "next/image";

export default function AdminGamesPage() {
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const {data: gamesData, isLoading: gamesLoading, error: gamesError} = useGames()

  // Utiliser le hook entity list pour les jeux
  const {
    data: games,
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
  } = useEntityList<Game>({
    entityType: "games",
    // initialData: gamesData?.pages.flatMap((page) => page.data),
    defaultFilters: {
      isActive: true,
    },
    defaultLimit: 20,
  });

  // Mutations
  const deleteGame = useDeleteGame();
  const updateGame = useUpdateGame();

  // Rendu d'une carte jeu
  const renderGameRow = (game: Game) => {
    return (
      <tr key={game.id} className="border-b hover:bg-muted/50">
        <td className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded overflow-hidden bg-muted">
              {game.profileImage ? (
                <Image
                  src={game.profileImage}
                  alt={game.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <Gamepad2 className="h-6 w-6 m-2 text-muted-foreground" />
              )}
            </div>
            <div>
              <Typography
                variant="body-sm"
                weight="medium"
                className="truncate max-w-xs"
              >
                {game.name}
              </Typography>
              <Typography variant="caption2" theme="muted">
                {game.publisher || "Éditeur inconnu"}
              </Typography>
            </div>
          </div>
        </td>
        <td className="p-4">
          <Badge variant="outline">{game.genre || "N/A"}</Badge>
        </td>
        <td className="p-4">
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {game.platforms?.slice(0, 2).map((p) => (
              <Badge
                key={p}
                variant="secondary"
                className="text-[10px] px-1 h-5"
              >
                {p}
              </Badge>
            ))}
            {game.platforms && game.platforms.length > 2 && (
              <Badge variant="secondary" className="text-[10px] px-1 h-5">
                +{game.platforms.length - 2}
              </Badge>
            )}
          </div>
        </td>
        <td className="p-4 text-center">
          <div className="flex items-center justify-center gap-1">
            <TrendingUp className="h-3 w-3 text-primary" />
            <Typography variant="body-sm">{game.popularity || 0}</Typography>
          </div>
        </td>
        <td className="p-4">
          {game.isActive ? (
            <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">
              Actif
            </Badge>
          ) : (
            <Badge variant="secondary">Inactif</Badge>
          )}
        </td>
        <td className="p-4 text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setSelectedGame(game);
                setViewDialogOpen(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.push(`/admin/games/edit?id=${game.id}`)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={async () => {
                if (confirm("Supprimer ce jeu ?")) {
                  await deleteGame.mutateAsync(game.id);
                  onRefresh();
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  // Rendu de l'en-tête du tableau
  const renderTableHeader = () => (
    <tr className="border-b">
      <th className="text-left p-4">Jeu</th>
      <th className="text-left p-4">Genre</th>
      <th className="text-left p-4">Plateformes</th>
      <th className="text-center p-4">Popularité</th>
      <th className="text-left p-4">Statut</th>
      <th className="text-right p-4">Actions</th>
    </tr>
  );

  // Rendu d'une carte jeu (pour grille/liste)
  const renderGameCard = (game: Game, viewMode: "grid" | "list" | "table") => {
    if (viewMode === "table") return renderGameRow(game);

    const isList = viewMode === "list";

    return (
      <Card className={isList ? "flex" : "h-full"}>
        <CardContent className={`p-6 ${isList ? "flex-1" : ""}`}>
          <div className="flex flex-col h-full gap-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted">
                  {game.profileImage ? (
                    <Image
                      src={game.profileImage}
                      alt={game.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Gamepad2 className="h-6 w-6 m-3 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <Typography
                    variant="h4"
                    weight="bold"
                    className="line-clamp-1"
                  >
                    {game.name}
                  </Typography>
                  <Typography variant="caption2" theme="muted">
                    {game.publisher || "Éditeur inconnu"}
                  </Typography>
                </div>
              </div>
              <Badge variant={game.isActive ? "default" : "secondary"}>
                {game.isActive ? "Actif" : "Inactif"}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-1">
              {game.platforms?.map((p) => (
                <Badge key={p} variant="secondary" className="text-[10px] px-1">
                  {p}
                </Badge>
              ))}
            </div>

            <div className="mt-auto flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <Typography variant="body-sm">
                  {game.popularity || 0}
                </Typography>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedGame(game);
                    setViewDialogOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/games/edit?id=${game.id}`)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderStats = () => (
    <>
      <StatCard
        title="Total Jeux"
        value={total}
        icon={Gamepad2}
        iconClassName="bg-primary/10 text-primary"
      />

      <StatCard
        title="Jeux Actifs"
        value={games.filter((g: Game) => g.isActive).length}
        icon={CheckCircle}
        iconClassName="bg-green-500/10 text-green-500"
      />

      <StatCard
        title="Mise en avant"
        value={games.filter((g: Game) => g.featured).length}
        icon={TrendingUp}
        iconClassName="bg-amber-500/10 text-amber-500"
      />
    </>
  );

  return (
    <div className="space-y-6">
      {/* Main List */}
      <EntityList
        title="Gestion des Jeux"
        description="Gérez le catalogue de jeux disponibles sur la plateforme."
        entityType="games"
        data={games}
        total={total}
        loading={loading}
        page={page}
        limit={limit}
        searchTerm={searchTerm}
        filters={filters}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSearchChange={setSearchTerm}
        onFilterChange={setFilters}
        onRefresh={onRefresh}
        onResetFilters={onResetFilters}
        onAdd={() => router.push("/admin/games/add")}
        renderCard={renderGameCard}
        renderTableRow={renderGameRow}
        renderTableHeader={renderTableHeader}
        renderStats={renderStats}
      />

      {/* Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        {/* title */}
        <DialogTitle className="text-2xl font-bold hidden">
          Détails de {selectedGame?.name}
        </DialogTitle>
        <DialogContent className="max-w-7xl p-0 overflow-hidden bg-background border-primary/20">
          {selectedGame && (
            <>
              <div className="relative h-48 w-full bg-muted">
                {selectedGame.coverImage ? (
                  <Image
                    src={selectedGame.coverImage}
                    alt={selectedGame.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
                    <Gamepad2 className="h-16 w-16 text-primary/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <div className="absolute bottom-4 left-6 flex items-center gap-4">
                  <div className="h-20 w-20 rounded-xl border-4 border-background overflow-hidden bg-background shadow-xl scale-110">
                    {selectedGame.profileImage ? (
                      <Image
                        src={selectedGame.profileImage}
                        alt={selectedGame.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Gamepad2 className="h-10 w-10 m-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <Typography variant="h3" weight="bold">
                      {selectedGame.name}
                    </Typography>
                    <Typography variant="body-sm" theme="muted">
                      {selectedGame.publisher}
                    </Typography>
                  </div>
                </div>
              </div>

              <ScrollArea className="max-h-[60vh] p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Tag className="h-4 w-4 mt-1 text-primary" />
                        <div>
                          <Typography variant="caption1" theme="muted">
                            Genre
                          </Typography>
                          <Typography variant="body-base">
                            {selectedGame.genre || "N/A"}
                          </Typography>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Monitor className="h-4 w-4 mt-1 text-primary" />
                        <div>
                          <Typography variant="caption1" theme="muted">
                            Plateformes
                          </Typography>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedGame.platforms?.map((p) => (
                              <Badge key={p} variant="secondary">
                                {p}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Globe className="h-4 w-4 mt-1 text-primary" />
                        <div>
                          <Typography variant="caption1" theme="muted">
                            Popularité
                          </Typography>
                          <Typography variant="body-base">
                            Score: {selectedGame.popularity || 0}
                          </Typography>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 mt-1 text-primary" />
                        <div>
                          <Typography variant="caption1" theme="muted">
                            Statut
                          </Typography>
                          <Badge
                            className={
                              selectedGame.isActive
                                ? "bg-success/10 text-success"
                                : ""
                            }
                          >
                            {selectedGame.isActive ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Typography variant="h4" weight="semibold">
                      Description
                    </Typography>
                    <Typography
                      variant="body-sm"
                      theme="muted"
                      className="leading-relaxed"
                    >
                      {selectedGame.description ||
                        "Aucune description fournie."}
                    </Typography>
                  </div>

                  {selectedGame.tags && selectedGame.tags.length > 0 && (
                    <div className="space-y-2">
                      <Typography variant="h4" weight="semibold">
                        Étiquettes
                      </Typography>
                      <div className="flex flex-wrap gap-2">
                        {selectedGame.tags.map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="border-primary/20"
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-primary/10 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setViewDialogOpen(false)}
                >
                  Fermer
                </Button>
                <Button
                  onClick={() =>
                    router.push(`/admin/games/edit?id=${selectedGame.id}`)
                  }
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
