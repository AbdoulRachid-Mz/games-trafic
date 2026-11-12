"use client";

import {
  EnhancedDashboard,
  SidebarContainer,
  SidebarHeader,
  SidebarItem,
  SidebarGroup,
  DashboardHeader,
  SidebarFooter,
} from "@/components/dashboard/enhanced-dashboard";
import { useActiveRoute } from "@/hooks/use-active-route";
import {
  Sparkles,
  Store,
  ShoppingBag,
  ShoppingCart,
  Trophy,
  Wallet,
  MessageCircle,
  Bell,
} from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const { isActive } = useActiveRoute();
  const { user } = useAuthContext();
  const Sidebar = (
    <SidebarContainer sidebarBgType="gradient">
      <SidebarHeader
        title="Mon Espace"
        subtitle="Vue globale utilisateur"
        user={{
          username: user?.username || "Utilisateur",
          profileImage: user?.image || "/icons/avatar.png",
          level: user?.level || "C",
        }}
        sidebarBgType="default"
      />

      <div className="p-3 space-y-2">
        <SidebarGroup label="Général" sidebarBgType="gradient">
          <SidebarItem title="Overview" icon={Sparkles} url="/dashboard" isActive={isActive("/dashboard", true)} sidebarBgType="gradient" />
          <SidebarItem title="Commandes" icon={ShoppingCart} url="/dashboard/orders" isActive={isActive("/dashboard/orders", false)} sidebarBgType="gradient" />
          <SidebarItem title="Boutiques" icon={Store} url="/dashboard/shops" isActive={isActive("/dashboard/shops", false)} sidebarBgType="gradient" />
          <SidebarItem title="Produits" icon={ShoppingBag} url="/dashboard/products" isActive={isActive("/dashboard/products", false)} sidebarBgType="gradient" />
          <SidebarItem title="Tournois" icon={Trophy} url="/dashboard/tournaments" isActive={isActive("/dashboard/tournaments", false)} sidebarBgType="gradient" />
        </SidebarGroup>

        <SidebarGroup label="Mon compte" sidebarBgType="gradient">
          <SidebarItem title="Portefeuille" icon={Wallet} url="/wallet" isActive={isActive("/wallet", false)} sidebarBgType="gradient" />
          <SidebarItem title="Messages" icon={MessageCircle} url="/chats" isActive={isActive("/chats", false)} sidebarBgType="gradient" />
          <SidebarItem title="Notifications" icon={Bell} url="/dashboard/notifications" isActive={isActive("/dashboard/notifications", false)} sidebarBgType="gradient" />
        </SidebarGroup>
      </div>

      <SidebarFooter
        user={{
          username: user?.fullName || "Utilisateur",
          profileImage: user?.profileImage || undefined,
          status: "online",
        }}
        sidebarBgType="default"
      />
    </SidebarContainer>
  );

  const Header = (
    <DashboardHeader
      title="Dashboard Utilisateur"
      description="Aperçu personnalisé de votre activité"
      showSidebarTrigger={true}
    />
  );

  return (
    <EnhancedDashboard sidebar={Sidebar} header={Header} sidebarBgType="gradient">
      {children}
    </EnhancedDashboard>
  );
}
