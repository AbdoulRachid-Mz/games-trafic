// app/admin/settings/page.tsx
"use client";

import React, { useState } from "react";
import { useAppConfig } from "@/hooks/use-app-config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { Save, RefreshCw, AlertTriangle, Shield, Wallet, Globe, Sliders } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";

export default function AppSettingsPage() {
  const { settings, updateAppConfig, isSettingsLoading } = useAppConfig();
  const [isSaving, setIsSaving] = useState(false);

  // États locaux pour le formulaire (copie des settings)
  const [formData, setFormData] = useState<any>(null);

  // Initialiser le formulaire quand les settings sont chargés
  React.useEffect(() => {
    if (settings && !formData) {
      setFormData({ ...settings });
    }
  }, [settings, formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) : value,
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev: any) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateAppConfig(formData);
      toast.success("Paramètres enregistrés avec succès");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  if (isSettingsLoading || !formData) {
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
          <Typography variant="h1" weight="bold" className="mt-2">
            Paramètres de l'Application
          </Typography>
          <Typography variant="lead" theme="muted">
            Configurez les limites, les frais et les fonctionnalités globales du système
          </Typography>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer les modifications
        </Button>
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
          <Card>
            <CardHeader>
              <CardTitle>Configuration Générale</CardTitle>
              <CardDescription>Paramètres de base de l'application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gtcToFcfaRate">Taux GTC vers FCFA</Label>
                  <Input
                    id="gtcToFcfaRate"
                    name="gtcToFcfaRate"
                    type="number"
                    value={formData.gtcToFcfaRate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vipMonthlyPrice">Prix VIP Mensuel (GTC)</Label>
                  <Input
                    id="vipMonthlyPrice"
                    name="vipMonthlyPrice"
                    type="number"
                    value={formData.vipMonthlyPrice}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Items de jeu activés</Label>
                  <p className="text-sm text-muted-foreground">Activer/désactiver la boutique d'items globalement</p>
                </div>
                <Switch
                  checked={formData.gameItemsEnabled}
                  onCheckedChange={(checked) => handleSwitchChange("gameItemsEnabled", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Finances */}
        <TabsContent value="finances">
          <Card>
            <CardHeader>
              <CardTitle>Frais et Commissions</CardTitle>
              <CardDescription>Définissez les pourcentages de frais pour chaque type de transaction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Frais Dépôt (%)</Label>
                  <Input
                    name="depositFeePercentage"
                    type="number"
                    step="0.01"
                    value={formData.depositFeePercentage}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frais Retrait (%)</Label>
                  <Input
                    name="withdrawalFeePercentage"
                    type="number"
                    step="0.01"
                    value={formData.withdrawalFeePercentage}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frais Transfert (%)</Label>
                  <Input
                    name="transferFeePercentage"
                    type="number"
                    step="0.01"
                    value={formData.transferFeePercentage}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Commission Items (%)</Label>
                  <Input
                    name="gameItemCommissionPercentage"
                    type="number"
                    step="0.01"
                    value={formData.gameItemCommissionPercentage}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Limites */}
        <TabsContent value="limits">
          <Card>
            <CardHeader>
              <CardTitle>Limites Utilisateurs</CardTitle>
              <CardDescription>Quotas pour les comptes Regular vs VIP</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-bold border-b pb-2">Regular</h3>
                  <div className="space-y-2">
                    <Label>Max Produits</Label>
                    <Input name="maxProductsRegular" type="number" value={formData.maxProductsRegular} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Boutiques</Label>
                    <Input name="maxShopsRegular" type="number" value={formData.maxShopsRegular} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold border-b pb-2 text-primary">VIP</h3>
                  <div className="space-y-2">
                    <Label>Max Produits</Label>
                    <Input name="maxProductsVip" type="number" value={formData.maxProductsVip} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Boutiques</Label>
                    <Input name="maxShopsVip" type="number" value={formData.maxShopsVip} onChange={handleInputChange} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Maintenance */}
        <TabsContent value="maintenance">
          <Card className="border-destructive/50">
            <CardHeader className="bg-destructive/5">
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Mode Maintenance
              </CardTitle>
              <CardDescription>
                Activez ce mode pour restreindre l'accès à la plateforme pendant les mises à jour
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-destructive/5">
                <div className="space-y-0.5">
                  <Label className="text-destructive font-bold">Activer la maintenance globale</Label>
                  <p className="text-sm text-muted-foreground">Seuls les administrateurs pourront accéder à la plateforme</p>
                </div>
                <Switch
                  checked={formData.maintenanceMode}
                  onCheckedChange={(checked) => handleSwitchChange("maintenanceMode", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
