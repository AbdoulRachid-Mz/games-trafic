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
  Save,
  X,
  ChevronUp,
  ChevronDown,
  Copy,
  AlertCircle,
  CheckCircle,
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
import {
  useGuideById,
  useCreateGuide,
  useUpdateGuide,
} from "@/hooks/use-guides";
import { useCategoriesByEntityType } from "@/hooks/use-categories";
import { checkGuideTitleExists } from "@/actions/guides";
import { useAuthContext } from "@/contexts/auth-context";
import { AdvancedMultiUpload } from "@/components/ui/advanced-multi-upload";
import {
  Guide,
  GuideWithRelations,
  NewGuide,
  NewGuideStep,
} from "@/database/schema";

// ============================================================================
// Types et schémas
// ============================================================================

const guideFormSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(200, "Titre trop long"),
  category: z.string().min(1, "La catégorie est requise"),
  description: z.string().optional(),
  images: z.array(z.string()),
  isActive: z.boolean(),
  steps: z.array(
    z.object({
      id: z.string().optional(),
      order: z.number().min(1),
      title: z.string().min(1, "Le titre de l'étape est requis"),
      content: z.string().min(1, "Le contenu de l'étape est requis"),
      images: z.array(z.string()),
    })
  ).min(1, "Au moins une étape est requise"),
});

type GuideFormData = z.infer<typeof guideFormSchema>;

// ============================================================================
// Composant principal
// ============================================================================

