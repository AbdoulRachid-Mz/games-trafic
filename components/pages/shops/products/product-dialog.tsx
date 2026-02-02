// components/products/product-dialog.tsx
"use client";

import React, { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { createProduct, updateProduct } from "@/actions/products";
import { toast } from "sonner";

const gameOptions = [
  "Fortnite",
  "Valorant", 
  "League of Legends",
  "Minecraft",
  "Call of Duty",
  "FIFA",
  "Rocket League",
  "CS:GO",
  "Genshin Impact",
  "Dota 2",
  "Apex Legends",
  "Overwatch",
  "Rainbow Six Siege",
  "PUBG",
  "Among Us"
];

const platformOptions = [
  { value: "PC", label: "PC" },
  { value: "PLAYSTATION", label: "PlayStation" },
  { value: "XBOX", label: "Xbox" },
  { value: "NINTENDO_SWITCH", label: "Nintendo Switch" },
  { value: "MOBILE", label: "Mobile" },
  { value: "VR", label: "VR" },
  { value: "OTHER", label: "Autre" },
];

const statusOptions = [
  { value: "NON_VENDU", label: "En stock" },
  { value: "RESERVE", label: "Réservé" },
  { value: "EN_ECHANGE", label: "En échange" },
  { value: "LIVRE", label: "Livré" },
  { value: "VENDU", label: "Vendu" },
  { value: "ANNULER", label: "Annulé" },
];

interface ProductDialogProps {
  shopId: string;
  product?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ProductDialog({
  shopId,
  product,
  open,
  onOpenChange,
  onSuccess,
}: ProductDialogProps) {
  const isEdit = !!product;
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || "",
    currency: product?.currency || "GTC",
    game: product?.game || "",
    platform: product?.platform || "PC",
    status: product?.status || "NON_VENDU",
    images: product?.images || [],
    featuredImage: product?.featuredImage || "",
    accountLogin: product?.accountLogin || "",
    encryptedPassword: product?.encryptedPassword || "",
    accountLevel: product?.accountLevel || "",
    accountRank: product?.accountRank || "",
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    isNegotiable: product?.isNegotiable ?? false,
    isVisible: product?.isVisible ?? true,
    categories: product?.categories || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        shopId,
        userId: product?.userId || "", // À remplacer par l'ID de l'utilisateur connecté
        name: formData.name,
        description: formData.description,
        price: formData.price,
        currency: formData.currency,
        game: formData.game,
        platform: formData.platform,
        status: formData.status,
        images: formData.images,
        featuredImage: formData.featuredImage,
        accountLogin: formData.accountLogin,
        encryptedPassword: formData.encryptedPassword,
        accountLevel: formData.accountLevel,
        accountRank: formData.accountRank,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        isNegotiable: formData.isNegotiable,
        isVisible: formData.isVisible,
        categories: formData.categories,
      };

      if (isEdit) {
        await updateProduct(product.id, productData);
        toast.success("Produit mis à jour avec succès");
      } else {
        await createProduct(productData);
        toast.success("Produit créé avec succès");
      }

      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le produit" : "Ajouter un produit"}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Modifiez les informations de votre produit" 
              : "Créez un nouveau produit à vendre dans votre boutique"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="basic">Informations de base</TabsTrigger>
            <TabsTrigger value="media">Médias</TabsTrigger>
            <TabsTrigger value="account">Compte (optionnel)</TabsTrigger>
            <TabsTrigger value="advanced">Avancé</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            {/* Informations de base */}
            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du produit *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Compte Fortnite Level 200"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Prix *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GTC">GTC</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="game">Jeu *</Label>
                  <Select
                    value={formData.game}
                    onValueChange={(value) => setFormData({ ...formData, game: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un jeu" />
                    </SelectTrigger>
                    <SelectContent>
                      {gameOptions.map((game) => (
                        <SelectItem key={game} value={game}>{game}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform">Plateforme *</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value) => setFormData({ ...formData, platform: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une plateforme" />
                    </SelectTrigger>
                    <SelectContent>
                      {platformOptions.map((platform) => (
                        <SelectItem key={platform.value} value={platform.value}>
                          {platform.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categories">Catégories</Label>
                  <Input
                    id="categories"
                    placeholder="gaming, compte, fortnite"
                    value={formData.categories.join(", ")}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      categories: e.target.value.split(",").map(c => c.trim()).filter(c => c) 
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre produit en détail..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
            </TabsContent>

            {/* Médias */}
            <TabsContent value="media" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Image principale</Label>
                  <Typography variant="caption2" theme="muted" className="mb-2 block">
                    Cette image sera affichée en premier
                  </Typography>
                  <AdvancedUpload
                    value={formData.featuredImage}
                    onChange={(url) => setFormData({ ...formData, featuredImage: url })}
                    maxSizeMB={2}
                  />
                </div>

                <div>
                  <Label>Galerie d'images</Label>
                  <Typography variant="caption2" theme="muted" className="mb-2 block">
                    Ajoutez jusqu'à 5 images supplémentaires
                  </Typography>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[...Array(5)].map((_, index) => (
                      <AdvancedUpload
                        key={index}
                        value={formData.images[index] || ""}
                        onChange={(url) => {
                          const newImages = [...formData.images];
                          newImages[index] = url;
                          setFormData({ ...formData, images: newImages });
                        }}
                        maxSizeMB={2}
                        className="aspect-square"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Compte */}
            <TabsContent value="account" className="space-y-6">
              <div className="rounded-lg border p-4 bg-muted/30">
                <Typography variant="body-sm" weight="semibold" className="mb-2">
                  ⚠️ Informations sensibles
                </Typography>
                <Typography variant="caption2" theme="muted">
                  Ces informations seront chiffrées et sécurisées. Ne les partagez qu'après validation de la commande.
                </Typography>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="accountLogin">Identifiant/Email du compte</Label>
                  <Input
                    id="accountLogin"
                    placeholder="identifiant@gmail.com"
                    value={formData.accountLogin}
                    onChange={(e) => setFormData({ ...formData, accountLogin: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="encryptedPassword">Mot de passe (chiffré)</Label>
                  <Input
                    id="encryptedPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.encryptedPassword}
                    onChange={(e) => setFormData({ ...formData, encryptedPassword: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountLevel">Niveau du compte</Label>
                  <Input
                    id="accountLevel"
                    placeholder="Ex: 200"
                    value={formData.accountLevel}
                    onChange={(e) => setFormData({ ...formData, accountLevel: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountRank">Rang/Division</Label>
                  <Input
                    id="accountRank"
                    placeholder="Ex: Diamond III"
                    value={formData.accountRank}
                    onChange={(e) => setFormData({ ...formData, accountRank: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Avancé */}
            <TabsContent value="advanced" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Activer le produit</Label>
                    <Typography variant="caption2" theme="muted">
                      Le produit sera visible dans votre boutique
                    </Typography>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mettre en vedette</Label>
                    <Typography variant="caption2" theme="muted">
                      Afficher ce produit en avant
                    </Typography>
                  </div>
                  <Switch
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Négociable</Label>
                    <Typography variant="caption2" theme="muted">
                      Permettre aux acheteurs de négocier le prix
                    </Typography>
                  </div>
                  <Switch
                    checked={formData.isNegotiable}
                    onCheckedChange={(checked) => setFormData({ ...formData, isNegotiable: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Visible publiquement</Label>
                    <Typography variant="caption2" theme="muted">
                      Le produit apparaîtra dans les recherches
                    </Typography>
                  </div>
                  <Switch
                    checked={formData.isVisible}
                    onCheckedChange={(checked) => setFormData({ ...formData, isVisible: checked })}
                  />
                </div>
              </div>
            </TabsContent>

            <DialogFooter className="mt-6">
              <div className="flex items-center justify-between w-full">
                <div className="flex gap-2">
                  {activeTab !== "basic" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const tabs = ["basic", "media", "account", "advanced"];
                        const currentIndex = tabs.indexOf(activeTab);
                        if (currentIndex > 0) {
                          setActiveTab(tabs[currentIndex - 1]);
                        }
                      }}
                    >
                      Précédent
                    </Button>
                  )}
                  
                  {activeTab !== "advanced" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const tabs = ["basic", "media", "account", "advanced"];
                        const currentIndex = tabs.indexOf(activeTab);
                        if (currentIndex < tabs.length - 1) {
                          setActiveTab(tabs[currentIndex + 1]);
                        }
                      }}
                    >
                      Suivant
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer le produit"}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}