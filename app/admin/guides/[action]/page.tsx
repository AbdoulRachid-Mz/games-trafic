// app/admin/guides/[action]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Link,
  Save,
  X,
  ChevronUp,
  ChevronDown,
  Copy,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  useFieldArray,
  Controller,
  SubmitHandler,
} from "react-hook-form";
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
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useGuides, useCreateGuide, useUpdateGuide } from "@/hooks/use-guides";
import { useAuthContext } from "@/contexts/auth-context";
import { AdvancedMultiUpload } from "@/components/ui/advanced-multi-upload";
import { SuccessDialog, ErrorDialog } from "@/components/shared/result-dialog";
import {
  GuideStep,
  GuideWithRelations,
  NewGuide,
  NewGuideStep,
} from "@/database/schema";

// Predefined categories matching entityTypeEnum values
const GUIDE_CATEGORIES = [
  { value: "getting-started", label: "Premiers pas" },
  { value: "shops", label: "Boutiques" },
  { value: "tournaments", label: "Tournois" },
  { value: "wallet", label: "Portefeuille" },
  { value: "products", label: "Produits" },
  { value: "security", label: "Sécurité" },
  { value: "vip", label: "Programme VIP" },
  { value: "community", label: "Communauté" },
  { value: "technical", label: "Support technique" },
] as const;

// Form schema and types
const guideFormSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1),
  description: z.string().optional(),

  images: z.array(z.string()),           // ⬅️ REQUIRED
  isActive: z.boolean(),
  isDeleted: z.boolean(),
  viewCount: z.number(),
  adminId: z.string().optional(),

  steps: z.array(
    z.object({
      id: z.string().optional(),
      order: z.number().min(1),
      title: z.string().min(1),
      content: z.string().min(1),
      images: z.array(z.string()),        // ⬅️ REQUIRED
    })
  ).min(1),
});


type GuideFormData = z.infer<typeof guideFormSchema>;