export default function GuideFormPage() {
  const router = useRouter();
  const params = useParams();
  const action = params.action as "create" | "edit";
  const guideId = params.id as string | undefined;
  const { user } = useAuthContext();

  const isEdit = action === "edit" && guideId;
  const [activeTab, setActiveTab] = useState("info");
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [titleExists, setTitleExists] = useState(false);

  // Fetch guide data
  const { data: guide, isLoading: isLoadingGuide } = useGuideById(
    guideId || ""
  );

  // Mutations
  const createGuide = useCreateGuide();
  const updateGuide = useUpdateGuide();

  // Fetch categories
  const { data: guideCategories = [] } = useCategoriesByEntityType("GUIDE");

  // Form initialization
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm<GuideFormData>({
    resolver: zodResolver(guideFormSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      images: [],
      isActive: true,
      steps: [{ order: 1, title: "", content: "", images: [] }],
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
        steps: (guide.steps ?? []).map((step: any, index: number) => ({
          id: step.id,
          order: step.order ?? index + 1,
          title: step.title,
          content: step.content,
          images: step.images ?? [],
        })),
      });
    }
  }, [isEdit, guide, reset]);

  // Check title uniqueness on change
  const currentTitle = watch("title");
  useEffect(() => {
    const checkTitle = async () => {
      if (currentTitle && currentTitle.length > 2) {
        const exists = await checkGuideTitleExists(currentTitle, guideId);
        setTitleExists(exists);
      } else {
        setTitleExists(false);
      }
    };
    const timeout = setTimeout(checkTitle, 500);
    return () => clearTimeout(timeout);
  }, [currentTitle, guideId]);

  // Step management
  const addStep = () => {
    const lastOrder = fields.length > 0 ? Math.max(...fields.map((f) => f.order)) : 0;
    append({ order: lastOrder + 1, title: "", content: "", images: [] });
    toast.success(`Étape ${fields.length + 1} ajoutée`);
  };

  const duplicateStep = (index: number) => {
    const step = getValues(`steps.${index}`);
    const newOrder = fields.length + 1;
    append({
      ...step,
      order: newOrder,
      title: `${step.title} (copie)`,
    });
    toast.success("Étape dupliquée");
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index > 0) {
      move(index, index - 1);
    } else if (direction === "down" && index < fields.length - 1) {
      move(index, index + 1);
    }
    // Reorder steps
    fields.forEach((_, i) => {
      update(i, { ...getValues(`steps.${i}`), order: i + 1 });
    });
  };

  const removeStep = (index: number) => {
    if (fields.length <= 1) {
      toast.error("Il doit y avoir au moins une étape");
      return;
    }
    remove(index);
    // Reorder remaining steps
    fields.forEach((_, i) => {
      if (i !== index) {
        update(i, { ...getValues(`steps.${i}`), order: i + 1 });
      }
    });
    toast.success("Étape supprimée");
  };

  // Form submission
  const onSubmit: SubmitHandler<GuideFormData> = async (data) => {
    if (!user?.id) {
      toast.error("Vous devez être connecté");
      return;
    }

    if (titleExists) {
      toast.error("Un guide avec ce titre existe déjà");
      return;
    }

    // Check for duplicate step titles
    const stepTitles = data.steps.map((s) => s.title.trim().toLowerCase());
    const hasDuplicateTitles = stepTitles.some(
      (title, index) => stepTitles.indexOf(title) !== index
    );
    if (hasDuplicateTitles) {
      toast.error("Les titres des étapes doivent être uniques");
      return;
    }

    setSaving(true);
    try {
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
        toast.success("Guide mis à jour avec succès");
      } else {
        await createGuide.mutateAsync(payload);
        toast.success("Guide créé avec succès");
      }

      setTimeout(() => {
        router.push("/admin/guides");
      }, 1500);
    } catch (error) {
      console.error("Error saving guide:", error);
      toast.error("Erreur lors de l'enregistrement du guide");
    } finally {
      setSaving(false);
    }
  };

  // Preview renderer
  const renderPreview = () => {
    const data = watch();
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="border rounded-xl p-8 bg-gradient-to-r from-primary/5 to-primary/10">
          <h1 className="text-3xl font-bold mb-2">{data.title || "Sans titre"}</h1>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">{data.category}</Badge>
            <Badge variant={data.isActive ? "default" : "secondary"}>
              {data.isActive ? "Actif" : "Inactif"}
            </Badge>
          </div>
          {data.description && (
            <p className="text-muted-foreground">{data.description}</p>
          )}
        </div>

        {/* Guide Images */}
        {data.images && data.images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {data.images.map((image, idx) => (
              <img
                key={idx}
                src={image}
                alt={`Image ${idx + 1}`}
                className="rounded-lg w-full h-40 object-cover border"
              />
            ))}
          </div>
        )}

        {/* Steps */}
        <div className="space-y-6">
          {data.steps.map((step, idx) => (
            <Card key={idx} className="relative">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full">
                    Étape {idx + 1}
                  </Badge>
                  <CardTitle className="text-xl">{step.title || "Sans titre"}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  {step.content.split("\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
                {step.images && step.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {step.images.map((img, imgIdx) => (
                      <img
                        key={imgIdx}
                        src={img}
                        alt={`Étape ${idx + 1} - ${imgIdx + 1}`}
                        className="rounded-lg w-full h-32 object-cover border"
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

  // Loading state
  if (isLoadingGuide && isEdit) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <Typography variant="body-base">Chargement du guide...</Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Button variant="ghost" onClick={() => router.back()} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold">
            {isEdit ? "Modifier le guide" : "Créer un nouveau guide"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit
              ? "Modifiez les informations du guide et ses étapes"
              : "Créez un guide complet avec plusieurs étapes pour aider les utilisateurs"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="gap-2"
          >
            {previewMode ? (
              <>
                <EyeOff className="h-4 w-4" />
                Éditer
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Prévisualiser
              </>
            )}
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={saving || titleExists || (isEdit && !isDirty) || !isValid}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      {/* Preview Mode */}
      {previewMode ? (
        renderPreview()
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informations générales</TabsTrigger>
                <TabsTrigger value="steps">
                  Étapes ({fields.length})
                </TabsTrigger>
              </TabsList>

              {/* Info Tab */}
              <TabsContent value="info" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations du guide</CardTitle>
                    <CardDescription>
                      Définissez le titre, la catégorie et la description
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="title">Titre *</Label>
                      <div className="relative">
                        <Input
                          id="title"
                          placeholder="Ex: Comment créer une boutique sur Games Trafic"
                          {...register("title")}
                          className={errors.title ? "border-destructive" : ""}
                        />
                        {titleExists && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                          </div>
                        )}
                      </div>
                      {titleExists && (
                        <p className="text-sm text-destructive">
                          Un guide avec ce titre existe déjà
                        </p>
                      )}
                      {errors.title && (
                        <p className="text-sm text-destructive">{errors.title.message}</p>
                      )}
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label htmlFor="category">Catégorie *</Label>
                      <Controller
                        control={control}
                        name="category"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                              <SelectValue placeholder="Sélectionnez une catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                              {guideCategories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.slug}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.category && (
                        <p className="text-sm text-destructive">{errors.category.message}</p>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Décrivez brièvement ce guide..."
                        rows={3}
                        {...register("description")}
                      />
                    </div>

                    {/* Images */}
                    <div className="space-y-2">
                      <Label>Images du guide</Label>
                      <Controller
                        control={control}
                        name="images"
                        render={({ field }) => (
                          <AdvancedMultiUpload
                            value={field.value}
                            onChange={field.onChange}
                            uploadPath="guides/main"
                            disabled={saving}
                            maxImages={5}
                          />
                        )}
                      />
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label htmlFor="isActive" className="font-medium">
                          Guide actif
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Le guide sera visible par les utilisateurs
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
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Steps Tab */}
              <TabsContent value="steps" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Étapes du guide</CardTitle>
                        <CardDescription>
                          Organisez les étapes dans l'ordre logique
                        </CardDescription>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={addStep}>
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
                          className="mb-6 last:mb-0"
                        >
                          <Card className="border-2 hover:border-primary/30 transition-colors">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Badge variant="outline" className="rounded-full">
                                      Étape {index + 1}
                                    </Badge>
                                    <div className="flex gap-1">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => moveStep(index, "up")}
                                        disabled={index === 0}
                                        className="h-7 w-7"
                                      >
                                        <ChevronUp className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => moveStep(index, "down")}
                                        disabled={index === fields.length - 1}
                                        className="h-7 w-7"
                                      >
                                        <ChevronDown className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <Input
                                    placeholder="Titre de l'étape"
                                    {...register(`steps.${index}.title`)}
                                    className={errors.steps?.[index]?.title ? "border-destructive" : ""}
                                  />
                                  {errors.steps?.[index]?.title && (
                                    <p className="text-sm text-destructive mt-1">
                                      {errors.steps[index].title.message}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-1 ml-3">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => duplicateStep(index)}
                                    className="h-8 w-8"
                                    title="Dupliquer"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeStep(index)}
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                              {/* Content */}
                              <div className="space-y-2">
                                <Label>Contenu *</Label>
                                <Textarea
                                  placeholder="Décrivez cette étape en détail..."
                                  rows={5}
                                  {...register(`steps.${index}.content`)}
                                  className={errors.steps?.[index]?.content ? "border-destructive" : ""}
                                />
                                {errors.steps?.[index]?.content && (
                                  <p className="text-sm text-destructive">
                                    {errors.steps[index].content.message}
                                  </p>
                                )}
                              </div>

                              {/* Step Images */}
                              <div className="space-y-2">
                                <Label>Images de l'étape (optionnel)</Label>
                                <Controller
                                  control={control}
                                  name={`steps.${index}.images`}
                                  render={({ field }) => (
                                    <AdvancedMultiUpload
                                      value={field.value}
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

                    {fields.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground mb-4">Aucune étape</p>
                        <Button type="button" variant="outline" onClick={addStep}>
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter une étape
                        </Button>
                      </div>
                    )}

                    {fields.length > 0 && (
                      <div className="mt-6 pt-4 border-t">
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
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Aperçu rapide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                    Titre
                  </Label>
                  <p className="font-medium line-clamp-2">
                    {watch("title") || "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                    Catégorie
                  </Label>
                  <Badge variant="secondary" className="mt-1">
                    {guideCategories.find(c => c.slug === watch("category"))?.name || "—"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                    Étapes
                  </Label>
                  <p className="text-2xl font-bold">{fields.length}</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                    Statut
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    {watch("isActive") ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Actif</span>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 text-muted-foreground" />
                        <span>Inactif</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle>💡 Conseils</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                  <p className="text-sm"><strong>Titres clairs :</strong> Utilisez des verbes d'action</p>
                </div>
                <div className="flex gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                  <p className="text-sm"><strong>Étapes courtes :</strong> Une idée par étape</p>
                </div>
                <div className="flex gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                  <p className="text-sm"><strong>Images :</strong> Ajoutez des captures d'écran</p>
                </div>
                <div className="flex gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                  <p className="text-sm"><strong>Ordre logique :</strong> Du simple au complexe</p>
                </div>
              </CardContent>
            </Card>

            {/* Validation Status */}
            <Card>
              <CardHeader>
                <CardTitle>✅ Validation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Titre valide</span>
                  <Badge variant={!titleExists && watch("title") ? "default" : "secondary"}>
                    {!titleExists && watch("title") ? "OK" : "En attente"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Catégorie</span>
                  <Badge variant={watch("category") ? "default" : "secondary"}>
                    {watch("category") ? "OK" : "Requis"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Étapes complètes</span>
                  <Badge variant={fields.every(f => f.title && f.content) ? "default" : "secondary"}>
                    {fields.filter(f => f.title && f.content).length}/{fields.length}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm">Prêt à publier</span>
                  <Badge variant={isValid && !titleExists && watch("title") ? "default" : "secondary"}>
                    {isValid && !titleExists && watch("title") ? "Oui" : "Non"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Global Errors Alert */}
      {(Object.keys(errors).length > 0 || errors.steps?.length) && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Des erreurs sont présentes dans le formulaire. Veuillez les corriger avant de soumettre.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}