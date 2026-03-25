// @/components/categories/category-manager.tsx
"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
} from "lucide-react";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/hooks/use-categories";
import { toast } from "sonner";
import type { Category } from "@/database/schema";
import { AdvancedUpload } from "../ui/advanced-upload";


// Composant pour le formulaire de création de catégorie
function CreateCategoryForm({ onSuccess }: { onSuccess?: () => void }) {
  const createMutation = useCreateCategory();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [applicableEntities, setApplicableEntities] = useState<string[]>(["PRODUCT"]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    // Générer le slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        icon: icon.trim() || undefined,
        color: color !== "#3b82f6" ? color : undefined,
        parentId: null, // ✅ Important: null pour les catégories racines
        applicableEntities: applicableEntities as any,
        slug,
        isActive: true,
        sortOrder: 0,
      });
      toast.success("Catégorie créée avec succès");
      onSuccess?.();
      // Réinitialiser le formulaire
      setName("");
      setDescription("");
      setIcon("");
      setColor("#3b82f6");
      setApplicableEntities(["PRODUCT"]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Nom *</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de la catégorie"
          disabled={createMutation.isPending}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description optionnelle"
          disabled={createMutation.isPending}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Icône</label>
          {/* replace to uploadcomponents */}
          <Input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="Ex: 🎮, ⚽, 💻"
            disabled={createMutation.isPending}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Couleur</label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={createMutation.isPending}
              className="w-full"
            />
            <div
              className="w-10 h-10 rounded border"
              style={{ backgroundColor: color }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Types d'entités</label>
        <div className="flex flex-wrap gap-2">
          {["PRODUCT", "POST", "SHOP", "TOURNAMENT", "THEME", "GUIDE"].map((entity) => (
            <Badge
              key={entity}
              variant={applicableEntities.includes(entity) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => {
                if (applicableEntities.includes(entity)) {
                  setApplicableEntities(applicableEntities.filter(e => e !== entity));
                } else {
                  setApplicableEntities([...applicableEntities, entity]);
                }
              }}
            >
              {entity}
            </Badge>
          ))}
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Création..." : "Créer"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Composant pour le formulaire d'édition
function EditCategoryForm({
  category,
  onSuccess,
  onCancel
}: {
  category: Category;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const updateMutation = useUpdateCategory();
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description || "");
  const [icon, setIcon] = useState(category.icon || "");
  const [color, setColor] = useState(category.color || "#3b82f6");
  const [isActive, setIsActive] = useState(category.isActive);
  const [isFeatured, setIsFeatured] = useState(category.isFeatured);
  const [applicableEntities, setApplicableEntities] = useState<string[]>(
    category.applicableEntities as string[] || ["PRODUCT"]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    // Générer le slug seulement si le nom a changé
    const slug = name !== category.name
      ? name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
      : undefined;

    try {
      await updateMutation.mutateAsync({
        id: category.id,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          icon: icon.trim() || undefined,
          color: color !== "#3b82f6" ? color : undefined,
          applicableEntities: applicableEntities as any,
          isActive,
          isFeatured,
          slug,
        },
      });
      toast.success("Catégorie mise à jour");
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Nom *</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de la catégorie"
          disabled={updateMutation.isPending}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description optionnelle"
          disabled={updateMutation.isPending}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Icône</label>
          <Input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="Ex: 🎮, ⚽, 💻"
            disabled={updateMutation.isPending}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Couleur</label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={updateMutation.isPending}
              className="w-full"
            />
            <div
              className="w-10 h-10 rounded border"
              style={{ backgroundColor: color }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Statut
          </label>
          <Badge
            variant={isActive ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => setIsActive(!isActive)}
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Star className="h-4 w-4" />
            Mise en avant
          </label>
          <Badge
            variant={isFeatured ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => setIsFeatured(!isFeatured)}
          >
            {isFeatured ? "En vedette" : "Normal"}
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Types d'entités</label>
        <div className="flex flex-wrap gap-2">
          {["PRODUCT", "POST", "SHOP", "TOURNAMENT", "THEME", "GUIDE"].map((entity) => (
            <Badge
              key={entity}
              variant={applicableEntities.includes(entity) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => {
                if (applicableEntities.includes(entity)) {
                  setApplicableEntities(applicableEntities.filter(e => e !== entity));
                } else {
                  setApplicableEntities([...applicableEntities, entity]);
                }
              }}
            >
              {entity}
            </Badge>
          ))}
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={updateMutation.isPending}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Composant principal CategoryManager
export function CategoryManager() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: categoriesData, isLoading, refetch } = useCategories({
    pagination: { page: 1, limit: 50 },
    filters: search ? { name: search } : {},
  });

  const deleteMutation = useDeleteCategory();
  const updateMutation = useUpdateCategory();

  const handleDelete = async (category: Category) => {
    if (!confirm(`Supprimer la catégorie "${category.name}" ?`)) return;

    try {
      await deleteMutation.mutateAsync(category.id);
      toast.success("Catégorie supprimée");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de supprimer la catégorie");
    }
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      await updateMutation.mutateAsync({
        id: category.id,
        data: { isActive: !category.isActive },
      });
      toast.success(`Catégorie ${!category.isActive ? "activée" : "désactivée"}`);
      refetch();
    } catch (error) {
      toast.error("Impossible de modifier le statut");
    }
  };

  const handleToggleFeatured = async (category: Category) => {
    try {
      await updateMutation.mutateAsync({
        id: category.id,
        data: { isFeatured: !category.isFeatured },
      });
      toast.success(
        `Catégorie ${!category.isFeatured ? "mise en avant" : "retirée de la mise en avant"}`
      );
      refetch();
    } catch (error) {
      toast.error("Impossible de modifier le statut");
    }
  };

  const filteredCategories = categoriesData?.data.filter((category) => {
    if (activeTab === "active") return category.isActive;
    if (activeTab === "inactive") return !category.isActive;
    if (activeTab === "featured") return category.isFeatured;
    return true;
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestion des catégories</CardTitle>
            <CardDescription>
              Gérez les catégories disponibles sur la plateforme
            </CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle catégorie
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Créer une catégorie</DialogTitle>
              </DialogHeader>
              <CreateCategoryForm onSuccess={() => {
                setShowCreateDialog(false);
                refetch();
              }} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="active">Actives</TabsTrigger>
              <TabsTrigger value="inactive">Inactives</TabsTrigger>
              <TabsTrigger value="featured">En vedette</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[250px]"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type d'entités</TableHead>
                    <TableHead>Articles</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : filteredCategories?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Aucune catégorie trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories?.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {category.icon && <span>{category.icon}</span>}
                            {category.name}
                            {category.isFeatured && (
                              <Star className="h-3 w-3 text-amber-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {category.description || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {category.applicableEntities.map((entity) => (
                              <Badge key={entity} variant="secondary">
                                {entity}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {category.itemCount || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              category.isActive ? "default" : "secondary"
                            }
                          >
                            {category.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setEditingCategory(category)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(category)}
                              >
                                {category.isActive ? (
                                  <>
                                    <EyeOff className="h-4 w-4 mr-2" />
                                    Désactiver
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Activer
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleFeatured(category)}
                              >
                                <Star className="h-4 w-4 mr-2" />
                                {category.isFeatured
                                  ? "Retirer de la vedette"
                                  : "Mettre en vedette"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(category)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Dialog d'édition */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <EditCategoryForm
              category={editingCategory}
              onSuccess={() => {
                setEditingCategory(null);
                refetch();
              }}
              onCancel={() => setEditingCategory(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}