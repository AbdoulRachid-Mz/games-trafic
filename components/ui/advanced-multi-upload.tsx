// components/ui/advanced-multi-upload.tsx
"use client";

import type React from "react";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Upload,
  X,
  ImageIcon,
  Loader2,
  Plus,
  Grid3X3,
  Search,
} from "lucide-react";
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
  previewClassName,
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

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      if (value.length + files.length > maxImages) {
        alert(`Vous ne pouvez pas uploader plus de ${maxImages} images.`);
        return;
      }

      const filesToUpload = Array.from(files).map((file) => ({
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        originalSize: file.size,
        progress: 0,
        status: "compressing" as const,
      }));

      setUploadingFiles((prev) => [...prev, ...filesToUpload]);

      const uploadPromises = filesToUpload.map(async (fileInfo) => {
        try {
          // Compression d'image
          const compressedFile = await compressImage(fileInfo.file, {
            maxSizeMB,
            maxWidthOrHeight,
            onProgress: (progress: number) => {
              setUploadingFiles((prev) =>
                prev.map((f) => {
                  if (f.id === fileInfo.id) {
                    return {
                      ...f,
                      progress: 10 + Math.round(progress * 60),
                    };
                  }
                  return f;
                })
              );
            },
          });

          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === fileInfo.id
                ? {
                    ...f,
                    status: "uploading",
                    progress: 70,
                    compressedSize: compressedFile.size,
                  }
                : f
            )
          );

          if (isAutoUpload) {
            // Upload automatique
            const result = await uploadToCloudinary(compressedFile, {
              uploadPath,
              uploadPreset,
            });

            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.id === fileInfo.id
                  ? {
                      ...f,
                      progress: 90,
                    }
                  : f
              )
            );

            if (!result.success) {
              throw new Error(result.error || "Upload failed");
            }

            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.id === fileInfo.id
                  ? {
                      ...f,
                      status: "complete",
                      progress: 100,
                    }
                  : f
              )
            );

            setTimeout(() => {
              setUploadingFiles((prev) =>
                prev.filter((f) => f.id !== fileInfo.id)
              );
            }, 2000);

            return result.url;
          } else {
            // Stockage temporaire pour upload différé
            const objectUrl = URL.createObjectURL(compressedFile);
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.id === fileInfo.id
                  ? {
                      ...f,
                      status: "complete",
                      progress: 100,
                    }
                  : f
              )
            );

            setTimeout(() => {
              setUploadingFiles((prev) =>
                prev.filter((f) => f.id !== fileInfo.id)
              );
            }, 2000);

            return objectUrl;
          }
        } catch (error) {
          console.error("Upload error:", error);
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === fileInfo.id
                ? {
                    ...f,
                    status: "error",
                    progress: 0,
                    error:
                      error instanceof Error ? error.message : "Unknown error",
                  }
                : f
            )
          );

          setTimeout(() => {
            setUploadingFiles((prev) =>
              prev.filter((f) => f.id !== fileInfo.id)
            );
          }, 3000);

          return null;
        }
      });

      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter((url): url is string => url !== null);

      const newUrls = [...value, ...validUrls];
      onChange(newUrls);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [
      maxImages,
      maxSizeMB,
      maxWidthOrHeight,
      onChange,
      value,
      uploadPath,
      uploadPreset,
      isAutoUpload,
    ]
  );

  const handleRemove = useCallback(
    (index: number) => {
      const newUrls = [...value];
      newUrls.splice(index, 1);
      onChange(newUrls);
    },
    [onChange, value]
  );

  const handleInternalImageSelect = (image: ImageInfo) => {
    if (value.length >= maxImages) {
      alert(`Vous ne pouvez pas ajouter plus de ${maxImages} images.`);
      return;
    }

    const newUrls = [...value, image.url];
    onChange(newUrls);
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
              <>
                <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-center">
                  Ajouter une image
                </p>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  {maxImages - value.length} restante
                  {maxImages - value.length > 1 ? "s" : ""}
                </p>
              </>
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
        <ScrollArea className="h-40 border rounded-lg p-4">
          <div className="space-y-4">
            {uploadingFiles.map((file) => (
              <div key={file.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {file.name}
                    </span>
                  </div>
                  <span
                    className={`text-xs ${
                      file.status === "error"
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {file.status === "compressing"
                      ? "Compression..."
                      : file.status === "uploading"
                      ? "Upload..."
                      : file.status === "complete"
                      ? "Terminé"
                      : file.error || "Erreur"}
                  </span>
                </div>
                <Progress value={file.progress} className="h-1" />
                {file.compressedSize && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      Original: {formatBytes(file.originalSize)} • Compressé:{" "}
                      {formatBytes(file.compressedSize)}
                    </span>
                    <span>
                      {Math.round(
                        (file.compressedSize / file.originalSize) * 100
                      )}
                      %
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
