type Input = {
  name?: string;
  description?: string;
  game?: string;
  platform?: string | null;
  profileImage?: string;
  coverImage?: string;
  maxParticipants?: number;
  cashprize?: number;
  competitionType?: string;
  competitionMode?: string;
  entryFee?: number;
};

export function getTournamentPreviewData(input: Input) {
  const name = (input.name || "").trim();
  const description = (input.description || "").trim();
  const game = (input.game || "").trim();
  const platform = (input.platform || "") || "";
  const profileImage = input.profileImage || "";
  const coverImage = input.coverImage || "";
  const maxParticipants = input.maxParticipants || 0;
  const cashprize = input.cashprize || 0;
  const competitionType = input.competitionType || "LDC";
  const competitionMode = input.competitionMode || "AUTO";
  const entryFee = input.entryFee || 0;

  const badges: Array<{ label: string; variant?: "default" | "secondary" | "outline" | "destructive" }> = [];
  if (game) badges.push({ label: game, variant: "secondary" });
  if (platform) badges.push({ label: platform, variant: "outline" });
  if (maxParticipants > 0) badges.push({ label: `${maxParticipants} joueurs`, variant: "default" });
  if (cashprize > 0) badges.push({ label: `Cashprize: ${cashprize} GTC`, variant: "default" });
  if (entryFee > 0) badges.push({ label: `Entrée: ${entryFee} GTC`, variant: "outline" });
  if (competitionType) badges.push({ label: competitionType, variant: "secondary" });
  if (competitionMode === "MANUAL") badges.push({ label: "Mode Manuel", variant: "destructive" });

  return {
    title: name || "Nouveau tournoi",
    description,
    badges,
    profileImage,
    coverImage,
  };
}

