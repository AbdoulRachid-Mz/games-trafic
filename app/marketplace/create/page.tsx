"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/contexts/auth-context";
import { useShopsByOwner } from "@/hooks/use-shops";
import { createProduct, setProductCredentials } from "@/actions/products";
import { generateProductDescription } from "@/lib/products/description";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { AdvancedMultiUpload } from "@/components/ui/advanced-multi-upload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Package,
  RefreshCw,
  Shield,
  Store,
  Wand2,
} from "lucide-react";
import Link from "next/link";

const PLATFORMS = [
  { value: "PC", label: "PC" },
  { value: "PLAYSTATION", label: "PlayStation" },
  { value: "XBOX", label: "Xbox" },
  { value: "NINTENDO_SWITCH", label: "Nintendo Switch" },
  { value: "MOBILE", label: "Mobile" },
  { value: "OTHER", label: "Autre" },
] as const;

type FormState = {
  name: string;
  game: string;
  platform: "PC" | "PLAYSTATION" | "XBOX" | "NINTENDO_SWITCH" | "MOBILE" | "OTHER";
  price: string;
  currency: string;
  description: string;
  categories: string;
  accountLogin: string;
  accountPassword: string;
  accountLevel: string;
  accountRank: string;
  images: string[];
  featuredImage: string;
  isVisible: boolean;
  isFeatured: boolean;
  isNegotiable: boolean;
};

const initialForm: FormState = {
  name: "",
  game: "",
  platform: "MOBILE",
  price: "",
  currency: "GTC",
  description: "",
  categories: "",
  accountLogin: "",
  accountPassword: "",
  accountLevel: "",
  accountRank: "",
  images: [],
  featuredImage: "",
  isVisible: true,
  isFeatured: false,
  isNegotiable: false,
};

