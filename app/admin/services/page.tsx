"use client";

import { useState } from "react";
import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import {
  getServices,
  updateService,
  deleteService,
  toggleServiceActive,
} from "@/actions/services";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Settings, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ResultDialog } from "@/components/shared/result-dialog";
import { useRouter } from "next/navigation";
import { Service } from "@/database/schema";

export default function ServicesPage() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
  } = useEntityList<Service>({
    entityType: "services",
    defaultFilters: {
      limit: 20,
    },
    // fetchMethod: "server-action",
    // fetchFunction: async (params) => {
    //   const result = await getServices({
    //     pagination: { page: params.page, limit: params.limit },
    //     filters: {
    //       title: params.search, // Use title instead of search
    //       isActive:
    //         params.isActive === "true"
    //           ? true
    //           : params.isActive === "false"
    //             ? false
    //             : undefined,
    //     },
    //     options: {
    //       sortBy: params.sortBy,
    //       sortOrder: params.sortOrder,
    //     },
    //   });
    //   return {
    //     success: true,
    //     data: result.data,
    //     pagination: result.pagination,
    //   };
    // },
  });

  const handleToggleActive = async (service: any) => {
    try {
      await toggleServiceActive(service.id, !service.isActive);
      toast.success(service.isActive ? "Service désactivé" : "Service activé");
      onRefresh();
    } catch (error) {
      console.error("Error toggling service:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  const handleDelete = async () => {
    if (!selectedService) return;

    setDeleting(true);
    try {
      await deleteService(selectedService.id);
      toast.success("Service supprimé avec succès");
      setIsDeleteDialogOpen(false);
      setSelectedService(null);
      onRefresh();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <EntityList
        title="Services"
        description="Gérez les services de l'entreprise et de l'application"
        entityType="services"
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
        onAdd={() => router.push("/admin/services/create")}
        onEdit={(item) => router.push(`/admin/services/${item.id}`)}
        onDelete={(item) => {
          setSelectedService(item);
          setIsDeleteDialogOpen(true);
        }}
        availableFilters={[
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
          { key: "createdAt-desc", label: "Date (Récent)", direction: "desc" },
          { key: "createdAt-asc", label: "Date (Ancien)", direction: "asc" },
          { key: "title-asc", label: "Titre (A-Z)", direction: "asc" },
          { key: "title-desc", label: "Titre (Z-A)", direction: "desc" },
        ]}
        renderTableHeader={() => (
          <tr className="border-b">
            <th className="text-left p-4">Titre</th>
            <th className="text-left p-4">Description</th>
            <th className="text-left p-4">Statut</th>
            <th className="text-left p-4">Date</th>
            <th className="text-left p-4">Actions</th>
          </tr>
        )}
        renderTableRow={(item: any) => (
          <tr key={item.id} className="border-b hover:bg-muted/50">
            <td className="p-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{item.title}</span>
              </div>
            </td>
            <td className="p-4">
              <span className="text-sm text-muted-foreground truncate max-w-[300px] block">
                {item.description}
              </span>
            </td>
            <td className="p-4">
              <Badge variant={item.isActive ? "default" : "secondary"}>
                {item.isActive ? "Actif" : "Inactif"}
              </Badge>
            </td>
            <td className="p-4">{formatDate(item.createdAt)}</td>
            <td className="p-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleActive(item)}
              >
                {item.isActive ? (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Désactiver
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Activer
                  </>
                )}
              </Button>
            </td>
          </tr>
        )}
        renderCard={(item: any) => (
          <div key={item.id} className="p-4 border rounded shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div className="font-bold">{item.title}</div>
              <Badge variant={item.isActive ? "default" : "secondary"}>
                {item.isActive ? "Actif" : "Inactif"}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground line-clamp-2">
              {item.description}
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{formatDate(item.createdAt)}</span>
            </div>
          </div>
        )}
      />

      {/* Delete Dialog */}
      <ResultDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        type="warning"
        title="Supprimer le service"
        description="Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible."
        actions={[
          {
            label: "Annuler",
            onClick: () => setIsDeleteDialogOpen(false),
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
