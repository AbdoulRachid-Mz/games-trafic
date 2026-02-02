// constants/product-constants.ts
import {
  BarChart2,
  Settings,
  ShoppingBag,
  Package,
} from "lucide-react";

export const productOverviewItems = [
  {
    title: "Vue d'ensemble",
    url: "/marketplace/[productId]/dashboard",
    icon: BarChart2,
    description: "Statistiques du produit",
  },
];

export const productEditItems = [
  {
    title: "Modifier",
    url: "/marketplace/[productId]/dashboard/edit",
    icon: Settings,
    description: "Modifier le produit",
  },
];

export const productViewItems = [
  {
    title: "Voir la page",
    url: "/marketplace/[productId]",
    icon: ShoppingBag,
    description: "Voir le produit en ligne",
  },
];

// Pour le layout complet
export const getProductNavData = (productId: string) => ({
  overviewItems: productOverviewItems.map(item => ({
    ...item,
    url: item.url.replace("[productId]", productId),
  })),
  editItems: productEditItems.map(item => ({
    ...item,
    url: item.url.replace("[productId]", productId),
  })),
  viewItems: productViewItems.map(item => ({
    ...item,
    url: item.url.replace("[productId]", productId),
  })),
});