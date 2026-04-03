// components/shared/entity-list.tsx
"use client";

import React, { useState } from "react";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Grid,
  List,
  Table,
  Plus,
  Download,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCarousel } from "@/components/shared/stats-carousel";
import { ResponsiveFilters } from "@/components/shared/responsive-filters";
import { useScreenSize } from "@/hooks/use-screen";

// Types génériques
export interface EntityListProps<T> {
  // Configuration
  title: string;
  description?: string;
  entityType: string;

  // Données
  data: T[];
  total: number;
  loading?: boolean;
  error?: string | null;

  // États
  page: number;
  limit: number;
  searchTerm: string;
  filters: Record<string, any>;
  viewMode?: "grid" | "list" | "table";

  // Handlers
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSearchChange: (search: string) => void;
  onFilterChange: (filters: Record<string, any>) => void;
  onViewModeChange?: (mode: "grid" | "list" | "table") => void;
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onView?: (item: T) => void;
  onDelete?: (item: T) => void;
  onExport?: (format: "csv" | "excel" | "pdf") => void;
  onRefresh?: () => void;
  onResetFilters?: () => void;

  // Renderers
  renderCard: (item: T, viewMode: "grid" | "list" | "table") => React.ReactNode;
  renderTableRow?: (item: T) => React.ReactNode;
  renderTableHeader?: () => React.ReactNode;
  renderStats?: () => React.ReactNode;
  renderEmptyState?: () => React.ReactNode;

  // Configuration avancée
  availableFilters?: {
    key: string;
    label: string;
    type: "select" | "date" | "boolean" | "range";
    options?: { value: string; label: string }[];
    placeholder?: string;
  }[];

  sortOptions?: {
    key: string;
    label: string;
    direction?: "asc" | "desc";
  }[];

  // Options d'affichage
  showSearch?: boolean;
  showFilters?: boolean;
  showViewToggle?: boolean;
  showExport?: boolean;
  showAddButton?: boolean;
  showStats?: boolean;

  // Classes personnalisées
  className?: string;
  gridClassName?: string;
  listClassName?: string;
  tableClassName?: string;
  statsMode?: "carousel" | "auto" | "grid";
}

