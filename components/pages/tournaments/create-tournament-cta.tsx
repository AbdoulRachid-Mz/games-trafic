"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { PlusCircle, Sparkles, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function CreateTournamentCTA() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 border-primary/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Trophy className="w-64 h-64 rotate-12" />
        </div>
        
        <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-2 text-primary font-medium">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span>Organisateur de tournoi</span>
            </div>
            
            <Typography variant="h2" className="font-bold">
              Créez votre propre légende
            </Typography>
            
            <Typography variant="body-sm" className="text-muted-foreground">
              Lancez votre compétition en quelques clics. Gérez les inscriptions, l'arbre de tournoi 
              et les récompenses automatiquement grâce à notre assistant intelligent.
            </Typography>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 px-3 py-1 rounded-full border border-border/50">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span>Cashprize automatisé</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 px-3 py-1 rounded-full border border-border/50">
                <Users className="h-4 w-4 text-blue-500" />
                <span>Jusqu'à 1024 joueurs</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Button size="lg" className="w-full md:w-auto shadow-lg shadow-primary/20 group" asChild>
              <Link href="/tournaments/create">
                <PlusCircle className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
                Créer un tournoi
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full md:w-auto bg-background/50 backdrop-blur-sm">
              Comment ça marche ?
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
