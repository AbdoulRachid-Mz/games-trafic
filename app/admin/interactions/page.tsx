"use client";

import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import { getInteractions } from "@/actions/interactions";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Heart, Eye, Bookmark, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function InteractionsPage() {
  const router = useRouter();

  const {
    data,
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
    isPlaceholderData,
  } = useEntityList<any>({
    entityType: "interactions",
    defaultFilters: {
      limit: 20,
    },
    fetchMethod: "server-action",
    fetchFunction: async (params) => {
      const result = await getInteractions({
        pagination: { page: params.page, limit: params.limit },
        filters: {
          userId: params.userId,
          types: params.type,
          entityType: params.entityType,
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

  const getIcon = (type: string) => {
    switch (type) {
      case "LIKE":
        return <Heart className="h-4 w-4 text-red-500" />;
      case "VIEW":
        return <Eye className="h-4 w-4 text-blue-500" />;
      case "BOOKMARK":
        return <Bookmark className="h-4 w-4 text-yellow-500" />;
      case "FOLLOW":
        return <UserPlus className="h-4 w-4 text-green-500" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  return (
    <EntityList
      title="Interactions"
      description="Suivi des interactions utilisateurs"
      entityType="interactions"
      data={data}
      loading={loading}
      isPlaceholderData={isPlaceholderData}
      page={page}
      limit={limit}
      total={100}
      searchTerm={searchTerm}
      filters={filters}
      viewMode={viewMode}
      onPageChange={setPage}
      onLimitChange={setLimit}
      onSearchChange={setSearchTerm}
      onFilterChange={setFilters}
      onViewModeChange={setViewMode}
      onRefresh={onRefresh}
      availableFilters={[
        {
          key: "type",
          label: "Type",
          type: "select",
          options: [
            { label: "Like", value: "LIKE" },
            { label: "Vue", value: "VIEW" },
            { label: "Favori", value: "BOOKMARK" },
            { label: "Suivi", value: "FOLLOW" },
          ],
        },
        {
          key: "entityType",
          label: "Entité",
          type: "select",
          options: [
            { label: "Produit", value: "PRODUCT" },
            { label: "Article", value: "POST" },
            { label: "Boutique", value: "SHOP" },
            { label: "Tournoi", value: "TOURNAMENT" },
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
          <th className="text-left p-4">Action</th>
          <th className="text-left p-4">Cible</th>
          <th className="text-left p-4">Date</th>
        </tr>
      )}
      renderTableRow={(item: any) => (
        <tr key={item.id} className="border-b hover:bg-muted/50">
          <td className="p-4">
            <div className="flex items-center gap-2">
              {item.user ? (
                <>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={item.user?.image} />
                    <AvatarFallback>
                      {item.user?.username?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {item.user?.username}
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {item.userId}
                </span>
              )}
            </div>
          </td>
          <td className="p-4">
            <div className="flex items-center gap-2">
              {getIcon(item.type)}
              <span className="capitalize font-medium">
                {item.type?.toLowerCase()}
              </span>
            </div>
          </td>
          <td className="p-4">
            <div className="flex flex-col">
              <Badge variant="outline" className="w-fit mb-1">
                {item.entityType}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {item.entityId}
              </span>
            </div>
          </td>
          <td className="p-4">{formatDate(item.createdAt)}</td>
        </tr>
      )}
      renderCard={(item: any) => (
        <div key={item.id} className="p-4 border rounded shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              {getIcon(item.type)}
              <span className="font-bold capitalize">
                {item.type?.toLowerCase()}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDate(item.createdAt)}
            </span>
          </div>
          <div className="text-sm mb-2">
            User: {item.user?.username || item.userId}
          </div>
          <div className="text-xs">
            Target: {item.entityType} ({item.entityId})
          </div>
        </div>
      )}
    />
  );
}
