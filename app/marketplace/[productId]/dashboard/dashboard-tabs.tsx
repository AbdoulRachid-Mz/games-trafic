"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BarChart2,
  Settings,
  ShoppingCart,
  Eye,
  Heart,
  ShoppingBag,
  Tag,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { useAppShellStickyOffset } from "@/stores/app-shell-store";
import type { ProductDetail } from "@/types/view-models";

interface DashboardTabsProps {
  product: ProductDetail;
  productId: string;
}

export function DashboardTabs({ product, productId }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState("overview");
  // Offset global (App Shell) + hauteur h-16 du header local du layout.
  const stickyOffset = useAppShellStickyOffset() + 64;

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
      color: "var(--chart-1)",
    },
    {
      title: "Commandes",
      value: stats.orderCount,
      icon: ShoppingBag,
      color: "var(--chart-2)",
    },
    {
      title: "Favoris",
      value: stats.likeCount,
      icon: Heart,
      color: "var(--chart-3)",
    },
    {
      title: "Prix",
      value: `${new Intl.NumberFormat("fr-FR").format(Number(product.price) || 0)} ${product.currency || "GTC"}`,
      icon: Tag,
      color: "var(--chart-4)",
    },
  ];

  const total = stats.viewCount + stats.likeCount + stats.orderCount;

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
            Gérez votre compte gaming et suivez ses performances réelles.
          </Typography>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-xl">
            <Eye className="mr-2 h-4 w-4" />
            Voir la page
          </Button>
          <Button size="sm" className="rounded-xl font-bold">
            <Zap className="mr-2 h-4 w-4 fill-current" />
            Mettre en avant
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <div
          className="sticky z-20 flex items-center justify-between overflow-x-auto rounded-xl border border-border/50 bg-card/50 p-1 backdrop-blur-sm"
          style={{ top: stickyOffset }}
        >
          <TabsList className="h-auto border-none bg-transparent p-0">
            <TabsTrigger
              value="overview"
              className="rounded-xl px-6 py-2.5 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"
            >
              <BarChart2 className="mr-2 h-4 w-4" />
              Vue d&apos;ensemble
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="rounded-xl px-6 py-2.5 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Commandes
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-xl px-6 py-2.5 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"
            >
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-6 space-y-6">
          <TabsContent
            value="overview"
            className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {kpis.map((kpi) => (
                <Card
                  key={kpi.title}
                  className="overflow-hidden rounded-xl border-border/50 bg-card/30 backdrop-blur-sm transition-colors hover:border-primary/50"
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      {kpi.title}
                    </CardTitle>
                    <div
                      className="rounded-xl bg-muted p-2"
                      style={{ color: kpi.color }}
                    >
                      <kpi.icon className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black tabular-nums">
                      {kpi.value}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-7">
              <Card className="rounded-xl border-border/50 bg-card/30 backdrop-blur-sm lg:col-span-4">
                <CardHeader>
                  <CardTitle className="font-bold">Activité récente</CardTitle>
                  <CardDescription>
                    Cumuls réels depuis la création de l&apos;annonce
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {total === 0 ? (
                    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/10 p-6 text-center">
                      <BarChart2 className="h-10 w-10 text-muted-foreground/50" />
                      <Typography variant="body-base" weight="semibold">
                        Aucune activité enregistrée
                      </Typography>
                      <Typography variant="body-sm" theme="muted">
                        Les interactions apparaîtront ici dès que le produit
                        sera consulté.
                      </Typography>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {[
                        { label: "Vues", value: stats.viewCount, color: "var(--chart-1)" },
                        { label: "Favoris", value: stats.likeCount, color: "var(--chart-2)" },
                        { label: "Commandes", value: stats.orderCount, color: "var(--chart-3)" },
                      ].map((row) => (
                        <div key={row.label} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {row.label}
                            </span>
                            <span className="font-semibold tabular-nums">
                              {row.value}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(row.value / total) * 100}%`,
                                backgroundColor: row.color,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                      <Typography variant="caption1" theme="muted">
                        Aucun historique journalier n&apos;est persisté pour le
                        moment.
                      </Typography>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-xl border-border/50 bg-card/30 backdrop-blur-sm lg:col-span-3">
                <CardHeader>
                  <CardTitle className="font-bold">
                    Informations produit
                  </CardTitle>
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
                          Déclaré par le vendeur
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
                      <span className="text-muted-foreground">Plateforme</span>
                      <span className="font-bold text-primary">
                        {product.platform || "Non renseignée"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent
            value="orders"
            className="animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <Card className="rounded-xl border-border/50 bg-card/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-bold uppercase tracking-tighter">
                  Historique des commandes
                </CardTitle>
                <CardDescription>
                  Commandes liées à ce produit ({stats.orderCount})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.orderCount === 0 ? (
                  <div className="flex flex-col items-center justify-center space-y-4 py-20 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted/20">
                      <ShoppingCart className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <div>
                      <Typography variant="body-lg" weight="bold">
                        Aucune commande pour le moment
                      </Typography>
                      <Typography variant="body-sm" theme="muted">
                        Partagez votre produit pour augmenter vos chances de
                        vente.
                      </Typography>
                    </div>
                  </div>
                ) : (
                  <Typography variant="body-base" theme="muted">
                    {stats.orderCount} commande(s) enregistrée(s). Le détail par
                    commande n&apos;est pas encore exposé dans cette vue.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="settings"
            className="animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <Card className="rounded-xl border-border/50 bg-card/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-bold uppercase tracking-tighter">
                  Paramètres du produit
                </CardTitle>
                <CardDescription>
                  Informations de visibilité et détails techniques.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-border/50 bg-muted/10 p-6 transition-colors hover:bg-muted/20">
                    <Shield className="mb-3 h-8 w-8 text-primary" />
                    <Typography variant="body-lg" weight="bold">
                      Sécurité du compte
                    </Typography>
                    <Typography variant="caption1" theme="muted" className="mb-4">
                      Gérez les informations d&apos;accès sensibles.
                    </Typography>
                    <Button variant="secondary" size="sm" className="w-full rounded-xl">
                      Modifier les accès
                    </Button>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-muted/10 p-6 transition-colors hover:bg-muted/20">
                    <Eye className="mb-3 h-8 w-8 text-primary" />
                    <Typography variant="body-lg" weight="bold">
                      Visibilité
                    </Typography>
                    <Typography variant="caption1" theme="muted" className="mb-4">
                      Statut actuel : {product.isVisible ? "visible" : "masqué"}.
                    </Typography>
                    <Button variant="secondary" size="sm" className="w-full rounded-xl">
                      Options de visibilité
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
