"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
// import { getTournamentById } from "@/actions/tournanents";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useAuthContext } from "@/contexts/auth-context";
import { useActiveRoute } from "@/hooks/use-active-route";
import { getTournamentNavData } from "@/constants/tournament-constants";
import { getTournamentById, isUserTournamentOrganizer } from "@/actions/tournaments";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  EnhancedDashboard,
  SidebarHeader,
  SidebarGroup,
  SidebarItem,
  SidebarFooter,
  DashboardHeader,
} from "@/components/dashboard/enhanced-dashboard";

export default function TournamentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.tournamentId as string;
  const [tournament, setTournament] = useState<any>(null);
  const [isOrganizer, setIsOrganizer] = useState<boolean | null>(null);
  const { user, loading: authLoading } = useAuthContext();
  const { isActive, getActiveTitle } = useActiveRoute();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/sign-in");
      return;
    }

    if (user) {
      getTournamentById(tournamentId).then(setTournament);
      isUserTournamentOrganizer(tournamentId, user.id).then((result) => {
        setIsOrganizer(result);
        if (result === false) {
          toast.error("Vous n'avez pas accès à ce tableau de bord");
          router.push(`/tournaments/${tournamentId}`);
        }
      });
    }
  }, [tournamentId, user, authLoading, router]);

  if (authLoading || !tournament || isOrganizer === null) {
    return <PageSkeleton type="dashboard" />;
  }

  if (isOrganizer === false) {
    return null;
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

  // Utiliser le hook pour détecter l'item actif
  const activeTitle = getActiveTitle(allItems);
  const pageTitle = activeTitle || tournament?.name || "Tournoi";
  const pageDescription = `Tableau de bord du tournoi`;

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
