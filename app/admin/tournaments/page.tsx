// app/admin/tournaments/page.tsx
"use client";

import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import { Tournament } from "@/database/schema";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trophy,
  Calendar,
  Users,
  Eye,
  EyeOff,
  Ban,
  Trash2,
  Gamepad2,
  Globe,
  Shield,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { SuccessDialog, ErrorDialog } from "@/components/shared/result-dialog";
import { updateTournament, deleteTournament } from "@/actions/tournaments"; // Maintien du typo du fichier existant
import { toast } from "sonner";
import { TournamentCard } from "@/components/cards/tournament-card";


export default function TournamentsAdminPage() {
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
  const [tournamentDialogOpen, setTournamentDialogOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const {
    data,
    total,
    loading,
    page,
    limit,
    searchTerm,
    filters,
    viewMode,
    setPage,
    setLimit,
    setSearchTerm,
    setFilters,
    setViewMode,
    onRefresh,
    error,
  } = useEntityList<Tournament>({
    entityType: "tournaments",
    defaultFilters: {
      isActive: true,
      limit: 20,
    },
    defaultLimit: 20,
  });

  const handleViewTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setTournamentDialogOpen(true);
  };

  const handleUpdateTournament = async (
    tournament: Tournament,
    updates: Partial<Tournament>
  ) => {
    setActionLoading(true);
    try {
      await updateTournament(tournament.id, updates as any);
      setSuccessMessage("Tournoi mis à jour avec succès");
      setShowSuccess(true);
      onRefresh();
      if (selectedTournament?.id === tournament.id) {
        setSelectedTournament({ ...selectedTournament, ...updates });
      }
    } catch (error) {
      setErrorMessage("Erreur lors de la mise à jour du tournoi");
      setShowError(true);
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTournament = async (tournament: Tournament) => {
    setActionLoading(true);
    try {
      await deleteTournament(tournament.id);
      setSuccessMessage("Tournoi supprimé avec succès");
      setShowSuccess(true);
      onRefresh();
      setTournamentDialogOpen(false);
    } catch (error) {
      setErrorMessage("Erreur lors de la suppression du tournoi");
      setShowError(true);
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const renderStats = () => {
    const stats = [
      {
        label: "Total Tournois",
        value: total,
        icon: Trophy,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      },
      {
        label: "En Cours (Live)",
        value: data.filter((t: Tournament) => t.status === "LIVE").length,
        icon: Activity,
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
      {
        label: "À Venir",
        value: data.filter((t: Tournament) => t.status === "UPCOMING").length,
        icon: Calendar,
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
      },
      {
        label: "Privés",
        value: data.filter((t: Tournament) => t.visibility === "PRIVATE").length,
        icon: EyeOff,
        color: "text-gray-600",
        bgColor: "bg-gray-100",
      },
      {
        label: "Total Cashprize",
        value:
          Number(
            data.reduce((acc: number, t: Tournament) => acc + Number(t.totalPrizePool || 0), 0)
          ).toLocaleString() + " GTC",
        icon: Shield,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
      },
      {
        label: "Tournois Actifs",
        value: data.filter((t: Tournament) => t.isActive).length,
        icon: Trophy,
        color: "text-emerald-600",
        bgColor: "bg-emerald-100",
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="body-sm" theme="muted" className="mb-1">
                    {stat.label}
                  </Typography>
                  <Typography
                    variant="h4"
                    weight="bold"
                    className="truncate max-w-[100px]"
                  >
                    {stat.value}
                  </Typography>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderCardActions = (tournament: Tournament) => (
    <div className="flex flex-wrap gap-2 mt-3">
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleViewTournament(tournament)}
        className="flex-1"
      >
        Voir
      </Button>
      <Button
        size="sm"
        variant={tournament.visibility === "PRIVATE" ? "secondary" : "outline"}
        onClick={() =>
          handleUpdateTournament(tournament, {
            visibility:
              tournament.visibility === "PRIVATE" ? "PUBLIC" : "PRIVATE",
          })
        }
        className="flex-1"
      >
        {tournament.visibility === "PRIVATE" ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>
      <Button
        size="sm"
        variant={tournament.isActive ? "destructive" : "default"}
        onClick={() =>
          handleUpdateTournament(tournament, { isActive: !tournament.isActive })
        }
        className="flex-1"
      >
        {tournament.isActive ? "Désactiver" : "Activer"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <EntityList
        title="Gestion des Tournois"
        description="Supervisez les compétitions et les organisateurs"
        entityType="tournaments"
        data={data}
        total={total}
        loading={loading}
        error={error}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFilterChange={setFilters}
        onRefresh={onRefresh}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        renderStats={renderStats}
        showAddButton={false}
        availableFilters={[
          {
            key: "status",
            label: "Statut",
            type: "select",
            options: [
              { value: "all", label: "Tous" },
              { value: "UPCOMING", label: "À venir" },
              { value: "LIVE", label: "En cours" },
              { value: "COMPLETED", label: "Terminé" },
              { value: "CANCELLED", label: "Annulé" },
            ],
          },
          {
            key: "visibility",
            label: "Visibilité",
            type: "select",
            options: [
              { value: "all", label: "Toutes" },
              { value: "PUBLIC", label: "Public" },
              { value: "PRIVATE", label: "Privé" },
              { value: "UNLISTED", label: "Non répertorié" },
            ],
          },
        ]}
        sortOptions={[
          { key: "createdAt", label: "Date de création" },
          { key: "totalPrizePool", label: "Cashprize" },
          { key: "name", label: "Nom" },
        ]}
        renderCard={(tournament, viewMode) => (
          <TournamentCard
            item={tournament as Tournament}
            viewMode={viewMode as any}
            onView={() => handleViewTournament(tournament as Tournament)}
            showDetails={false}
          />
        )}
      />

      {/* Dialog Détails Tournoi */}
      <Dialog
        open={tournamentDialogOpen}
        onOpenChange={setTournamentDialogOpen}
      >
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          {selectedTournament && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={selectedTournament.coverImage || undefined}
                    />
                    <AvatarFallback>
                      <Trophy className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                      {selectedTournament.name}
                      <Badge
                        variant={
                          selectedTournament.status === "LIVE"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {selectedTournament.status}
                      </Badge>
                    </DialogTitle>
                    <Typography variant="body-sm" theme="muted">
                      ID: {selectedTournament.id} • Jeu:{" "}
                      {selectedTournament.game}
                    </Typography>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        handleUpdateTournament(selectedTournament, {
                          status: "CANCELLED",
                        })
                      }
                      disabled={selectedTournament.status === "CANCELLED"}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteTournament(selectedTournament)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <Typography variant="body-sm" theme="muted">
                          Plateforme
                        </Typography>
                        <Badge variant="outline">
                          {selectedTournament.platform}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <Typography variant="body-sm" theme="muted">
                          Visibilité
                        </Typography>
                        <Badge variant="outline">
                          {selectedTournament.visibility}
                        </Badge>
                      </div>
                      {/* <div className="flex justify-between">
                        <Typography variant="body-sm" theme="muted">
                          Région
                        </Typography>
                        <Typography variant="body-sm" weight="medium">
                          {selectedTournament.region || "Toutes"}
                        </Typography>
                      </div> */}
                      <div className="pt-2 border-t mt-2">
                        <Typography
                          variant="body-sm"
                          theme="muted"
                          className="mb-1"
                        >
                          Tags
                        </Typography>
                        <div className="flex flex-wrap gap-1">
                          {selectedTournament.tags?.map((tag, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-[10px]"
                            >
                              {tag}
                            </Badge>
                          )) || "Aucun tag"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Économie</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="bg-primary/5 p-4 rounded-lg flex justify-between items-center">
                        <Typography variant="body-base" weight="semibold">
                          Cashprize Total
                        </Typography>
                        <Typography
                          variant="h4"
                          weight="bold"
                          className="text-primary"
                        >
                          {Number(
                            selectedTournament.totalPrizePool || 0
                          ).toLocaleString()}{" "}
                          GTC
                        </Typography>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        Description & Règles
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 h-[250px] overflow-y-auto">
                      <div>
                        <Typography
                          variant="body-sm"
                          weight="bold"
                          theme="muted"
                          className="uppercase"
                        >
                          Description
                        </Typography>
                        <Typography variant="body-sm" className="mt-1">
                          {selectedTournament.description ||
                            "Pas de description."}
                        </Typography>
                      </div>
                      <div>
                        <Typography
                          variant="body-sm"
                          weight="bold"
                          theme="muted"
                          className="uppercase"
                        >
                          Règles
                        </Typography>
                        <Typography
                          variant="body-sm"
                          className="mt-1 whitespace-pre-wrap"
                        >
                          {selectedTournament.rules ||
                            "Pas de règles spécifiées."}
                        </Typography>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex flex-col gap-2">
                    <Typography variant="body-sm" weight="semibold">
                      Statut Administratif
                    </Typography>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={
                          selectedTournament.isActive ? "outline" : "default"
                        }
                        onClick={() =>
                          handleUpdateTournament(selectedTournament, {
                            isActive: !selectedTournament.isActive,
                          })
                        }
                      >
                        {selectedTournament.isActive ? "Désactiver" : "Activer"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          window.open(
                            `/tournaments/${selectedTournament.id}`,
                            "_blank"
                          )
                        }
                      >
                        <Globe className="h-4 w-4 mr-2" /> Publique
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogs de résultat */}
      <SuccessDialog
        open={showSuccess}
        onOpenChange={setShowSuccess}
        title="Succès"
        description={successMessage}
      />

      <ErrorDialog
        open={showError}
        onOpenChange={setShowError}
        title="Erreur"
        description={errorMessage}
      />
    </div>
  );
}

// Composant TournamentCard local adapté à l'admin
// function TournamentCard({
//   tournament,
//   viewMode,
//   onView,
//   customActions,
// }: {
//   tournament: Tournament;
//   viewMode: "grid" | "list" | "table";
//   onView: () => void;
//   customActions?: React.ReactNode;
// }) {
//   const statusColors: any = {
//     UPCOMING: "bg-blue-100 text-blue-700",
//     LIVE: "bg-green-100 text-green-700",
//     COMPLETED: "bg-gray-100 text-gray-700",
//     CANCELLED: "bg-red-100 text-red-700",
//   };

//   if (viewMode === "list") {
//     return (
//       <Card className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
//         <div
//           className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center shrink-0 cursor-pointer"
//           onClick={onView}
//         >
//           <Trophy className="h-6 w-6 text-primary" />
//         </div>
//         <div className="flex-1 cursor-pointer" onClick={onView}>
//           <div className="flex items-center gap-2">
//             <Typography variant="body-base" weight="semibold">
//               {tournament.name}
//             </Typography>
//             <Badge
//               variant="outline"
//               className={`text-[10px] ${statusColors[tournament.status as keyof typeof statusColors]}`}
//             >
//               {tournament.status}
//             </Badge>
//           </div>
//           <Typography variant="body-sm" theme="muted">
//             {tournament.game} • {tournament.platform}
//           </Typography>
//         </div>
//         <div className="flex items-center gap-4">
//           <div className="text-right">
//             <Typography variant="body-sm" weight="bold">
//               {Number(tournament.totalPrizePool || 0).toLocaleString()} GTC
//             </Typography>
//             <Typography variant="body-sm" theme="muted">
//               {tournament.visibility}
//             </Typography>
//           </div>
//           {!tournament.isActive && <Ban className="h-4 w-4 text-red-500" />}
//         </div>
//         {customActions}
//       </Card>
//     );
//   }

//   return (
//     <Card className="overflow-hidden hover:shadow-lg transition-all border-t-4 border-t-primary/20">
//       <div className="relative h-24 bg-muted flex items-center justify-center overflow-hidden">
//         {tournament.coverImage ? (
//           <img
//             src={tournament.coverImage}
//             className="w-full h-full object-cover opacity-60"
//             alt="Cover"
//           />
//         ) : (
//           <Gamepad2 className="h-12 w-12 text-muted-foreground/20" />
//         )}
//         <div className="absolute top-2 left-2">
//           <Badge className={statusColors[tournament.status as keyof typeof statusColors]}>
//             {tournament.status}
//           </Badge>
//         </div>
//       </div>
//       <CardContent className="p-4 pb-2">
//         <Typography
//           variant="body-base"
//           weight="bold"
//           className="line-clamp-1 cursor-pointer"
//           onClick={onView}
//         >
//           {tournament.name}
//         </Typography>
//         <Typography variant="body-sm" theme="muted" className="mb-2">
//           {tournament.game}
//         </Typography>

//         <div className="flex justify-between items-center py-2 border-y my-2">
//           <div className="flex items-center gap-1">
//             <Trophy className="h-3 w-3 text-yellow-500" />
//             <Typography variant="body-sm" weight="semibold">
//               {Number(tournament.totalPrizePool || 0).toLocaleString()} GTC
//             </Typography>
//           </div>
//           <div className="flex items-center gap-1">
//             <Users className="h-3 w-3 text-blue-500" />
//             <Typography variant="body-sm">{tournament.visibility}</Typography>
//           </div>
//         </div>

//         {customActions}
//       </CardContent>
//     </Card>
//   );
// }
