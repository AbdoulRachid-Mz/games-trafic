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

export const shopCustomerItems = [
  {
    title: "Clients",
    url: "/shops/[shopId]/dashboard/customers",
    icon: Users,
    description: "Gérer les clients",
  },
  {
    title: "Avis",
    url: "/shops/[shopId]/dashboard/reviews",
    icon: Star,
    description: "Gérer les avis clients",
  },
];

export const shopAnalyticsItems = [
  {
    title: "Analytiques",
    url: "/shops/[shopId]/dashboard/analytics",
    icon: BarChart3,
    description: "Analyses et statistiques",
  },
];

export const shopMarketingItems = [
  {
    title: "Marketing",
    url: "/shops/[shopId]/dashboard/marketing",
    icon: CreditCard,
    description: "Outils marketing",
  },
  {
    title: "Promotions",
    url: "/shops/[shopId]/dashboard/promotions",
    icon: TrendingUp,
    description: "Gérer les promotions",
  },
  {
    title: "Newsletter",
    url: "/shops/[shopId]/dashboard/newsletter",
    icon: MessageSquare,
    description: "Gérer les newsletters",
  },
];

export const shopAppearanceItems = [
  {
    title: "Apparence",
    url: "/shops/[shopId]/dashboard/appearance",
    icon: Palette,
    description: "Personnaliser l'apparence",
  },
  {
    title: "Thèmes",
    url: "/shops/[shopId]/dashboard/themes",
    icon: Palette,
    description: "Gérer les thèmes",
  },
];

export const shopPaymentItems = [
  {
    title: "Paiements",
    url: "/shops/[shopId]/dashboard/payments",
    icon: Wallet,
    description: "Gérer les paiements",
  },
  {
    title: "Portefeuille",
    url: "/shops/[shopId]/dashboard/wallet",
    icon: CreditCard,
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
  customerItems: shopCustomerItems.map(item => ({
    ...item,
    url: item.url.replace("[shopId]", shopId),
  })),
  analyticsItems: shopAnalyticsItems.map(item => ({
    ...item,
    url: item.url.replace("[shopId]", shopId),
  })),
  marketingItems: shopMarketingItems.map(item => ({
    ...item,
    url: item.url.replace("[shopId]", shopId),
  })),
  appearanceItems: shopAppearanceItems.map(item => ({
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