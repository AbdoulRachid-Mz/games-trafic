"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Info, Lock, Image as ImageIcon, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AutoSyncField } from "@/components/shared/auto-sync-field";
import { AdvancedMultiUpload } from "@/components/ui/advanced-multi-upload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setProductCredentials, updateProduct } from "@/actions/products";
import { generateProductDescription } from "@/lib/products/description";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductSettingsFormProps {
  product: any;
  decryptedPassword?: string;
  isLocked?: boolean;
  lockReason?: {
    sold: boolean;
    paid: boolean;
    completedOrders: number;
    completedTransactions: number;
  };
}

const PLATFORMS = ["PC", "PLAYSTATION", "XBOX", "NINTENDO_SWITCH", "MOBILE", "OTHER"] as const;
const STATUSES = ["NON_VENDU", "RESERVE", "EN_ECHANGE", "LIVRE", "VENDU", "ANNULER"] as const;

export function ProductSettingsForm({
  product,
  decryptedPassword = "",
  isLocked = false,
  lockReason,
}: ProductSettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const [descTouched, setDescTouched] = useState(Boolean(product.description));

  const [name, setName] = useState(product.name || "");
  const [game, setGame] = useState(product.game || "");
  const [platform, setPlatform] = useState<string>(product.platform || "MOBILE");
  const [price, setPrice] = useState(String(product.price ?? ""));
  const [currency, setCurrency] = useState(product.currency || "GTC");
  const [description, setDescription] = useState(product.description || "");
  const [status, setStatus] = useState<string>(product.status || "NON_VENDU");
  const [categories, setCategories] = useState<string>((product.categories || []).join(", "));
  const [images, setImages] = useState<string[]>(product.images || []);
  const [featuredImage, setFeaturedImage] = useState<string>(product.featuredImage || "");
  const [isVisible, setIsVisible] = useState<boolean>(product.isVisible ?? true);
  const [isActive, setIsActive] = useState<boolean>(product.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState<boolean>(product.isFeatured ?? false);
  const [isNegotiable, setIsNegotiable] = useState<boolean>(product.isNegotiable ?? false);

  const [accountLogin, setAccountLogin] = useState(product.accountLogin || "");
  const [accountPassword, setAccountPassword] = useState(decryptedPassword);
  const [accountLevel, setAccountLevel] = useState(product.accountLevel || "");
  const [accountRank, setAccountRank] = useState(product.accountRank || "");

  const generatedDescription = useMemo(
    () =>
      generateProductDescription({
        name,
        game,
        platform: platform as any,
        price,
        currency,
        accountLevel,
        accountRank,
        categories: categories.split(",").map((c) => c.trim()).filter(Boolean),
      }),
    [name, game, platform, price, currency, accountLevel, accountRank, categories]
  );

  useEffect(() => {
    if (!descTouched) setDescription(generatedDescription);
  }, [generatedDescription, descTouched]);

  const disabledCritical = isLocked || saving;

  const saveGeneral = async () => {
    if (isLocked) {
      toast.error("Produit verrouillé: modification des informations critiques indisponible.");
      return;
    }
    setSaving(true);
    try {
      await updateProduct(product.id, {
        name: name.trim(),
        game: game.trim(),
        platform: platform as any,
        price,
        currency,
        description: description.trim(),
        status: status as any,
        categories: categories.split(",").map((c) => c.trim()).filter(Boolean),
        images,
        featuredImage: featuredImage || images[0] || null,
        isActive,
        isFeatured,
        isNegotiable,
        accountLevel: accountLevel || null,
        accountRank: accountRank || null,
      } as any);
      toast.success("Informations produit mises à jour");
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const saveVisibility = async (next: boolean) => {
    setSaving(true);
    try {
      await updateProduct(product.id, { isVisible: next } as any);
      setIsVisible(next);
      toast.success("Visibilité mise à jour");
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const saveCredentials = async (login: string, pass: string) => {
    if (isLocked) {
      toast.error("Produit verrouillé: identifiants non modifiables.");
      throw new Error("locked");
    }
    try {
      await setProductCredentials(product.id, login, pass);
      toast.success("Identifiants mis à jour");
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de la mise à jour");
      throw e;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/30 backdrop-blur-sm rounded-[2rem] overflow-hidden">
        <CardHeader>
          <CardTitle className="font-bold uppercase tracking-tight flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" /> Informations produit
          </CardTitle>
          <CardDescription>
            Informations principales de l'annonce. {isLocked && "Verrouillées car le produit est vendu/payé."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-name">Nom</Label>
              <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} disabled={disabledCritical} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-game">Jeu</Label>
              <Input id="p-game" value={game} onChange={(e) => setGame(e.target.value)} disabled={disabledCritical} />
            </div>
            <div className="space-y-2">
              <Label>Plateforme</Label>
              <Select value={platform} onValueChange={setPlatform} disabled={disabledCritical}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-price">Prix</Label>
              <div className="flex gap-2">
                <Input id="p-price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} disabled={disabledCritical} />
                <Input className="w-28" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} disabled={disabledCritical} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={status} onValueChange={setStatus} disabled={disabledCritical}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-cats" className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> Catégories</Label>
              <Input id="p-cats" value={categories} onChange={(e) => setCategories(e.target.value)} disabled={disabledCritical} placeholder="séparées par des virgules" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="p-desc">Description</Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setDescription(generatedDescription); setDescTouched(false); }} disabled={disabledCritical}>
                Régénérer
              </Button>
            </div>
            <Textarea id="p-desc" rows={5} value={description} onChange={(e) => { setDescTouched(true); setDescription(e.target.value); }} disabled={disabledCritical} />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={isActive} onCheckedChange={setIsActive} disabled={disabledCritical} /> Actif
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} disabled={disabledCritical} /> En vedette
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={isNegotiable} onCheckedChange={setIsNegotiable} disabled={disabledCritical} /> Négociable
            </label>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" /> Images</Label>
            <AdvancedMultiUpload
              value={images}
              onChange={(urls) => { setImages(urls); if (!featuredImage || !urls.includes(featuredImage)) setFeaturedImage(urls[0] || ""); }}
              maxImages={8}
            />
            {featuredImage && <p className="text-xs text-muted-foreground">Image principale: {featuredImage}</p>}
          </div>

          <div className="flex justify-end">
            <Button onClick={saveGeneral} disabled={disabledCritical} className="gap-2">
              {isLocked && <Lock className="h-4 w-4" />} Enregistrer les informations
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className={cn("border-border/50 bg-card/30 backdrop-blur-sm rounded-[2rem] overflow-hidden", isLocked && "opacity-90") }>
        <CardHeader>
          <CardTitle className="font-bold uppercase tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Accès au compte
          </CardTitle>
          <CardDescription>
            Identifiants chiffrés transmis à l'acheteur. {isLocked && "Verrouillés après vente/paiement."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className={cn(isLocked && "pointer-events-none opacity-70")}>
              <AutoSyncField
                label="Nom d'utilisateur / Email"
                value={accountLogin}
                onChange={async (val) => {
                  await saveCredentials(val, accountPassword);
                  setAccountLogin(val);
                }}
                placeholder="Ex: player@gmail.com"
                className="bg-muted/10 p-4 rounded-3xl border border-border/50"
              />
            </div>
            <div className={cn(isLocked && "pointer-events-none opacity-70")}>
              <AutoSyncField
                label="Mot de passe"
                value={accountPassword}
                onChange={async (val) => {
                  await saveCredentials(accountLogin, val);
                  setAccountPassword(val);
                }}
                placeholder="••••••••"
                type="input"
                className="bg-muted/10 p-4 rounded-3xl border border-border/50"
                renderEdit={({ value, onChange, disabled, placeholder }) => (
                  <input
                    type="text"
                    value={value as string}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled || isLocked}
                    placeholder={placeholder}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm"
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-level">Niveau du compte</Label>
              <Input id="acc-level" value={accountLevel} onChange={(e) => setAccountLevel(e.target.value)} disabled={disabledCritical} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-rank">Rang du compte</Label>
              <Input id="acc-rank" value={accountRank} onChange={(e) => setAccountRank(e.target.value)} disabled={disabledCritical} />
            </div>
          </div>
          {isLocked && (
            <div className="flex flex-wrap gap-2 text-xs">
              {lockReason?.sold && <Badge variant="secondary">Statut: VENDU</Badge>}
              {lockReason?.paid && <Badge variant="secondary">Paiement/commande complétée</Badge>}
              {(lockReason?.completedOrders ?? 0) > 0 && <Badge variant="outline">{lockReason?.completedOrders} commande(s) complétée(s)</Badge>}
              {(lockReason?.completedTransactions ?? 0) > 0 && <Badge variant="outline">{lockReason?.completedTransactions} transaction(s) liée(s)</Badge>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/30 backdrop-blur-sm rounded-[2rem] overflow-hidden">
        <CardHeader>
          <CardTitle className="font-bold uppercase tracking-tight flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" /> Visibilité
          </CardTitle>
          <CardDescription>Contrôlez si le produit apparaît sur la marketplace.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/10 rounded-3xl border border-border/50">
            <AutoSyncField
              label="Produit public"
              value={isVisible}
              type="switch"
              editMode="auto"
              onChange={saveVisibility}
              className="flex items-center justify-between"
            />
            <p className="mt-2 ml-1 text-xs text-muted-foreground">
              Si désactivé, le produit n'apparaît pas dans les listes publiques.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
