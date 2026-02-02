// @/components/categories/category-selector.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Plus,
  Tag,
  ChevronRight,
  ChevronDown,
  Check,
  Trash2,
  Edit,
  Layers,
  Filter,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useCategoriesByEntityType,
  useCategoryChildren,
  useRootCategories,
  useCategoryTree,
  useAttachCategoryToEntity,
  useDetachCategoryFromEntity,
  useEntityCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCategories,
} from "@/hooks/use-categories";
import type {
  Category,
  CategoryWithChildren,
  EntityType,
} from "@/database/schema";
import { useDebounce } from "@/hooks/use-debounce";

// Types
interface CategorySelectorProps {
  entityId: string;
  entityType: EntityType;
  label?: string;
  placeholder?: string;
  maxCategories?: number;
  allowCreation?: boolean;
  allowDeletion?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "compact" | "inline";
  mode?: "single" | "multiple";
  value?: string[];
  onChange?: (categoryIds: string[]) => void;
  onCategoriesChange?: (categories: CategoryWithChildren[]) => void;
}

// Composant pour afficher une catégorie
function CategoryItem({
  category,
  level = 0,
  selected = false,
  onToggle,
  showChildren = false,
  onExpand,
}: {
  category: Category;
  level?: number;
  selected?: boolean;
  onToggle?: () => void;
  showChildren?: boolean;
  onExpand?: () => void;
}) {
  const typedCategory = category as CategoryWithChildren;
  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer",
          selected && "bg-accent"
        )}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={onToggle}
      >
        {typedCategory.children && typedCategory.children.length > 0 ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onExpand?.();
            }}
          >
            {showChildren ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        ) : (
          <div className="w-6" />
        )}

        <div className="flex-1 flex items-center gap-2">
          {category.icon ? (
            <span className="text-lg">{category.icon}</span>
          ) : (
            <Tag className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium truncate">{category.name}</span>
          {category.description && (
            <span className="text-xs text-muted-foreground truncate hidden md:inline">
              {category.description}
            </span>
          )}
        </div>

        {selected && <Check className="h-4 w-4 text-primary" />}
      </div>

      {showChildren && typedCategory.children && (
        <div className="space-y-1">
          {typedCategory.children.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              level={level + 1}
              selected={selected}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Badge de catégorie avec option de suppression
function CategoryBadge({
  category,
  onRemove,
  readOnly = false,
}: {
  category: Category;
  onRemove?: () => void;
  readOnly?: boolean;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-2 pl-3 pr-2 py-1.5",
        category.color && `border-l-4`,
        category.color && `border-l-[${category.color}]`
      )}
    >
      {category.icon && <span>{category.icon}</span>}
      <span className="font-medium">{category.name}</span>
      {!readOnly && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 ml-1 hover:bg-transparent"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </Badge>
  );
}

// Modal de création/édition de catégorie
function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  entityType,
  parentId,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryWithChildren;
  entityType: string;
  parentId?: string;
  onSubmit: (data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    parentId?: string;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");
  const [icon, setIcon] = useState(category?.icon || "");
  const [color, setColor] = useState(category?.color || "#3b82f6");
  const [loading, setLoading] = useState(false);

  const { data: rootCategories } = useRootCategories();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        icon: icon.trim() || undefined,
        color: color !== "#3b82f6" ? color : undefined,
        parentId: parentId || category?.parentId || "",
      });
      onOpenChange(false);
      toast.success(
        category ? "Catégorie mise à jour" : "Catégorie créée avec succès"
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {category ? "Modifier la catégorie" : "Nouvelle catégorie"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de la catégorie"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Icône</label>
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="Ex: 🎮, ⚽, 💻"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Couleur</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  disabled={loading}
                  className="w-full"
                />
                <div
                  className="w-10 h-10 rounded border"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
          </div>

          {!parentId && !category?.parentId && rootCategories && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Catégorie parente</label>
              <select
                value={category?.parentId || ""}
                onChange={(e) => {
                  // Handle parent selection
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={loading}
              >
                <option value="">Aucune (catégorie racine)</option>
                {rootCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "En cours..." : category ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Composant principal
export function CategorySelector({
  entityId,
  entityType,
  label = "Catégories",
  placeholder = "Sélectionnez des catégories...",
  maxCategories = 10,
  allowCreation = true,
  allowDeletion = true,
  required = false,
  disabled = false,
  className,
  variant = "default",
  mode = "multiple",
  value,
  onChange,
  onCategoriesChange,
}: CategorySelectorProps) {
  // État
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    value || []
  );
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<CategoryWithChildren | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<
    string | undefined
  >();

  // Hooks
  const { data: categories = [], isLoading: isLoadingCategories } =
    useCategoriesByEntityType(entityType, {
      populate: ["children"],
      ...(debouncedSearch && { name: debouncedSearch }),
    });

  const { data: entityCategories = [], isLoading: isLoadingEntityCategories } =
    useEntityCategories(entityId, entityType);

  const { data: categoryTree = [], isLoading: isLoadingTree } =
    useCategoryTree();

  // Mutations
  const attachMutation = useAttachCategoryToEntity();
  const detachMutation = useDetachCategoryFromEntity();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  // Synchroniser les catégories sélectionnées
  useEffect(() => {
    if (value) {
      setSelectedCategoryIds(value);
    }
  }, [value]);

  useEffect(() => {
    if (entityCategories.length > 0 && selectedCategoryIds.length === 0) {
      const ids = entityCategories.map((cat) => cat.id);
      setSelectedCategoryIds(ids);
    }
  }, [entityCategories, selectedCategoryIds.length]);

  // Gérer la sélection/déselection
  const handleCategoryToggle = useCallback(
    (categoryId: string) => {
      setSelectedCategoryIds((prev) => {
        const isSelected = prev.includes(categoryId);
        let newSelection: string[];

        if (mode === "single") {
          newSelection = isSelected ? [] : [categoryId];
        } else {
          newSelection = isSelected
            ? prev.filter((id) => id !== categoryId)
            : prev.length < maxCategories
            ? [...prev, categoryId]
            : prev;
        }

        // Appeler les callbacks
        onChange?.(newSelection);

        // Attacher/détacher de l'entité
        if (isSelected) {
          detachMutation.mutate({
            entityId,
            entityType,
            categoryId,
          });
        } else {
          attachMutation.mutate({
            entityId,
            entityType,
            categoryId,
          });
        }

        return newSelection;
      });
    },
    [
      mode,
      maxCategories,
      onChange,
      entityId,
      entityType,
      attachMutation,
      detachMutation,
    ]
  );

  // Créer une nouvelle catégorie
  const handleCreateCategory = async (data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    parentId?: string;
  }) => {
    return createMutation.mutateAsync({
      ...data,
      applicableEntities: [entityType] as [
        | "PRODUCT"
        | "POST"
        | "SHOP"
        | "TOURNAMENT"
        | "USER"
        | "BLOG"
        | "MESSAGE"
        | "TEAM"
        | "THEME"
        | "NEWS"
        | "GROUP"
        | "ANNOUNCEMENT"
        | "SERVICE"
        | "GUIDE"
        | "COMMENT"
        | "MATCH"
      ],
      slug: data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      isActive: true,
      sortOrder: 0,
    });
  };

  // Mettre à jour une catégorie
  const handleUpdateCategory = async (data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    parentId?: string;
  }) => {
    if (!editingCategory) return;
    return updateMutation.mutateAsync({
      id: editingCategory.id,
      data: {
        ...data,
        slug:
          data.name !== editingCategory.name
            ? data.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")
            : undefined,
      },
    });
  };

  // Supprimer une catégorie
  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(categoryId);
      toast.success("Catégorie supprimée");

      // Retirer de la sélection si nécessaire
      setSelectedCategoryIds((prev) => prev.filter((id) => id !== categoryId));
    } catch (error) {
      toast.error("Impossible de supprimer la catégorie");
    }
  };

  // Toggle l'expansion d'une catégorie
  const toggleExpand = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Recherche et filtrage des catégories
  const filteredCategories = useMemo(() => {
    if (!debouncedSearch) return categoryTree;

    return categoryTree.filter((cat) => {
      const searchLower = debouncedSearch.toLowerCase();
      return (
        cat.name.toLowerCase().includes(searchLower) ||
        cat.description?.toLowerCase().includes(searchLower) ||
        cat.fullPath?.toLowerCase().includes(searchLower)
      );
    });
  }, [categoryTree, debouncedSearch]);

  // Rendu des catégories sous forme d'arbre
  const renderCategoryTree = (
    categories: CategoryWithChildren[],
    level = 0
  ) => {
    return categories.map((category) => (
      <div key={category.id}>
        <CommandItem
          value={category.id}
          onSelect={() => handleCategoryToggle(category.id)}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2 flex-1">
            <div style={{ paddingLeft: `${level * 20}px` }}>
              {category.children && category.children.length > 0 ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 mr-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(category.id);
                  }}
                >
                  {expandedCategories.has(category.id) ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              ) : (
                <div className="w-7 inline-block" />
              )}
            </div>

            {category.icon && <span className="text-lg">{category.icon}</span>}
            <span className="font-medium">{category.name}</span>
            {category.description && (
              <span className="text-sm text-muted-foreground truncate hidden md:inline">
                - {category.description}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {selectedCategoryIds.includes(category.id) && (
              <Check className="h-4 w-4 text-primary" />
            )}

            {allowCreation && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCategory(category);
                    setShowCreateDialog(true);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>

                {allowDeletion && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(category.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </>
            )}
          </div>
        </CommandItem>

        {expandedCategories.has(category.id) &&
          category.children &&
          renderCategoryTree(category.children, level + 1)}
      </div>
    ));
  };

  // Rendu compact (inline)
  if (variant === "inline") {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {isLoadingEntityCategories ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))
        ) : (
          <>
            {entityCategories.map((category) => (
              <CategoryBadge
                key={category.id}
                category={category}
                onRemove={
                  !disabled && allowDeletion
                    ? () => handleCategoryToggle(category.id)
                    : undefined
                }
                readOnly={disabled}
              />
            ))}

            {!disabled && (
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={disabled}
                  >
                    <Plus className="h-3 w-3" />
                    Ajouter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Rechercher une catégorie..."
                      value={search}
                      onValueChange={setSearch}
                    />
                    <CommandList>
                      <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
                      <CommandGroup>
                        {renderCategoryTree(filteredCategories)}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </>
        )}
      </div>
    );
  }

  // Rendu compact (sheet)
  if (variant === "compact") {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className={cn("justify-start", className)}
            disabled={disabled}
          >
            <Layers className="h-4 w-4 mr-2" />
            {entityCategories.length > 0
              ? `${entityCategories.length} catégories`
              : placeholder}
          </Button>
        </SheetTrigger>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Sélectionner des catégories</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <Command>
              <CommandInput
                placeholder="Rechercher une catégorie..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <ScrollArea className="h-[300px]">
                  <CommandEmpty>
                    {isLoadingCategories ? (
                      <div className="space-y-2 p-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} className="h-10 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-sm">
                        Aucune catégorie trouvée.
                        {allowCreation && (
                          <Button
                            variant="link"
                            className="mt-2"
                            onClick={() => setShowCreateDialog(true)}
                          >
                            Créer une nouvelle catégorie
                          </Button>
                        )}
                      </div>
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {renderCategoryTree(filteredCategories)}
                  </CommandGroup>
                </ScrollArea>
              </CommandList>
            </Command>

            {allowCreation && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer une nouvelle catégorie
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Rendu par défaut
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        <span className="text-xs text-muted-foreground">
          {selectedCategoryIds.length}/{maxCategories} sélectionnées
        </span>
      </div>

      {/* Badges des catégories sélectionnées */}
      <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[60px]">
        {isLoadingEntityCategories ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        ) : entityCategories.length > 0 ? (
          entityCategories.map((category) => (
            <CategoryBadge
              key={category.id}
              category={category}
              onRemove={
                !disabled && allowDeletion
                  ? () => handleCategoryToggle(category.id)
                  : undefined
              }
              readOnly={disabled}
            />
          ))
        ) : (
          <div className="flex-1 text-center text-sm text-muted-foreground py-2">
            {placeholder}
          </div>
        )}
      </div>

      {/* Bouton d'ouverture du sélecteur */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <Layers className="h-4 w-4 mr-2" />
        {entityCategories.length > 0
          ? "Modifier les catégories"
          : "Sélectionner des catégories"}
      </Button>

      {/* Sheet de sélection */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Sélectionner des catégories</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une catégorie..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Liste des catégories */}
            <ScrollArea className="h-[400px] pr-4">
              {isLoadingTree ? (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Aucune catégorie trouvée.</p>
                  {allowCreation && (
                    <Button
                      variant="link"
                      className="mt-2"
                      onClick={() => setShowCreateDialog(true)}
                    >
                      Créer une nouvelle catégorie
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {renderCategoryTree(filteredCategories)}
                </div>
              )}
            </ScrollArea>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {allowCreation && (
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(true)}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle catégorie
                </Button>
              )}

              <Button
                variant="default"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Valider ({selectedCategoryIds.length})
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog de création/édition */}
      {(showCreateDialog || editingCategory) && (
        <CategoryFormDialog
          open={showCreateDialog || !!editingCategory}
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateDialog(false);
              setEditingCategory(null);
              setSelectedParentId(undefined);
            }
          }}
          category={editingCategory || undefined}
          entityType={entityType}
          parentId={selectedParentId}
          onSubmit={async (data) => {
            if (editingCategory) {
              await handleUpdateCategory(data);
            } else {
              await handleCreateCategory(data);
            }
          }}
        />
      )}
    </div>
  );
}

// Composant de catégories rapides (pour les formulaires)
export function QuickCategorySelector({
  entityType,
  onSelect,
  limit = 6,
}: {
  entityType: string;
  onSelect: (categoryId: string) => void;
  limit?: number;
}) {
  const { data: categories = [] } = useCategories({
    pagination: { limit, page: 1 },
    filters: {
      applicableEntities: [
        entityType as
          | "PRODUCT"
          | "POST"
          | "SHOP"
          | "TOURNAMENT"
          | "USER"
          | "BLOG"
          | "MESSAGE"
          | "TEAM"
          | "THEME"
          | "NEWS"
          | "GROUP"
          | "ANNOUNCEMENT"
          | "SERVICE"
          | "GUIDE"
          | "COMMENT"
          | "MATCH",
      ],
      isFeatured: true,
    },
  });

  if (Array.isArray(categories) && categories.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Catégories populaires</p>
      <div className="flex flex-wrap gap-2">
        {(Array.isArray(categories) ? categories : categories.data || []).map(
          (category) => (
            <Button
              key={category.id}
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => onSelect(category.id)}
            >
              {category.icon && <span>{category.icon}</span>}
              {category.name}
            </Button>
          )
        )}
      </div>
    </div>
  );
}