export default function MarketplaceCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthContext();
  const preselectedShopId = searchParams.get("shopId") || "";
  const [step, setStep] = useState(1);
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [descTouched, setDescTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<
    { shopId: string; shopName: string; ok: boolean; productId?: string; error?: string }[]
  >([]);

  const { data: shopsRes, isLoading: shopsLoading } = useShopsByOwner(user?.id, {
    pagination: { page: 1, limit: 100 },
  });
  const shops = shopsRes?.data || [];

  useEffect(() => {
    if (preselectedShopId) {
      setSelectedShopIds((prev) =>
        prev.includes(preselectedShopId) ? prev : [...prev, preselectedShopId]
      );
    }
  }, [preselectedShopId]);

  const generatedDescription = useMemo(
    () =>
      generateProductDescription({
        name: form.name,
        game: form.game,
        platform: form.platform,
        price: form.price,
        currency: form.currency,
        accountLevel: form.accountLevel,
        accountRank: form.accountRank,
        categories: form.categories.split(",").map((c) => c.trim()).filter(Boolean),
      }),
    [
      form.name,
      form.game,
      form.platform,
      form.price,
      form.currency,
      form.accountLevel,
      form.accountRank,
      form.categories,
    ]
  );

  useEffect(() => {
    if (!descTouched) {
      setForm((prev) => ({ ...prev, description: generatedDescription }));
    }
  }, [generatedDescription, descTouched]);

  const toggleShop = (id: string) => {
    setSelectedShopIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const canGoStep2 = selectedShopIds.length > 0;
  const canGoStep3 =
    form.name.trim().length >= 2 && !!form.game.trim() && Number.parseFloat(form.price) > 0;

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("Vous devez être connecté.");
      return;
    }
    if (selectedShopIds.length === 0) {
      toast.error("Sélectionnez au moins une boutique.");
      setStep(1);
      return;
    }
    if (!canGoStep3) {
      toast.error("Veuillez compléter les informations du produit.");
      setStep(2);
      return;
    }

    setSubmitting(true);
    setResults([]);
    const created: typeof results = [];
    const categories = form.categories.split(",").map((c) => c.trim()).filter(Boolean);
    const images = form.images.filter(Boolean);
    const featuredImage = form.featuredImage || images[0] || "";

    for (const shopId of selectedShopIds) {
      const shopName = shops.find((s: any) => s.id === shopId)?.name || shopId;
      try {
        const product = await createProduct({
          shopId,
          userId: user.id,
          name: form.name.trim(),
          description: form.description?.trim() || generatedDescription,
          price: form.price,
          currency: form.currency || "GTC",
          game: form.game.trim(),
          platform: form.platform as any,
          status: "NON_VENDU" as any,
          images,
          featuredImage,
          accountLogin: form.accountLogin || null,
          accountLevel: form.accountLevel || null,
          accountRank: form.accountRank || null,
          isActive: true,
          isFeatured: form.isFeatured,
          isNegotiable: form.isNegotiable,
          isVisible: form.isVisible,
          categories,
        } as any);

        if (form.accountLogin && form.accountPassword) {
          try {
            await setProductCredentials(product.id, form.accountLogin, form.accountPassword);
          } catch (e: any) {
            created.push({
              shopId,
              shopName,
              ok: true,
              productId: product.id,
              error: `Produit créé, identifiants: ${e?.message || "erreur"}`,
            });
            continue;
          }
        }
        created.push({ shopId, shopName, ok: true, productId: product.id });
      } catch (e: any) {
        created.push({ shopId, shopName, ok: false, error: e?.message || "Erreur lors de la création" });
      }
    }

    setResults(created);
    setSubmitting(false);
    const okCount = created.filter((r) => r.ok).length;
    const failCount = created.length - okCount;
    if (okCount > 0 && failCount === 0) {
      toast.success(`${okCount} produit(s) créé(s) avec succès.`);
    } else if (okCount > 0) {
      toast.warning(`${okCount} créé(s), ${failCount} en échec.`);
    } else {
      toast.error("Aucun produit n'a pu être créé.");
    }
  };

  const successProducts = results.filter((r) => r.ok && r.productId);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Typography variant="h2" weight="bold">
            Créer un produit
          </Typography>
          <Typography variant="body-sm" theme="muted">
            Sélectionnez vos boutiques, renseignez le produit et publiez sur une ou plusieurs boutiques.
          </Typography>
        </div>
        <Button variant="outline" asChild>
          <Link href="/marketplace">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Marketplace
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Étapes de création">
        {[1, 2, 3].map((s) => (
          <Badge key={s} variant={step === s ? "default" : "secondary"} className="px-3 py-1">
            Étape {s}
          </Badge>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Boutique(s)
            </CardTitle>
            <CardDescription>
              Choisissez une ou plusieurs boutiques avant de définir le produit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!user ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Connectez-vous pour sélectionner vos boutiques.
              </div>
            ) : shopsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des boutiques...
              </div>
            ) : shops.length === 0 ? (
              <div className="space-y-3 rounded-xl border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">Vous n'avez pas encore de boutique.</p>
                <Button asChild>
                  <Link href="/shops/create">Créer une boutique</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {shops.map((shop: any) => {
                  const checked = selectedShopIds.includes(shop.id);
                  return (
                    <label
                      key={shop.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                        checked ? "border-primary bg-primary/5" : "hover:border-primary/40"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleShop(shop.id)}
                        aria-label={`Sélectionner ${shop.name}`}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{shop.name}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {shop.description || "Aucune description"}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!canGoStep2}>
                Continuer <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Informations produit
            </CardTitle>
            <CardDescription>
              Décrivez le produit. La description est générée automatiquement et reste modifiable.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du produit *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Compte Rare"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="game">Jeu *</Label>
                <Input
                  id="game"
                  value={form.game}
                  onChange={(e) => setForm({ ...form, game: e.target.value })}
                  placeholder="Ex: eFootball"
                />
              </div>
              <div className="space-y-2">
                <Label>Plateforme</Label>
                <Select value={form.platform} onValueChange={(v: any) => setForm({ ...form, platform: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Prix *</Label>
                <div className="flex gap-2">
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
                  />
                  <Input
                    className="w-28"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                    placeholder="GTC"
                    aria-label="Devise"
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="categories">Catégories (séparées par des virgules)</Label>
                <Input
                  id="categories"
                  value={form.categories}
                  onChange={(e) => setForm({ ...form, categories: e.target.value })}
                  placeholder="compte, rare, premium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="description">Description</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    setForm((p) => ({ ...p, description: generatedDescription }));
                    setDescTouched(false);
                  }}
                >
                  <Wand2 className="h-4 w-4" />
                  Régénérer
                </Button>
              </div>
              <Textarea
                id="description"
                rows={5}
                value={form.description}
                onChange={(e) => {
                  setDescTouched(true);
                  setForm({ ...form, description: e.target.value });
                }}
              />
              <p className="text-xs text-muted-foreground">
                Générée automatiquement à partir des informations saisies (modifiable).
              </p>
            </div>

            <div className="space-y-2">
              <Label>Images du produit</Label>
              <AdvancedMultiUpload
                value={form.images}
                onChange={(urls) =>
                  setForm((p) => ({
                    ...p,
                    images: urls,
                    featuredImage: p.featuredImage || urls[0] || "",
                  }))
                }
                maxImages={5}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canGoStep3}>
                Continuer <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Compte, visibilité & publication
            </CardTitle>
            <CardDescription>
              Informations de compte (optionnel) et options de publication.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="accountLogin">Identifiant / Email du compte</Label>
                <Input
                  id="accountLogin"
                  value={form.accountLogin}
                  onChange={(e) => setForm({ ...form, accountLogin: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountPassword">Mot de passe du compte</Label>
                <Input
                  id="accountPassword"
                  type="text"
                  value={form.accountPassword}
                  onChange={(e) => setForm({ ...form, accountPassword: e.target.value })}
                  placeholder="Transmis de façon sécurisée"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountLevel">Niveau</Label>
                <Input
                  id="accountLevel"
                  value={form.accountLevel}
                  onChange={(e) => setForm({ ...form, accountLevel: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountRank">Rang</Label>
                <Input
                  id="accountRank"
                  value={form.accountRank}
                  onChange={(e) => setForm({ ...form, accountRank: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex items-center gap-2 rounded-lg border p-3">
                <Checkbox
                  checked={form.isVisible}
                  onCheckedChange={(v) => setForm({ ...form, isVisible: !!v })}
                />
                <span className="text-sm">Visible sur la marketplace</span>
              </label>
              <label className="flex items-center gap-2 rounded-lg border p-3">
                <Checkbox
                  checked={form.isFeatured}
                  onCheckedChange={(v) => setForm({ ...form, isFeatured: !!v })}
                />
                <span className="text-sm">Mettre en avant</span>
              </label>
              <label className="flex items-center gap-2 rounded-lg border p-3">
                <Checkbox
                  checked={form.isNegotiable}
                  onCheckedChange={(v) => setForm({ ...form, isNegotiable: !!v })}
                />
                <span className="text-sm">Prix négociable</span>
              </label>
            </div>

            <div className="space-y-1 rounded-xl border bg-muted/30 p-4 text-sm">
              <p>
                <strong>Boutiques ciblées:</strong> {selectedShopIds.length}
              </p>
              <p>
                <strong>Produit:</strong> {form.name || "—"} • {form.game || "—"} • {form.price || "—"}{" "}
                {form.currency}
              </p>
            </div>

            {results.length > 0 && (
              <div className="space-y-2 rounded-xl border p-4">
                <p className="font-medium">Résultats</p>
                {results.map((r) => (
                  <div key={r.shopId} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{r.shopName}</span>
                    <span className={r.ok ? "text-green-600" : "text-destructive"}>
                      {r.ok ? (r.error ? r.error : "Créé") : r.error}
                    </span>
                  </div>
                ))}
                {successProducts.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {successProducts.map((r) => (
                      <Button key={r.productId} size="sm" variant="outline" asChild>
                        <Link href={`/marketplace/${r.productId}/dashboard`}>Gérer {r.shopName}</Link>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep(2)} disabled={submitting}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <Button onClick={handleSubmit} disabled={submitting || !user} className="gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {submitting ? "Publication..." : `Publier sur ${selectedShopIds.length} boutique(s)`}
              </Button>
            </div>

            {successProducts.length > 0 && !submitting && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/shops/${selectedShopIds[0]}/dashboard/products`)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retour aux produits
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
