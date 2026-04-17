// constants/shop-constants.ts
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Star,
  BarChart3,
  CreditCard,
  Palette,
  Wallet,
  Settings,
  TrendingUp,
  MessageSquare,
  Globe,
} from "lucide-react";

export const shopOverviewItems = [
  {
    title: "Tableau de bord",
    url: "/shops/[shopId]/dashboard",
    icon: LayoutDashboard,
    description: "Vue d'ensemble de la boutique",
  },
];

export const shopProductItems = [
  {
    title: "Produits",
    url: "/shops/[shopId]/dashboard/products",
    icon: Package,
    description: "Gérer les produits",
  },
];

export const shopOrderItems = [
  {
    title: "Commandes",
    url: "/shops/[shopId]/dashboard/orders",
    icon: ShoppingBag,
    description: "Gérer les commandes",
  },
];

export const shopPaymentItems = [
  {
    title: "Portefeuille",
    url: "/shops/[shopId]/dashboard/wallet",
    icon: Wallet,
    description: "Gérer vos revenus et retraits",
  },
];

export const shopSettingsItems = [
  {
    title: "Paramètres",
    url: "/shops/[shopId]/dashboard/settings",
    icon: Settings,
    description: "Configuration de la boutique",
  },
];

// Pour le layout complet
export const getShopNavData = (shopId: string) => ({
  overviewItems: shopOverviewItems.map(item => ({
    ...item,
    url: item.url.replace("[shopId]", shopId),
  })),
  productItems: shopProductItems.map(item => ({
    ...item,
    url: item.url.replace("[shopId]", shopId),
  })),
  orderItems: shopOrderItems.map(item => ({
    ...item,
    url: item.url.replace("[shopId]", shopId),
  })),
  paymentItems: shopPaymentItems.map(item => ({
    ...item,
    url: item.url.replace("[shopId]", shopId),
  })),
  settingsItems: shopSettingsItems.map(item => ({
    ...item,
    url: item.url.replace("[shopId]", shopId),
  })),
});