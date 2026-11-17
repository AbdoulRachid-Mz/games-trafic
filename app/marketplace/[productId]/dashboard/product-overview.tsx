"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Settings,
  Eye,
  Heart,
  ShoppingBag,
  Tag,
  BarChart2,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import Link from "next/link";
import { StatsCarousel } from "@/components/shared/stats-carousel";
import { StatCard } from "@/components/admin/stat-card";
import type { ProductDetail } from "@/types/view-models";

interface ProductOverviewProps {
  product: ProductDetail;
  productId: string;
}

const formatDate = (value: Date | string | null | undefined) => {
  if (!value) return "Non renseignée";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Non renseignée";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export function ProductOverview({ product, productId }: ProductOverviewProps) {
  // Toutes les valeurs proviennent de l'action serveur getProductById :
  // aucune statistique ni période n'est simulée côté client.
  const stats = product.stats ?? {
    viewCount: product.viewCount ?? 0,
    orderCount: 0,
    likeCount: 0,
  };

  const kpis = [
    {
      title: "Vues totales",
      value: stats.viewCount,
      icon: Eye,
      description: "Vues enregistrées sur la fiche",
    },
    {
      title: "Commandes",
      value: stats.orderCount,
      icon: ShoppingBag,
      description: "Commandes liées au produit",
    },
    {
      title: "Favoris",
      value: stats.likeCount,
      icon: Heart,
      description: "Mentions « j'aime » enregistrées",
    },
    {
      title: "Prix affiché",
      value: `${new Intl.NumberFormat("fr-FR").format(Number(product.price) || 0)} ${product.currency || "GTC"}`,
      icon: Tag,
      description: "Tarif actuel du produit",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Typography
            variant="h2"
            weight="bold"
            className="tracking-tight uppercase"
          >
            Dashboard Produit
          </Typography>
          <Typography variant="body-sm" theme="muted" className="mt-1">
            {product.name} — gérez votre annonce et consultez ses performances
            réelles.
          </Typography>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-primary/20 hover:bg-primary/5"
            asChild
          >
            <Link href={`/marketplace/${productId}/dashboard/settings`}>
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </Link>
          </Button>
          <Button size="sm" className="rounded-xl font-bold">
            <Zap className="mr-2 h-4 w-4 fill-current" />
            Mettre en avant
          </Button>
        </div>
      </div>

      <StatsCarousel mode="auto">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            description={kpi.description}
            iconClassName="bg-primary/10 text-primary"
          />
        ))}
      </StatsCarousel>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="rounded-xl border-border/50 bg-card/30 backdrop-blur-sm lg:col-span-4">
          <CardHeader>
            <CardTitle className="font-bold">Activité récente</CardTitle>
            <CardDescription>
              Répartition des interactions enregistrées sur ce produit
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.viewCount + stats.orderCount + stats.likeCount === 0 ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/10 p-6 text-center">
                <BarChart2 className="h-10 w-10 text-muted-foreground/50" />
                <Typography variant="body-base" weight="semibold">
                  Aucune activité enregistrée
                </Typography>
                <Typography variant="body-sm" theme="muted">
                  Les vues, commandes et favoris apparaîtront ici dès que le
                  produit sera consulté.
                </Typography>
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { label: "Vues", value: stats.viewCount, color: "var(--chart-1)" },
                  { label: "Favoris", value: stats.likeCount, color: "var(--chart-2)" },
                  { label: "Commandes", value: stats.orderCount, color: "var(--chart-3)" },
                ].map((row) => {
                  const total =
                    stats.viewCount + stats.likeCount + stats.orderCount;
                  const percent = total > 0 ? (row.value / total) * 100 : 0;
                  return (
                    <div key={row.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-semibold tabular-nums">
                          {row.value}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: row.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                <Typography variant="caption1" theme="muted">
                  Cumuls réels depuis la création de l&apos;annonce. Aucun
                  historique journalier n&apos;est persisté pour le moment.
                </Typography>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/50 bg-card/30 backdrop-blur-sm lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-bold">Informations produit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <Typography variant="body-sm" weight="bold">
                    Statut
                  </Typography>
                  <Typography variant="caption1" theme="muted">
                    Statut déclaré par le vendeur
                  </Typography>
                </div>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {product.status ?? "Non renseigné"}
              </span>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">ID produit</span>
                <span className="truncate font-mono">{productId}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Date de création</span>
                <span className="text-right">
                  {formatDate(product.createdAt)}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Jeu</span>
                <span className="max-w-[55%] truncate text-right">
                  {product.game || "Non renseigné"}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Plateforme</span>
                <span className="font-bold text-primary">
                  {product.platform || "Non renseignée"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
