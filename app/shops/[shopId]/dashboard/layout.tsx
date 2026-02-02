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
    ...navData.customerItems,
    ...navData.analyticsItems,
    ...navData.marketingItems,
    ...navData.appearanceItems,
    ...navData.paymentItems,
    ...navData.settingsItems,
  ];

  // Trouver l'item actif pour le titre du header
  const activeItem = allItems.find(item => item.url && isActive(item.url, false));
  const pageTitle = activeItem?.title || shop?.name || "Boutique";
  const pageDescription = activeItem?.description || `Tableau de bord de la boutique`;

  const ShopSidebar = (
    <div className="flex flex-col h-full bg-gradient-to-br from-emerald-900 to-teal-800 text-white">
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
        <SidebarGroup label="Général" sidebarBgType="gradient">
          {navData.overviewItems.map((item) => (
            <SidebarItem 
              key={item.title} 
              {...item} 
              isActive={isActive(item.url, false)}
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

        <SidebarGroup label="Ventes" sidebarBgType="gradient">
          {navData.orderItems.map((item) => (
            <SidebarItem 
              key={item.title} 
              {...item} 
              isActive={isActive(item.url, false)}
              sidebarBgType="gradient"
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Clients" sidebarBgType="gradient">
          {navData.customerItems.map((item) => (
            <SidebarItem 
              key={item.title} 
              {...item} 
              isActive={isActive(item.url, false)}
              sidebarBgType="gradient"
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Analyses" sidebarBgType="gradient">
          {navData.analyticsItems.map((item) => (
            <SidebarItem 
              key={item.title} 
              {...item} 
              isActive={isActive(item.url, false)}
              sidebarBgType="gradient"
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Marketing" sidebarBgType="gradient">
          {navData.marketingItems.map((item) => (
            <SidebarItem 
              key={item.title} 
              {...item} 
              isActive={isActive(item.url, false)}
              sidebarBgType="gradient"
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Apparence" sidebarBgType="gradient">
          {navData.appearanceItems.map((item) => (
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
          username: user?.username || "Gérant",
          profileImage: user?.profileImage || undefined,
          status: "online",
        }}
        sidebarBgType="gradient"
      />
    </div>
  );

  const ShopHeader = (
    <DashboardHeader
      title={pageTitle}
      description={pageDescription}
      showSidebarTrigger={true}
    />
  );

  return (
    <EnhancedDashboard
      sidebar={ShopSidebar}
      header={ShopHeader}
      sidebarBgType="gradient"
      className="min-h-screen"
    >
      {children}
    </EnhancedDashboard>
  );
}