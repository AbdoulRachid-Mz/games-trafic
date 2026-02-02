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
  TrendingUp,
} from "lucide-react";
import { CategorySelector } from "./category-selector";
import {
  useCategories,
  useDeleteCategory,
  useUpdateCategory,
} from "@/hooks/use-categories";
import { toast } from "sonner";
import type { Category } from "@/database/schema";

export function CategoryManager() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { data: categoriesData, isLoading } = useCategories({
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
    } catch (error) {
      toast.error("Impossible de supprimer la catégorie");
    }
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      await updateMutation.mutateAsync({
        id: category.id,
        data: { isActive: !category.isActive },
      });
      toast.success(
        `Catégorie ${!category.isActive ? "activée" : "désactivée"}`
      );
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
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle catégorie
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une catégorie</DialogTitle>
              </DialogHeader>
              <CategorySelector
                entityId=""
                entityType="USER"
                variant="default"
                allowCreation={true}
                allowDeletion={false}
                disabled={false}
              />
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
    </Card>
  );
}