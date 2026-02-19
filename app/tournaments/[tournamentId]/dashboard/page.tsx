"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Users, Eye, Heart, Calendar } from "lucide-react";
import { getTournamentById } from "@/actions/tournaments";
import { AdvancedChart } from "@/components/ui/advanced-chart";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";


export default function TournamentOverviewPage() {
  const params = useParams();
  const [timeRange, setTimeRange] = useState("7j");
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<any>(null);

  useEffect(() => {
    load();
  }, [timeRange, params.tournamentId]);

  const load = async () => {
    setLoading(true);
    const t = await getTournamentById(params.tournamentId as string);
    setTournament(t);
    setLoading(false);
  };

  const StatCard = ({ title, value, icon: Icon, color = "blue" }: any) => {
    const colorClasses: Record<string, string> = {
      blue: "text-blue-500 bg-blue-500/10",
      purple: "text-purple-500 bg-purple-500/10",
      yellow: "text-amber-500 bg-amber-500/10",
      green: "text-emerald-500 bg-emerald-500/10",
    };
    const activeColor = colorClasses[color] || colorClasses.blue;

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={cn("p-3 rounded-lg", activeColor.split(" ")[1])}>
              <Icon className={cn("h-6 w-6", activeColor.split(" ")[0])} />
            </div>
          </div>
          <Typography variant="h3" weight="bold" className="mb-1">
            {typeof value === "number" ? value.toLocaleString() : value}
          </Typography>
          <Typography variant="body-sm" theme="muted">
            {title}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  if (loading || !tournament) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Typography variant="h2" weight="bold">Tableau de bord</Typography>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Période" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24h</SelectItem>
              <SelectItem value="7j">7 jours</SelectItem>
              <SelectItem value="30j">30 jours</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card><CardContent className="p-6 h-32" /></Card>
          <Card><CardContent className="p-6 h-32" /></Card>
          <Card><CardContent className="p-6 h-32" /></Card>
          <Card><CardContent className="p-6 h-32" /></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Typography variant="h2" weight="bold" className="mb-1">Tableau de bord</Typography>
          <Typography variant="body-base" theme="muted">Statistiques générales du tournoi</Typography>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/tournaments/${params.tournamentId}/dashboard/settings`}>
            <Button variant="outline">Compléter les infos</Button>
          </Link>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Période" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24h</SelectItem>
              <SelectItem value="7j">7 jours</SelectItem>
              <SelectItem value="30j">30 jours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Éditions" value={tournament.totalEditions ?? 0} icon={Calendar} color="blue" />
        <StatCard title="Participants" value={tournament.totalParticipants ?? 0} icon={Users} color="purple" />
        <StatCard title="Cashprize total" value={`${Number(tournament.totalPrizePool || 0)} GTC`} icon={Trophy} color="yellow" />
        <StatCard title="Vues" value={tournament.viewCount ?? 0} icon={Eye} color="green" />
      </div>
      <AdvancedChart
        data={[
          { name: "Statistiques", Éditions: Number(tournament.totalEditions || 0), Participants: Number(tournament.totalParticipants || 0), Vues: Number(tournament.viewCount || 0), Suiveurs: Number(tournament.followerCount || 0) },
        ]}
        kind="bar"
        series={[
          { key: (r: any) => r["Éditions"], label: "Éditions", color: "hsl(var(--primary))" },
          { key: (r: any) => r["Participants"], label: "Participants", color: "hsl(var(--secondary))" },
          { key: (r: any) => r["Vues"], label: "Vues", color: "#60a5fa" },
          { key: (r: any) => r["Suiveurs"], label: "Suiveurs", color: "#f59e0b" },
        ]}
        title="Vue globale"
        description="Aperçu des principaux indicateurs du tournoi"
        showLegend
        showTooltip
        height={280}
      />
      <Card className="p-3">
        <CardContent className="p-2">
          <div className="flex items-center justify-between mb-4">
            <Typography variant="h3" weight="bold">Engagement</Typography>
            <Badge variant="secondary">{tournament.followerCount ?? 0} suiveurs</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-primary" />
                <Typography variant="body-sm">Suiveurs</Typography>
              </div>
              <Typography variant="h3" weight="bold" className="mt-2">{tournament.followerCount ?? 0}</Typography>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-primary" />
                <Typography variant="body-sm">Vues</Typography>
              </div>
              <Typography variant="h3" weight="bold" className="mt-2">{tournament.viewCount ?? 0}</Typography>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
