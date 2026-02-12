"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTournamentEditionWithRelations } from "@/actions/editions";
import { EnhancedDashboard, SidebarItem } from "@/components/dashboard/enhanced-dashboard";
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

export default function EditionDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  const editionId = params.editionId as string;
  const [edition, setEdition] = useState<any>(null);

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

  const sidebarContent = (
    <div className="flex flex-col gap-2 p-4">
      {navData.map((item) => (
        <SidebarItem
          key={item.title}
          title={item.title}
          url={item.url}
          icon={item.icon}
          sidebarBgType="default"
        />
      ))}
    </div>
  );

  const headerContent = (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <div className="flex items-center gap-2">
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink
                href={`/tournaments/${tournamentId}/dashboard/editions`}
              >
                Éditions
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {edition?.name || "Chargement..."}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );

  return (
    <EnhancedDashboard
      sidebar={sidebarContent}
      header={headerContent}
    // className="mt-28"
    >
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-4">
        {children}
      </div>
    </EnhancedDashboard>
  );
}
