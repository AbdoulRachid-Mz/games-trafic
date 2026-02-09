"use client";

import {
  EnhancedDashboard,
  SidebarContainer,
  SidebarHeader,
  SidebarItem,
  SidebarGroup,
  DashboardHeader,
} from "@/components/dashboard/enhanced-dashboard";
import {
  Sparkles,
  Store,
  ShoppingBag,
  Trophy,
  Wallet,
  MessageCircle,
  Bell,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type DashboardShellProps = {
  user: {
    username?: string;
    profileImage?: string;
    level?: string;
  };
  children: React.ReactNode;
};

export function DashboardShell({ user, children }: DashboardShellProps) {
  return (
    <EnhancedDashboard
      sidebar={
        <SidebarContainer sidebarBgType="gradient" className="w-64">
          <SidebarHeader
            title="Mon Espace"
            subtitle="Vue globale utilisateur"
            user={user}
            sidebarBgType="gradient"
          />

          <div className="p-3 space-y-2">
            <SidebarGroup label="Général" sidebarBgType="gradient">
              <SidebarItem title="Overview" icon={Sparkles} url="/dashboard" />
              <SidebarItem title="Boutiques" icon={Store} url="/dashboard/shops" />
              <SidebarItem title="Produits" icon={ShoppingBag} url="/dashboard/marketplace" />
              <SidebarItem title="Tournois" icon={Trophy} url="/dashboard/tournaments" />
            </SidebarGroup>

            <SidebarGroup label="Activités" sidebarBgType="gradient">
              <SidebarItem title="Portefeuille" icon={Wallet} url="/dashboard/wallet" />
              <SidebarItem title="Messages" icon={MessageCircle} url="/dashboard/messages" />
              <SidebarItem title="Notifications" icon={Bell} url="/dashboard/notifications" />
              <SidebarItem title="VIP" icon={Star} url="/dashboard/vip" />
            </SidebarGroup>
          </div>
        </SidebarContainer>
      }
      header={
        <DashboardHeader
          title="Dashboard Utilisateur"
          description="Aperçu personnalisé de votre activité"
          // actions={
          //   <div className="flex items-center gap-2">
          //     <Button variant="outline" size="sm">
          //       Exporter
          //     </Button>
          //     <Button size="sm">Créer</Button>
          //   </div>
          // }
        />
      }
    >
      {children}
    </EnhancedDashboard>
  );
}
