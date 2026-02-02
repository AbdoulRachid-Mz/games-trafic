"use client";

import React from "react";
import { motion } from "framer-motion";
import { Trophy, ShoppingBag, Users, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ActivityFeedSection() {
  const activities = [
    {
      user: { name: "AlexPro", image: "/avatars/1.jpg", fallback: "AP" },
      action: "a remporté le tournoi Solo Mid",
      target: "League of Legends",
      time: "Il y a 2 min",
      type: "TOURNAMENT",
      icon: <Trophy className="w-3.5 h-3.5" />,
      color: "bg-yellow-500/10 text-yellow-500",
    },
    {
      user: { name: "GameStore", image: "/avatars/2.jpg", fallback: "GS" },
      action: "a ajouté 15 nouveaux items",
      target: "Fortnite Skins",
      time: "Il y a 15 min",
      type: "MARKET",
      icon: <ShoppingBag className="w-3.5 h-3.5" />,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      user: { name: "TeamRocket", image: "/avatars/3.jpg", fallback: "TR" },
      action: "a rejoint le groupe",
      target: "Pro Gamers FR",
      time: "Il y a 32 min",
      type: "SOCIAL",
      icon: <Users className="w-3.5 h-3.5" />,
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      user: { name: "MarcGamer", image: "/avatars/4.jpg", fallback: "MG" },
      action: "a mis en vente son compte",
      target: "Valorant Ascendant 3",
      time: "Il y a 1h",
      type: "MARKET",
      icon: <ShoppingBag className="w-3.5 h-3.5" />,
      color: "bg-blue-500/10 text-blue-500",
    },
  ];

  return (
    <section className="py-24 bg-card/30 border-y border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
          <div className="max-w-2xl">
            <Badge
              variant="outline"
              className="mb-4 text-primary border-primary/20 bg-primary/5"
            >
              ACTIVITÉ EN DIRECT
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              L'énergie de la{" "}
              <span className="text-primary italic">Communauté</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Mise à jour en temps réel
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex items-center justify-between p-4 rounded-2xl bg-background/50 border border-border/50 hover:border-primary/20 transition-all group"
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={activity.user.image} />
                  <AvatarFallback className="bg-secondary text-[10px] font-bold">
                    {activity.user.fallback}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                  <p className="text-sm font-bold">
                    {activity.user.name}{" "}
                    <span className="font-medium text-muted-foreground">
                      {activity.action}
                    </span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-bold px-1.5 py-0 h-4 ${activity.color}`}
                    >
                      {activity.icon}
                      <span className="ml-1 uppercase tracking-tighter">
                        {activity.type}
                      </span>
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {activity.time}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-none mb-1">
                    Cible
                  </p>
                  <p className="text-xs font-bold text-primary">
                    {activity.target}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground font-medium italic">
            Rejoignez +25,000 membres actifs et marquez l'histoire du gaming.
          </p>
        </div>
      </div>
    </section>
  );
}
