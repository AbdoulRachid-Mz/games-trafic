"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Plus, Store, Trophy, CreditCard, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      icon: Store,
      label: "Créer une Boutique",
      description: "Ouvrez votre boutique",
      onClick: () => router.push("/shops/create"),
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Trophy,
      label: "Rejoindre un Tournoi",
      description: "Participez aux compétitions",
      onClick: () => router.push("/tournaments"),
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: CreditCard,
      label: "Recharger",
      description: "Ajoutez des fonds",
      onClick: () => router.push("/wallet/transactions/create?type=deposite"),
      color: "from-green-500 to-emerald-500",
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card
              className="cursor-pointer border-2 hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 overflow-hidden group"
              onClick={action.onClick}
            >
              <CardContent className="p-6 relative">
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
