"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Trophy, Shield, Swords, Loader2, Star, TrendingUp } from "lucide-react";
import { getEditionBestPlayersStats } from "@/actions/editions";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/user-avatar";
import { motion } from "framer-motion";

interface EditionBestParticipantsTabProps {
  editionId: string;
}

export function EditionBestParticipantsTab({
  editionId,
}: EditionBestParticipantsTabProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getEditionBestPlayersStats(editionId)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [editionId]);

  const StatItem = ({ item, value, label, icon: Icon, color, rank }: any) => {
    const member = item.registration?.member;
    const user = member?.user;
    const team = member?.team;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: rank * 0.05 }}
        className="group flex items-center justify-between p-4 rounded-2xl border bg-card/50 hover:bg-muted/50 hover:border-primary/20 transition-all duration-300"
      >
        <div className="flex items-center gap-4">
          <div className="text-lg font-black italic text-muted-foreground/30 w-6">
            {rank + 1}
          </div>
          <div className="relative">
            <UserAvatar 
              user={{
                username: user?.username || member?.displayName,
                profileImage: user?.profileImage || user?.image,
              }} 
              className="h-12 w-12 border-2 border-background shadow-md group-hover:scale-105 transition-transform"
            />
            <div className={cn("absolute -top-1 -left-1 p-1 rounded-full bg-background shadow-sm border", color)}>
              <Icon className="h-3 w-3" />
            </div>
          </div>
          <div>
            <Typography variant="body-base" weight="bold" className="line-clamp-1 group-hover:text-primary transition-colors">
              {user?.username || member?.displayName || "Anonyme"}
            </Typography>
            <div className="flex items-center gap-1.5 opacity-70">
              {team?.logo && <img src={team.logo} className="h-3.3 w-3.5 rounded-sm object-contain" alt="" />}
              <span className="text-[11px] uppercase font-bold tracking-tight">{team?.name || "Individuel"}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1.5">
            <Typography variant="h4" weight="bold" className={cn("italic", color)}>
              {value}
            </Typography>
            <Typography variant="body-base" weight="bold" theme="muted" className="uppercase tracking-widest mt-1">
              {label}
            </Typography>
          </div>
          <div className="flex gap-2 justify-end mt-1">
             <Badge variant="outline" className="text-[9px] h-4.5 px-1.5 leading-none border-dashed bg-primary/5 text-primary">
                {item.played} match(s)
             </Badge>
          </div>
        </div>
      </motion.div>
    );
  };

  const PodiumItem = ({ item, value, label, icon: Icon, color, rank }: any) => {
    const member = item.registration?.member;
    const user = member?.user;
    const team = member?.team;
    
    // Rank 0 = 1st, 1 = 2nd, 2 = 3rd
    const sizes = ["h-32 w-32", "h-24 w-24", "h-24 w-24"];
    const colors = ["from-yellow-400 to-amber-600", "from-slate-300 to-slate-500", "from-orange-400 to-orange-700"];
    const trophyColors = ["text-yellow-400", "text-slate-300", "text-orange-400"];

    return (
      <div className={cn("flex flex-col items-center gap-3", rank === 0 ? "order-2 -mt-8" : rank === 1 ? "order-1" : "order-3")}>
        <div className="relative">
          <div className={cn("rounded-full p-1 bg-gradient-to-tr shadow-2xl relative z-10", colors[rank])}>
            <UserAvatar 
              user={{
                username: user?.username || member?.displayName,
                profileImage: user?.profileImage || user?.image,
              }} 
              className={cn("border-4 border-background", sizes[rank])}
            />
          </div>
          <div className="absolute -bottom-2 -right-2 z-20 bg-background rounded-full p-1.5 shadow-lg border-2">
            <Trophy className={cn("h-5 w-5", trophyColors[rank])} />
          </div>
          <div className={cn("absolute -top-4 left-1/2 -translate-x-1/2 font-black text-4xl opacity-10 italic", trophyColors[rank])}>
            #{rank + 1}
          </div>
        </div>
        <div className="text-center">
            <Typography variant="body-base" weight="bold" className="line-clamp-1 italic uppercase tracking-tighter">
              {user?.username || member?.displayName || "Anonyme"}
            </Typography>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className={cn("text-xl font-black italic", color)}>{value}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{label}</span>
            </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <Typography variant="body-sm" theme="muted" className="animate-pulse">Calcul du Hall of Fame...</Typography>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="py-16 text-center border-2 border-dashed rounded-3xl bg-muted/10">
        <Typography variant="body-base" theme="muted">Aucune statistique disponible pour cette édition.</Typography>
      </div>
    );
  }

  return (
    <div className="space-y-12 py-6">
      <div className="text-center space-y-2">
        <Typography variant="h2" weight="bold" className="italic uppercase tracking-tighter flex items-center justify-center gap-3">
          <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
          Hall of Fame
          <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
        </Typography>
        <Typography variant="body-base" theme="muted">Les gladiateurs les plus performants de cette arène.</Typography>
      </div>

      <Tabs defaultValue="attack" className="w-full">
        <div className="flex justify-center mb-10">
          <TabsList className="bg-muted/50 p-1.5 h-14 rounded-full border border-border/50">
            <TabsTrigger value="attack" className="rounded-full px-8 gap-3 data-[state=active]:bg-background data-[state=active]:shadow-xl data-[state=active]:text-primary transition-all font-bold">
              <Swords className="h-4 w-4" />
              Attaque
            </TabsTrigger>
            <TabsTrigger value="defense" className="rounded-full px-8 gap-3 data-[state=active]:bg-background data-[state=active]:shadow-xl data-[state=active]:text-blue-500 transition-all font-bold">
              <Shield className="h-4 w-4" />
              Défense
            </TabsTrigger>
            <TabsTrigger value="winrate" className="rounded-full px-8 gap-3 data-[state=active]:bg-background data-[state=active]:shadow-xl data-[state=active]:text-emerald-500 transition-all font-bold">
              <TrendingUp className="h-4 w-4" />
              Victoires
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="attack" className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
          {/* Podium for top scorers */}
          <div className="flex flex-wrap items-end justify-center gap-8 md:gap-20 py-10 bg-gradient-to-b from-orange-500/5 to-transparent rounded-3xl border border-orange-500/10">
            {stats.topScorers.slice(0, 3).map((item: any, i: number) => (
              <PodiumItem key={i} item={item} value={item.goalsFor} label="Buts" icon={Swords} color="text-orange-500" rank={i} />
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="col-span-full mb-2">
                <Typography variant="body-sm" weight="bold" theme="muted" className="uppercase tracking-[0.2em] px-2">Classement complet (Buts)</Typography>
             </div>
             {stats.topScorers.map((item: any, i: number) => (
                <StatItem key={i} item={item} value={item.goalsFor} label="Buts" icon={Swords} color="text-orange-500" rank={i} />
             ))}
          </div>
        </TabsContent>

        <TabsContent value="defense" className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
          <div className="flex flex-wrap items-end justify-center gap-8 md:gap-20 py-10 bg-gradient-to-b from-blue-500/5 to-transparent rounded-3xl border border-blue-500/10">
            {stats.bestDefense.slice(0, 3).map((item: any, i: number) => (
              <PodiumItem key={i} item={item} value={item.goalsAgainst} label="Encaissés" icon={Shield} color="text-blue-500" rank={i} />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="col-span-full mb-2">
                <Typography variant="body-sm" weight="bold" theme="muted" className="uppercase tracking-[0.2em] px-2">Remparts d'acier (Buts encaissés)</Typography>
             </div>
             {stats.bestDefense.map((item: any, i: number) => (
                <StatItem key={i} item={item} value={item.goalsAgainst} label="Encaissés" icon={Shield} color="text-blue-500" rank={i} />
             ))}
          </div>
        </TabsContent>

        <TabsContent value="winrate" className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
          <div className="flex flex-wrap items-end justify-center gap-8 md:gap-20 py-10 bg-gradient-to-b from-emerald-500/5 to-transparent rounded-3xl border border-emerald-500/10">
            {stats.mostWins.slice(0, 3).map((item: any, i: number) => (
              <PodiumItem key={i} item={item} value={item.wins} label="Victoires" icon={Trophy} color="text-emerald-500" rank={i} />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="col-span-full mb-2">
                <Typography variant="body-sm" weight="bold" theme="muted" className="uppercase tracking-[0.2em] px-2">Collectionneurs de victoires</Typography>
             </div>
             {stats.mostWins.map((item: any, i: number) => (
                <StatItem key={i} item={item} value={item.wins} label="Victoires" icon={Trophy} color="text-emerald-500" rank={i} />
             ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