export default function GuideFormPage() {
  const router = useRouter();
  const params = useParams();
  const action = params.action as "create" | "edit";
  const guideId = params.id as string | undefined;

  const isEdit = action === "edit" && guideId;
  const [activeTab, setActiveTab] = useState("info");
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { user } = useAuthContext();

  // Fetch guide in edit mode
  const { data: guideData, isLoading: isLoadingGuide } = useGuides(
    isEdit
      ? {
          filters: { id: guideId },
          options: { includeDeleted: false },
        }
      : undefined
  );

  const guide = guideData?.data?.[0] as GuideWithRelations | undefined;

  // Mutations
  const createGuide = useCreateGuide();
  const updateGuide = useUpdateGuide();

  // Form initialization
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isDirty },
  } = useForm<GuideFormData>({
    resolver: zodResolver(guideFormSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      images: [],
      isActive: true,
      isDeleted: false,
      viewCount: 0,
      steps: [
        {
          order: 1,
          title: "",
          content: "",
          images: [],
        },
      ],
    },
  });

  // Field array for steps
  const { fields, append, remove, move, update } = useFieldArray({
    control,
    name: "steps",
  });

  // Load guide data in edit mode
  useEffect(() => {
    if (isEdit && guide) {
      reset({
        title: guide.title,
        category: guide.category,
        description: guide.description ?? "",
        images: guide.images ?? [],
        isActive: guide.isActive ?? true,
        isDeleted: guide.isDeleted ?? false,
        viewCount: guide.viewCount ?? 0,
        steps:
          guide.steps?.map((step: GuideStep, index: number) => ({
            id: step.id,
            order: step.order ?? index + 1,
            title: step.title,
            content: step.content,
            images: step.images ?? [],
          })) ?? [],
      });
    }
  }, [isEdit, guide, reset]);

  // Ajouter une étape
  const addStep = () => {
    const lastOrder =
      fields.length > 0 ? Math.max(...fields.map((f) => f.order)) : 0;
    append({
      order: lastOrder + 1,
      title: "",
      content: "",
      images: [],
    });
  };

  // Dupliquer une étape
  const duplicateStep = (index: number) => {
    const step = getValues(`steps.${index}`);
    const lastOrder =
      fields.length > 0 ? Math.max(...fields.map((f) => f.order)) : 0;
    append({
      ...step,
      order: lastOrder + 1,
      title: `${step.title} (copie)`,
    });
  };

  // Monter/descendre une étape
  const moveStep = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index > 0) {
      move(index, index - 1);
      // Mettre à jour les ordres
      fields.forEach((field, i) => {
        update(i, { ...field, order: i + 1 });
      });
    } else if (direction === "down" && index < fields.length - 1) {
      move(index, index + 1);
      // Mettre à jour les ordres
      fields.forEach((field, i) => {
        update(i, { ...field, order: i + 1 });
      });
    }
  };

  // Soumission du formulaire
  const onSubmit: SubmitHandler<GuideFormData> = async (data) => {
    if (!user?.id) return;

    const payload = {
      ...data,
      adminId: user.id,
      steps: data.steps.map((s, i) => ({
        ...s,
        order: i + 1,
      })),
    };

    if (isEdit && guideId) {
      await updateGuide.mutateAsync({ id: guideId, data: payload });
    } else {
      await createGuide.mutateAsync(payload);
    }
  };

  // Prévisualisation
  const renderPreview = () => {
    const formData = watch();
    return (
      <div className="space-y-6">
        {/* En-tête du guide */}
        <div className="border rounded-lg p-6 bg-gradient-to-r from-primary/5 to-primary/10">
          <Typography variant="h1" weight="bold" className="mb-2">
            {formData.title || "Sans titre"}
          </Typography>
          <div className="flex items-center gap-2 mb-4">
            <Badge>{formData.category || "Non catégorisé"}</Badge>
            <Badge variant={formData.isActive ? "default" : "secondary"}>
              {formData.isActive ? "Actif" : "Inactif"}
            </Badge>
          </div>
          {formData.description && (
            <Typography variant="lead">{formData.description}</Typography>
          )}
        </div>

        {/* Images du guide */}
        {formData.images && formData.images.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image}
                  alt={`Image ${index + 1}`}
                  className="rounded-lg w-full h-48 object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Étapes */}
        <div className="space-y-6">
          {formData.steps.map((step, index) => (
            <Card key={index} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Étape {index + 1}</Badge>
                      <CardTitle>{step.title || "Sans titre"}</CardTitle>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Typography
                  variant="body-base"
                  className="whitespace-pre-wrap mb-4"
                >
                  {step.content}
                </Typography>

                {/* Images de l'étape */}
                {step.images && step.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {step.images.map((image, imgIndex) => (
                      <img
                        key={imgIndex}
                        src={image}
                        alt={`Image étape ${index + 1}`}
                        className="rounded-lg w-full h-32 object-cover"
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  if (isLoadingGuide && isEdit) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Typography variant="h3">Chargement du guide...</Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Typography variant="h1" weight="bold">
            {isEdit ? "Modifier le guide" : "Créer un nouveau guide"}
          </Typography>
          <Typography variant="lead" theme="muted">
            {isEdit
              ? "Modifiez les informations du guide et ses étapes"
              : "Créez un guide complet avec plusieurs étapes"}
          </Typography>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Éditer
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Prévisualiser
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

      {/* Mode prévisualisation */}
      {previewMode ? (
        renderPreview()
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire principal */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="info">Informations</TabsTrigger>
                <TabsTrigger value="steps">
                  Étapes ({fields.length})
                </TabsTrigger>
              </TabsList>

              {/* Informations du guide */}
              <TabsContent value="info" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations générales</CardTitle>
                    <CardDescription>
                      Définissez le titre, la catégorie et la description
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Titre */}
                    <div className="space-y-2">
                      <Label htmlFor="title">Titre *</Label>
                      <Input
                        id="title"
                        placeholder="Ex: Comment créer une boutique"
                        {...register("title")}
                        className={errors.title ? "border-destructive" : ""}
                      />
                      {errors.title && (
                        <Typography variant="caption1" theme="danger">
                          {errors.title.message}
                        </Typography>
                      )}
                    </div>

                    {/* Catégorie */}
                    <div className="space-y-2">
                      <Label htmlFor="category">Catégorie *</Label>
                      <Controller
                        control={control}
                        name="category"
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger
                              className={
                                errors.category ? "border-destructive" : ""
                              }
                            >
                              <SelectValue placeholder="Sélectionnez une catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                              {GUIDE_CATEGORIES.map((category) => (
                                <SelectItem
                                  key={category.value}
                                  value={category.value}
                                >
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.category && (
                        <Typography variant="caption1" theme="danger">
                          {errors.category.message}
                        </Typography>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Description détaillée du guide..."
                        rows={4}
                        {...register("description")}
                      />
                    </div>

                    {/* Images du guide */}
                    <div className="space-y-4">
                      <Label>Images du guide</Label>
                      <Controller
                        control={control}
                        name="images"
                        render={({ field }) => (
                          <AdvancedMultiUpload
                            value={field.value ?? []}
                            onChange={field.onChange}
                            uploadPath="guides/main"
                            disabled={saving}
                          />
                        )}
                      />
                    </div>

                    {/* Statut */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label htmlFor="isActive" className="font-medium">
                          Guide actif
                        </Label>
                        <Typography variant="caption1" theme="muted">
                          Le guide sera visible par les utilisateurs
                        </Typography>
                      </div>
                      <Controller
                        control={control}
                        name="isActive"
                        render={({ field }) => (
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Étapes du guide */}
              <TabsContent value="steps" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Étapes du guide</CardTitle>
                        <CardDescription>
                          Organisez les étapes dans l'ordre logique
                        </CardDescription>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addStep}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter une étape
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <AnimatePresence>
                      {fields.map((field, index) => (
                        <motion.div
                          key={field.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="mb-6"
                        >
                          <Card className="relative">
                            {/* En-tête de l'étape */}
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline">
                                      Étape {index + 1}
                                    </Badge>
                                    <div className="flex gap-1">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => moveStep(index, "up")}
                                        disabled={index === 0}
                                        className="h-6 w-6"
                                      >
                                        <ChevronUp className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => moveStep(index, "down")}
                                        disabled={index === fields.length - 1}
                                        className="h-6 w-6"
                                      >
                                        <ChevronDown className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <Input
                                    placeholder="Titre de l'étape"
                                    {...register(`steps.${index}.title`)}
                                    className={
                                      errors.steps?.[index]?.title
                                        ? "border-destructive"
                                        : ""
                                    }
                                  />
                                  {errors.steps?.[index]?.title && (
                                    <Typography
                                      variant="caption1"
                                      theme="danger"
                                    >
                                      {errors.steps[index].title.message}
                                    </Typography>
                                  )}
                                </div>
                                <div className="flex gap-1 ml-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => duplicateStep(index)}
                                    className="h-8 w-8"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  {fields.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => remove(index)}
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                              {/* Contenu de l'étape */}
                              <div className="space-y-2">
                                <Label>Contenu</Label>
                                <Textarea
                                  placeholder="Décrivez cette étape en détail..."
                                  rows={6}
                                  {...register(`steps.${index}.content`)}
                                  className={
                                    errors.steps?.[index]?.content
                                      ? "border-destructive"
                                      : ""
                                  }
                                />
                                {errors.steps?.[index]?.content && (
                                  <Typography variant="caption1" theme="danger">
                                    {errors.steps[index].content.message}
                                  </Typography>
                                )}
                              </div>

                              {/* Images de l'étape */}
                              <div className="space-y-4">
                                <Label>Images de l'étape (optionnel)</Label>
                                <Controller
                                  control={control}
                                  name={`steps.${index}.images`}
                                  render={({ field }) => (
                                    <AdvancedMultiUpload
                                      value={field.value ?? []}
                                      onChange={field.onChange}
                                      uploadPath={`guides/steps/${index}`}
                                      disabled={saving}
                                      maxImages={5}
                                    />
                                  )}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Bouton ajouter étape en bas */}
                    <div className="mt-6 pt-6 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={addStep}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter une nouvelle étape
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Panneau latéral - Aperçu & Stats */}
          <div className="space-y-6">
            {/* Aperçu rapide */}
            <Card>
              <CardHeader>
                <CardTitle>Aperçu rapide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Typography
                    variant="body-base"
                    className="font-medium truncate"
                  >
                    {watch("title") || "Sans titre"}
                  </Typography>
                </div>
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Badge>
                    {GUIDE_CATEGORIES.find((c) => c.value === watch("category"))
                      ?.label || "Non catégorisé"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label>Nombre d'étapes</Label>
                  <Typography variant="body-base" weight="bold">
                    {fields.length} étape{fields.length > 1 ? "s" : ""}
                  </Typography>
                </div>
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Badge variant={watch("isActive") ? "default" : "secondary"}>
                    {watch("isActive") ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Conseils */}
            <Card>
              <CardHeader>
                <CardTitle>Conseils</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <Typography variant="body-sm">
                    <strong>Titres clairs :</strong> Commencez par des verbes
                    d'action
                  </Typography>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <Typography variant="body-sm">
                    <strong>Étapes courtes :</strong> Une idée par étape pour
                    plus de clarté
                  </Typography>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <Typography variant="body-sm">
                    <strong>Images :</strong> Ajoutez des captures d'écran pour
                    illustrer
                  </Typography>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <Typography variant="body-sm">
                    <strong>Ordre logique :</strong> Organisez les étapes du
                    plus simple au plus complexe
                  </Typography>
                </div>
              </CardContent>
            </Card>

            {/* Statut du formulaire */}
            <Card>
              <CardHeader>
                <CardTitle>Statut</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Typography variant="body-sm">Formulaire modifié</Typography>
                  <Badge variant={isDirty ? "default" : "secondary"}>
                    {isDirty ? "Oui" : "Non"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <Typography variant="body-sm">Étapes complètes</Typography>
                  <Badge
                    variant={
                      fields.every((f) => f.title && f.content)
                        ? "default"
                        : "secondary"
                    }
                  >
                    {fields.filter((f) => f.title && f.content).length}/
                    {fields.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <Typography variant="body-sm">Images</Typography>
                  <Badge variant="outline">
                    {watch("images")?.length || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    const data = getValues();
                    console.log("Données du formulaire:", data);
                    toast.info("Données loguées dans la console");
                  }}
                >
                  <Link className="h-4 w-4 mr-2" />
                  Voir les données
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setPreviewMode(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Prévisualiser
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={() => {
                    if (
                      confirm(
                        "Voulez-vous vraiment annuler les modifications ?"
                      )
                    ) {
                      reset();
                    }
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler les modifications
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Alertes d'erreurs */}
      {(Object.keys(errors).length > 0 || errors.steps?.length) && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>
            Il y a des erreurs dans le formulaire. Veuillez les corriger avant
            de soumettre.
          </AlertDescription>
        </Alert>
      )}

      <SuccessDialog
        open={showSuccess}
        onOpenChange={setShowSuccess}
        title={isEdit ? "Guide mis à jour" : "Guide créé"}
        description={
          isEdit
            ? "Le guide a été mis à jour avec succès."
            : "Le nouveau guide a été créé avec succès."
        }
        actions={[
          {
            label: "Retour à la liste",
            onClick: () => router.push("/admin/guides"),
          },
        ]}
      />
      {/* Dialogs de résultat */}

      <ErrorDialog
        open={showError}
        onOpenChange={setShowError}
        title="Erreur"
        description={errorMessage}
      />
    </div>
  );
}
