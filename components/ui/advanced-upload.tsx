// components/ui/advanced-upload.tsx
"use client";

// import type React from "react";
import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Upload, X, ImageIcon, Loader2, Grid3X3, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/utils";
import Image from "next/image";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useScreenSize } from "@/hooks/use-screen";

interface AdvancedUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  uploadPath?: string;
  uploadPreset?: string;
  className?: string;
  isRounded?: boolean;
  previewClassName?: string;
  emptyPreview?: React.ReactNode;
  dropzoneOptions?: {
    accept?: Record<string, string[]>;
    maxFiles?: number;
  };
  isAutoUpload?: boolean;
  internalImagesFolder?: string;
  imageFilters?: ImageFilters;
  showInternalSelection?: boolean;
}

export function AdvancedUpload({
  value,
  onChange,
  disabled = false,
  maxSizeMB = 1,
  maxWidthOrHeight = 1920,
  uploadPath = "images",
  uploadPreset = "games_trafics",
  className,
  isRounded = false,
  previewClassName,
  emptyPreview,
  dropzoneOptions = {
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1
  },
  isAutoUpload = true,
  internalImagesFolder = "images",
  imageFilters = {
    withSubfolders: true,
    sortBy: "name",
    sortOrder: "asc",
  },
  showInternalSelection = false,
}: AdvancedUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [internalImages, setInternalImages] = useState<ImageCategory[]>([]);
  const [isInternalDialogOpen, setIsInternalDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  // const [imageFilters] = useState<ImageFilters>({
  //   withSubfolders: true,
  //   sortBy: "name",
  //   sortOrder: "asc",
  // });
  
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
  }, [showInternalSelection, imageFilters, searchQuery, selectedCategory, internalImagesFolder]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        setIsUploading(true);
        setUploadProgress(10);
        setFileName(file.name);
        setOriginalSize(file.size);
        setError(null);

        // Compression de l'image
        const compressedFile = await compressImage(file, {
          maxSizeMB,
          maxWidthOrHeight,
          onProgress: (progress: number) => {
            setUploadProgress(10 + Math.round(progress * 60));
          },
        });

        setCompressedSize(compressedFile.size);
        setUploadProgress(70);

        if (isAutoUpload) {
          // Upload automatique
          const result = await uploadToCloudinary(compressedFile, {
            uploadPath,
            uploadPreset,
          });

          setUploadProgress(90);

          if (result.success && result.url) {
            setUploadProgress(100);
            onChange(result.url);
          } else {
            throw new Error(result.error || "Upload failed");
          }
        } else {
          // Stockage temporaire pour upload différé
          const objectUrl = URL.createObjectURL(compressedFile);
          onChange(objectUrl);
          setUploadProgress(100);
        }
      } catch (error) {
        console.error("Erreur lors du traitement:", error);
        setUploadProgress(0);
        setError(error instanceof Error ? error.message : "Erreur inconnue");
      } finally {
        setIsUploading(false);
      }
    },
    [maxSizeMB, maxWidthOrHeight, onChange, uploadPath, uploadPreset, isAutoUpload]
  );

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setOriginalSize(null);
    setCompressedSize(null);
    setFileName(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [onChange]);

  const handleInternalImageSelect = (image: ImageInfo) => {
    onChange(image.url);
    setIsInternalDialogOpen(false);
    setSearchQuery("");
    setSelectedCategory("all");
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
      return internalImages.flatMap(category => category.images);
    }

    // Trouver la catégorie sélectionnée
    const category = internalImages.find(cat => cat.path === selectedCategory);
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
        <Badge variant="secondary" className="ml-1 hidden lg:inline-flex text-xs">
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
          <Typography component="span" variant="caption1" className="font-medium">
            {category.displayName}
          </Typography>
          <Badge variant={isActive ? "secondary" : "outline"} className="ml-1 text-xs">
            {category.totalImages}
          </Badge>
        </Button>
      </CarouselItem>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn(
        "relative overflow-hidden border border-border rounded-lg transition-all",
        isRounded ? "rounded-full" : "rounded-lg",
        !value ? "border-dashed bg-muted/30" : "bg-card",
        "cursor-pointer hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed"
      )} onClick={() => !disabled && !value && inputRef.current?.click()}>
        <Input
          ref={inputRef}
          type="file"
          accept={Object.entries(dropzoneOptions?.accept || {})
            .map(([_, exts]) => exts)
            .flat()
            .join(',')}
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
          className="hidden"
        />
        
        {value ? (
          <>
            <div className={cn(
              "aspect-square relative bg-muted overflow-hidden",
              previewClassName,
              isRounded ? "rounded-full" : "rounded-t-lg"
            )}>
              <Image
                src={value || "/placeholder.svg"}
                alt="Image uploadée"
                fill
                className={cn(
                  "object-cover transition-transform hover:scale-105",
                  isRounded ? "rounded-full" : "rounded-t-lg"
                )}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="absolute top-3 right-3">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleRemove}
                disabled={disabled}
                className="h-8 w-8 rounded-full shadow-md"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Supprimer l&apos;image</span>
              </Button>
            </div>
            {fileName && !isRounded && (
              <div className="p-3 bg-background/90 backdrop-blur-sm text-sm border-t">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate flex-1">{fileName}</p>
                  {originalSize !== null && compressedSize !== null && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {Math.round((compressedSize / originalSize) * 100)}%
                    </Badge>
                  )}
                </div>
                {originalSize !== null && compressedSize !== null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatBytes(compressedSize)} • Économisé {formatBytes(originalSize - compressedSize)}
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className={cn(
            "p-6 flex flex-col items-center justify-center space-y-3",
            isRounded ? "w-32 h-32" : "min-h-[180px]"
          )}>
            {isUploading ? (
              <div className="w-full space-y-4 text-center">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <Progress value={uploadProgress} className="h-2 w-full" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {uploadProgress < 70 ? "Compression..." : "Upload..."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {uploadProgress}% complet
                  </p>
                </div>
              </div>
            ) : emptyPreview ? (
              <div className="w-full h-full flex items-center justify-center">
                {emptyPreview}
              </div>
            ) : (
              <>
                <div className="p-3 rounded-full bg-primary/10">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                {!isRounded && (
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Glissez-déposez ou cliquez pour uploader
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, WEBP (max. {maxSizeMB}MB)
                    </p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    disabled={disabled || isUploading}
                    onClick={(e) => {
                      e.stopPropagation();
                      inputRef.current?.click();
                    }}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Uploader
                  </Button>
                  {showInternalSelection && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsInternalDialogOpen(true);
                      }}
                      className="gap-2"
                    >
                      <Grid3X3 className="h-4 w-4" />
                      Bibliothèque
                    </Button>
                  )}
                </div>
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-center">
                    <p className="text-xs text-destructive font-medium">{error}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setError(null)}
                      className="mt-1 text-xs h-6"
                    >
                      Fermer
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Dialog de sélection d'images internes */}
      {showInternalSelection && (
        <Drawer open={isInternalDialogOpen} onOpenChange={handleDialogOpenChange}>
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
                  Sélectionnez une image depuis votre bibliothèque ({internalImagesFolder})
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
                                  {category.displayName} ({category.totalImages})
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
                        <CategoryCarouselItem key={category.path} category={category} />
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
                    <Typography component="p" variant="body-base" theme="muted" weight="medium">
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
                            <Typography variant="caption2" component="span" theme="white" className="truncate block">
                              {image.name}
                            </Typography>
                            <Typography variant="caption3" component="span" theme="white" className="opacity-80">
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
                    <Typography variant="body-base" component="span" theme="muted" weight="medium">
                      {internalImages.length === 0 ? "Aucune catégorie d'images disponible" : "Aucune image trouvée"}
                    </Typography>
                    <Typography variant="body-sm" component="span" theme="muted" className="mt-1">
                      {internalImages.length === 0 
                        ? `Ajoutez des images dans le dossier /public/${internalImagesFolder}` 
                        : searchQuery 
                          ? "Essayez une autre recherche" 
                          : "Cette catégorie est vide"
                      }
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