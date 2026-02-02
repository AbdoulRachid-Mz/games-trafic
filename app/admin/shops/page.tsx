// app/admin/shops/page.tsx
"use client";

import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import { Shop, ShopWithRelations } from "@/database/schema";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingBag,
  CheckCircle,
  Star,
  Ban,
  Trash2,
  Globe,
  Phone,
  MapPin,
  Eye,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { SuccessDialog, ErrorDialog } from "@/components/shared/result-dialog";
import { updateShop, deleteShop } from "@/actions/shops";
import { toast } from "sonner";

export default function ShopsAdminPage() {
  const [selectedShop, setSelectedShop] = useState<ShopWithRelations | null>(null);
  const [shopDialogOpen, setShopDialogOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const {
    data,
    total,
    loading,
    page,
    limit,
    searchTerm,
    filters,
    viewMode,
    setPage,
    setLimit,
    setSearchTerm,
    setFilters,
    setViewMode,
    onRefresh,
    error,
  } = useEntityList<ShopWithRelations>({
    entityType: "shops",
    defaultFilters: {
      isActive: true,
      limit: 20,
    },
    defaultLimit: 20,
  });

  const handleViewShop = (shop: Shop) => {
    setSelectedShop(shop);
    setShopDialogOpen(true);
  };

  const handleUpdateShop = async (shop: Shop, updates: Partial<Shop>) => {
    setActionLoading(true);
    try {
      await updateShop(shop.id, updates as any);
      setSuccessMessage("Boutique mise à jour avec succès");
      setShowSuccess(true);
      onRefresh();
      if (selectedShop?.id === shop.id) {
        setSelectedShop({ ...selectedShop, ...updates });
      }
    } catch (error) {
      setErrorMessage("Erreur lors de la mise à jour de la boutique");
      setShowError(true);
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteShop = async (shop: Shop) => {
    setActionLoading(true);
    try {
      await deleteShop(shop.id);
      setSuccessMessage("Boutique supprimée avec succès");
      setShowSuccess(true);
      onRefresh();
      setShopDialogOpen(false);
    } catch (error) {
      setErrorMessage("Erreur lors de la suppression de la boutique");
      setShowError(true);
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const renderStats = () => {
    const stats = [
      {
        label: "Total Boutiques",
        value: total,
        icon: ShoppingBag,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      },
      {
        label: "Vérifiées",
        value: data.filter((s: Shop) => s.verified).length,
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
      {
        label: "En Vedette",
        value: data.filter((s: Shop) => s.featured).length,
        icon: Star,
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
      },
      {
        label: "Boutiques Actives",
        value: data.filter((s: Shop) => s.isActive).length,
        icon: ShoppingBag,
        color: "text-emerald-600",
        bgColor: "bg-emerald-100",
      },
      {
        label: "Total Vues",
        value: data.reduce((acc: number, s: Shop) => acc + (s.viewCount || 0), 0),
        icon: Eye,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
      },
      {
        label: "Balance Totale",
        value:
          Number(
            data.reduce((acc: number, s: Shop) => acc + Number(s.balance || 0), 0)
          ).toLocaleString() + " FCFA",
        icon: Wallet,
        color: "text-red-600",
        bgColor: "bg-red-100",
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="body-sm" theme="muted" className="mb-1">
                    {stat.label}
                  </Typography>
                  <Typography
                    variant="h4"
                    weight="bold"
                    className="truncate max-w-[100px]"
                  >
                    {stat.value}
                  </Typography>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderCardActions = (shop: Shop) => (
    <div className="flex flex-wrap gap-2 mt-3">
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleViewShop(shop)}
        className="flex-1"
      >
        Voir
      </Button>
      <Button
        size="sm"
        variant={shop.verified ? "secondary" : "outline"}
        onClick={() => handleUpdateShop(shop, { verified: !shop.verified })}
        className="flex-1"
      >
        {shop.verified ? "Vérifié" : "Vérifier"}
      </Button>
      <Button
        size="sm"
        variant={shop.isActive ? "destructive" : "default"}
        onClick={() => handleUpdateShop(shop, { isActive: !shop.isActive })}
        className="flex-1"
      >
        {shop.isActive ? "Désactiver" : "Activer"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <EntityList
        title="Gestion des Boutiques"
        description="Gérez les boutiques et les vendeurs de la plateforme"
        entityType="shops"
        data={data}
        total={total}
        loading={loading}
        error={error}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFilterChange={setFilters}
        onRefresh={onRefresh}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        renderStats={renderStats}
        showAddButton={false}
        availableFilters={[
          {
            key: "verified",
            label: "Vérification",
            type: "select",
            options: [
              { value: "all", label: "Tous" },
              { value: "true", label: "Vérifiée" },
              { value: "false", label: "Non vérifiée" },
            ],
          },
          {
            key: "isActive",
            label: "Statut",
            type: "select",
            options: [
              { value: "all", label: "Tous" },
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ],
          },
          {
            key: "featured",
            label: "Mise en avant",
            type: "select",
            options: [
              { value: "all", label: "Tous" },
              { value: "true", label: "En vedette" },
              { value: "false", label: "Standard" },
            ],
          },
        ]}
        sortOptions={[
          { key: "createdAt", label: "Date de création" },
          { key: "viewCount", label: "Nombre de vues" },
          { key: "name", label: "Nom" },
          { key: "balance", label: "Balance" },
        ]}
        renderCard={(shop, viewMode) => (
          <ShopCard
            shop={shop as unknown as ShopWithRelations}
            viewMode={viewMode}
            onView={() => handleViewShop(shop as Shop)}
            customActions={renderCardActions(shop as Shop)}
          />
        )}
      />

      {/* Dialog Détails Boutique */}
      <Dialog open={shopDialogOpen} onOpenChange={setShopDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          {selectedShop && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedShop.profileImage || undefined} />
                    <AvatarFallback>
                      <ShoppingBag className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                      {selectedShop.name}
                      {selectedShop.verified && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {selectedShop.featured && (
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      )}
                    </DialogTitle>
                    <Typography
                      variant="body-sm"
                      theme="muted"
                      className="flex items-center gap-2"
                    >
                      ID: {selectedShop.id} • Créé le{" "}
                      {format(
                        new Date(selectedShop.createdAt || Date.now()),
                        "PP",
                        { locale: fr }
                      )}
                    </Typography>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleUpdateShop(selectedShop, {
                          featured: !selectedShop.featured,
                        })
                      }
                    >
                      <Star
                        className={`h-4 w-4 mr-2 ${
                          selectedShop.featured
                            ? "fill-yellow-500 text-yellow-500"
                            : ""
                        }`}
                      />
                      Vedette
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteShop(selectedShop)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        Informations Générales
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <Typography variant="body-sm" theme="muted">
                          Pays
                        </Typography>
                        <Typography variant="body-sm" weight="medium">
                          {selectedShop.country || "Non spécifié"}
                        </Typography>
                      </div>
                      <div className="flex justify-between">
                        <Typography variant="body-sm" theme="muted">
                          Téléphone
                        </Typography>
                        <Typography
                          variant="body-sm"
                          weight="medium"
                          className="flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />{" "}
                          {selectedShop.phoneNumber || "N/A"}
                        </Typography>
                      </div>
                      <div className="flex justify-between">
                        <Typography variant="body-sm" theme="muted">
                          Site Web
                        </Typography>
                        <Typography
                          variant="body-sm"
                          weight="medium"
                          className="flex items-center gap-1"
                        >
                          <Globe className="h-3 w-3" />{" "}
                          {selectedShop.website || "N/A"}
                        </Typography>
                      </div>
                      <div className="space-y-1 pt-2 border-t">
                        <Typography variant="body-sm" theme="muted">
                          Description
                        </Typography>
                        <Typography variant="body-sm" className="italic">
                          {selectedShop.description ||
                            "Aucune description fournie."}
                        </Typography>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Stats Boutique</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div className="bg-primary/5 p-3 rounded-lg text-center">
                        <Typography variant="body-sm" theme="muted">
                          Solde
                        </Typography>
                        <Typography
                          variant="h4"
                          weight="bold"
                          className="text-primary truncate"
                        >
                          {Number(selectedShop.balance || 0).toLocaleString()}
                        </Typography>
                      </div>
                      <div className="bg-secondary/20 p-3 rounded-lg text-center">
                        <Typography variant="body-sm" theme="muted">
                          Produits
                        </Typography>
                        <Typography variant="h4" weight="bold">
                          {selectedShop.productCount || 0}
                        </Typography>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  {selectedShop.coverImage && (
                    <Card className="overflow-hidden">
                      <img
                        src={selectedShop.coverImage}
                        alt="Boutique Cover"
                        className="w-full h-40 object-cover"
                      />
                    </Card>
                  )}

                  {(selectedShop.address as string) && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Emplacement</CardTitle>
                      </CardHeader>
                      <CardContent className="flex items-start gap-2">
                        <MapPin className="h-5 w-5 text-primary shrink-0" />
                        <Typography variant="body-base">
                          {(selectedShop.address as unknown as string) ||
                            "Adresse non fournie."}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex flex-col gap-2">
                    <Typography
                      variant="body-sm"
                      weight="semibold"
                      className="mb-1"
                    >
                      Actions d'administration
                    </Typography>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={selectedShop.isActive ? "outline" : "default"}
                        onClick={() =>
                          handleUpdateShop(selectedShop, {
                            isActive: !selectedShop.isActive,
                          })
                        }
                      >
                        {selectedShop.isActive ? "Désactiver" : "Activer"}
                      </Button>
                      <Button
                        variant={selectedShop.isVisible ? "outline" : "default"}
                        onClick={() =>
                          handleUpdateShop(selectedShop, {
                            isVisible: !selectedShop.isVisible,
                          })
                        }
                      >
                        {selectedShop.isVisible ? "Cacher" : "Montrer"}
                      </Button>
                      <Button
                        variant={selectedShop.verified ? "ghost" : "secondary"}
                        onClick={() =>
                          handleUpdateShop(selectedShop, {
                            verified: !selectedShop.verified,
                          })
                        }
                        className="col-span-2"
                      >
                        {selectedShop.verified
                          ? "Révoquer la vérification"
                          : "Vérifier la boutique"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogs de résultat */}
      <SuccessDialog
        open={showSuccess}
        onOpenChange={setShowSuccess}
        title="Opération réussie"
        description={successMessage}
      />

      <ErrorDialog
        open={showError}
        onOpenChange={setShowError}
        title="Erreur"
        description={errorMessage}
      />
    </div>
  );
}

// Composant ShopCard local
function ShopCard({
  shop,
  viewMode,
  onView,
  customActions,
}: {
  shop: ShopWithRelations;
  viewMode: "grid" | "list" | "table";
  onView: () => void;
  customActions?: React.ReactNode;
}) {
  if (viewMode === "list") {
    return (
      <Card className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
        <Avatar className="h-12 w-12 cursor-pointer" onClick={onView}>
          <AvatarImage src={shop.profileImage || undefined} />
          <AvatarFallback>
            <ShoppingBag className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 cursor-pointer" onClick={onView}>
          <div className="flex items-center gap-2">
            <Typography variant="body-base" weight="semibold">
              {shop.name}
            </Typography>
            {shop.verified && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
          <Typography
            variant="body-sm"
            theme="muted"
            className="truncate max-w-[300px]"
          >
            {shop.country || "Pays non spécifié"} • {shop.productCount || 0}{" "}
            produits
          </Typography>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <Typography variant="body-sm" weight="bold">
              {Number(shop.balance || 0).toLocaleString()} FCFA
            </Typography>
            <Typography variant="body-sm" theme="muted">
              {shop.viewCount || 0} vues
            </Typography>
          </div>
          <div className="flex gap-1">
            {shop.featured && (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            )}
            {!shop.isActive && <Ban className="h-4 w-4 text-red-500" />}
          </div>
        </div>
        {customActions}
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all border-t-4 border-t-primary/20">
      <div className="relative h-24 bg-linear-to-r from-primary/10 to-primary/5">
        {shop.coverImage && (
          <img
            src={shop.coverImage}
            alt="Cover"
            className="w-full h-full object-cover opacity-50"
          />
        )}
        <Avatar className="absolute -bottom-6 left-4 h-16 w-16 border-4 border-background">
          <AvatarImage src={shop.profileImage || undefined} />
          <AvatarFallback>
            <ShoppingBag className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>
        <div className="absolute top-2 right-2 flex gap-1">
          {shop.featured && (
            <Badge className="bg-yellow-500 text-white border-0">
              <Star className="h-3 w-3 mr-1 fill-white" /> Vedette
            </Badge>
          )}
        </div>
      </div>
      <CardContent className="pt-8 pb-4">
        <div className="flex justify-between items-start mb-2">
          <div className="cursor-pointer" onClick={onView}>
            <div className="flex items-center gap-1">
              <Typography
                variant="body-base"
                weight="bold"
                className="line-clamp-1"
              >
                {shop.name}
              </Typography>
              {shop.verified && (
                <CheckCircle className="h-3 w-3 text-green-500" />
              )}
            </div>
            <Typography variant="body-sm" theme="muted">
              {shop.country || "Afrique"}
            </Typography>
          </div>
          <div className="text-right">
            <Typography variant="body-sm" theme="muted">
              Vues: {shop.viewCount || 0}
            </Typography>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 my-3">
          <div className="bg-gray-50 p-2 rounded text-center">
            <Typography variant="body-sm" theme="muted">
              Produits
            </Typography>
            <Typography variant="body-sm" weight="semibold">
              {shop.productCount || 0}
            </Typography>
          </div>
          <div className="bg-gray-50 p-2 rounded text-center">
            <Typography variant="body-sm" theme="muted">
              Balance
            </Typography>
            <Typography variant="body-sm" weight="semibold">
              {Number(shop.balance || 0).toLocaleString()}
            </Typography>
          </div>
        </div>

        {customActions}
      </CardContent>
    </Card>
  );
}
