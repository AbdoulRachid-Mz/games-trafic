"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import {
  Store,
  Trophy,
  CreditCard,
  Settings,
  Wallet,
  ShoppingCart,
  MessageCircle,
  ShoppingBag,
} from "lucide-react";
import { useRouter } from "next/navigation";

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      icon: Wallet,
      label: "Mon Wallet",
      description: "Voir mon solde et mes mouvements",
      onClick: () => router.push("/wallet"),
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: CreditCard,
      label: "Recharger",
      description: "Ajoutez des fonds",
      onClick: () => router.push("/wallet/transactions/create?type=DEPOSIT"),
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: ShoppingCart,
      label: "Mes commandes",
      description: "Suivre mes achats",
      onClick: () => router.push("/dashboard/orders"),
      color: "from-blue-500 to-indigo-500",
    },
    {
      icon: MessageCircle,
      label: "Mes messages",
      description: "Reprendre une discussion",
      onClick: () => router.push("/chats"),
      color: "from-sky-500 to-cyan-500",
    },
    {
      icon: Store,
      label: "Créer une boutique",
      description: "Ouvrez votre boutique",
      onClick: () => router.push("/shops/create"),
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: ShoppingBag,
      label: "Mes produits",
      description: "Gérer mes annonces",
      onClick: () => router.push("/dashboard/products"),
      color: "from-amber-500 to-orange-500",
    },
    {
      icon: Trophy,
      label: "Rejoindre un tournoi",
      description: "Participez aux compétitions",
      onClick: () => router.push("/tournaments"),
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Settings,
      label: "Paramètres",
      description: "Gérez votre compte",
      onClick: () => router.push("/profile/settings"),
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="space-y-4">
      <Typography variant="h4" weight="semibold">
        Actions Rapides
      </Typography>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Card
              className="cursor-pointer border-2 py-0 hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 overflow-hidden group"
              onClick={action.onClick}
            >
              <CardContent className="p-2 relative">
                {/* Gradient Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                />

                {/* Content */}
                <div className="relative space-y-3">
                  <div className="p-3 rounded-lg bg-primary/10 w-fit">
                    <action.icon className="h-6 w-6 text-primary" />
                  </div>

                  <div>
                    <Typography
                      variant="body-base"
                      weight="semibold"
                      className="mb-1"
                    >
                      {action.label}
                    </Typography>
                    <Typography variant="caption2" theme="muted">
                      {action.description}
                    </Typography>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
