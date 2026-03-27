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
import { StatsCard } from "@/components/ui/stats-card";

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
    // {
    //   label: "Cashprize",
    //   value: `${edition.prizePool || 0} ${edition.prizeCurrency || "GTC"}`,
    //   icon: Trophy,
    //   className: "text-yellow-500 bg-yellow-500/10",
    // },
    {
      label: "Participants",
      value: `${edition.currentParticipants || edition.registrations?.length || 0} / ${edition.maxParticipants || "-"
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
    // {
    //   label: "Début",
    //   value: format(new Date(edition.startDate), "d MMM", { locale: fr }),
    //   icon: Calendar,
    //   className: "text-slate-500 bg-slate-500/10",
    // },
  ];

  return (
    <div className="flex w-full items-center justify-between gap-2 overflow-auto whitespace-nowrap">
      {stats
        .filter((s) => !s.hidden)
        .map((stat, i) => (
          <StatsCard
            key={i}
            title={stat.label}
            value={stat.value}
            // description={stat.subValue}
            iconName={stat.icon.displayName === "Users" ? "Users" : undefined}
            icon={React.createElement(stat.icon, { className: "h-5 w-5" })}
            variant="default"
            className="min-w-full md:min-w-[250px] lg:flex-1 p-1 border-secondary border-2 bg-secondary/20"
            size="sm"
            shadow="sm"
            bgType="solid"
            responsive
          />
        ))}
    </div>
  );
}
