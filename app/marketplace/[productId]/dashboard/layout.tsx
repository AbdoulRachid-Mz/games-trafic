// app/marketplace/[productId]/dashboard/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProductById } from "@/actions/products";
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
import { getProductNavData } from "@/constants/product-constants";

export default function ProductDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const productId = params.productId as string;
  const [product, setProduct] = useState<any>(null);
  const { user, loading } = useAuthContext();
  const { isActive } = useActiveRoute();

  useEffect(() => {
    getProductById(productId).then(setProduct);
  }, [productId]);

  if (loading || !product) {
    return <PageSkeleton type="dashboard" />;
  }

  // Obtenir les données de navigation
  const navData = getProductNavData(productId);

  // Récupérer tous les items pour le header
  const allItems = [
    ...navData.overviewItems,
    ...navData.editItems,
    ...navData.viewItems,
  ];

  // Trouver l'item actif pour le titre du header
  const activeItem = allItems.find(item => item.url && isActive(item.url, false));
  const pageTitle = activeItem?.title || product?.name || "Produit";
  const pageDescription = activeItem?.description || `Tableau de bord du produit`;

  const ProductSidebar = (
    <div className="flex flex-col h-full bg-gradient-to-br from-amber-900 to-orange-800 text-white">
      <SidebarHeader
        title={product?.name || "Produit"}
        subtitle="Tableau de bord"
        user={{
          username: user?.username || "Vendeur",
          level: "Product Owner",
        }}
        sidebarBgType="gradient"
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <SidebarGroup label="Analyses" sidebarBgType="gradient">
          {navData.overviewItems.map((item) => (
            <SidebarItem 
              key={item.title} 
              {...item} 
              isActive={isActive(item.url, false)}
              sidebarBgType="gradient"
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Gestion" sidebarBgType="gradient">
          {navData.editItems.map((item) => (
            <SidebarItem 
              key={item.title} 
              {...item} 
              isActive={isActive(item.url, false)}
              sidebarBgType="gradient"
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="Visualisation" sidebarBgType="gradient">
          {navData.viewItems.map((item) => (
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
          username: user?.username || "Vendeur",
          profileImage: user?.profileImage || undefined,
          status: "online",
        }}
        sidebarBgType="gradient"
      />
    </div>
  );

  const ProductHeader = (
    <DashboardHeader
      title={pageTitle}
      description={pageDescription}
      showSidebarTrigger={true}
    />
  );

  return (
    <EnhancedDashboard
      sidebar={ProductSidebar}
      header={ProductHeader}
      sidebarBgType="gradient"
      className="min-h-screen"
    >
      {children}
    </EnhancedDashboard>
  );
}