// app/shops/[shopId]/dashboard/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getShopById } from "@/actions/shops";
import {
  EnhancedDashboard,
  SidebarHeader,
  SidebarGroup,
  SidebarItem,
  SidebarFooter,
  DashboardHeader,
  SidebarContainer,
} from "@/components/dashboard/enhanced-dashboard";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useAuthContext } from "@/contexts/auth-context";
import { useActiveRoute } from "@/hooks/use-active-route";
import { getShopNavData } from "@/constants/shop-constants";

export default function ShopDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const shopId = params.shopId as string;
  const [shop, setShop] = useState<any>(null);
  const [stats, setStats] = useState({
    orders: { pending: 0, total: 0 },
    products: { active: 0, total: 0 },
  });
  const { user, loading } = useAuthContext();
  const { isActive } = useActiveRoute();

  useEffect(() => {
    getShopById(shopId).then(setShop);
    // Les statistiques peuvent être chargées ici
  }, [shopId]);

  if (loading || !shop) {
    return <PageSkeleton type="dashboard" />;
  }

  // Obtenir les données de navigation
  const navData = getShopNavData(shopId);

  // Récupérer tous les items pour le header
  const allItems = [
    ...navData.overviewItems,
    ...navData.productItems,
    ...navData.orderItems,
    ...navData.paymentItems,
    ...navData.settingsItems,
  ];

  // Trouver l'item actif pour le titre du header
  const activeItem = allItems.find(item => item.url && isActive(item.url, false));
  const pageTitle = activeItem?.title || shop?.name || "Boutique";
  const pageDescription = activeItem?.description || `Tableau de bord de la boutique`;

  const ShopSidebar = (
    <SidebarContainer sidebarBgType="gradient">
      <SidebarHeader
        title={shop?.name || "Boutique"}
        subtitle="Tableau de bord"
        user={{
          username: user?.username || "Gérant",
          level: "Pro",
        }}
        sidebarBgType="gradient"
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <SidebarGroup label="Vue d'ensemble" sidebarBgType="gradient">
          {navData.overviewItems.map((item) => (
            <SidebarItem
              key={item.title}
              {...item}
              isActive={isActive(item.url, true)}
              sidebarBgType="gradient"
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Produits" sidebarBgType="gradient">
          {navData.productItems.map((item) => (
            <SidebarItem
              key={item.title}
              {...item}
              isActive={isActive(item.url, false)}
              sidebarBgType="gradient"
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Commandes" sidebarBgType="gradient">
          {navData.orderItems.map((item) => (
            <SidebarItem
              key={item.title}
              {...item}
              isActive={isActive(item.url, false)}
              sidebarBgType="gradient"
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Finances" sidebarBgType="gradient">
          {navData.paymentItems.map((item) => (
            <SidebarItem
              key={item.title}
              {...item}
              isActive={isActive(item.url, false)}
              sidebarBgType="gradient"
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Paramètres" sidebarBgType="gradient">
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
          username: user?.username || "Gérant",
          profileImage: user?.profileImage || undefined,
          status: "online",
        }}
        sidebarBgType="gradient"
      />
    </SidebarContainer>
  );

  const Header = (
    <DashboardHeader
      title={pageTitle}
      description={pageDescription}
      showSidebarTrigger={true}
      togglerComponent={false}
    />
  );

  return (
    <EnhancedDashboard sidebar={ShopSidebar} header={Header} sidebarBgType="gradient">
      {children}
    </EnhancedDashboard>
  );
}
