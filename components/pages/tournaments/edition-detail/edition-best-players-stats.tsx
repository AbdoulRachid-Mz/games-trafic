"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { UserAvatar } from "@/components/shared/user-avatar";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Trophy, Shield, Swords, Loader2, Star } from "lucide-react";
import { getEditionBestPlayersStats } from "@/actions/editions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";

interface EditionBestPlayersStatsProps {
  editionId: string;
  trigger?: React.ReactNode;
}

export function EditionBestPlayersStats({
  editionId,
  trigger,
}: EditionBestPlayersStatsProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && !stats) {
      setLoading(true);
      getEditionBestPlayersStats(editionId)
        .then(setStats)
        .finally(() => setLoading(false));
    }
  }, [open, editionId, stats]);

  const StatItem = ({ item, value, label, icon: Icon, color }: any) => {
    const member = item.registration?.member;
    const user = member?.user;
    const team = member?.team;

    return (
      <div className="flex items-center justify-between p-3 rounded-xl border bg-card/50 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="relative">
            <UserAvatar 
              user={{
                username: user?.username || member?.displayName,
                profileImage: user?.profileImage || user?.image,
              }} 
              className="h-10 w-10 border-2 border-background shadow-sm"
            />
            <div className={cn("absolute -top-1 -left-1 p-1 rounded-full bg-background shadow-sm", color)}>
              <Icon className="h-2.5 w-2.5" />
            </div>
          </div>
          <div>
            <Typography variant="body-sm" weight="bold" className="line-clamp-1">
              {user?.username || member?.displayName || "Anonyme"}
            </Typography>
            <div className="flex items-center gap-1.5 opacity-70">
              {team?.logo && <img src={team.logo} className="h-3 w-3 rounded-sm object-contain" alt="" />}
              <span className="text-[10px] uppercase font-medium tracking-wider">{team?.name || "Individuel"}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Typography variant="h5" weight="bold" className={color}>
              {value}
            </Typography>
            <Typography variant="body-base" weight="medium" theme="muted" className="mt-1">
              {label}
            </Typography>
          </div>
          <div className="flex gap-1 justify-end mt-0.5">
             <Badge variant="outline" className="text-[8px] h-4 px-1 leading-none border-dashed">
                {item.played} match(s)
             </Badge>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            Meilleurs Joueurs
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-primary p-6 text-primary-foreground relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
             <Trophy className="h-32 w-32 rotate-12" />
          </div>
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2">
              Hall of Fame
              <Trophy className="h-6 w-6 text-yellow-400" />
            </DialogTitle>
            <Typography variant="body-sm" className="text-primary-foreground/70">
              Les performances exceptionnelles de cette édition.
            </Typography>
          </DialogHeader>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
              <Typography variant="body-sm" theme="muted">Analyse des performances...</Typography>
            </div>
          ) : stats ? (
            <Tabs defaultValue="attack" className="w-full">
              <TabsList className="grid grid-cols-3 mb-6 bg-muted/30 p-1 h-11 rounded-full">
                <TabsTrigger value="attack" className="rounded-full gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Swords className="h-3.5 w-3.5" />
                  Attaque
                </TabsTrigger>
                <TabsTrigger value="defense" className="rounded-full gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Shield className="h-3.5 w-3.5" />
                  Défense
                </TabsTrigger>
                <TabsTrigger value="winrate" className="rounded-full gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Trophy className="h-3.5 w-3.5" />
                  Victoires
                </TabsTrigger>
              </TabsList>

              <TabsContent value="attack" className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                <Typography variant="body-base" theme="muted" className="px-1 font-bold uppercase tracking-widest mb-2">
                  Top Buteurs (Buts marqués)
                </Typography>
                {stats.topScorers.map((item: any, i: number) => (
                  <StatItem 
                    key={i} 
                    item={item} 
                    value={item.goalsFor} 
                    label="Buts" 
                    icon={Swords} 
                    color="text-orange-500" 
                  />
                ))}
              </TabsContent>

              <TabsContent value="defense" className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                <Typography variant="body-base" theme="muted" className="px-1 font-bold uppercase tracking-widest mb-2">
                  Mur de Fer (Buts encaissés - min. 2 MJ)
                </Typography>
                {stats.bestDefense.map((item: any, i: number) => (
                  <StatItem 
                    key={i} 
                    item={item} 
                    value={item.goalsAgainst} 
                    label="Buts" 
                    icon={Shield} 
                    color="text-blue-500" 
                  />
                ))}
              </TabsContent>

              <TabsContent value="winrate" className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                <Typography variant="body-base" theme="muted" className="px-1 font-bold uppercase tracking-widest mb-2">
                  Plus victorieux
                </Typography>
                {stats.mostWins.map((item: any, i: number) => (
                  <StatItem 
                    key={i} 
                    item={item} 
                    value={item.wins} 
                    label="Wins" 
                    icon={Trophy} 
                    color="text-emerald-500" 
                  />
                ))}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="py-12 text-center text-muted-foreground border border-dashed rounded-xl">
              Aucune donnée statistique disponible pour le moment.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
