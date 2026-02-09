"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import { useScreenSize } from "@/hooks/use-screen";
import { useAuthContext } from "@/contexts/auth-context";
import { getUserNotifications } from "@/actions/notifications";
import { type Notification } from "@/database/schema";
import { Bell } from "lucide-react";

export default function NotificationsDashboardPage() {
  const { isSmallScreen, isMediumScreen } = useScreenSize();
  const { user } = useAuthContext();

  const {
    data,
    total,
    loading,
    error,
    page,
    limit,
    searchTerm,
    filters,
    setPage: onPageChange,
    setLimit: onLimitChange,
    setSearchTerm: onSearchChange,
    setFilters: onFilterChange,
    viewMode,
    setViewMode,
  } = useEntityList<Notification>({
    entityType: "notifications",
    defaultLimit: isSmallScreen ? 10 : isMediumScreen ? 15 : 20,
  });

  const renderNotificationCard = (n: Notification) => (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <Bell className="h-5 w-5 text-blue-500" />
        <CardTitle className="truncate">{n.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Typography variant="body-sm" theme="muted">
          {n.message}
        </Typography>
        <div className="text-xs text-muted-foreground">
          Type: {n.type} • {n.read ? "Lue" : "Non lue"}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="mx-auto p-4">
      <EntityList<Notification>
        title="Mes Notifications"
        description="Consultez et gérez vos notifications"
        entityType="notifications"
        data={data}
        total={total}
        loading={loading}
        error={error}
        page={page}
        limit={limit}
        searchTerm={searchTerm}
        filters={filters as Record<string, any>}
        viewMode={viewMode}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        onSearchChange={onSearchChange}
        onFilterChange={onFilterChange}
        onViewModeChange={setViewMode}
        renderCard={(item) => renderNotificationCard(item)}
        showSearch={true}
        showFilters={true}
        showViewToggle={true}
      />
    </div>
  );
}

