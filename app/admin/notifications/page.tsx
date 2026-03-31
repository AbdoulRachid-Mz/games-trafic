"use client";

import { useState } from "react";
import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import {
  getNotifications,
  createNotification,
  deleteNotification,
  markAllNotificationsAsRead,
  type NotificationFilters,
} from "@/actions/notifications";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  Bell,
  BellRing,
  CheckCheck,
  Store,
  Trophy,
  Plus,
  Users,
  Globe,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/admin/stat-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ResultDialog } from "@/components/shared/result-dialog";
import { Notification } from "@/database/schema";

type NotificationTarget = "user" | "shop" | "tournament" | "global";

export default function NotificationsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [target, setTarget] = useState<NotificationTarget>("user");
  const [userId, setUserId] = useState("");
  const [shopId, setShopId] = useState("");
  const [tournamentId, setTournamentId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("SYSTEM");
  const [linkUrl, setLinkUrl] = useState("");

  const {
    data,
    loading,
    page,
    limit,
    searchTerm,
    filters,
    viewMode,
    total,
    setPage,
    setLimit,
    setSearchTerm,
    setFilters,
    setViewMode,
    onRefresh,
    isPlaceholderData,
  } = useEntityList<Notification>({
    entityType: "notifications",
    defaultFilters: {
      limit: 20,
    },
  });

  const handleCreate = async () => {
    if (!title || !message) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    if (target === "user" && !userId) {
      toast.error("Veuillez sélectionner un utilisateur");
      return;
    }

    if (target === "shop" && !shopId) {
      toast.error("Veuillez sélectionner un shop");
      return;
    }

    if (target === "tournament" && !tournamentId) {
      toast.error("Veuillez sélectionner un tournoi");
      return;
    }

    setCreating(true);
    try {
      const notificationData: any = {
        userId: target === "user" ? userId : "system", // Pour global, on met un userId système
        title,
        message,
        type,
        linkUrl: linkUrl || undefined,
      };

      if (target === "shop") {
        notificationData.shopId = shopId;
      }

      if (target === "tournament") {
        notificationData.tournamentId = tournamentId;
      }

      const result = await createNotification(notificationData);

      if (result.success) {
        toast.success("Notification créée avec succès");
        setIsCreateOpen(false);
        resetForm();
        onRefresh();
      } else {
        toast.error(result.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Error creating notification:", error);
      toast.error("Erreur lors de la création de la notification");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNotification) return;

    setDeleting(true);
    try {
      const result = await deleteNotification(
        selectedNotification.id,
        selectedNotification.userId,
      );

      if (result.success) {
        toast.success("Notification supprimée avec succès");
        setIsDeleteOpen(false);
        setSelectedNotification(null);
        onRefresh();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setTarget("user");
    setUserId("");
    setShopId("");
    setTournamentId("");
    setTitle("");
    setMessage("");
    setType("SYSTEM");
    setLinkUrl("");
  };

  const renderStats = () => (
    <>
      <StatCard
        title="Total Notifications"
        value={total}
        icon={Bell}
        iconClassName="bg-primary/10 text-primary"
      />
      <StatCard
        title="Non lues"
        value={data.filter((n: any) => !n.read).length}
        icon={Bell}
        iconClassName="bg-amber-500/10 text-amber-500"
      />
      <StatCard
        title="Système"
        value={data.filter((n: any) => n.type === "SYSTEM").length}
        icon={CheckCheck}
        iconClassName="bg-green-500/10 text-green-500"
      />
    </>
  );

  return (
    <>
      <EntityList
        title="Notifications"
        description="Gérez les notifications envoyées aux utilisateurs"
        entityType="notifications"
        data={data}
        loading={loading}
        isPlaceholderData={isPlaceholderData}
        page={page}
        limit={limit}
        total={total}
        searchTerm={searchTerm}
        filters={filters}
        viewMode={viewMode}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSearchChange={setSearchTerm}
        onFilterChange={setFilters}
        onViewModeChange={setViewMode}
        onRefresh={onRefresh}
        onAdd={() => setIsCreateOpen(true)}
        renderStats={renderStats}
        onDelete={(item) => {
          setSelectedNotification(item);
          setIsDeleteOpen(true);
        }}
        availableFilters={[
          {
            key: "read",
            label: "État",
            type: "select",
            options: [
              { label: "Lu", value: "true" },
              { label: "Non lu", value: "false" },
            ],
          },
          {
            key: "type",
            label: "Type",
            type: "select",
            options: [
              { label: "Ordre", value: "ORDER" },
              { label: "Message", value: "MESSAGE" },
              { label: "Système", value: "SYSTEM" },
            ],
          },
        ]}
        sortOptions={[
          { key: "createdAt", label: "Date (Récent)", direction: "desc" },
          { key: "createdAt", label: "Date (Ancien)", direction: "asc" },
        ]}
        renderTableHeader={() => (
          <tr className="border-b">
            <th className="text-left p-4">Utilisateur</th>
            <th className="text-left p-4">Notification</th>
            <th className="text-left p-4">Type</th>
            <th className="text-left p-4">État</th>
            <th className="text-left p-4">Concerne</th>
            <th className="text-left p-4">Date</th>
          </tr>
        )}
        renderTableRow={(item: any) => (
          <tr key={item.id} className="border-b hover:bg-muted/50">
            <td className="p-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={item.user?.image} />
                  <AvatarFallback>
                    {item.user?.username?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {item.user?.username || "Inconnu"}
                </span>
              </div>
            </td>
            <td className="p-4">
              <div className="flex flex-col">
                <span className="font-medium">{item.title}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                  {item.message}
                </span>
              </div>
            </td>
            <td className="p-4">
              <Badge variant="outline" className="capitalize">
                {item.type}
              </Badge>
            </td>
            <td className="p-4">
              {item.read ? (
                <Badge variant="secondary" className="gap-1">
                  <CheckCheck className="h-3 w-3" /> Lu
                </Badge>
              ) : (
                <Badge variant="default" className="gap-1">
                  <Bell className="h-3 w-3" /> Non lu
                </Badge>
              )}
            </td>
            <td className="p-4">
              <div className="flex gap-1">
                {item.shop && (
                  <Badge variant="outline" className="gap-1">
                    <Store className="h-3 w-3" /> {item.shop.name}
                  </Badge>
                )}
                {item.tournament && (
                  <Badge variant="outline" className="gap-1">
                    <Trophy className="h-3 w-3" /> Tournoi
                  </Badge>
                )}
              </div>
            </td>
            <td className="p-4">{formatDate(item.createdAt)}</td>
          </tr>
        )}
        renderCard={(item: any) => (
          <div key={item.id} className="p-4 border rounded shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="font-bold">{item.title}</div>
              {item.read ? (
                <Badge variant="secondary" className="text-xs">
                  Lu
                </Badge>
              ) : (
                <Badge variant="default" className="text-xs">
                  Non lu
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              {item.message}
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{item.user?.username}</span>
              <span>{formatDate(item.createdAt)}</span>
            </div>
          </div>
        )}
      />

      {/* Create Notification Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer une notification</DialogTitle>
            <DialogDescription>
              Envoyez une notification ciblée aux utilisateurs
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cible</Label>
              <Select
                value={target}
                onValueChange={(v: NotificationTarget) => setTarget(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Utilisateur spécifique
                    </div>
                  </SelectItem>
                  <SelectItem value="shop">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      Shop
                    </div>
                  </SelectItem>
                  <SelectItem value="tournament">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Tournoi
                    </div>
                  </SelectItem>
                  <SelectItem value="global">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Global (tous les utilisateurs)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {target === "user" && (
              <div className="space-y-2">
                <Label>ID Utilisateur *</Label>
                <Input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="user-id-123"
                />
              </div>
            )}

            {target === "shop" && (
              <div className="space-y-2">
                <Label>ID Shop *</Label>
                <Input
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value)}
                  placeholder="shop-id-123"
                />
              </div>
            )}

            {target === "tournament" && (
              <div className="space-y-2">
                <Label>ID Tournoi *</Label>
                <Input
                  value={tournamentId}
                  onChange={(e) => setTournamentId(e.target.value)}
                  placeholder="tournament-id-123"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SYSTEM">Système</SelectItem>
                  <SelectItem value="ORDER">Commande</SelectItem>
                  <SelectItem value="MESSAGE">Message</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre de la notification"
              />
            </div>

            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Contenu de la notification"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Lien (optionnel)</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="/orders/123"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ResultDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        type="warning"
        title="Supprimer la notification"
        description="Êtes-vous sûr de vouloir supprimer cette notification ? Cette action est irréversible."
        actions={[
          {
            label: "Annuler",
            onClick: () => setIsDeleteOpen(false),
            variant: "outline",
          },
          {
            label: deleting ? "Suppression..." : "Supprimer",
            onClick: handleDelete,
            variant: "destructive",
            disabled: deleting,
            loading: deleting,
          },
        ]}
        showCloseButton={false}
      />
    </>
  );
}
