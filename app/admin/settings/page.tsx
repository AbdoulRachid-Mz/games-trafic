// app/admin/settings/page.tsx
"use client";

import React from "react";
import { useAppConfig } from "@/hooks/use-app-config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { RefreshCw, AlertTriangle, Shield, Wallet, Globe, Sliders } from "lucide-react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { AutoSyncField } from "@/components/shared/auto-sync-field";

export default function AppSettingsPage() {
  const { settings, updateAppConfig, isSettingsLoading } = useAppConfig();

  const handleUpdate = async (field: string, value: any) => {
    try {
      await updateAppConfig({ [field]: value });
    } catch (error) {
       console.error(`Error updating ${field}:`, error);
       throw error;
    }
  };

  if (isSettingsLoading || !settings) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-center text-muted-foreground">Chargement de la configuration...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Typography variant="h1" weight="bold" className="mt-2 uppercase italic tracking-tighter">
            Paramètres Système
          </Typography>
          <Typography variant="lead" theme="muted">
            Configurez les limites, les frais et les fonctionnalités globales
          </Typography>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          <TabsTrigger value="general" className="gap-2"><Sliders className="h-4 w-4" /> Général</TabsTrigger>
          <TabsTrigger value="finances" className="gap-2"><Wallet className="h-4 w-4" /> Finances</TabsTrigger>
          <TabsTrigger value="limits" className="gap-2"><Globe className="h-4 w-4" /> Limites</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Shield className="h-4 w-4" /> Sécurité</TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-2 text-destructive"><AlertTriangle className="h-4 w-4" /> Maintenance</TabsTrigger>
        </TabsList>

        {/* Tab Général */}
        <TabsContent value="general">
          <Card className="border-border/50 bg-card/30 backdrop-blur-sm rounded-[2rem] overflow-hidden">
            <CardHeader>
              <CardTitle>Configuration Générale</CardTitle>
              <CardDescription>Paramètres de base de l'application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AutoSyncField
                  label="Taux GTC vers FCFA"
                  value={settings.gtcToFcfaRate}
                  type="input"
                  onChange={(val) => handleUpdate("gtcToFcfaRate", parseFloat(val))}
                  placeholder="Ex: 650"
                  editMode="auto"
                />
                <AutoSyncField
                  label="Prix VIP Mensuel (GTC)"
                  value={settings.vipMonthlyPrice}
                  type="input"
                  onChange={(val) => handleUpdate("vipMonthlyPrice", parseFloat(val))}
                  placeholder="Ex: 50"
                  editMode="auto"
                />
              </div>
              <div className="p-4 bg-muted/10 rounded-2xl border border-border/50">
                <AutoSyncField
                  label="Boutique d'items activée"
                  value={settings.gameItemsEnabled}
                  type="switch"
                  onChange={(val) => handleUpdate("gameItemsEnabled", val)}
                  editMode="auto"
                  className="flex items-center justify-between"
                  containerClassName="w-full"
                />
                <p className="text-xs text-muted-foreground mt-2 ml-1">Activer/désactiver la boutique d'items globalement</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Finances */}
        <TabsContent value="finances">
          <Card className="border-border/50 bg-card/30 backdrop-blur-sm rounded-[2rem] overflow-hidden">
            <CardHeader>
              <CardTitle>Frais et Commissions (%)</CardTitle>
              <CardDescription>Définissez les pourcentages de frais pour chaque transaction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AutoSyncField
                  label="Frais Dépôt"
                  value={settings.depositFeePercentage}
                  type="input"
                  onChange={(val) => handleUpdate("depositFeePercentage", parseFloat(val))}
                  editMode="auto"
                />
                <AutoSyncField
                  label="Frais Retrait"
                  value={settings.withdrawalFeePercentage}
                  type="input"
                  onChange={(val) => handleUpdate("withdrawalFeePercentage", parseFloat(val))}
                  editMode="auto"
                />
                <AutoSyncField
                  label="Frais Transfert"
                  value={settings.transferFeePercentage}
                  type="input"
                  onChange={(val) => handleUpdate("transferFeePercentage", parseFloat(val))}
                  editMode="auto"
                />
                <AutoSyncField
                  label="Commission Items"
                  value={settings.gameItemCommissionPercentage}
                  type="input"
                  onChange={(val) => handleUpdate("gameItemCommissionPercentage", parseFloat(val))}
                  editMode="auto"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Limites */}
        <TabsContent value="limits">
          <Card className="border-border/50 bg-card/30 backdrop-blur-sm rounded-[2rem] overflow-hidden">
            <CardHeader>
              <CardTitle>Limites Utilisateurs</CardTitle>
              <CardDescription>Quotas pour les comptes Regular vs VIP</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="font-bold border-b pb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    Regular
                  </h3>
                  <AutoSyncField
                    label="Max Produits"
                    value={settings.maxProductsRegular}
                    onChange={(val) => handleUpdate("maxProductsRegular", parseInt(String(val)))}
                    editMode="auto"
                  />
                  <AutoSyncField
                    label="Max Boutiques"
                    value={settings.maxShopsRegular}
                    onChange={(val) => handleUpdate("maxShopsRegular", parseInt(String(val)))}
                    editMode="auto"
                  />
                </div>
                <div className="space-y-6">
                  <h3 className="font-bold border-b pb-2 text-primary flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    VIP
                  </h3>
                  <AutoSyncField
                    label="Max Produits"
                    value={settings.maxProductsVip}
                    onChange={(val) => handleUpdate("maxProductsVip", parseInt(String(val)))}
                    editMode="auto"
                  />
                  <AutoSyncField
                    label="Max Boutiques"
                    value={settings.maxShopsVip}
                    onChange={(val) => handleUpdate("maxShopsVip", parseInt(String(val)))}
                    editMode="auto"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Maintenance */}
        <TabsContent value="maintenance">
          <Card className="border-destructive/30 bg-destructive/5 backdrop-blur-sm rounded-[2rem] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Mode Maintenance
              </CardTitle>
              <CardDescription>
                Activez ce mode pour restreindre l'accès pendant les mises à jour
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 space-y-4">
              <div className="p-4 border border-destructive/20 rounded-2xl bg-background/50">
                <AutoSyncField
                  label="Maintenance Globale"
                  value={settings.maintenanceMode}
                  type="switch"
                  onChange={(val) => handleUpdate("maintenanceMode", val)}
                  editMode="auto"
                  className="flex items-center justify-between font-bold text-destructive"
                />
                <p className="text-xs text-muted-foreground mt-2 ml-1">Seuls les administrateurs pourront accéder à la plateforme</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
