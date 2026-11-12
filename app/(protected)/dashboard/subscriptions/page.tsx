import React from "react";
import Link from "next/link";
import { getMyVipSubscription } from "@/actions/vip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "Mon abonnement | Games-Trafics",
};

const PLAN_LABEL: Record<string, string> = {
  MONTHLY: "VIP Mensuel",
  YEARLY: "VIP Annuel",
  LIFETIME: "VIP à vie",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Actif",
  EXPIRED: "Expiré",
  CANCELLED: "Annulé",
  PENDING: "En attente",
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function daysRemaining(endDate: Date | string) {
  const end = new Date(endDate).getTime();
  if (Number.isNaN(end)) return 0;
  return Math.max(0, Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24)));
}

function readBenefits(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((benefit) => {
      if (typeof benefit === "string") return benefit;
      if (benefit && typeof benefit === "object") {
        const record = benefit as Record<string, unknown>;
        return (
          (record.label as string) ||
          (record.name as string) ||
          (record.description as string) ||
          null
        );
      }
      return null;
    })
    .filter((benefit): benefit is string => Boolean(benefit));
}

export default async function SubscriptionsDashboardPage() {
  const { active, history } = await getMyVipSubscription();
  const benefits = active ? readBenefits(active.activeBenefits) : [];
  const remaining = active ? daysRemaining(active.endDate) : 0;
  const planLabel = active
    ? PLAN_LABEL[active.planType ?? "MONTHLY"] ?? active.planType ?? "VIP"
    : null;

  return (
    <div className="mx-auto space-y-6 p-2">
      <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mon abonnement</h1>
          <p className="text-sm text-muted-foreground">
            Consultez votre statut VIP, vos avantages et vos échéances.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="gap-2 border-purple-500/50 text-purple-500 hover:bg-purple-500/5"
        >
          <Link href="/vip">
            <Zap className="h-4 w-4" />
            {active ? "Gérer mon abonnement" : "Découvrir les offres VIP"}
          </Link>
        </Button>
      </div>

      {active ? (
        <Card className="overflow-hidden border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-card to-indigo-500/10">
          <CardContent className="space-y-6 p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-purple-500 p-3 text-white shadow-lg shadow-purple-500/20">
                  <Star className="h-6 w-6 fill-current" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold">{planLabel}</h2>
                    <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/20">
                      {STATUS_LABEL[active.status ?? "ACTIVE"] ?? active.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Actif jusqu&apos;au {formatDate(active.endDate)}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="w-fit border-purple-500/30 bg-purple-500/10 px-3 py-1 text-purple-500"
              >
                {remaining > 0
                  ? `${remaining} jour${remaining > 1 ? "s" : ""} restant${remaining > 1 ? "s" : ""}`
                  : "Échéance aujourd'hui"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InfoTile
                icon={<Calendar className="h-4 w-4" />}
                label="Début"
                value={formatDate(active.startDate)}
              />
              <InfoTile
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Échéance"
                value={formatDate(active.endDate)}
              />
              <InfoTile
                icon={<RefreshCw className="h-4 w-4" />}
                label="Renouvellement"
                value={active.autoRenew ? "Automatique" : "Manuel"}
              />
              <InfoTile
                icon={<CreditCard className="h-4 w-4" />}
                label="Montant payé"
                value={
                  active.pricePaid
                    ? `${active.pricePaid} ${active.currency || "GTC"}`
                    : "—"
                }
              />
            </div>

            {benefits.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Avantages inclus
                </div>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {benefits.map((benefit, index) => (
                    <li
                      key={`${benefit}-${index}`}
                      className="flex items-start gap-2 rounded-lg border border-border/50 bg-background/40 p-2.5 text-sm"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {active.autoRenew
                  ? "Votre abonnement se renouvellera automatiquement à l'échéance via votre portefeuille."
                  : "Le renouvellement automatique est désactivé : pensez à renouveler avant l'échéance."}
              </p>
              <Button asChild className="gap-2 bg-purple-600 hover:bg-purple-700">
                <Link href="/vip">
                  {active.autoRenew ? "Voir les options" : "Renouveler"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="cursor-pointer border-2 border-dashed transition-colors hover:border-purple-500/50">
          <CardContent className="space-y-4 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold">Aucun abonnement actif</h2>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                Devenez VIP pour débloquer des fonctionnalités exclusives et
                booster votre expérience sur Games-Trafics.
              </p>
            </div>
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link href="/vip">Découvrir les offres VIP</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Historique des abonnements</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucun abonnement enregistré pour le moment.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {history.map((subscription) => {
                const isActive = subscription.id === active?.id;
                return (
                  <li
                    key={subscription.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">
                          {PLAN_LABEL[subscription.planType ?? "MONTHLY"] ??
                            subscription.planType}
                        </span>
                        {isActive && (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/15 text-emerald-500"
                          >
                            Actuel
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Du {formatDate(subscription.startDate)} au{" "}
                        {formatDate(subscription.endDate)}
                        {subscription.pricePaid
                          ? ` · ${subscription.pricePaid} ${subscription.currency || "GTC"}`
                          : ""}
                      </p>
                    </div>
                    <Badge
                      variant={
                        subscription.status === "ACTIVE" ? "default" : "secondary"
                      }
                    >
                      {STATUS_LABEL[subscription.status ?? ""] ??
                        subscription.status}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/40 p-3">
      <div className="mb-1 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
