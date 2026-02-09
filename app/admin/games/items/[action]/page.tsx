"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Package,
  Coins,
  Shield,
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Gamepad2,
  DollarSign,
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

const ITEM_TYPES = [
  {
    value: "COIN",
    label: "Coins / Cash",
    icon: Coins,
    color: "text-yellow-500",
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
    icon: Shield,
    color: "text-green-500",
  },
  {
    value: "CURRENCY",
    label: "Devise locale",
    icon: Coins,
    color: "text-orange-500",
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
    // @ts-ignore
    resolver: zodResolver(gameItemFormSchema),
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
        isActive: (item.isActive ?? true) as boolean,
        featured: (item.featured ?? false) as boolean,
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
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const selectedGame = gamesData?.pages?.[0]?.data?.find(
    (g) => g.id === watch("gameId")
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 text-start">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-2 p-0 hover:bg-transparent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? "Modifier l'item" : "Ajouter un nouvel item"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit
              ? "Modifiez le prix, la disponibilité et les informations de cet item."
              : "Créez un nouvel item pour l'un des jeux de la plateforme."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            // @ts-ignore
            onClick={handleSubmit(onSubmit)}
            disabled={saving || !!(isEdit && !isDirty)}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 text-start">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-blue-500" />
                Sélection du Jeu
              </CardTitle>
              <CardDescription>
                Choisissez le jeu auquel appartient cet item.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gameId">Jeu *</Label>
                  <Controller
                    control={control}
                    name="gameId"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          className={errors.gameId ? "border-destructive" : ""}
                        >
                          <SelectValue placeholder="Sélectionnez un jeu" />
                        </SelectTrigger>
                        <SelectContent>
                          {gamesData?.pages?.[0]?.data?.map((game) => (
                            <SelectItem key={game.id} value={game.id}>
                              <div className="flex items-center gap-2 text-start">
                                <Avatar className="h-5 w-5 rounded-full">
                                  <AvatarImage src={game.profileImage || ""} />
                                  <AvatarFallback>
                                    <Gamepad2 className="h-3 w-3" />
                                  </AvatarFallback>
                                </Avatar>
                                {game.name}
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
                  <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 flex items-center gap-4">
                    <Avatar className="h-12 w-12 rounded-lg">
                      <AvatarImage src={selectedGame.profileImage || ""} />
                      <AvatarFallback>
                        <Gamepad2 className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-blue-900 dark:text-blue-100">
                        {selectedGame.name}
                      </p>
                      <p className="text-xs text-blue-700/70 dark:text-blue-400/70">
                        {selectedGame.publisher} • {selectedGame.genre}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-purple-500" />
                Informations de l'item
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l'item *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: 1000 Gems, Dragon Scale..."
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type d'item *</Label>
                  <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Type d'item" />
                        </SelectTrigger>
                        <SelectContent>
                          {ITEM_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2 text-start">
                                <type.icon
                                  className={`h-4 w-4 ${type.color}`}
                                />
                                {type.label}
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Détails sur l'item (ex: livraison automatique, bonus...)"
                  rows={4}
                  {...register("description")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">URL de l'image / icône</Label>
                <Input
                  id="icon"
                  placeholder="https://..."
                  {...register("icon")}
                />
                <p className="text-[10px] text-muted-foreground">
                  Une petite image carrée est idéale pour les items.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Tarification & Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priceGtc">Prix (GTC) *</Label>
                  <div className="relative">
                    <Input
                      id="priceGtc"
                      type="number"
                      step="0.01"
                      className="pl-8"
                      {...register("priceGtc")}
                    />
                    <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-bold">
                      G
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minOrder">Min Commande</Label>
                  <Input
                    id="minOrder"
                    type="number"
                    step="0.01"
                    {...register("minOrder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxOrder">Max Commande</Label>
                  <Input
                    id="maxOrder"
                    type="number"
                    step="0.01"
                    {...register("maxOrder")}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] space-y-2">
                  <Label htmlFor="availability">Disponibilité</Label>
                  <Controller
                    control={control}
                    name="availability"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABILITY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="flex-1 min-w-[200px] space-y-2">
                  <Label htmlFor="processingTime">Délai estimé</Label>
                  <Input
                    id="processingTime"
                    placeholder="Ex: 5min, 1h, 24h..."
                    {...register("processingTime")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 text-start">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-4 w-4" /> Statut
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Actif / Visible</Label>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={(val: boolean) => field.onChange(val)}
                    />
                  )}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Mettre en vedette</Label>
                <Controller
                  control={control}
                  name="featured"
                  render={({ field }) => (
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={(val: boolean) => field.onChange(val)}
                    />
                  )}
                />
              </div>
              <div className="space-y-2 pt-2">
                <Label htmlFor="popularity">Popularité</Label>
                <Input
                  id="popularity"
                  type="number"
                  {...register("popularity")}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50 border-dashed">
            <CardHeader>
              <CardTitle className="text-xs">Aperçu rapide</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="h-20 w-20 rounded-xl bg-background border flex items-center justify-center p-2 mb-4 shadow-sm">
                {watch("icon") ? (
                  <img
                    src={watch("icon") || ""}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  React.createElement(
                    ITEM_TYPES.find((t) => t.value === watch("type"))?.icon ||
                      Package,
                    {
                      className: `h-10 w-10 ${
                        ITEM_TYPES.find((t) => t.value === watch("type"))
                          ?.color || "text-muted-foreground"
                      }`,
                    }
                  )
                )}
              </div>
              <h3 className="font-bold text-center">
                {watch("name") || "Nom de l'item"}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                {selectedGame?.name || "Jeu non sélectionné"}
              </p>
              <Badge className="bg-green-600 text-lg py-1 px-4">
                {watch("priceGtc")} GTC
              </Badge>
            </CardContent>
          </Card>

          <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
            <div className="flex gap-2 text-yellow-800 dark:text-yellow-200 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Note de sécurité
              </span>
            </div>
            <p className="text-xs text-yellow-900/70 dark:text-yellow-100/70 leading-relaxed">
              Les items à prix élevé ou les devises nécessitent généralement une
              vérification manuelle des transactions. Assurez-vous de définir un
              temps de traitement réaliste.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GameItemFormPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <GameItemFormContent />
    </Suspense>
  );
}
