"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Gamepad2,
  Trash2,
  Plus,
  Info,
  Layers,
  Globe,
  Tag as TagIcon,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Image as ImageIcon,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useGames, useCreateGame, useUpdateGame } from "@/hooks/use-games";
import { AdvancedMultiUpload } from "@/components/ui/advanced-multi-upload";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { GameAssetPicker } from "@/components/admin/game-asset-picker";

const PLATFORMS = [
  { value: "PC", label: "PC" },
  { value: "PLAYSTATION", label: "PlayStation" },
  { value: "XBOX", label: "Xbox" },
  { value: "NINTENDO_SWITCH", label: "Nintendo Switch" },
  { value: "MOBILE", label: "Mobile" },
  { value: "VR", label: "VR" },
  { value: "OTHER", label: "Autre" },
];

const gameFormSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  description: z.string().optional(),
  publisher: z.string().optional(),
  genre: z.string().optional(),
  platforms: z.array(z.enum(PLATFORMS.map(p => p.value) as [string, ...string[]])).min(1),
  profileImage: z.string().optional(),
  coverImage: z.string().optional(),
  website: z.string().optional(),
  minAge: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
  featured: z.boolean().default(false),
  popularity: z.coerce.number().default(0),
});

type GameFormData = z.infer<typeof gameFormSchema>;

function GameFormContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const action = params.action as string;
  const gameId = searchParams.get("id");

  const isEdit = (action === "edit" || action === "update") && gameId;
  const [activeTab, setActiveTab] = useState("info");
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: gameData, isLoading: isLoadingGame } = useGames(
    isEdit ? { filters: { id: gameId } } : undefined
  );

  const game = gameData?.pages?.[0]?.data?.[0];

  const createGame = useCreateGame();
  const updateGame = useUpdateGame();

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<GameFormData>({
    resolver: zodResolver(gameFormSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      publisher: "",
      genre: "",
      platforms: [],
      profileImage: "",
      coverImage: "",
      website: "",
      minAge: 0,
      isActive: true,
      featured: false,
      popularity: 0,
    },
  });

  useEffect(() => {
    if (isEdit && game) {
      reset({
        name: game.name,
        description: game.description ?? "",
        publisher: game.publisher ?? "",
        genre: game.genre ?? "",
        platforms: game.platforms ?? [],
        profileImage: game.profileImage ?? "",
        coverImage: game.coverImage ?? "",
        website: game.website ?? "",
        minAge: game.minAge ?? 0,
        isActive: game.isActive ?? true,
        featured: game.featured ?? false,
        popularity: game.popularity ?? 0,
      });
    }
  }, [isEdit, game, reset]);

  const onSubmit: SubmitHandler<GameFormData> = async (data) => {
    setSaving(true);
    try {
      if (isEdit && gameId) {
        await updateGame.mutateAsync({ id: gameId, data: data as any });
        toast.success("Jeu mis à jour avec succès");
      } else {
        await createGame.mutateAsync(data as any);
        toast.success("Jeu créé avec succès");
      }
      router.push("/admin/games");
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (isLoadingGame && isEdit) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Gamepad2 className="h-8 w-8 animate-bounce text-primary" />
          <p className="text-muted-foreground">Chargement du jeu...</p>
        </div>
      </div>
    );
  }

  const formData = watch();

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
            {isEdit ? "Modifier le jeu" : "Ajouter un nouveau jeu"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit
              ? "Modifiez les informations essentielles et visuelles du jeu."
              : "Remplissez les informations pour rendre le jeu disponible sur la plateforme."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" /> Éditer
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" /> Aperçu
              </>
            )}
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={saving || !!(isEdit && !isDirty)}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      {previewMode ? (
        <div className="space-y-6">
          <div className="relative min-h-[14rem] sm:h-64 w-full rounded-2xl overflow-hidden bg-muted group text-start flex flex-col justify-end p-4 sm:p-6">
            {formData.coverImage ? (
              <img
                src={formData.coverImage}
                alt="Cover"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-gradient-to-br from-primary/10 to-background">
                Pas de couverture
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4">
              <div className="h-16 w-16 sm:h-24 sm:w-24 rounded-xl border-2 sm:border-4 border-background overflow-hidden bg-background shadow-xl shrink-0 flex items-center justify-center">
                {formData.profileImage ? (
                  <img
                    src={formData.profileImage}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Gamepad2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="pb-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-md truncate">
                  {formData.name || "Sans nom"}
                </h2>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {formData.genre || "Genre inconnu"}
                  </Badge>
                  <Badge variant={formData.isActive ? "default" : "secondary"} className="text-xs">
                    {formData.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <Card className="text-start">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">
                {formData.description || "Aucune description fournie."}
              </p>
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                    Éditeur
                  </p>
                  <p className="font-medium">{formData.publisher || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                    Plateformes
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.platforms?.map((p) => (
                      <Badge key={p} variant="outline" className="text-[10px]">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                    Âge Min
                  </p>
                  <p className="font-medium">{formData.minAge}+ ans</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                    Popularité
                  </p>
                  <p className="font-medium flex items-center gap-1">
                    {formData.popularity} <Eye className="h-3 w-3" />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-start">
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="info">Informations de base</TabsTrigger>
                <TabsTrigger value="media">Médias & Visuels</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-blue-500" />
                      Identité du jeu
                    </CardTitle>
                    <CardDescription>
                      Informations textuelles et catégorisation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom du jeu *</Label>
                      <Input
                        id="name"
                        placeholder="Ex: EA SPORTS FC 24"
                        {...register("name")}
                        className={errors.name ? "border-destructive" : ""}
                      />
                      {errors.name && (
                        <p className="text-xs text-destructive">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="publisher">Éditeur</Label>
                        <Input
                          id="publisher"
                          placeholder="Ex: Electronic Arts"
                          {...register("publisher")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="genre">Genre</Label>
                        <Input
                          id="genre"
                          placeholder="Ex: Sport, Action, RPG"
                          {...register("genre")}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Plateformes de jeu *</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border rounded-lg bg-muted/20">
                        {PLATFORMS.map((platform) => (
                          <div
                            key={platform.value}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              id={`platform-${platform.value}`}
                              value={platform.value}
                              checked={formData.platforms?.includes(
                                platform.value
                              )}
                              onChange={(e) => {
                                const current = formData.platforms || [];
                                if (e.target.checked) {
                                  setValue(
                                    "platforms",
                                    [...current, platform.value],
                                    { shouldDirty: true }
                                  );
                                } else {
                                  setValue(
                                    "platforms",
                                    current.filter((p) => p !== platform.value),
                                    { shouldDirty: true }
                                  );
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label
                              htmlFor={`platform-${platform.value}`}
                              className="text-xs cursor-pointer"
                            >
                              {platform.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {errors.platforms && (
                        <p className="text-xs text-destructive">
                          {errors.platforms.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description complète</Label>
                      <Textarea
                        id="description"
                        placeholder="Présentez le jeu aux utilisateurs..."
                        rows={6}
                        {...register("description")}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minAge">Âge Minimum</Label>
                        <Input
                          id="minAge"
                          type="number"
                          {...register("minAge")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Site Officiel</Label>
                        <Input
                          id="website"
                          placeholder="https://..."
                          {...register("website")}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-purple-500" />
                      Visibilité & Statut
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label className="text-base">
                          Mettre en avant (Featured)
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Apparaîtra dans les sélections spéciales
                        </p>
                      </div>
                      <Controller
                        control={control}
                        name="featured"
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label className="text-base text-green-600">
                          Jeu Actif
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Désactivez pour masquer le jeu et ses items
                        </p>
                      </div>
                      <Controller
                        control={control}
                        name="isActive"
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="popularity">
                        Popularité (Score manuel)
                      </Label>
                      <Input
                        id="popularity"
                        type="number"
                        {...register("popularity")}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Plus le score est élevé, plus le jeu monte dans les
                        listes.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="media" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-orange-500" />
                      Visuels du jeu
                    </CardTitle>
                    <CardDescription>
                      Téléchargez le logo et l'image de couverture.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Logo / Image Profil</Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Image carrée recommandée (ex: 512x512px)
                          </p>
                        </div>
                        <GameAssetPicker
                          value={watch("profileImage")}
                          onChange={(url) => setValue("profileImage", url, { shouldDirty: true })}
                          title="Choisir une icône officielle ou 3D"
                        />
                      </div>
                      <Controller
                        control={control}
                        name="profileImage"
                        render={({ field }) => (
                          <AdvancedMultiUpload
                            value={field.value ? [field.value] : []}
                            onChange={(vals) => field.onChange(vals[0] || "")}
                            uploadPath="games/profiles"
                            maxImages={1}
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <Label>Image de Couverture (Banner)</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Image large recommandée (ex: 1920x600px)
                      </p>
                      <Controller
                        control={control}
                        name="coverImage"
                        render={({ field }) => (
                          <AdvancedMultiUpload
                            value={field.value ? [field.value] : []}
                            onChange={(vals) => field.onChange(vals[0] || "")}
                            uploadPath="games/covers"
                            maxImages={1}
                          />
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>État actuel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-muted-foreground">Nom:</span>
                  <span className="font-semibold">
                    {formData.name || "Nouveau Jeu"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-muted-foreground">Plateformes:</span>
                  <span className="font-semibold">
                    {formData.platforms?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-muted-foreground">
                    Actions requises:
                  </span>
                  <span
                    className={
                      formData.platforms?.length === 0 || !formData.name
                        ? "text-red-500 font-bold"
                        : "text-green-500"
                    }
                  >
                    {formData.platforms?.length === 0 || !formData.name
                      ? "Compléter infos"
                      : "Prêt à publier"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm">Conseil d'admin</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Assurez-vous d'utiliser des images de haute qualité pour les
                  couvertures. Un jeu bien présenté a 80% plus de chances
                  d'attirer des acheteurs pour ses items.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GameFormPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <GameFormContent />
    </Suspense>
  );
}
