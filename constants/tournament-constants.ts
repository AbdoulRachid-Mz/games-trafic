// constants/tournament-constants.ts
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  Swords,
} from "lucide-react";

export const tournamentOverviewItems = [
  {
    title: "Vue d'ensemble",
    url: "/tournaments/[tournamentId]/dashboard",
    icon: LayoutDashboard,
    description: "Statistiques et vue globale",
  },
];

export const tournamentEditionItems = [
  {
    title: "Éditions",
    url: "/tournaments/[tournamentId]/dashboard/editions",
    icon: Calendar,
    description: "Gérer les éditions du tournoi",
  },
  // {
  //   title: "Créer une édition",
  //   url: "/tournaments/[tournamentId]/dashboard/editions/create",
  //   icon: Calendar,
  //   description: "Créer une nouvelle édition",
  // },
];

export const tournamentMemberItems = [
  {
    title: "Membres & Staff",
    url: "/tournaments/[tournamentId]/dashboard/members",
    icon: Users,
    description: "Gérer les membres et le staff",
  },
];

export const tournamentMatchItems = [
  {
    title: "Matchs",
    url: "/tournaments/[tournamentId]/dashboard/matches",
    icon: Swords,
    description: "Gérer les matchs du tournoi",
  },
];

export const tournamentSettingsItems = [
  {
    title: "Paramètres",
    url: "/tournaments/[tournamentId]/dashboard/settings",
    icon: Settings,
    description: "Configurer le tournoi",
  },
];

// Pour le layout complet
export const getTournamentNavData = (tournamentId: string) => ({
  overviewItems: tournamentOverviewItems.map(item => ({
    ...item,
    url: item.url.replace("[tournamentId]", tournamentId),
  })),
  editionItems: tournamentEditionItems.map(item => ({
    ...item,
    url: item.url.replace("[tournamentId]", tournamentId),
  })),
  memberItems: tournamentMemberItems.map(item => ({
    ...item,
    url: item.url.replace("[tournamentId]", tournamentId),
  })),
  matchItems: tournamentMatchItems.map(item => ({
    ...item,
    url: item.url.replace("[tournamentId]", tournamentId),
  })),
  settingsItems: tournamentSettingsItems.map(item => ({
    ...item,
    url: item.url.replace("[tournamentId]", tournamentId),
  })),
});