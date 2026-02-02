import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Trophy,
  DollarSign,
  Calendar,
  Target,
  Clock,
  Coins,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TournamentEditionWithRelations } from "@/database/schema";

interface EditionStatsGridProps {
  edition: TournamentEditionWithRelations;
}

export function EditionStatsGrid({ edition }: EditionStatsGridProps) {
  const registrations = edition.registrations || [];
  // Calculer les frais collectés
  const totalCollected = registrations.reduce((acc, reg) => {
    if (reg.feePaid) {
      return acc + (Number(reg.registrationFee) || 0);
    }
    return acc;
  }, 0);

  // Compter les participants check-in
  const checkedInCount = registrations.filter((reg) => reg.checkedIn).length;

  const stats = [
    {
      label: "Cashprize",
      value: `${edition.prizePool || 0} ${edition.prizeCurrency || "GTC"}`,
      icon: Trophy,
      className: "text-yellow-500 bg-yellow-500/10",
    },
    {
      label: "Participants",
      value: `${edition.currentParticipants || 0} / ${
        edition.maxParticipants || "-"
      }`,
      subValue: `${checkedInCount} check-in`,
      icon: Users,
      className: "text-blue-500 bg-blue-500/10",
    },
    {
      label: "Frais d'inscription",
      value: `${edition.entryFee || 0} ${edition.prizeCurrency || "GTC"}`,
      icon: Wallet,
      className: "text-purple-500 bg-purple-500/10",
      hidden: (edition.entryFee || 0) === 0,
    },
    {
      label: "Montant Collecté",
      value: `${totalCollected} ${edition.prizeCurrency || "GTC"}`,
      icon: Coins,
      className: "text-green-500 bg-green-500/10",
      hidden: totalCollected === 0,
    },
    {
      label: "Matchs joués",
      value: edition.completedMatchCount || 0,
      icon: Target,
      className: "text-purple-500 bg-purple-500/10",
    },
    {
      label: "Début",
      value: format(new Date(edition.startDate), "d MMM", { locale: fr }),
      icon: Calendar,
      className: "text-slate-500 bg-slate-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats
        .filter((s) => !s.hidden)
        .map((stat, i) => (
          <Card
            key={i}
            className="overflow-hidden border-none shadow-sm bg-secondary/20"
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
              <div className={`p-2 rounded-full mb-2 ${stat.className}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">
                {stat.label}
              </div>
              <div className="text-lg font-bold">{stat.value}</div>
              {stat.subValue && (
                <div className="text-xs text-muted-foreground mt-1">
                  {stat.subValue}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
