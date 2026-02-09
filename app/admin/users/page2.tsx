// app/admin/users/page.tsx
"use client";

import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import { UserWithRelations } from "@/database/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function UsersPage() {
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
    onAdd,
    onEdit,
    onView,
    onExport,
    onRefresh,
  } = useEntityList<UserWithRelations>({
    entityType: 'users',
    defaultFilters: {
      isActive: true,
      accountType: 'all'
    },
  });

  // Rendu d'une carte utilisateur
  const renderUserCard = (user: UserWithRelations, mode: 'grid' | 'list' | 'table') => {
    if (mode === 'table') {
      return (
        <tr className="border-b hover:bg-muted/50">
          <td className="p-4">{user.username || user.email}</td>
          <td className="p-4">{user.email}</td>
          <td className="p-4">
            <div className="flex gap-1">
              {user.accountTypes?.map((type: string) => (
                <Badge key={type} variant="outline">{type}</Badge>
              ))}
            </div>
          </td>
          <td className="p-4">
            <Badge variant={user.isVip ? 'default' : 'secondary'}>
              {user.isVip ? 'VIP' : 'Standard'}
            </Badge>
          </td>
          <td className="p-4">
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onView(user)}>Voir</Button>
              <Button size="sm" variant="outline" onClick={() => onEdit(user)}>Éditer</Button>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{user.fullName || user.username}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Badge variant={user.isVip ? 'default' : 'outline'}>
              {user.isVip ? 'VIP' : 'Standard'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex gap-1">
              {user.accountTypes?.map((type: string) => (
                <Badge key={type} variant="secondary">{type}</Badge>
              ))}
            </div>
            <div className="flex justify-between text-sm">
              <span>Créé le {new Date(user.createdAt).toLocaleDateString()}</span>
              <span className={user.isActive ? 'text-green-600' : 'text-red-600'}>
                {user.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={() => onView(user)}>Voir profil</Button>
              <Button size="sm" variant="outline" onClick={() => onEdit(user)}>Éditer</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <EntityList
      title="Utilisateurs"
      description="Gestion des utilisateurs de la plateforme"
      entityType="users"
      data={data}
      total={total}
      loading={loading}
      page={page}
      limit={limit}
      searchTerm={searchTerm}
      filters={filters}
      viewMode={viewMode}
      onPageChange={setPage}
      onLimitChange={setLimit}
      onSearchChange={setSearchTerm}
      onFilterChange={setFilters}
      onViewModeChange={setViewMode}
      onAdd={onAdd}
      onEdit={onEdit}
      onView={onView}
      onExport={onExport}
      onRefresh={onRefresh}
      renderCard={renderUserCard}
      showSearch={true}
      showFilters={true}
      showViewToggle={true}
      showExport={true}
      showAddButton={true}
      availableFilters={[
        {
          key: 'isVip',
          label: 'Statut VIP',
          type: 'boolean',
          options: [
            { value: 'all', label: 'Tous' },
            { value: 'true', label: 'VIP' },
            { value: 'false', label: 'Non VIP' },
          ],
        },
      ]}
      sortOptions={[
        { key: 'createdAt', label: 'Date de création' },
        { key: 'username', label: 'Nom d\'utilisateur' },
        { key: 'email', label: 'Email' },
      ]}
    />
  );
}