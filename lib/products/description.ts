import type { Product } from "@/database/schema";

type Platform = Product["platform"] | "" | null | undefined;

type Input = {
  name?: string;
  game?: string;
  platform?: Platform;
  price?: number | string;
  currency?: string;
  accountLevel?: string | null;
  accountRank?: string | null;
  categories?: string[] | null;
};

export function generateProductDescription(input: Input): string {
  const name = (input.name || "").trim();
  const game = (input.game || "").trim();
  const platform = (input.platform || "").toString().trim();
  const level = (input.accountLevel || "").toString().trim();
  const rank = (input.accountRank || "").toString().trim();
  const categories = (input.categories || []).map((c) => c.trim()).filter(Boolean);

  const priceNum =
    typeof input.price === "number"
      ? input.price
      : Number.parseFloat(String(input.price ?? "").replace(",", "."));
  const currency = (input.currency || "GTC").trim() || "GTC";

  const parts: string[] = [];
  if (name) parts.push(name);

  if (game && platform) parts.push(`Compte/produit ${game} sur ${platform}`);
  else if (game) parts.push(`Compte/produit ${game}`);
  else parts.push("Produit gaming prêt à l'emploi");

  if (Number.isFinite(priceNum) && priceNum > 0) {
    parts.push(`proposé à ${priceNum} ${currency}`);
  }

  const details: string[] = [];
  if (level) details.push(`niveau ${level}`);
  if (rank) details.push(`rang ${rank}`);
  if (categories.length > 0) details.push(categories.slice(0, 3).join(", "));
  if (details.length > 0) parts.push(details.join(" • "));

  const mainLine = parts.join(" • ");

  const extras = [
    "Livraison et informations de compte transmises de façon sécurisée après validation.",
    "Annonce claire pour un achat rapide sur la marketplace.",
    "Contactez la boutique pour toute question avant achat.",
  ];

  return [mainLine, ...extras].filter(Boolean).join(" ");
}
