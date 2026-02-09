"use client";

import { useState } from "react";
import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import { getBlogs, deleteBlog, toggleBlogStatus } from "@/actions/blogs";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { FileText, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ResultDialog } from "@/components/shared/result-dialog";
import { useRouter } from "next/navigation";

export default function BlogsAdminPage() {
  const router = useRouter();
  const [selectedBlog, setSelectedBlog] = useState<any>(null);
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
  } = useEntityList<any>({
    entityType: "blogs",
    defaultFilters: {
      limit: 20,
    },
    // fetchMethod: "server-action",
    // fetchFunction: async (params) => {
    //   const result = await getBlogs({
    //     pagination: { page: params.page, limit: params.limit },
    //     filters: {
    //       title: params.search,
    //     },
    //     options: {
    //       sortBy: params.sortBy,
    //       sortOrder: params.sortOrder,
    //       includeDeleted: false,
    //       includeInactive: true,
    //     },
    //   });
    //   return {
    //     success: true,
    //     data: result.data,
    //     pagination: result.pagination,
    //   };
    // },
  });

  const handleToggleStatus = async (blog: any) => {
    try {
      await toggleBlogStatus(blog.id);
      toast.success(blog.isActive ? "Blog désactivé" : "Blog activé");
      onRefresh();
    } catch (error) {
      console.error("Error toggling blog:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  const handleDelete = async () => {
    if (!selectedBlog) return;

    setDeleting(true);
    try {
      await deleteBlog(selectedBlog.id);
      toast.success("Blog supprimé avec succès");
      setIsDeleteDialogOpen(false);
      setSelectedBlog(null);
      onRefresh();
    } catch (error) {
      console.error("Error deleting blog:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <EntityList
        title="Blogs"
        description="Gérez vos articles de blog"
        entityType="blogs"
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
        onAdd={() => router.push("/admin/blogs/create")}
        onEdit={(item) => router.push(`/admin/blogs/${item.id}`)}
        onDelete={(item) => {
          setSelectedBlog(item);
          setIsDeleteDialogOpen(true);
        }}
        sortOptions={[
          { key: "createdAt-desc", label: "Date (Récent)", direction: "desc" },
          { key: "createdAt-asc", label: "Date (Ancien)", direction: "asc" },
          { key: "title-asc", label: "Titre (A-Z)", direction: "asc" },
          { key: "title-desc", label: "Titre (Z-A)", direction: "desc" },
        ]}
        renderTableHeader={() => (
          <tr className="border-b">
            <th className="text-left p-4">Titre</th>
            <th className="text-left p-4">Auteur</th>
            <th className="text-left p-4">Statut</th>
            <th className="text-left p-4">Date</th>
            <th className="text-left p-4">Actions</th>
          </tr>
        )}
        renderTableRow={(item: any) => (
          <tr key={item.id} className="border-b hover:bg-muted/50">
            <td className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{item.title}</span>
              </div>
            </td>
            <td className="p-4">
              <span className="text-sm text-muted-foreground">
                {item.author?.username || "Inconnu"}
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
                onClick={() => handleToggleStatus(item)}
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
              <div className="font-bold line-clamp-1">{item.title}</div>
              <Badge variant={item.isActive ? "default" : "secondary"}>
                {item.isActive ? "Actif" : "Inactif"}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground line-clamp-2">
              {item.content.replace(/<[^>]*>/g, "").substring(0, 100)}...
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{item.author?.username}</span>
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
        title="Supprimer le blog"
        description="Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible."
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
