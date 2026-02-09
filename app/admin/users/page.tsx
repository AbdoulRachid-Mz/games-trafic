// app/admin/users/page.tsx
"use client";

import { EntityList } from "@/components/shared/entity-list";
// import { UserCard } from "@/components/shared/entity-cards/user-card";
import { useEntityList } from "@/hooks/use-entity-list";
import { User } from "@/database/schema";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Shield,
  UserCheck,
  Activity,
  Mail,
  Award,
  Wallet,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { SuccessDialog, ErrorDialog } from "@/components/shared/result-dialog";
import { updateUser, getUsers } from "@/actions/users";
import { toast } from "sonner";

export default function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
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
  } = useEntityList<User>({
    entityType: "users",
    defaultFilters: {
      isActive: true,
      limit: 20,
    },
    defaultLimit: 20,
    // fetchFunction: async (params) => {
    //   const { page, limit, search, sortBy, sortOrder, ...restFilters } = params;
    //   const result = await getUsers({
    //     pagination: { page, limit },
    //     filters: { ...restFilters, search },
    //     options: { sortBy, sortOrder },
    //   });
    //   return {
    //     success: true,
    //     data: result.data,
    //     pagination: result.pagination,
    //   };
    // },
  });

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setUserDialogOpen(true);
  };

  const handleBanUser = async (user: User) => {
    setActionLoading(true);
    try {
      await updateUser(user.id, {
        banned: !user.banned,
        banReason: user.banned ? null : "Violation des règles de la plateforme",
      });
      setSuccessMessage(
        `Utilisateur ${user.banned ? "débanni" : "banni"} avec succès`
      );
      setShowSuccess(true);
      onRefresh();
    } catch (error) {
      setErrorMessage("Erreur lors du bannissement");
      setShowError(true);
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAdmin = async (user: User) => {
    setActionLoading(true);
    try {
      await updateUser(user.id, {
        isAdmin: !user.isAdmin,
      });
      setSuccessMessage(
        `Droits administrateur ${
          user.isAdmin ? "retirés" : "accordés"
        } avec succès`
      );
      setShowSuccess(true);
      onRefresh();
    } catch (error) {
      setErrorMessage("Erreur lors de la modification des droits admin");
      setShowError(true);
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleVip = async (user: User) => {
    setActionLoading(true);
    try {
      await updateUser(user.id, {
        isVip: !user.isVip,
      });
      setSuccessMessage(
        `Statut VIP ${user.isVip ? "retiré" : "accordé"} avec succès`
      );
      setShowSuccess(true);
      onRefresh();
    } catch (error) {
      setErrorMessage("Erreur lors de la modification du statut VIP");
      setShowError(true);
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyEmail = async (user: User) => {
    setActionLoading(true);
    try {
      await updateUser(user.id, {
        emailVerified: !user.emailVerified,
      });
      setSuccessMessage(
        `Email ${user.emailVerified ? "invalidé" : "vérifié"} avec succès`
      );
      setShowSuccess(true);
      onRefresh();
    } catch (error) {
      setErrorMessage("Erreur lors de la vérification de l'email");
      setShowError(true);
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  // Statistiques pour les utilisateurs
  const renderStats = () => {
    const stats = [
      {
        label: "Total Utilisateurs",
        value: total,
        icon: Users,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      },
      {
        label: "Administrateurs",
        value: data.filter((u: User) => u.isAdmin).length,
        icon: Shield,
        color: "text-red-600",
        bgColor: "bg-red-100",
      },
      {
        label: "Utilisateurs VIP",
        value: data.filter((u: User) => u.isVip).length,
        icon: Award,
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
      },
      {
        label: "Emails Vérifiés",
        value: data.filter((u: User) => u.emailVerified).length,
        icon: Mail,
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
      {
        label: "Utilisateurs Actifs",
        value: data.filter((u: User) => u.isActive).length,
        icon: UserCheck,
        color: "text-emerald-600",
        bgColor: "bg-emerald-100",
      },
      {
        label: "Utilisateurs Bannis",
        value: data.filter((u: User) => u.banned).length,
        icon: Ban,
        color: "text-gray-600",
        bgColor: "bg-gray-100",
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md p-3 transition-shadow">
            <CardContent className="p-2">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="body-sm" theme="muted" className="mb-1">
                    {stat.label}
                  </Typography>
                  <Typography variant="h3" weight="bold">
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

  // Fonction pour rendre les actions dans la carte utilisateur
  const renderCardActions = (user: User) => (
    <div className="flex flex-wrap gap-2 mt-3">
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleViewUser(user)}
        className="flex-1"
      >
        Voir
      </Button>
      <Button
        size="sm"
        variant={user.isAdmin ? "destructive" : "outline"}
        onClick={() => handleToggleAdmin(user)}
        className="flex-1"
      >
        {user.isAdmin ? "Retirer Admin" : "Admin"}
      </Button>
      <Button
        size="sm"
        variant={user.banned ? "default" : "destructive"}
        onClick={() => handleBanUser(user)}
        className="flex-1"
      >
        {user.banned ? "Débannir" : "Bannir"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <EntityList
        title="Gestion des Utilisateurs"
        description="Gérez l'ensemble des utilisateurs de la plateforme"
        entityType="users"
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
            key: "accountType",
            label: "Type de compte",
            type: "select",
            options: [
              { value: "all", label: "Tous" },
              { value: "BUYER", label: "Acheteur" },
              { value: "SELLER", label: "Vendeur" },
              { value: "TRADER", label: "Trader" },
              { value: "TOURNAMENT_ORGANIZER", label: "Organisateur" },
              { value: "VIP", label: "VIP" },
            ],
          },
          {
            key: "level",
            label: "Niveau",
            type: "select",
            options: [
              { value: "all", label: "Tous" },
              { value: "A", label: "A" },
              { value: "B", label: "B" },
              { value: "C", label: "C" },
            ],
          },
          {
            key: "isVerified",
            label: "Email vérifié",
            type: "select",
            options: [
              { value: "all", label: "Tous" },
              { value: "true", label: "Vérifié" },
              { value: "false", label: "Non vérifié" },
            ],
          },
          {
            key: "isBanned",
            label: "Statut bannissement",
            type: "select",
            options: [
              { value: "all", label: "Tous" },
              { value: "true", label: "Banni" },
              { value: "false", label: "Non banni" },
            ],
          },
        ]}
        sortOptions={[
          { key: "createdAt", label: "Date de création" },
          { key: "lastLogin", label: "Dernière connexion" },
          { key: "username", label: "Nom d'utilisateur" },
          { key: "email", label: "Email" },
        ]}
        renderCard={(user: User, viewMode) => (
          <UserCard
            user={user}
            viewMode={viewMode}
            onView={() => handleViewUser(user)}
            customActions={renderCardActions(user)}
          />
        )}
      />

      {/* Dialog pour voir les détails de l'utilisateur */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedUser.profileImage || undefined} />
                    <AvatarFallback>
                      {selectedUser.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Typography variant="h4">
                      {selectedUser.fullName ||
                        selectedUser.username ||
                        "Utilisateur sans nom"}
                    </Typography>
                    <Typography variant="body-sm" theme="muted">
                      @{selectedUser.username}
                    </Typography>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Informations générales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <Typography variant="h5" className="mb-4">
                        Informations personnelles
                      </Typography>
                      <div className="space-y-3">
                        <div>
                          <Typography variant="body-sm" theme="muted">
                            Email
                          </Typography>
                          <Typography
                            variant="body-base"
                            className="flex items-center gap-2"
                          >
                            {selectedUser.email}
                            {selectedUser.emailVerified ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200"
                              >
                                <Mail className="h-3 w-3 mr-1" /> Vérifié
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-red-50 text-red-700 border-red-200"
                              >
                                Non vérifié
                              </Badge>
                            )}
                          </Typography>
                        </div>
                        <div>
                          <Typography variant="body-sm" theme="muted">
                            Nom complet
                          </Typography>
                          <Typography variant="body-base">
                            {selectedUser.fullName || "Non spécifié"}
                          </Typography>
                        </div>
                        <div>
                          <Typography variant="body-sm" theme="muted">
                            Pays
                          </Typography>
                          <Typography variant="body-base">
                            {selectedUser.country || "Non spécifié"}
                          </Typography>
                        </div>
                        <div>
                          <Typography variant="body-sm" theme="muted">
                            Bio
                          </Typography>
                          <Typography variant="body-base">
                            {selectedUser.bio || "Aucune bio"}
                          </Typography>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <Typography variant="h5" className="mb-4">
                        Statut et permissions
                      </Typography>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {selectedUser.isAdmin && (
                            <Badge
                              variant="default"
                              className="bg-red-100 text-red-700 hover:bg-red-100"
                            >
                              <Shield className="h-3 w-3 mr-1" /> Administrateur
                            </Badge>
                          )}
                          {selectedUser.isVip && (
                            <Badge
                              variant="default"
                              className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                            >
                              <Award className="h-3 w-3 mr-1" /> VIP
                            </Badge>
                          )}
                          {selectedUser.banned && (
                            <Badge
                              variant="default"
                              className="bg-gray-100 text-gray-700 hover:bg-gray-100"
                            >
                              <Ban className="h-3 w-3 mr-1" /> Banni
                            </Badge>
                          )}
                          {!selectedUser.isActive && (
                            <Badge
                              variant="outline"
                              className="bg-gray-50 text-gray-500"
                            >
                              Inactif
                            </Badge>
                          )}
                        </div>
                        <div>
                          <Typography variant="body-sm" theme="muted">
                            Niveau
                          </Typography>
                          <Badge variant="outline" className="mt-1">
                            Niveau {selectedUser.level}
                          </Badge>
                        </div>
                        <div>
                          <Typography variant="body-sm" theme="muted">
                            Types de compte
                          </Typography>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedUser.accountTypes?.map((type, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs"
                              >
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Typography variant="body-sm" theme="muted">
                            Statistiques
                          </Typography>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <Typography variant="body-sm" theme="muted">
                                Boutiques
                              </Typography>
                              <Typography variant="h4">
                                {selectedUser.shopsCreatedCount || 0}
                              </Typography>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <Typography variant="body-sm" theme="muted">
                                Tournois
                              </Typography>
                              <Typography variant="h4">
                                {selectedUser.tournamentsCreatedCount || 0}
                              </Typography>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Historique et métadonnées */}
                <Card>
                  <CardContent className="p-6">
                    <Typography variant="h5" className="mb-4">
                      Activité et métadonnées
                    </Typography>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Typography variant="body-sm" theme="muted">
                          Date de création
                        </Typography>
                        <Typography variant="body-base">
                          {selectedUser.createdAt
                            ? format(new Date(selectedUser.createdAt), "PPpp", {
                                locale: fr,
                              })
                            : "Inconnue"}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="body-sm" theme="muted">
                          Dernière connexion
                        </Typography>
                        <Typography variant="body-base">
                          {selectedUser.lastLogin
                            ? format(new Date(selectedUser.lastLogin), "PPpp", {
                                locale: fr,
                              })
                            : "Jamais"}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="body-sm" theme="muted">
                          Dernière mise à jour
                        </Typography>
                        <Typography variant="body-base">
                          {selectedUser.updatedAt
                            ? format(new Date(selectedUser.updatedAt), "PPpp", {
                                locale: fr,
                              })
                            : "Inconnue"}
                        </Typography>
                      </div>
                    </div>

                    {selectedUser.banned && selectedUser.banReason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <Typography
                          variant="body-sm"
                          weight="semibold"
                          className="text-red-700 mb-1"
                        >
                          Raison du bannissement
                        </Typography>
                        <Typography variant="body-sm" className="text-red-600">
                          {selectedUser.banReason}
                        </Typography>
                        {selectedUser.banExpires && (
                          <Typography
                            variant="body-sm"
                            className="text-red-500 mt-1"
                          >
                            Expire le:{" "}
                            {format(new Date(selectedUser.banExpires), "PP", {
                              locale: fr,
                            })}
                          </Typography>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actions rapides */}
                <Card>
                  <CardContent className="p-6">
                    <Typography variant="h5" className="mb-4">
                      Actions rapides
                    </Typography>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleToggleAdmin(selectedUser)}
                        className="flex-1 min-w-[140px]"
                      >
                        {selectedUser.isAdmin
                          ? "Retirer Admin"
                          : "Donner Admin"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleToggleVip(selectedUser)}
                        className="flex-1 min-w-[140px]"
                      >
                        {selectedUser.isVip ? "Retirer VIP" : "Donner VIP"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleVerifyEmail(selectedUser)}
                        className="flex-1 min-w-[140px]"
                      >
                        {selectedUser.emailVerified
                          ? "Invalider Email"
                          : "Vérifier Email"}
                      </Button>
                      <Button
                        variant={
                          selectedUser.banned ? "default" : "destructive"
                        }
                        onClick={() => handleBanUser(selectedUser)}
                        className="flex-1 min-w-[140px]"
                      >
                        {selectedUser.banned ? "Débannir" : "Bannir"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          window.open(`/profile/${selectedUser.id}`, "_blank")
                        }
                        className="flex-1 min-w-[140px]"
                      >
                        Visiter le profil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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

// UserCard component
const UserCard = ({
  user,
  viewMode,
  onView,
  customActions,
}: {
  user: User;
  viewMode: "grid" | "list" | "table";
  onView: () => void;
  customActions?: React.ReactNode;
}) => {
  if (viewMode === "list") {
    return (
      <Card className="p-4 flex items-center gap-4">
        <Avatar>
          <AvatarImage src={user.profileImage || undefined} />
          <AvatarFallback>
            {user.username?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Typography variant="body-base" weight="semibold">
            {user.fullName || user.username}
          </Typography>
          <Typography variant="body-sm" theme="muted">
            @{user.username}
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          {user.isAdmin && <Shield className="h-4 w-4 text-red-600" />}
          {user.isVip && <Award className="h-4 w-4 text-yellow-600" />}
          {user.banned && <Ban className="h-4 w-4 text-gray-600" />}
          {user.emailVerified ? (
            <Mail className="h-4 w-4 text-green-600" />
          ) : (
            <Mail className="h-4 w-4 text-red-600" />
          )}
        </div>
        {customActions}
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <Avatar>
          <AvatarImage src={user.profileImage || undefined} />
          <AvatarFallback>
            {user.username?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Typography variant="body-base" weight="semibold">
            {user.fullName || user.username}
          </Typography>
          <Typography variant="body-sm" theme="muted">
            @{user.username}
          </Typography>
        </div>
        <div className="flex gap-1">
          {user.isAdmin && <Shield className="h-4 w-4 text-red-600" />}
          {user.isVip && <Award className="h-4 w-4 text-yellow-600" />}
          {user.banned && <Ban className="h-4 w-4 text-gray-600" />}
        </div>
      </div>
      <div className="mb-3">
        <Typography variant="body-sm" theme="muted">
          Email
        </Typography>
        <Typography variant="body-sm" className="flex items-center gap-2">
          {user.email}
          {user.emailVerified ? (
            <Mail className="h-3 w-3 text-green-600" />
          ) : (
            <Mail className="h-3 w-3 text-red-600" />
          )}
        </Typography>
      </div>
      {customActions}
    </Card>
  );
};
