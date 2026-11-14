// components/ui/advanced-multi-upload.tsx
"use client";

import type React from "react";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Upload,
  X,
  ImageIcon,
  Loader2,
  Grid3X3,
  Search,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/utils";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";
import {
  compressImage,
  uploadToCloudinary,
  getImageCategories,
  type ImageCategory,
  type ImageInfo,
  type ImageFilters,
  formatFileSize,
} from "@/utils/image-upload-utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useScreenSize } from "@/hooks/use-screen";

interface AdvancedMultiUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  maxImages?: number;
  uploadPath?: string;
  uploadPreset?: string;
  className?: string;
  previewClassName?: string;
  emptyPreview?: React.ReactNode;
  dropzoneOptions?: {
    accept?: Record<string, string[]>;
    maxFiles?: number;
  };
  isRounded?: boolean;
  isAutoUpload?: boolean;
  internalImagesFolder?: string;
  imageFilters?: ImageFilters;
  showInternalSelection?: boolean;
}

interface UploadingFile {
  id: string;
  name: string;
  file?: File;
  progress: number;
  originalSize: number;
  compressedSize?: number;
  status: "compressing" | "uploading" | "complete" | "error";
  error?: string;
}

export function AdvancedMultiUpload({
  value,
  onChange,
  disabled = false,
  maxSizeMB = 1,
  maxWidthOrHeight = 1920,
  maxImages = 5,
  uploadPath = "images",
  uploadPreset = "games_trafics",
  className,
  previewClassName: _previewClassName,
  emptyPreview,
  dropzoneOptions = {
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
  },
  isRounded = false,
  isAutoUpload = true,
  internalImagesFolder = "images",
  imageFilters = {
    withSubfolders: true,
    sortBy: "name",
    sortOrder: "asc",
  },
  showInternalSelection = true,
}: AdvancedMultiUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [internalImages, setInternalImages] = useState<ImageCategory[]>([]);
  const [isInternalDialogOpen, setIsInternalDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const { isXLargeScreen: isDesktop } = useScreenSize();
  const inputRef = useRef<HTMLInputElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<string[]>(value || []);
  const createdObjectUrlsRef = useRef<Set<string>>(new Set());

  // Maintenir valueRef toujours à jour
  useEffect(() => {
    valueRef.current = value || [];
  }, [value]);

  // Nettoyage de la mémoire au démontage
  useEffect(() => {
    const urlsToClean = createdObjectUrlsRef.current;
    return () => {
      urlsToClean.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
      urlsToClean.clear();
    };
  }, []);

  // Charger les images internes lorsque le dialog s'ouvre
  useEffect(() => {
    if (isInternalDialogOpen && showInternalSelection) {
      loadInternalImages();
    }
  }, [isInternalDialogOpen, showInternalSelection, internalImagesFolder]);

  const loadInternalImages = useCallback(async () => {
    if (!showInternalSelection) return;

    setIsLoadingCategories(true);
    try {
      const categories = await getImageCategories({
        folder: internalImagesFolder, // Utilisation du dossier spécifié
        ...imageFilters,
        search: searchQuery,
      });
      setInternalImages(categories);

      // Sélectionner automatiquement la première catégorie disponible
      if (categories.length > 0 && selectedCategory === "all") {
        setSelectedCategory(categories[0].path);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des images internes:", error);
      setInternalImages([]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [
    showInternalSelection,
    imageFilters,
    searchQuery,
    selectedCategory,
    internalImagesFolder,
  ]);

  const uploadSingleFile = useCallback(
    async (fileInfo: { id: string; file: File; name: string; originalSize: number }) => {
      try {
        const compressedFile = await compressImage(fileInfo.file, {
          maxSizeMB,
          maxWidthOrHeight,
          onProgress: (progress: number) => {
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.id === fileInfo.id
                  ? { ...f, progress: 10 + Math.round(progress * 50) }
                  : f
              )
            );
          },
        });

        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === fileInfo.id
              ? {
                  ...f,
                  status: "uploading",
                  progress: 65,
                  compressedSize: compressedFile.size,
                }
              : f
          )
        );

        if (isAutoUpload) {
          const result = await uploadToCloudinary(compressedFile, {
            uploadPath,
            uploadPreset,
          });

          if (!result.success || !result.url) {
            throw new Error(result.error || "Échec du téléchargement Cloudinary");
          }

          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === fileInfo.id ? { ...f, status: "complete", progress: 100 } : f
            )
          );

          // Ajout atomique dans value via ref
          const updated = [...valueRef.current, result.url];
          valueRef.current = updated;
          onChange(updated);

          setTimeout(() => {
            setUploadingFiles((prev) => prev.filter((f) => f.id !== fileInfo.id));
          }, 1500);

          return result.url;
        } else {
          const objectUrl = URL.createObjectURL(compressedFile);
          createdObjectUrlsRef.current.add(objectUrl);

          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === fileInfo.id ? { ...f, status: "complete", progress: 100 } : f
            )
          );

          const updated = [...valueRef.current, objectUrl];
          valueRef.current = updated;
          onChange(updated);

          setTimeout(() => {
            setUploadingFiles((prev) => prev.filter((f) => f.id !== fileInfo.id));
          }, 1500);

          return objectUrl;
        }
      } catch (err: any) {
        console.error("Upload error:", err);
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === fileInfo.id
              ? {
                  ...f,
                  status: "error",
                  progress: 0,
                  error: err?.message || "Erreur de transfert",
                }
              : f
          )
        );
        toast.error(`Échec pour ${fileInfo.name}: ${err?.message || "Erreur réseau"}`);
        return null;
      }
    },
    [isAutoUpload, maxSizeMB, maxWidthOrHeight, onChange, uploadPath, uploadPreset]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const currentActiveCount = (valueRef.current.length || 0) + uploadingFiles.filter((f) => f.status !== "error").length;
      const remainingSlots = Math.max(0, maxImages - currentActiveCount);

      if (remainingSlots <= 0) {
        toast.error(`Limite maximale de ${maxImages} images déjà atteinte.`);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      const rawFilesArray = Array.from(files);
      let selectedFiles = rawFilesArray;

      if (rawFilesArray.length > remainingSlots) {
        selectedFiles = rawFilesArray.slice(0, remainingSlots);
        toast.warning(
          `Seules ${remainingSlots} image(s) sur les ${rawFilesArray.length} sélectionnées ont été conservées (limite: ${maxImages}).`
        );
      }

      const filesToUpload = selectedFiles.map((file) => ({
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        originalSize: file.size,
        progress: 0,
        status: "compressing" as const,
      }));

      setUploadingFiles((prev) => [...prev, ...filesToUpload]);

      // Traitement avec concurrence contrôlée (max 3 uploads simultanés)
      const CONCURRENCY_LIMIT = 3;
      const queue = [...filesToUpload];
      const activeWorkers: Promise<void>[] = [];

      const runWorker = async () => {
        while (queue.length > 0) {
          const nextItem = queue.shift();
          if (nextItem) {
            await uploadSingleFile(nextItem);
          }
        }
      };

      for (let i = 0; i < Math.min(CONCURRENCY_LIMIT, filesToUpload.length); i++) {
        activeWorkers.push(runWorker());
      }

      await Promise.all(activeWorkers);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [maxImages, uploadSingleFile, uploadingFiles]
  );

  const handleRetry = useCallback(
    async (fileId: string) => {
      const target = uploadingFiles.find((f) => f.id === fileId);
      if (!target || !target.file) return;

      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: "compressing", progress: 0, error: undefined } : f))
      );

      await uploadSingleFile({
        id: target.id,
        file: target.file,
        name: target.name,
        originalSize: target.originalSize,
      });
    },
    [uploadSingleFile, uploadingFiles]
  );

  const handleRemove = useCallback(
    (index: number) => {
      const removedUrl = valueRef.current[index];
      if (removedUrl && createdObjectUrlsRef.current.has(removedUrl)) {
        try {
          URL.revokeObjectURL(removedUrl);
          createdObjectUrlsRef.current.delete(removedUrl);
        } catch (_) {}
      }
      const newUrls = [...valueRef.current];
      newUrls.splice(index, 1);
      valueRef.current = newUrls;
      onChange(newUrls);
    },
    [onChange]
  );

  const handleInternalImageSelect = (image: ImageInfo) => {
    const currentActiveCount = (valueRef.current.length || 0) + uploadingFiles.filter((f) => f.status !== "error").length;
    if (currentActiveCount >= maxImages) {
      toast.error(`Vous ne pouvez pas ajouter plus de ${maxImages} images.`);
      return;
    }

    const newUrls = [...valueRef.current, image.url];
    valueRef.current = newUrls;
    onChange(newUrls);
    toast.success("Image ajoutée depuis la bibliothèque");
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsInternalDialogOpen(open);
    if (!open) {
      setSearchQuery("");
      setSelectedCategory("all");
    }
  };

  // Filtrer les images basées sur la recherche et la catégorie
  const filteredImages = useMemo(() => {
    if (!internalImages.length) return [];

    // Si "all" est sélectionné, retourner toutes les images de toutes les catégories
    if (selectedCategory === "all") {
      return internalImages.flatMap((category) => category.images);
    }

    // Trouver la catégorie sélectionnée
    const category = internalImages.find(
      (cat) => cat.path === selectedCategory
    );
    return category?.images || [];
  }, [internalImages, selectedCategory]);

  // Composant pour les onglets de catégories (version desktop)
  const CategoryTab = ({ category }: { category: ImageCategory }) => {
    const isActive = selectedCategory === category.path;

    return (
      <TabsTrigger
        value={category.path}
        className={cn(
          "gap-2 py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
          "min-w-12 justify-center lg:justify-start"
        )}
      >
        <span className="text-base lg:text-sm">{category.icon}</span>
        <Typography
          variant="caption1"
          className="hidden lg:inline-block font-medium"
          hasTooltip={!isDesktop}
          component="span"
          tooltipContent={category.displayName}
          tooltipSide="top"
        >
          {category.displayName}
        </Typography>
        <Badge
          variant="secondary"
          className="ml-1 hidden lg:inline-flex text-xs"
        >
          {category.totalImages}
        </Badge>
      </TabsTrigger>
    );
  };

  // Composant pour les items du carousel (version mobile)
  const CategoryCarouselItem = ({ category }: { category: ImageCategory }) => {
    const isActive = selectedCategory === category.path;

    return (
      <CarouselItem className="basis-auto">
        <Button
          variant={isActive ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(category.path)}
          className={cn(
            "gap-2 py-2 px-3 h-auto whitespace-nowrap",
            isActive && "bg-primary text-primary-foreground"
          )}
        >
          <span className="text-sm">{category.icon}</span>
          <Typography
            component="span"
            variant="caption1"
            className="font-medium"
          >
            {category.displayName}
          </Typography>
          <Badge
            variant={isActive ? "secondary" : "outline"}
            className="ml-1 text-xs"
          >
            {category.totalImages}
          </Badge>
        </Button>
      </CarouselItem>
    );
  };

  const acceptTypes = Object.entries(dropzoneOptions?.accept || {})
    .map(([_, exts]) => exts)
    .flat()
    .join(",");

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {value.map((url, index) => (
          <div
            key={index}
            className={cn(
              "relative rounded-lg overflow-hidden border border-border group bg-card hover:border-primary/50 transition-all",
              isRounded ? "rounded-full" : "rounded-lg"
            )}
          >
            <div
              className={cn(
                "aspect-square relative bg-muted overflow-hidden",
                isRounded ? "rounded-full" : "rounded-t-lg"
              )}
            >
              <Image
                src={url || "/placeholder.svg"}
                alt={`Image ${index + 1}`}
                fill
                className={cn(
                  "object-cover transition-transform hover:scale-105",
                  isRounded ? "rounded-full" : "rounded-t-lg"
                )}
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                className="h-8 w-8 rounded-full shadow-md"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Supprimer l&apos;image</span>
              </Button>
            </div>
            <div className="p-2 bg-background/90 backdrop-blur-sm text-xs border-t">
              <p className="font-medium truncate">Image {index + 1}</p>
            </div>
          </div>
        ))}

        {value.length < maxImages && (
          <div
            className={cn(
              "border border-dashed border-border aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors rounded-lg",
              isRounded ? "rounded-full" : "rounded-lg"
            )}
            onClick={() => inputRef.current?.click()}
          >
            {emptyPreview ? (
              emptyPreview
            ) : (
              <div className="flex flex-col items-center justify-center p-3 text-center">
                <div className="relative h-12 w-12 mb-2 opacity-80">
                  <Image
                    src="/images/uploads/upload.png"
                    alt="Upload Games-Trafics"
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Ajouter une image
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {maxImages - value.length} restante{maxImages - value.length > 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <Input
        ref={inputRef}
        type="file"
        accept={acceptTypes}
        onChange={handleFileSelect}
        disabled={disabled || value.length >= maxImages}
        className="hidden"
        multiple
      />

      {uploadingFiles.length > 0 && (
        <ScrollArea className="max-h-48 border border-border/60 rounded-xl p-3 bg-card/40">
          <div className="space-y-3">
            {uploadingFiles.map((file) => (
              <div key={file.id} className="space-y-1.5 p-2 rounded-lg bg-background/50 border border-border/40">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <ImageIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs font-semibold truncate max-w-[160px] sm:max-w-[240px]">
                      {file.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[11px] font-medium ${
                        file.status === "error"
                          ? "text-destructive"
                          : file.status === "complete"
                          ? "text-emerald-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {file.status === "compressing"
                        ? "Compression..."
                        : file.status === "uploading"
                        ? "Transfert..."
                        : file.status === "complete"
                        ? "Terminé"
                        : file.error || "Erreur"}
                    </span>
                    {file.status === "error" && file.file && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-primary hover:bg-primary/10"
                        onClick={() => handleRetry(file.id)}
                        title="Réessayer"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => setUploadingFiles((prev) => prev.filter((f) => f.id !== file.id))}
                      title="Retirer"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Progress value={file.progress} className="h-1 rounded-full" />
                {file.compressedSize && (
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>
                      {formatBytes(file.originalSize)} → {formatBytes(file.compressedSize)}
                    </span>
                    <span>
                      {Math.round((file.compressedSize / file.originalSize) * 100)}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <div className="flex gap-2 justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || value.length >= maxImages}
          onClick={() => inputRef.current?.click()}
          className="flex-1 gap-2"
        >
          <Upload className="h-4 w-4" />
          {value.length === 0
            ? `Sélectionner (max ${maxImages})`
            : `Ajouter ${maxImages - value.length} de plus`}
        </Button>

        {showInternalSelection && value.length < maxImages && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsInternalDialogOpen(true)}
            disabled={disabled}
            className="gap-2"
          >
            <Grid3X3 className="h-4 w-4" />
            Bibliothèque
          </Button>
        )}
      </div>

      {/* Dialog de sélection d'images internes */}
      {showInternalSelection && (
        <Drawer
          open={isInternalDialogOpen}
          onOpenChange={handleDialogOpenChange}
        >
          <DrawerContent className="h-[85vh] p-0 overflow-hidden">
            <DrawerHeader className="px-6 pt-6 pb-4 border-b">
              <DrawerTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                <Typography component="h6" variant="h6" weight="semibold">
                  Bibliothèque d&apos;images
                </Typography>
              </DrawerTitle>
              <DrawerDescription>
                <Typography component="span" variant="body-sm" theme="muted">
                  Sélectionnez des images depuis votre bibliothèque (
                  {value.length}/{maxImages} utilisées) ({internalImagesFolder})
                </Typography>
              </DrawerDescription>

              {/* Barre de recherche */}
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une image..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </DrawerHeader>

            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Navigation des catégories - Version Desktop (Tabs) */}
              {isDesktop && internalImages.length > 0 && (
                <Tabs
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                  className="px-6 pt-4"
                >
                  <ScrollArea className="w-full">
                    <TabsList className="w-max justify-start h-auto p-1 bg-muted/50">
                      <TooltipProvider>
                        {internalImages.map((category) => (
                          <Tooltip key={category.path}>
                            <TooltipTrigger asChild>
                              <CategoryTab category={category} />
                            </TooltipTrigger>
                            {!isDesktop && (
                              <TooltipContent side="top">
                                <Typography component="span" variant="caption1">
                                  {category.displayName} ({category.totalImages}
                                  )
                                </Typography>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        ))}
                      </TooltipProvider>
                    </TabsList>
                  </ScrollArea>
                </Tabs>
              )}

              {/* Navigation des catégories - Version Mobile (Carousel) */}
              {!isDesktop && internalImages.length > 0 && (
                <div className="px-4 pt-4">
                  <Carousel
                    ref={carouselRef}
                    opts={{
                      align: "start",
                      dragFree: true,
                    }}
                    className="w-full"
                  >
                    <CarouselContent>
                      {internalImages.map((category) => (
                        <CategoryCarouselItem
                          key={category.path}
                          category={category}
                        />
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2 h-8 w-8" />
                    <CarouselNext className="right-2 h-8 w-8" />
                  </Carousel>
                </div>
              )}

              {/* Grille d'images */}
              <ScrollArea className="flex-1 p-6 max-md:p-3 overflow-y-auto">
                {isLoadingCategories ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <Typography
                      component="p"
                      variant="body-base"
                      theme="muted"
                      weight="medium"
                    >
                      Chargement des images...
                    </Typography>
                  </div>
                ) : filteredImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredImages.map((image, index) => (
                      <div
                        key={index}
                        className="group relative aspect-square cursor-pointer rounded-lg overflow-hidden border hover:border-primary transition-all"
                        onClick={() => handleInternalImageSelect(image)}
                      >
                        <Image
                          src={image.url}
                          alt={`Image ${index + 1}`}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="bg-black/70 rounded px-2 py-1">
                            <Typography
                              variant="caption2"
                              component="span"
                              theme="white"
                              className="truncate block"
                            >
                              {image.name}
                            </Typography>
                            <Typography
                              variant="caption3"
                              component="span"
                              theme="white"
                              className="opacity-80"
                            >
                              {formatFileSize(image.size)}
                            </Typography>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <Typography
                      variant="body-base"
                      component="span"
                      theme="muted"
                      weight="medium"
                    >
                      {internalImages.length === 0
                        ? "Aucune catégorie d'images disponible"
                        : "Aucune image trouvée"}
                    </Typography>
                    <Typography
                      variant="body-sm"
                      component="span"
                      theme="muted"
                      className="mt-1"
                    >
                      {internalImages.length === 0
                        ? `Ajoutez des images dans le dossier /public/${internalImagesFolder}`
                        : searchQuery
                        ? "Essayez une autre recherche"
                        : "Cette catégorie est vide"}
                    </Typography>
                  </div>
                )}
              </ScrollArea>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