export function EntityList<T>({
  title,
  description,
  entityType,
  data,
  total,
  loading = false,
  error = null,
  page,
  limit,
  searchTerm,
  filters,
  viewMode = "grid",
  onPageChange,
  onLimitChange,
  onSearchChange,
  onFilterChange,
  onViewModeChange,
  onAdd,
  onEdit,
  onView,
  onDelete,
  onExport,
  onRefresh,
  onResetFilters,
  renderCard,
  renderTableRow,
  renderTableHeader,
  renderStats,
  renderEmptyState,
  availableFilters = [],
  sortOptions = [],
  showSearch = true,
  showFilters = true,
  showViewToggle = true,
  showExport = true,
  showAddButton = true,
  showStats = true,
  className,
  gridClassName,
  listClassName,
  tableClassName,
  isPlaceholderData,
  statsMode = "auto",
}: EntityListProps<T> & { isPlaceholderData?: boolean }) {
  const { isMobile } = useScreenSize();
  const totalPages = Math.ceil(total / limit);

  const mode = statsMode === "auto" ? (isMobile ? "carousel" : "grid") : statsMode;

  // Compter les filtres actifs (excluant limit et sortBy/Order)
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => 
    value !== undefined && value !== "all" && !["limit", "sortBy", "sortOrder"].includes(key)
  ).length;

  // Filtres par défaut selon le type d'entité
  const getDefaultFilters = () => {
    const baseFilters = [
      {
        key: "limit",
        label: "Éléments par page",
        type: "select" as const,
        options: [
          { value: "10", label: "10" },
          { value: "20", label: "20" },
          { value: "50", label: "50" },
          { value: "100", label: "100" },
        ],
      },
      {
        key: "isActive",
        label: "Statut",
        type: "select" as const,
        options: [
          { value: "all", label: "Tous" },
          { value: "active", label: "Actifs" },
          { value: "inactive", label: "Inactifs" },
        ],
      },
    ];

    // Filtres spécifiques selon le type d'entité
    const entitySpecificFilters: Record<string, any[]> = {
      users: [
        {
          key: "accountType",
          label: "Type de compte",
          type: "select" as const,
          options: [
            { value: "all", label: "Tous" },
            { value: "BUYER", label: "Acheteur" },
            { value: "SELLER", label: "Vendeur" },
            { value: "TRADER", label: "Trader" },
            { value: "VIP", label: "VIP" },
          ],
        },
        {
          key: "level",
          label: "Niveau",
          type: "select" as const,
          options: [
            { value: "all", label: "Tous" },
            { value: "A", label: "A" },
            { value: "B", label: "B" },
            { value: "C", label: "C" },
          ],
        },
      ],
      shops: [
        {
          key: "verified",
          label: "Vérification",
          type: "select" as const,
          options: [
            { value: "all", label: "Tous" },
            { value: "verified", label: "Vérifiées" },
            { value: "not_verified", label: "Non vérifiées" },
          ],
        },
      ],
      products: [
        {
          key: "status",
          label: "Statut",
          type: "select" as const,
          options: [
            { value: "all", label: "Tous" },
            { value: "NON_VENDU", label: "Non vendu" },
            { value: "VENDU", label: "Vendu" },
            { value: "RESERVE", label: "Réservé" },
          ],
        },
      ],
      tournaments: [
        {
          key: "status",
          label: "Statut",
          type: "select" as const,
          options: [
            { value: "all", label: "Tous" },
            { value: "UPCOMING", label: "À venir" },
            { value: "LIVE", label: "En cours" },
            { value: "COMPLETED", label: "Terminé" },
          ],
        },
      ],
      claims: [
        {
          key: "status",
          label: "Statut",
          type: "select" as const,
          options: [
            { value: "all", label: "Tous" },
            { value: "PENDING", label: "En attente" },
            { value: "IN_PROGRESS", label: "En cours" },
            { value: "RESOLVED", label: "Résolu" },
            { value: "REJECTED", label: "Rejeté" },
            { value: "CLOSED", label: "Fermé" },
          ],
        },
        {
          key: "type",
          label: "Type",
          type: "select" as const,
          options: [
            { value: "all", label: "Tous" },
            { value: "PAYMENT", label: "Paiement" },
            { value: "DELIVERY", label: "Livraison" },
            { value: "PRODUCT", label: "Produit" },
            { value: "SERVICE", label: "Service" },
            { value: "ACCOUNT", label: "Compte" },
            { value: "OTHER", label: "Autre" },
          ],
        },
      ],
    };

    return [
      ...baseFilters,
      ...(entitySpecificFilters[entityType] || []),
      ...availableFilters,
    ];
  };

  const allFilters = getDefaultFilters();

  // Rendu du contenu selon le mode d'affichage
  const renderContent = () => {
    if (loading) {
      return renderLoading();
    }

    if (error) {
      return renderError();
    }

    if (data.length === 0) {
      return renderEmptyState ? renderEmptyState() : renderDefaultEmptyState();
    }

    const content =
      viewMode === "table"
        ? renderTableView()
        : viewMode === "list"
          ? renderListView()
          : renderGridView();

    return (
      <div
        className={cn(
          "transition-opacity duration-200",
          isPlaceholderData && "opacity-50 pointer-events-none",
        )}
      >
        {content}
      </div>
    );
  };

  const renderLoading = () => (
    <div
      className={cn(
        "grid gap-4",
        viewMode === "grid"
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          : viewMode === "list"
            ? "grid-cols-1"
            : "grid-cols-1",
      )}
    >
      {Array.from({ length: limit }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderError = () => (
    <div className="text-center py-12">
      <Typography variant="h4" theme="danger" className="mb-2">
        Erreur de chargement
      </Typography>
      <Typography variant="body-sm" theme="muted">
        {error}
      </Typography>
      <Button variant="outline" className="mt-4" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Réessayer
      </Button>
    </div>
  );

  const renderDefaultEmptyState = () => (
    <div className="text-center py-12">
      <Typography variant="h4" theme="muted" className="mb-2">
        Aucun résultat trouvé
      </Typography>
      <Typography variant="body-sm" theme="muted" className="mb-4">
        Aucun {title.toLowerCase()} ne correspond à vos critères de recherche.
      </Typography>
      {onResetFilters && (
        <Button variant="outline" onClick={onResetFilters}>
          <X className="h-4 w-4 mr-2" />
          Réinitialiser les filtres
        </Button>
      )}
    </div>
  );

  const renderGridView = () => (
    <div
      className={cn(
        "grid gap-4",
        gridClassName || "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {data.map((item, index) => (
        <React.Fragment key={index}>{renderCard(item, "grid")}</React.Fragment>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className={cn("space-y-4", listClassName)}>
      {data.map((item, index) => (
        <React.Fragment key={index}>{renderCard(item, "list")}</React.Fragment>
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className={cn("overflow-x-auto", tableClassName)}>
      <table className="w-full">
        <thead>
          {renderTableHeader ? (
            renderTableHeader()
          ) : (
            <tr className="border-b">
              <th className="text-left p-4">ID</th>
              <th className="text-left p-4">Nom</th>
              <th className="text-left p-4">Statut</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          )}
        </thead>
        <tbody>
          {data.map((item, index) => (
            <React.Fragment key={index}>
              {renderTableRow ? (
                renderTableRow(item)
              ) : (
                <tr className="border-b hover:bg-muted/50">
                  <td className="p-4">{(item as any).id?.slice(0, 8)}...</td>
                  <td className="p-4">
                    {(item as any).name || (item as any).title || "Sans nom"}
                  </td>
                  <td className="p-4">
                    <Badge
                      variant={(item as any).isActive ? "default" : "secondary"}
                    >
                      {(item as any).isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {onView && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onView(item)}
                        >
                          Voir
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(item)}
                        >
                          Éditer
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Gestion des filtres
  const renderFilterInput = (filter: any) => {
    switch (filter.type) {
      case "select":
        return (
          <Select
            value={filters[filter.key] || "all"}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                [filter.key]: value === "all" ? undefined : value,
              })
            }
          >
            <SelectTrigger className="w-full min-w-[180px]">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {filter.options?.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "boolean":
        return (
          <Select
            value={filters[filter.key] || "all"}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                [filter.key]: value === "all" ? undefined : value,
              })
            }
          >
            <SelectTrigger className="w-full min-w-[180px]">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="true">Oui</SelectItem>
              <SelectItem value="false">Non</SelectItem>
            </SelectContent>
          </Select>
        );

      default:
        return (
          <Input
            placeholder={filter.placeholder || filter.label}
            value={filters[filter.key] || ""}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                [filter.key]: e.target.value || undefined,
              })
            }
            className="min-w-[180px]"
          />
        );
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* En-tête avec titre et actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <Typography variant="h3" weight="bold" animated>
            {title}
          </Typography>
          {description && (
            <Typography variant="lead" theme="muted">
              {description}
            </Typography>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle de vue */}
          {showViewToggle && onViewModeChange && (
            <div className="flex border rounded-lg p-1 bg-muted">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("grid")}
                className="h-8 w-8 p-0"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("list")}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("table")}
                className="h-8 w-8 p-0"
              >
                <Table className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Export */}
          {showExport && onExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onExport("excel")}>
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport("csv")}>
                  CSV (.csv)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport("pdf")}>
                  PDF (.pdf)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Rafraîchir */}
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}

          {/* Ajouter */}
          {showAddButton && onAdd && (
            <Button size="sm" onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          )}
        </div>
      </div>

      {/* Statistiques adaptatives */}
      {showStats && renderStats && (
        <StatsCarousel mode={mode}>
          {renderStats()}
        </StatsCarousel>
      )}

      {/* Barre de recherche et filtres responsive */}
      <ResponsiveFilters
        title={`Filtres ${title}`}
        showSearch={showSearch}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        searchPlaceholder={`Rechercher des ${title.toLowerCase()}...`}
        activeFiltersCount={activeFiltersCount}
        onReset={onResetFilters}
      >
        {allFilters.map((filter) => (
          <div key={filter.key} className="space-y-2">
            {!isMobile && (
              <label className="text-xs font-medium text-muted-foreground ml-1">
                {filter.label}
              </label>
            )}
            {renderFilterInput(filter)}
          </div>
        ))}
        
        {sortOptions.length > 0 && (
          <div className="flex items-center gap-2 pt-2 md:pt-0">
            <Typography variant="caption2" weight="medium" className="md:hidden">Trier par :</Typography>
            <Select
              value={filters.sortBy || sortOptions[0]?.key}
              onValueChange={(value) => onFilterChange({ ...filters, sortBy: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onFilterChange({ 
                ...filters, 
                sortOrder: filters.sortOrder === "asc" ? "desc" : "asc" 
              })}
            >
              {filters.sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </ResponsiveFilters>

      {/* Contenu principal */}
      <Card className="p-3">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>
              {loading ? (
                <Skeleton className="h-6 w-48" />
              ) : (
                <>
                  {total} {total > 1 ? "éléments" : "élément"} trouvé(s)
                </>
              )}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {totalPages > 1 && (
                <span>
                  Page {page} sur {totalPages}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Affichage de {(page - 1) * limit + 1} à{" "}
            {Math.min(page * limit, total)} sur {total} éléments
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) onPageChange(page - 1);
                  }}
                  aria-disabled={page <= 1}
                  className={cn(page <= 1 && "pointer-events-none opacity-50")}
                />
              </PaginationItem>

              {/* Génération des numéros de page */}
              {(() => {
                const pages = [];
                const maxVisiblePages = 5;

                if (totalPages <= maxVisiblePages) {
                  // Afficher toutes les pages
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  // Logique pour afficher avec ellipsis
                  if (page <= 3) {
                    for (let i = 1; i <= 4; i++) {
                      pages.push(i);
                    }
                    pages.push("ellipsis");
                    pages.push(totalPages);
                  } else if (page >= totalPages - 2) {
                    pages.push(1);
                    pages.push("ellipsis");
                    for (let i = totalPages - 3; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    pages.push(1);
                    pages.push("ellipsis");
                    pages.push(page - 1);
                    pages.push(page);
                    pages.push(page + 1);
                    pages.push("ellipsis");
                    pages.push(totalPages);
                  }
                }

                return pages.map((p, index) => (
                  <PaginationItem key={index}>
                    {p === "ellipsis" ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          onPageChange(p as number);
                        }}
                        isActive={page === p}
                      >
                        {p}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ));
              })()}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) onPageChange(page + 1);
                  }}
                  aria-disabled={page >= totalPages}
                  className={cn(
                    page >= totalPages && "pointer-events-none opacity-50",
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
