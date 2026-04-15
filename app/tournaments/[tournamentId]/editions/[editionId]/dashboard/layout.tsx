"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTournamentEditionWithRelations } from "@/actions/editions";
import { isUserTournamentOrganizer } from "@/actions/tournaments";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/auth-context";
import { toast } from "sonner";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import {
  EnhancedDashboard,
  SidebarHeader,
  SidebarGroup,
  SidebarItem,
  SidebarFooter,
  DashboardHeader,
  SidebarContainer,
} from "@/components/dashboard/enhanced-dashboard";
import {
  LayoutDashboard,
  Users, Settings,
  Swords,
  Wallet,
  ListTree,
  LayoutGrid,
  GitBranch,
  UserCog
} from "lucide-react";
import { useActiveRoute } from "@/hooks/use-active-route";

export default function EditionDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.tournamentId as string;
  const editionId = params.editionId as string;
  const [edition, setEdition] = useState<any>(null);
  const [isOrganizer, setIsOrganizer] = useState<boolean | null>(null);
  const { user, loading: authLoading } = useAuthContext();
  const { isActive } = useActiveRoute();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/sign-in");
      return;
    }

    if (user) {
      getTournamentEditionWithRelations(editionId).then(setEdition);
      isUserTournamentOrganizer(tournamentId, user.id).then((result) => {
        setIsOrganizer(result);
        if (result === false) {
          toast.error("Vous n'avez pas accès à ce tableau de bord");
          router.push(`/tournaments/${tournamentId}/editions/${editionId}`);
        }
      });
    }
  }, [tournamentId, editionId, user, authLoading, router]);

  if (authLoading || !edition || isOrganizer === null) {
    return <PageSkeleton type="dashboard" />;
  }

  if (isOrganizer === false) {
    return null;
  }

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
      title: "Organisation participants",
      url: `/tournaments/${tournamentId}/editions/${editionId}/dashboard/participants/organize`,
      icon: UserCog,
    },
    {
      title: "Phases & Arbre",
      url: `/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases`,
      icon: ListTree,
    },
    {
      title: "Groupes",
      url: `/tournaments/${tournamentId}/editions/${editionId}/dashboard/groups`,
      icon: LayoutGrid,
    },
    {
      title: "Brackets",
      url: `/tournaments/${tournamentId}/editions/${editionId}/dashboard/brackets`,
      icon: GitBranch,
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
    {
      title: "Organisation",
      url: `/tournaments/${tournamentId}/editions/${editionId}/dashboard/organize`,
      icon: Settings,
    },
  ];

  const editionOverview = navData.filter(i =>
    i.url.endsWith(`/tournaments/${tournamentId}/editions/${editionId}/dashboard`) ||
    i.url.endsWith(`/phases`) ||
    i.url.endsWith(`/groups`) ||
    i.url.endsWith(`/brackets`) ||
    i.url.endsWith(`/matches`) ||
    i.url.endsWith(`/organize`)
  );
  
  const editionManage = navData.filter(i =>
    i.url.endsWith(`/participants`) ||
    i.url.endsWith(`/payments`) ||
    i.url.endsWith(`/settings`)
  );

  const EditionSidebar = (
    <SidebarContainer sidebarBgType="default">
      <SidebarHeader
        title={edition?.name || "Édition"}
        subtitle="Tableau de bord"
        user={{
          username: "Organisateur",
          level: "Edition",
        }}
        sidebarBgType="default"
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <SidebarGroup label="Vue d'ensemble" sidebarBgType="default">
          {editionOverview.map((item) => (
            <SidebarItem
              key={item.title}
              {...item}
              isActive={isActive(item.url, item.url.endsWith(`/dashboard`))}
              sidebarBgType="default"
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Organisation" sidebarBgType="default">
          {editionManage.map((item) => (
            <SidebarItem
              key={item.title}
              {...item}
              isActive={isActive(item.url, false)}
              sidebarBgType="default"
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
        sidebarBgType="default"
      />
    </SidebarContainer>
  );

  const Header = (
    <DashboardHeader
      title={edition?.name || "Édition"}
      description="Gestion de l'édition"
      showSidebarTrigger={true}
      togglerComponent={false}
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
