import { platformEnum } from "@/database/schema";

type Platform = (typeof platformEnum.enumValues)[number] | "" | null | undefined;

type Input = {
  name?: string;
  game?: string;
  platform?: Platform;
  maxParticipants?: number;
  startDate?: string;
  cashprize?: number;
};

export function generateTournamentDescription(input: Input): string {
  const name = (input.name || "").trim();
  const game = (input.game || "").trim();
  const platform = input.platform || "";
  const maxP = input.maxParticipants || 0;
  const prize = input.cashprize || 0;

  const dateStr = (() => {
    if (!input.startDate) return "";
    const d = new Date(input.startDate);
    if (isNaN(d.getTime())) return "";
    const day = d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    return `${day} à ${time}`;
  })();

  const parts: string[] = [];

  if (name) parts.push(`${name}`);
  if (game && platform) {
    parts.push(`Tournoi compétitif sur ${game} (${platform})`);
  } else if (game) {
    parts.push(`Tournoi compétitif sur ${game}`);
  } else {
    parts.push(`Tournoi compétitif`);
  }

  if (maxP > 0) parts.push(`jusqu'à ${maxP} participants`);
  if (prize > 0) parts.push(`cashprize total de ${prize} GTC`);
  if (dateStr) parts.push(`début ${dateStr}`);

  const mainLine = parts.join(" • ");

  const extras: string[] = [];
  extras.push("Formats équilibrés, fair-play et bonne ambiance");
  extras.push("Inscription simple, notifications en temps réel");
  extras.push("Rejoignez la communauté et mesurez-vous aux meilleurs");

  return [mainLine, ...extras].join(". ");
}

