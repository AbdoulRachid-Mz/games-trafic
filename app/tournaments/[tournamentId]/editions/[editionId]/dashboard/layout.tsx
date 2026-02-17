"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTournamentEditionWithRelations } from "@/actions/editions";
import {
  EnhancedDashboard,
  SidebarHeader,
  SidebarGroup,
  SidebarItem,
  SidebarFooter,
  DashboardHeader,
  SidebarContainer,
} from "@/components/dashboard/enhanced-dashboard";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Settings,
  Swords,
  Wallet,
  ListTree,
} from "lucide-react";
import { useActiveRoute } from "@/hooks/use-active-route";

export default function EditionDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  const editionId = params.editionId as string;
  const [edition, setEdition] = useState<any>(null);
  const { isActive } = useActiveRoute();

  useEffect(() => {
    getTournamentEditionWithRelations(editionId).then(setEdition);
  }, [editionId]);

  const navData = [
    {
      title: "Vue d'ensemble",
      url: `/tournaments/${tournamentId}/editions/${editionId}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      title: "Participants",
      url: `/tournaments/${tournamentId}/editions/${editionId}/dashboard/participants`,
      icon: Users,
    },
    {
      title: "Phases & Arbre",
      url: `/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases`,
      icon: ListTree,
    },
    {
      title: "Matchs",
      url: `/tournaments/${tournamentId}/editions/${editionId}/dashboard/matches`,
      icon: Swords,
    },
    {
      title: "Paiements",
      url: `/tournaments/${tournamentId}/editions/${editionId}/dashboard/payments`,
      icon: Wallet,
    },
    {
      title: "Paramètres",
      url: `/tournaments/${tournamentId}/editions/${editionId}/dashboard/settings`,
      icon: Settings,
    },
  ];

  const editionOverview = navData.filter(i =>
    i.url.endsWith(`/tournaments/${tournamentId}/editions/${editionId}/dashboard`) ||
    i.url.endsWith(`/phases`) ||
    i.url.endsWith(`/matches`)
  );
  const editionManage = navData.filter(i =>
    i.url.endsWith(`/participants`) ||
    i.url.endsWith(`/payments`) ||
    i.url.endsWith(`/settings`)
  );

  const EditionSidebar = (
    <SidebarContainer sidebarBgType="gradient">
      <SidebarHeader
        title={edition?.name || "Édition"}
        subtitle="Tableau de bord"
        user={{
          username: "Organisateur",
          level: "Edition",
        }}
        sidebarBgType="gradient"
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <SidebarGroup label="Vue d'ensemble" sidebarBgType="gradient">
          {editionOverview.map((item) => (
            <SidebarItem
              key={item.title}
              {...item}
              isActive={isActive(item.url, item.url.endsWith(`/dashboard`))}
              sidebarBgType="gradient"
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Organisation" sidebarBgType="gradient">
          {editionManage.map((item) => (
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
          username: "Organisateur",
          profileImage: undefined,
          status: "online",
        }}
        sidebarBgType="gradient"
      />
    </SidebarContainer>
  );

  const Header = (
    <DashboardHeader
      title={edition?.name || "Édition"}
      description="Gestion de l'édition"
      showSidebarTrigger={true}
    />
  );

  return (
    <EnhancedDashboard sidebar={EditionSidebar} header={Header}>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-4">
        {children}
      </div>
    </EnhancedDashboard>
  );
}
