// hooks/use-fab-actions.ts
import { FABAction } from "@/components/layout/FloatingActionButton";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/contexts/auth-context";
import { 
  Store, 
  Trophy, 
  Wallet, 
  ShoppingBag,
  Package,
  Palette,
  MessageSquare,
  UserPlus,
  Gamepad2
} from "lucide-react";

export function useFabActions() {
  const pathname = usePathname();
  const { isAuthenticated, isAdmin } = useAuthContext();

  // Actions par défaut (pour les routes sans config spécifique)
  const defaultActions: FABAction[] = [
    {
      id: "create-shop",
      label: "Créer boutique",
      icon: <Store className="h-5 w-5" />,
      type: "link",
      url: "/shops/create",
      requiresAuth: true,
    },
    {
      id: "create-tournament",
      label: "Créer tournoi",
      icon: <Trophy className="h-5 w-5" />,
      type: "link",
      url: "/tournaments/create",
      requiresAuth: true,
    },
    {
      id: "new-wallet",
      label: "Nouveau portefeuille",
      icon: <Wallet className="h-5 w-5" />,
      type: "link",
      url: "/wallet/create",
      requiresAuth: true,
    },
  ];

  // Actions spécifiques par route
  const routeSpecificActions: Record<string, FABAction[]> = {
    "/shops": [
      {
        id: "create-shop",
        label: "Créer boutique",
        icon: <Store className="h-5 w-5" />,
        type: "link",
        url: "/shops/create",
        requiresAuth: true,
      },
      {
        id: "browse-shops",
        label: "Explorer",
        icon: <ShoppingBag className="h-5 w-5" />,
        type: "link",
        url: "/marketplace",
      },
    ],
    "/tournaments": [
      {
        id: "create-tournament",
        label: "Créer tournoi",
        icon: <Trophy className="h-5 w-5" />,
        type: "link",
        url: "/tournaments/create",
        requiresAuth: true,
      },
      {
        id: "join-tournament",
        label: "Rejoindre",
        icon: <Gamepad2 className="h-5 w-5" />,
        type: "link",
        url: "/tournaments?filter=upcoming",
      },
    ],
    "/products": [
      {
        id: "sell-product",
        label: "Vendre produit",
        icon: <Package className="h-5 w-5" />,
        type: "link",
        url: "/products/create",
        requiresAuth: true,
      },
      {
        id: "browse-products",
        label: "Acheter",
        icon: <ShoppingBag className="h-5 w-5" />,
        type: "link",
        url: "/marketplace?type=products",
      },
    ],
    "/themes": [
      {
        id: "create-theme",
        label: "Créer thème",
        icon: <Palette className="h-5 w-5" />,
        type: "link",
        url: "/themes/create",
        requiresAuth: true,
      },
      {
        id: "browse-themes",
        label: "Parcourir",
        icon: <ShoppingBag className="h-5 w-5" />,
        type: "link",
        url: "/marketplace?type=themes",
      },
    ],
    "/profile": [
      {
        id: "edit-profile",
        label: "Modifier profil",
        icon: <UserPlus className="h-5 w-5" />,
        type: "link",
        url: "/profile/edit",
        requiresAuth: true,
      },
      {
        id: "messages",
        label: "Messages",
        icon: <MessageSquare className="h-5 w-5" />,
        type: "link",
        url: "/messages",
        requiresAuth: true,
      },
      {
        id: "wallet",
        label: "Portefeuille",
        icon: <Wallet className="h-5 w-5" />,
        type: "link",
        url: "/wallet",
        requiresAuth: true,
      },
    ],
  };

  // Trouver les actions pour la route actuelle
  const getActionsForRoute = (): FABAction[] => {
    // Chercher une correspondance exacte d'abord
    for (const [route, actions] of Object.entries(routeSpecificActions)) {
      if (pathname === route || pathname.startsWith(route + "/")) {
        return actions;
      }
    }

    // Retourner les actions par défaut
    return defaultActions;
  };

  // Filtrer les actions selon les permissions
  const filterActionsByPermissions = (actions: FABAction[]): FABAction[] => {
    return actions.filter(action => {
      if (action.requiresAuth && !isAuthenticated) return false;
      if (action.requiresAdmin && !isAdmin) return false;
      return true;
    });
  };

  const actions = getActionsForRoute();
  const filteredActions = filterActionsByPermissions(actions);

  return {
    actions: filteredActions,
    hasActions: filteredActions.length > 0,
    defaultActions: filterActionsByPermissions(defaultActions),
  };
}