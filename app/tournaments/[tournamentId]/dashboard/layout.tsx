// app/tournaments/[tournamentId]/dashboard/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
// import { getTournamentById } from "@/actions/tournanents";
import {
  EnhancedDashboard,
  SidebarHeader,
  SidebarGroup,
  SidebarItem,
  SidebarFooter,
  DashboardHeader,
} from "@/components/dashboard/enhanced-dashboard";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useAuthContext } from "@/contexts/auth-context";
import { useActiveRoute } from "@/hooks/use-active-route";
import { getTournamentNavData } from "@/constants/tournament-constants";
import { getTournamentById } from "@/actions/tournaments";

export default function TournamentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  const [tournament, setTournament] = useState<any>(null);
  const { user, loading } = useAuthContext();
  const { isActive } = useActiveRoute();

  useEffect(() => {
    getTournamentById(tournamentId).then(setTournament);
  }, [tournamentId]);

  if (loading || !tournament) {
    return <PageSkeleton type="dashboard" />;
  }

  // Obtenir les données de navigation
  const navData = getTournamentNavData(tournamentId);

  // Récupérer tous les items pour le header
  const allItems = [
    ...navData.overviewItems,
    ...navData.editionItems,
    ...navData.memberItems,
    ...navData.matchItems,
    ...navData.settingsItems,
  ];

  // Trouver l'item actif pour le titre du header
  const activeItem = allItems.find(
    (item) => item.url && isActive(item.url, false)
  );
  const pageTitle = activeItem?.title || tournament?.name || "Tournoi";
  const pageDescription =
    activeItem?.description || `Tableau de bord du tournoi`;

  const TournamentSidebar = (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-900 to-purple-900 text-white">
      <SidebarHeader
        title={tournament?.name || "Tournoi"}
        subtitle="Tableau de bord"
        user={{
          username: user?.username || "Organisateur",
          level: "Admin",
        }}
        sidebarBgType="gradient"
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <SidebarGroup label="Vue d'ensemble" sidebarBgType="gradient">
          {navData.overviewItems.map((item) => (
            <SidebarItem
              key={item.title}
              {...item}
              isActive={isActive(item.url, false)}
              sidebarBgType="gradient"
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Éditions" sidebarBgType="gradient">
          {navData.editionItems.map((item) => (
            <SidebarItem
              key={item.title}
              {...item}
              isActive={isActive(item.url, false)}
              sidebarBgType="gradient"
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Personnel" sidebarBgType="gradient">
          {navData.memberItems.map((item) => (
            <SidebarItem
              key={item.title}
              {...item}
              isActive={isActive(item.url, false)}
              sidebarBgType="gradient"
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Compétition" sidebarBgType="gradient">
          {navData.matchItems.map((item) => (
            <SidebarItem
              key={item.title}
              {...item}
              isActive={isActive(item.url, false)}
              sidebarBgType="gradient"
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Configuration" sidebarBgType="gradient">
          {navData.settingsItems.map((item) => (
            <SidebarItem
              key={item.title}
              {...item}
              isActive={isActive(item.url, false)}
              sidebarBgType="gradient"
            />
          ))}
        </SidebarGroup>
      </div>

      <SidebarFooter
        user={{
          username: user?.username || "Organisateur",
          profileImage: user?.profileImage || undefined,
          status: "online",
        }}
        sidebarBgType="gradient"
      />
    </div>
  );

  const TournamentHeader = (
    <DashboardHeader
      title={pageTitle}
      description={pageDescription}
      showSidebarTrigger={true}
    />
  );

  return (
    <EnhancedDashboard
      sidebar={TournamentSidebar}
      header={TournamentHeader}
      sidebarBgType="gradient"
      className="min-h-screen"
    >
      {children}
    </EnhancedDashboard>
  );
}
