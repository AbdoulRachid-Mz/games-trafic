"use client";

import { useState } from "react";
import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "@/actions/announcements";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Pin, Megaphone, Newspaper, RefreshCw, Plus } from "lucide-react";
import { Announcement } from "@/database/schema";
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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ResultDialog } from "@/components/shared/result-dialog";
import { useAuth } from "@/hooks/use-auth";

export default function AnnouncementsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<string>("ANNOUNCEMENT");
  const [isPinned, setIsPinned] = useState(false);
  const [isActive, setIsActive] = useState(true);

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
  } = useEntityList<Announcement>({
    entityType: "announcements",
    defaultFilters: {
      limit: 20,
    },
    fetchMethod: "server-action",
    fetchFunction: async (params) => {
      const result = await getAnnouncements({
        pagination: { page: params.page, limit: params.limit },
        filters: {
          search: params.search,
          type: params.type,
          isActive: params.isActive === "true" ? true : params.isActive === "false" ? false : undefined,
        },
        options: {
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        },
      });
      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };
    },
  });

  const getTypeIcon = (type: string | null) => {
    switch (type) {
      case "ANNOUNCEMENT":
        return <Megaphone className="h-4 w-4" />;
      case "NEWS":
        return <Newspaper className="h-4 w-4" />;
      case "UPDATE":
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <Megaphone className="h-4 w-4" />;
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setType("ANNOUNCEMENT");
    setIsPinned(false);
    setIsActive(true);
  };

  const handleCreate = async () => {
    if (!title || !content) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    if (!user?.id) {
      toast.error("Vous devez être connecté");
      return;
    }

    setSaving(true);
    try {
      await createAnnouncement({
        authorId: user.id,
        title,
        content,
        type: type as any,
        isPinned,
        isActive,
        isDeleted: false,
      });

      toast.success("Annonce créée avec succès");
      setIsCreateOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error("Error creating announcement:", error);
      toast.error("Erreur lors de la création de l'annonce");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedAnnouncement) return;
    if (!title || !content) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    setSaving(true);
    try {
      await updateAnnouncement(selectedAnnouncement.id, {
        title,
        content,
        type: type as any,
        isPinned,
        isActive,
      });

      toast.success("Annonce modifiée avec succès");
      setIsEditOpen(false);
      setSelectedAnnouncement(null);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error("Error updating announcement:", error);
      toast.error("Erreur lors de la modification de l'annonce");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAnnouncement) return;

    setDeleting(true);
    try {
      await deleteAnnouncement(selectedAnnouncement.id);
      toast.success("Annonce supprimée avec succès");
      setIsDeleteOpen(false);
      setSelectedAnnouncement(null);
      onRefresh();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePin = async (announcement: Announcement) => {
    try {
      await updateAnnouncement(announcement.id, {
        isPinned: !announcement.isPinned,
      });
      toast.success(
        announcement.isPinned ? "Annonce désépinglée" : "Annonce épinglée"
      );
      onRefresh();
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error("Erreur lors de l'épinglage");
    }
  };

  const openEditDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setTitle(announcement.title);
    setContent(announcement.content);
    setType(announcement.type || "ANNOUNCEMENT");
    setIsPinned(announcement.isPinned || false);
    setIsActive(announcement.isActive || true);
    setIsEditOpen(true);
  };

  return (
    <>
      <EntityList
        title="Annonces"
        description="Gérez les annonces et actualités de la plateforme"
        data={data}
        entityType="announcements"
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
        onEdit={(item: Announcement) => openEditDialog(item)}
        onDelete={(item: Announcement) => {
          setSelectedAnnouncement(item);
          setIsDeleteOpen(true);
        }}
        availableFilters={[
          {
            key: "type",
            label: "Type",
            type: "select",
            options: [
              { label: "Annonce", value: "ANNOUNCEMENT" },
              { label: "Actualité", value: "NEWS" },
              { label: "Mise à jour", value: "UPDATE" },
            ],
          },
          {
            key: "isActive",
            label: "Statut",
            type: "select",
            options: [
              { label: "Actif", value: "true" },
              { label: "Inactif", value: "false" },
            ],
          },
        ]}
        sortOptions={[
          { key: "createdAt", label: "Date (Récent)", direction: "desc" },
          { key: "createdAt", label: "Date (Ancien)", direction: "asc" },
          { key: "title", label: "Titre (A-Z)", direction: "asc" },
          { key: "title", label: "Titre (Z-A)", direction: "desc" },
        ]}
        renderTableHeader={() => (
          <tr className="border-b">
            <th className="text-left p-4">Titre</th>
            <th className="text-left p-4">Type</th>
            <th className="text-left p-4">Statut</th>
            <th className="text-left p-4">Date</th>
            <th className="text-left p-4">Actions</th>
          </tr>
        )}
        renderTableRow={(item: Announcement) => (
          <tr key={item.id} className="border-b hover:bg-muted/50">
            <td className="p-4">
              <div className="flex items-center gap-2">
                {item.isPinned && (
                  <Pin className="h-3 w-3 text-primary rotate-45" />
                )}
                <span className="font-medium">{item.title}</span>
              </div>
            </td>
            <td className="p-4">
              <div className="flex items-center gap-2">
                {getTypeIcon(item.type)}
                <span className="capitalize">{item.type?.toLowerCase()}</span>
              </div>
            </td>
            <td className="p-4">
              <Badge variant={item.isActive ? "default" : "destructive"}>
                {item.isActive ? "Actif" : "Inactif"}
              </Badge>
            </td>
            <td className="p-4">
              {item.createdAt ? formatDate(item.createdAt) : "-"}
            </td>
            <td className="p-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTogglePin(item)}
                >
                  <Pin className="h-3 w-3 mr-1" />
                  {item.isPinned ? "Désépingler" : "Épingler"}
                </Button>
              </div>
            </td>
          </tr>
        )}
        renderCard={(item: Announcement) => (
          <div key={item.id} className="p-4 border rounded shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="font-bold flex items-center gap-2">
                {item.isPinned && <Pin className="h-3 w-3 text-primary" />}
                {item.title}
              </div>
              <Badge variant={item.isActive ? "default" : "destructive"}>
                {item.isActive ? "Actif" : "Inactif"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              {getTypeIcon(item.type)}
              <span className="capitalize">{item.type?.toLowerCase()}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground mt-auto">
              <span>{item.createdAt ? formatDate(item.createdAt) : "-"}</span>
            </div>
          </div>
        )}
      />

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer une annonce</DialogTitle>
            <DialogDescription>
              Publiez une nouvelle annonce pour tous les utilisateurs
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre de l'annonce"
              />
            </div>

            <div className="space-y-2">
              <Label>Contenu *</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Contenu de l'annonce"
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANNOUNCEMENT">Annonce</SelectItem>
                  <SelectItem value="NEWS">Actualité</SelectItem>
                  <SelectItem value="UPDATE">Mise à jour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Épingler</Label>
              <Switch checked={isPinned} onCheckedChange={setIsPinned} />
            </div>

            <div className="flex items-center justify-between">
              <Label>Actif</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier l'annonce</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'annonce
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre de l'annonce"
              />
            </div>

            <div className="space-y-2">
              <Label>Contenu *</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Contenu de l'annonce"
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANNOUNCEMENT">Annonce</SelectItem>
                  <SelectItem value="NEWS">Actualité</SelectItem>
                  <SelectItem value="UPDATE">Mise à jour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Épingler</Label>
              <Switch checked={isPinned} onCheckedChange={setIsPinned} />
            </div>

            <div className="flex items-center justify-between">
              <Label>Actif</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ResultDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        type="warning"
        title="Supprimer l'annonce"
        description="Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible."
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
