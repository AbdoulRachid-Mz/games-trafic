"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Package,
  Coins,
  Shield,
  Zap,
  Gem,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Gamepad2,
  DollarSign,
  Sparkles,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useGames,
  useGameItems,
  useCreateGameItem,
  useUpdateGameItem,
} from "@/hooks/use-games";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GameAssetPicker } from "@/components/admin/game-asset-picker";
import { GameItemVisual } from "@/components/pages/games/game-item-visual";
import { GameItemWithRelations } from "@/database/schema";
import Image from "next/image";

const ITEM_TYPES = [
  {
    value: "COIN",
    label: "Coins / Cash",
    icon: Coins,
    color: "text-amber-500",
  },
  {
    value: "ITEM",
    label: "Item de jeu",
    icon: Package,
    color: "text-blue-500",
  },
  {
    value: "SKIN",
    label: "Skin / Apparence",
    icon: Shield,
    color: "text-purple-500",
  },
  {
    value: "EQUIPMENT",
    label: "Équipement",
    icon: Zap,
    color: "text-emerald-500",
  },
  {
    value: "CURRENCY",
    label: "Devise gaming",
    icon: Gem,
    color: "text-rose-500",
  },
];

const AVAILABILITY_OPTIONS = [
  { value: "AVAILABLE", label: "Disponible" },
  { value: "OUT_OF_STOCK", label: "Rupture de stock" },
  { value: "PRE_ORDER", label: "Pré-commande" },
  { value: "UNAVAILABLE", label: "Non disponible" },
];

const gameItemFormSchema = z.object({
  gameId: z.string().min(1, "Le jeu est requis"),
  name: z.string().min(1, "Le nom est requis").max(100),
  type: z.enum(["COIN", "ITEM", "SKIN", "EQUIPMENT", "CURRENCY"]),
  description: z.string().optional(),
  icon: z.string().optional(),
  priceGtc: z.coerce.number().min(0.01, "Le prix minimum est 0.01"),
  exchangeRate: z.coerce.number().default(1),
  minOrder: z.coerce.number().default(1),
  maxOrder: z.coerce.number().default(1000),
  availability: z.string().default("AVAILABLE"),
  processingTime: z.string().default("24h"),
  isActive: z.boolean().default(true),
  featured: z.boolean().default(false),
  popularity: z.coerce.number().default(0),
});

type GameItemFormData = z.infer<typeof gameItemFormSchema>;

function GameItemFormContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const action = params.action as string;
  const itemId = searchParams.get("id");

  const isEdit = (action === "edit" || action === "update") && itemId;
  const [saving, setSaving] = useState(false);

  // Fetch all games for selection
  const { data: gamesData, isLoading: isLoadingGames } = useGames({
    filters: { isActive: true },
    pagination: { page: 1, limit: 100 },
  });

  // Fetch item in edit mode
  const { data: itemData, isLoading: isLoadingItem } = useGameItems(
    isEdit ? { filters: { id: itemId } } : undefined
  );

  const item = itemData?.pages?.[0]?.data?.[0];

  const createItem = useCreateGameItem();
  const updateItem = useUpdateGameItem();

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<GameItemFormData>({
    resolver: zodResolver(gameItemFormSchema) as any,
    defaultValues: {
      gameId: "",
      name: "",
      type: "ITEM",
      description: "",
      icon: "",
      priceGtc: 1,
      exchangeRate: 1,
      minOrder: 1,
      maxOrder: 1000,
      availability: "AVAILABLE",
      processingTime: "24h",
      isActive: true,
      featured: false,
      popularity: 0,
    },
  });

  useEffect(() => {
    if (isEdit && item) {
      reset({
        gameId: item.gameId,
        name: item.name,
        type: item.type as any,
        description: item.description ?? "",
        icon: item.icon ?? "",
        priceGtc: Number(item.priceGtc),
        exchangeRate: Number(item.exchangeRate ?? 1),
        minOrder: Number(item.minOrder ?? 1),
        maxOrder: Number(item.maxOrder ?? 1000),
        availability: item.availability ?? "AVAILABLE",
        processingTime: item.processingTime ?? "24h",
        isActive: Boolean(item.isActive ?? true),
        featured: Boolean(item.featured ?? false),
        popularity: item.popularity ?? 0,
      });
    }
  }, [isEdit, item, reset]);

  const onSubmit: SubmitHandler<GameItemFormData> = async (data) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        priceGtc: data.priceGtc.toString(),
        exchangeRate: data.exchangeRate?.toString() || "1",
        minOrder: data.minOrder?.toString() || "1",
        maxOrder: data.maxOrder?.toString() || "1000",
      };

      if (isEdit && itemId) {
        await updateItem.mutateAsync({ id: itemId, data: payload as any });
        toast.success("Item mis à jour avec succès");
      } else {
        await createItem.mutateAsync(payload as any);
        toast.success("Item créé avec succès");
      }
      router.push("/admin/games/items");
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if ((isLoadingItem && isEdit) || isLoadingGames) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Package className="h-8 w-8 animate-bounce text-primary" />
          <p className="text-muted-foreground text-sm">Chargement des données...</p>
        </div>
      </div>
    );
  }

  const selectedGame = gamesData?.pages?.[0]?.data?.find(
    (g) => g.id === watch("gameId")
  );

  const formValues = watch();

  // Pseudo item for preview with GameItemVisual
  const previewItem: GameItemWithRelations = {
    id: itemId || "preview",
    gameId: formValues.gameId || "",
    name: formValues.name || "Nom de l'item",
    type: formValues.type,
    description: formValues.description || null,
    icon: formValues.icon || null,
    priceGtc: formValues.priceGtc?.toString() || "0",
    exchangeRate: formValues.exchangeRate?.toString() || "1",
    minOrder: formValues.minOrder?.toString() || "1",
    maxOrder: formValues.maxOrder?.toString() || "1000",
    availability: formValues.availability as any,
    processingTime: formValues.processingTime || "24h",
    isActive: formValues.isActive,
    featured: formValues.featured,
    popularity: formValues.popularity,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    game: selectedGame ? {
      id: selectedGame.id,
      name: selectedGame.name,
      profileImage: selectedGame.profileImage || null,
    } : undefined,
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* Header bar responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-start">
        <div className="space-y-1">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-1 p-0 h-auto hover:bg-transparent text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Retour à la liste des items
          </Button>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            {isEdit ? "Modifier l'item" : "Ajouter un nouvel item"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isEdit
              ? "Modifiez le prix, la disponibilité et les visuels 3D de cet item."
              : "Créez un nouvel item pour l'un des jeux de la plateforme avec visuels 3D."}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={saving || Boolean(isEdit && !isDirty)}
            className="w-full sm:w-auto rounded-xl font-black uppercase tracking-wider text-xs shadow-lg shadow-primary/20"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Formulaire principal (2 cols) */}
        <div className="lg:col-span-2 space-y-6 text-start">
          {/* Jeu */}
          <Card className="rounded-2xl border-border/60 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-primary" />
                Sélection du Jeu
              </CardTitle>
              <CardDescription className="text-xs">
                Choisissez le jeu auquel appartient cet item.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gameId" className="text-xs font-bold uppercase tracking-wider">Jeu *</Label>
                <Controller
                  control={control}
                  name="gameId"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        className={errors.gameId ? "border-destructive rounded-xl" : "rounded-xl"}
                      >
                        <SelectValue placeholder="Sélectionnez un jeu" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {gamesData?.pages?.[0]?.data?.map((game) => (
                          <SelectItem key={game.id} value={game.id}>
                            <div className="flex items-center gap-2 text-start">
                              <Avatar className="h-5 w-5 rounded-md">
                                <AvatarImage src={game.profileImage || ""} />
                                <AvatarFallback>
                                  <Gamepad2 className="h-3 w-3" />
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-semibold text-xs">{game.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.gameId && (
                  <p className="text-xs text-destructive">
                    {errors.gameId.message}
                  </p>
                )}
              </div>

              {selectedGame && (
                <div className="bg-primary/5 p-3 sm:p-4 rounded-xl border border-primary/20 flex items-center gap-3">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl border border-primary/20">
                    <AvatarImage src={selectedGame.profileImage || ""} />
                    <AvatarFallback className="bg-primary/10">
                      <Gamepad2 className="h-5 w-5 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate">
                      {selectedGame.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedGame.publisher || "Éditeur"} • {selectedGame.genre || "Genre"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations */}
          <Card className="rounded-2xl border-border/60 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <Info className="h-4 w-4 text-purple-400" />
                Informations & Visuel 3D
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider">Nom de l'item *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: 5000 eFootball Coins, Skin Ghost..."
                    className="rounded-xl"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider">Type d'item *</Label>
                  <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Type d'item" />
                        </SelectTrigger>
                        <SelectContent>
                          {ITEM_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2 text-start">
                                <type.icon
                                  className={`h-4 w-4 ${type.color}`}
                                />
                                <span className="font-semibold text-xs">{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Détails sur l'item, instructions de livraison..."
                  rows={3}
                  className="rounded-xl resize-none"
                  {...register("description")}
                />
              </div>

              {/* Sélecteur d'icône & Assets 3D */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="icon" className="text-xs font-bold uppercase tracking-wider">
                    Image / Icône 3D
                  </Label>
                  <GameAssetPicker
                    value={watch("icon")}
                    onChange={(url) => setValue("icon", url, { shouldDirty: true })}
                    title="Choisir un asset 3D pour l'item"
                  />
                </div>
                <Input
                  id="icon"
                  placeholder="URL personnalisée ou choisir dans la bibliothèque ci-dessus"
                  className="rounded-xl text-xs font-mono"
                  {...register("icon")}
                />
                <p className="text-[11px] text-muted-foreground">
                  Utilisez un PNG 3D officiel (ex: eFootball coins, COD crate, airdrop) ou une icône GT pour un rendu optimal.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tarification */}
          <Card className="rounded-2xl border-border/60 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                Tarification & Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priceGtc" className="text-xs font-bold uppercase tracking-wider">Prix (GTC) *</Label>
                  <div className="relative">
                    <Input
                      id="priceGtc"
                      type="number"
                      step="0.01"
                      className="pl-8 rounded-xl font-bold"
                      {...register("priceGtc")}
                    />
                    <span className="absolute left-3 top-2.5 text-xs text-primary font-black">
                      G
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minOrder" className="text-xs font-bold uppercase tracking-wider">Min Commande</Label>
                  <Input
                    id="minOrder"
                    type="number"
                    step="1"
                    className="rounded-xl"
                    {...register("minOrder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxOrder" className="text-xs font-bold uppercase tracking-wider">Max Commande</Label>
                  <Input
                    id="maxOrder"
                    type="number"
                    step="1"
                    className="rounded-xl"
                    {...register("maxOrder")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="availability" className="text-xs font-bold uppercase tracking-wider">Disponibilité</Label>
                  <Controller
                    control={control}
                    name="availability"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABILITY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <span className="text-xs font-semibold">{opt.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="processingTime" className="text-xs font-bold uppercase tracking-wider">Délai estimé</Label>
                  <Input
                    id="processingTime"
                    placeholder="Ex: Instant, 5min, 1h, 24h..."
                    className="rounded-xl"
                    {...register("processingTime")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne Latérale : Prévisualisation & Statut */}
        <div className="space-y-6 text-start">
          {/* Aperçu fidèle Marketplace avec GameItemVisual */}
          <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden shadow-lg">
            <CardHeader className="pb-2 bg-muted/30">
              <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center justify-between">
                <span>Aperçu Marketplace</span>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                  Live Preview
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="rounded-2xl overflow-hidden border border-border/50 bg-background/50">
                <GameItemVisual
                  item={previewItem}
                  mode="card"
                  withGTBranding={true}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-black text-sm uppercase tracking-tight truncate">
                    {watch("name") || "Nom de l'item"}
                  </h3>
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    {watch("type")}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground truncate">
                  {selectedGame?.name || "Jeu non sélectionné"}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-border/40">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-primary">
                      {watch("priceGtc") || 0}
                    </span>
                    <span className="text-[10px] font-black text-primary/70">GTC</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    ~{watch("processingTime") || "Instant"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Options de visibilité */}
          <Card className="rounded-2xl border-border/60 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Options & Statut
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider">Actif / Visible</Label>
                  <p className="text-[10px] text-muted-foreground">Visible sur le catalogue public</p>
                </div>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch
                      checked={Boolean(field.value)}
                      onCheckedChange={(val: boolean) => field.onChange(val)}
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider">Mettre en vedette</Label>
                  <p className="text-[10px] text-muted-foreground">Affiché en tête de liste</p>
                </div>
                <Controller
                  control={control}
                  name="featured"
                  render={({ field }) => (
                    <Switch
                      checked={Boolean(field.value)}
                      onCheckedChange={(val: boolean) => field.onChange(val)}
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border/40">
                <Label htmlFor="popularity" className="text-xs font-bold uppercase tracking-wider">Score Popularité</Label>
                <Input
                  id="popularity"
                  type="number"
                  className="rounded-xl h-9 text-xs"
                  {...register("popularity")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Note de sécurité */}
          <div className="bg-amber-500/10 p-3.5 rounded-2xl border border-amber-500/20 text-start space-y-1">
            <div className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-[11px] font-black uppercase tracking-wider">
                Recommandation
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Pour une intégration parfaite, associez les items de type <strong>COIN</strong> ou <strong>CURRENCY</strong> avec l'icône de jeton GTC ou les coins 3D du jeu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GameItemFormPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Chargement du formulaire...</div>}>
      <GameItemFormContent />
    </Suspense>
  );
}
