import { Heart, Home, PlusCircle, Settings, ShoppingCart } from "lucide-react";

interface menuType {
    id: number
    name: string
    link: string
    icon: React.ComponentType<{ className?: string }>;
}

export const menuList: menuType[] = [
    {
      id: 1,
      name: "Accueil",
      link: "/",
      icon: Home,
    },
    {
      id: 2,
      name: "Boutiques",
      link: "/shops",
      icon: ShoppingCart,
    },
    {
      id: 5,
      name: "Marché",
      link: "/marketplace",
      icon: PlusCircle,
    },
    {
      id: 3,
      name: "Tournois",
      link: "/tournaments",
      icon: Heart,
    },
    {
      id: 6,
      name: "Services",
      link: "/services",
      icon: Settings,
    },
  ];