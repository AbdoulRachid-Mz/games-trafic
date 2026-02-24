"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart2, Settings, ShoppingBag, Eye, Heart, TrendingUp, Package, Clock, ShoppingCart, MessageSquare, Shield, Zap } from "lucide-react";
import { AdvancedChart } from "@/components/ui/advanced-chart";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

interface DashboardTabsProps {
    product: any;
    productId: string;
}

export function DashboardTabs({ product, productId }: DashboardTabsProps) {
    const [activeTab, setActiveTab] = useState("overview");

    // Mock stats
    const stats = [
        { title: "Vues totales", value: product.viewCount || 0, icon: Eye, change: "+12%", color: "text-blue-500" },
        { title: "Ventes", value: product.status === "VENDU" ? 1 : 0, icon: ShoppingCart, change: "0%", color: "text-green-500" },
        { title: "Favoris", value: 12, icon: Heart, change: "+5%", color: "text-red-500" },
        { title: "Messages", value: 4, icon: MessageSquare, change: "+2", color: "text-purple-500" },
    ];

    const chartData = [
        { name: "Lun", Vues: 45, Favoris: 12, Ventes: 0 },
        { name: "Mar", Vues: 52, Favoris: 15, Ventes: 0 },
        { name: "Mer", Vues: 38, Favoris: 8, Ventes: 1 },
        { name: "Jeu", Vues: 65, Favoris: 20, Ventes: 0 },
        { name: "Ven", Vues: 48, Favoris: 14, Ventes: 0 },
        { name: "Sam", Vues: 72, Favoris: 25, Ventes: 0 },
        { name: "Dim", Vues: 85, Favoris: 30, Ventes: 0 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Typography variant="h2" weight="bold" className="tracking-tight italic uppercase italic">
                        Dashboard Produit
                    </Typography>
                    <Typography variant="body-sm" theme="muted" className="mt-1">
                        Gérez votre compte gaming et suivez vos performances.
                    </Typography>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="rounded-xl border-primary/20 hover:bg-primary/5">
                        <Eye className="w-4 h-4 mr-2" />
                        Voir la page
                    </Button>
                    <Button size="sm" className="rounded-xl font-bold">
                        <Zap className="w-4 h-4 mr-2 fill-current" />
                        Mettre en avant
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
                <div className="flex items-center justify-between bg-card/50 backdrop-blur-sm p-1 rounded-2xl border border-border/50 sticky top-0 z-10 overflow-x-auto">
                    <TabsList className="bg-transparent border-none p-0 h-auto">
                        <TabsTrigger
                            value="overview"
                            className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
                        >
                            <BarChart2 className="w-4 h-4 mr-2" />
                            Vue d'ensemble
                        </TabsTrigger>
                        <TabsTrigger
                            value="orders"
                            className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
                        >
                            <Package className="w-4 h-4 mr-2" />
                            Commandes
                        </TabsTrigger>
                        <TabsTrigger
                            value="settings"
                            className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Paramètres
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="mt-6 space-y-6">
                    <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {stats.map((stat, i) => (
                                <Card key={i} className="border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden group hover:border-primary/50 transition-colors rounded-[2rem]">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{stat.title}</CardTitle>
                                        <div className={cn("p-2 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors", stat.color.replace("text-", "bg-").replace("500", "500/10"))}>
                                            <stat.icon className={cn("h-4 w-4", stat.color)} />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-black italic">{stat.value}</div>
                                        <div className="flex items-center mt-1 text-xs text-green-500 font-bold">
                                            <TrendingUp className="w-3 h-3 mr-1" />
                                            {stat.change}
                                            <span className="text-muted-foreground ml-2 font-normal">v.s mois dernier</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                            <Card className="lg:col-span-4 border-border/50 bg-card/30 backdrop-blur-sm rounded-[2.5rem]">
                                <CardHeader>
                                    <CardTitle className="font-bold">Activité Récente</CardTitle>
                                    <CardDescription>Visualisation des vues et interactions par jour</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <AdvancedChart
                                        data={chartData}
                                        kind="bar"
                                        series={[
                                            { key: "Vues", label: "Vues", color: "hsl(var(--primary))" },
                                            { key: "Favoris", label: "Favoris", color: "#f59e0b" },
                                            { key: "Ventes", label: "Ventes", color: "#22c55e" },
                                        ]}
                                        showLegend
                                        showTooltip
                                        height={300}
                                    />
                                </CardContent>
                            </Card>

                            <Card className="lg:col-span-3 border-border/50 bg-card/30 backdrop-blur-sm rounded-[2.5rem]">
                                <CardHeader>
                                    <CardTitle className="font-bold">Informations Produit</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50">
                                        <div className="flex items-center gap-3">
                                            <Shield className="w-5 h-5 text-primary" />
                                            <div>
                                                <Typography variant="body-sm" weight="bold">Statut</Typography>
                                                <Typography variant="caption1" theme="muted">Vérifié par GT</Typography>
                                            </div>
                                        </div>
                                        <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <div className="h-2 w-2 rounded-full bg-green-500" />
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">ID Produit</span>
                                            <span className="font-mono">{productId.slice(0, 8)}...</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Date de création</span>
                                            <span>{new Date().toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Catégorie</span>
                                            <span>Compte Gaming</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Plateforme</span>
                                            <span className="font-bold text-primary">{product.platform || "PC"}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="orders" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Card className="border-border/50 bg-card/30 backdrop-blur-sm rounded-[2.5rem]">
                            <CardHeader>
                                <CardTitle className="font-bold italic uppercase tracking-tighter">Historique des Commandes</CardTitle>
                                <CardDescription>Gérez les ventes et transactions liées à ce compte.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                    <div className="p-6 rounded-full bg-muted/20 border-2 border-dashed border-border flex items-center justify-center">
                                        <ShoppingCart className="w-10 h-10 text-muted-foreground/30" />
                                    </div>
                                    <div>
                                        <Typography variant="body-lg" weight="bold">Aucune commande pour le moment</Typography>
                                        <Typography variant="body-sm" theme="muted">Partagez votre produit pour augmenter vos chances de vente !</Typography>
                                    </div>
                                    <Button variant="outline" className="rounded-xl mt-4">
                                        Copier le lien de vente
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="settings" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Card className="border-border/50 bg-card/30 backdrop-blur-sm rounded-[2.5rem]">
                            <CardHeader>
                                <CardTitle className="font-bold italic uppercase tracking-tighter">Paramètres du Produit</CardTitle>
                                <CardDescription>Modifiez les informations de visibilité et les détails techniques.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="p-6 rounded-3xl border border-border/50 bg-muted/10 hover:bg-muted/20 transition-colors">
                                        <Shield className="w-8 h-8 text-primary mb-3" />
                                        <Typography variant="body-lg" weight="bold">Sécurité du compte</Typography>
                                        <Typography variant="caption1" theme="muted" className="mb-4">Gérez les informations d'accès sensibles.</Typography>
                                        <Button variant="secondary" size="sm" className="w-full rounded-xl">Modifier les accès</Button>
                                    </div>
                                    <div className="p-6 rounded-3xl border border-border/50 bg-muted/10 hover:bg-muted/20 transition-colors">
                                        <Eye className="w-8 h-8 text-primary mb-3" />
                                        <Typography variant="body-lg" weight="bold">Visibilité</Typography>
                                        <Typography variant="caption1" theme="muted" className="mb-4">Définissez si le produit est public ou masqué.</Typography>
                                        <Button variant="secondary" size="sm" className="w-full rounded-xl">Options de visibilité</Button>
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
