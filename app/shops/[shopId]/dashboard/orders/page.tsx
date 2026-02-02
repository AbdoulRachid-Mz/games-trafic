// app/(main)/shops/[id]/dashboard/orders/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, CheckCircle, XCircle, Clock, AlertCircle,
  Filter, Search, Download, MoreVertical, Eye, Mail, User,
  Package, DollarSign, Calendar, Shield, RefreshCw, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Image from "next/image";

// Actions
import { getOrdersByShopId, getOrderStats, acceptOrder, rejectOrder } from "@/actions/orders";
import { updateProduct } from "@/actions/products";

// Types
interface OrderWithDetails {
  id: string;
  productId: string;
  buyerId: string;
  shopId: string;
  price: string;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  orderType: string;
  orderedProductId?: string;
  expiresAt?: string;
  rejectionReason?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    description?: string;
    price: string;
    featuredImage?: string;
    game?: string;
    platform?: string;
    accountLogin?: string;
    encryptedPassword?: string;
  };
  buyer?: {
    id: string;
    username?: string;
    fullName?: string;
    email: string;
    profileImage?: string;
  };
}

interface OrderFilters {
  status?: ('PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED')[];
  search?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  minPrice?: number;
  maxPrice?: number;
}

export default function ShopOrdersPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId as string;

  // États
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState<OrderFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // Dialog states
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [productCredentials, setProductCredentials] = useState({
    login: "",
    password: "",
    notes: ""
  });

  // Charger les commandes
  const loadOrders = async (page = 1) => {
    setIsLoading(true);
    try {
      const statusFilter = activeTab === "all" 
        ? undefined 
        : [activeTab.toUpperCase() as 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'];
      
      const result = await getOrdersByShopId(shopId, {
        filters: {
          ...filters,
          statuses: statusFilter,
        },
        pagination: { page, limit: pagination.limit },
        options: {
          populate: ["product", "buyer"],
          sortBy: "createdAt",
          sortOrder: "desc"
        }
      });

      setOrders(result.data.map((o: any) => ({
        ...o,
        expiresAt: o.expiresAt ? o.expiresAt.toISOString() : undefined,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString()
      })) as OrderWithDetails[]);
      setPagination(prev => ({
        ...prev,
        page,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages
      }));
    } catch (error) {
      console.error("Erreur chargement commandes:", error);
      toast.error("Erreur lors du chargement des commandes");
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les statistiques
  const loadStats = async () => {
    try {
      const statsData = await getOrderStats({ shopId });
      setStats(statsData);
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    }
  };

  useEffect(() => {
    loadOrders();
    loadStats();
  }, [activeTab, filters]);

  // Filtres actifs
  const filterButtons = [
    { value: "all", label: "Toutes", color: "bg-gray-500", count: stats?.total || 0 },
    { value: "pending", label: "En attente", color: "bg-amber-500", count: stats?.pending || 0 },
    { value: "accepted", label: "Acceptées", color: "bg-green-500", count: stats?.accepted || 0 },
    { value: "rejected", label: "Refusées", color: "bg-red-500", count: stats?.rejected || 0 },
    { value: "cancelled", label: "Annulées", color: "bg-gray-400", count: stats?.cancelled || 0 },
  ];

  // Gestion des actions
  const handleViewDetails = (order: OrderWithDetails) => {
    setSelectedOrder(order);
    setIsDetailsDialogOpen(true);
  };

  const handleAcceptOrder = async () => {
    if (!selectedOrder) return;

    try {
      await acceptOrder(selectedOrder.id);
      toast.success("Commande acceptée avec succès");
      setIsAcceptDialogOpen(false);
      setSelectedOrder(null);
      loadOrders();
      loadStats();
    } catch (error) {
      toast.error("Erreur lors de l'acceptation de la commande");
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder) return;

    try {
      await rejectOrder(selectedOrder.id, rejectionReason);
      toast.success("Commande refusée avec succès");
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedOrder(null);
      loadOrders();
      loadStats();
    } catch (error) {
      toast.error("Erreur lors du refus de la commande");
    }
  };

  const handleCompleteOrder = async () => {
    if (!selectedOrder || !selectedOrder.product) return;

    try {
      // Mettre à jour les identifiants du produit
      await updateProduct(selectedOrder.product.id, {
        accountLogin: productCredentials.login,
        encryptedPassword: productCredentials.password,
        status: "RESERVE", // Statut réservé en attendant validation admin
      });

      // Accepter la commande
      await acceptOrder(selectedOrder.id);

      toast.success("Commande complétée avec succès ! En attente de validation admin.");
      setIsCompleteDialogOpen(false);
      setProductCredentials({ login: "", password: "", notes: "" });
      setSelectedOrder(null);
      loadOrders();
      loadStats();
    } catch (error) {
      toast.error("Erreur lors de la complétion de la commande");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING": return <Clock className="h-4 w-4" />;
      case "ACCEPTED": return <CheckCircle className="h-4 w-4" />;
      case "REJECTED": return <XCircle className="h-4 w-4" />;
      case "CANCELLED": return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-amber-100 text-amber-800 border-amber-200";
      case "ACCEPTED": return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED": return "bg-red-100 text-red-800 border-red-200";
      case "CANCELLED": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatPrice = (price: string) => {
    return `${parseFloat(price).toFixed(2)} GTC`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: fr });
  };

  // Filtre de recherche
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <Typography variant="h1" weight="bold" className="mb-2 flex items-center gap-3">
              <ShoppingBag className="h-8 w-8 text-primary" />
              Gestion des commandes
            </Typography>
            <Typography variant="body-base" theme="muted">
              Gérez les commandes de vos produits et suivez leur statut
            </Typography>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
            <Button className="gap-2" onClick={() => loadOrders()}>
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" weight="bold" className="text-primary">
                    {stats?.total || 0}
                  </Typography>
                  <Typography variant="caption1" theme="muted">
                    Commandes totales
                  </Typography>
                </div>
                <ShoppingBag className="h-8 w-8 text-primary/30" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" weight="bold" className="text-amber-600">
                    {stats?.pending || 0}
                  </Typography>
                  <Typography variant="caption1" theme="muted">
                    En attente
                  </Typography>
                </div>
                <Clock className="h-8 w-8 text-amber-300" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" weight="bold" className="text-green-600">
                    {stats?.accepted || 0}
                  </Typography>
                  <Typography variant="caption1" theme="muted">
                    Acceptées
                  </Typography>
                </div>
                <CheckCircle className="h-8 w-8 text-green-300" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" weight="bold" className="text-purple-600">
                    {stats?.totalRevenue || 0} GTC
                  </Typography>
                  <Typography variant="caption1" theme="muted">
                    Chiffre d'affaires
                  </Typography>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Barre de recherche */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par produit, client, ID..."
                  className="pl-10"
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>

              {/* Filtres */}
              <div className="flex gap-2">
                <Select onValueChange={(value) => setActiveTab(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterButtons.map((filter) => (
                      <SelectItem key={filter.value} value={filter.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${filter.color}`} />
                          {filter.label} ({filter.count})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Plus de filtres
                </Button>
              </div>
            </div>

            {/* Filtres rapides */}
            <div className="flex flex-wrap gap-2 mt-4">
              {filterButtons.map((filter) => (
                <Button
                  key={filter.value}
                  variant={activeTab === filter.value ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  onClick={() => setActiveTab(filter.value)}
                >
                  <div className={`w-2 h-2 rounded-full ${filter.color}`} />
                  {filter.label}
                  <Badge variant="secondary" className="ml-1">
                    {filter.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Liste des commandes */}
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === "all" ? "Toutes les commandes" : 
               activeTab === "pending" ? "Commandes en attente" :
               activeTab === "accepted" ? "Commandes acceptées" :
               activeTab === "rejected" ? "Commandes refusées" : "Commandes annulées"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <Typography variant="h4" weight="semibold" className="mb-2">
                  Aucune commande trouvée
                </Typography>
                <Typography variant="body-base" theme="muted">
                  {activeTab === "pending" 
                    ? "Aucune commande en attente pour le moment"
                    : "Aucune commande ne correspond à vos filtres"}
                </Typography>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {orders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Informations produit */}
                        <div className="flex items-start gap-4 flex-1">
                          {order.product?.featuredImage && (
                            <Image
                              src={order.product.featuredImage}
                              alt={order.product.name}
                              width={80}
                              height={80}
                              className="rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <Typography variant="body-lg" weight="semibold" className="mb-1">
                              {order.product?.name || "Produit non trouvé"}
                            </Typography>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                              {order.product?.game && (
                                <span className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  {order.product.game}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {formatPrice(order.price)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(order.createdAt)}
                              </span>
                            </div>
                            {order.message && (
                              <Typography variant="body-sm" theme="muted" className="line-clamp-1">
                                Message: {order.message}
                              </Typography>
                            )}
                          </div>
                        </div>

                        {/* Informations client */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <Typography variant="body-sm" weight="medium" className="mb-1 flex items-center gap-1 justify-end">
                              <User className="h-3 w-3" />
                              {order.buyer?.fullName || order.buyer?.username || "Client"}
                            </Typography>
                            <Typography variant="caption2" theme="muted">
                              {order.buyer?.email}
                            </Typography>
                          </div>
                          {order.buyer?.profileImage && (
                            <Image
                              src={order.buyer.profileImage}
                              alt="Client"
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          )}
                        </div>

                        {/* Statut et actions */}
                        <div className="flex items-center gap-3">
                          <Badge className={`gap-1 ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {order.status === "PENDING" ? "En attente" :
                             order.status === "ACCEPTED" ? "Acceptée" :
                             order.status === "REJECTED" ? "Refusée" : "Annulée"}
                          </Badge>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                              
                              {order.status === "PENDING" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setIsAcceptDialogOpen(true);
                                    }}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Accepter la commande
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setIsRejectDialogOpen(true);
                                    }}
                                    className="text-red-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Refuser la commande
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setIsCompleteDialogOpen(true);
                                    }}
                                    className="text-blue-600"
                                  >
                                    <Shield className="h-4 w-4 mr-2" />
                                    Compléter la commande
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Contacter le client
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => loadOrders(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Précédent
                </Button>
                <Typography variant="body-sm">
                  Page {pagination.page} sur {pagination.totalPages}
                </Typography>
                <Button
                  variant="outline"
                  onClick={() => loadOrders(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Suivant
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog - Détails de la commande */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Détails de la commande</DialogTitle>
            <DialogDescription>
              ID: {selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* En-tête */}
              <div className="flex items-center justify-between">
                <div>
                  <Badge className={`gap-1 text-lg ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    {selectedOrder.status === "PENDING" ? "En attente" :
                     selectedOrder.status === "ACCEPTED" ? "Acceptée" :
                     selectedOrder.status === "REJECTED" ? "Refusée" : "Annulée"}
                  </Badge>
                  <Typography variant="body-sm" theme="muted" className="mt-1">
                    Commandé le {formatDate(selectedOrder.createdAt)}
                  </Typography>
                </div>
                <Typography variant="h3" weight="bold" className="text-primary">
                  {formatPrice(selectedOrder.price)}
                </Typography>
              </div>

              <Separator />

              {/* Produit */}
              <div>
                <Typography variant="h4" weight="semibold" className="mb-4">
                  Produit commandé
                </Typography>
                <div className="flex items-start gap-4">
                  {selectedOrder.product?.featuredImage && (
                    <Image
                      src={selectedOrder.product.featuredImage}
                      alt={selectedOrder.product.name}
                      width={120}
                      height={120}
                      className="rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <Typography variant="body-lg" weight="semibold">
                      {selectedOrder.product?.name}
                    </Typography>
                    {selectedOrder.product?.description && (
                      <Typography variant="body-sm" theme="muted" className="mt-2">
                        {selectedOrder.product.description}
                      </Typography>
                    )}
                    <div className="flex flex-wrap gap-4 mt-3">
                      {selectedOrder.product?.game && (
                        <div>
                          <Typography variant="caption1" theme="muted">Jeu</Typography>
                          <Typography variant="body-sm">{selectedOrder.product.game}</Typography>
                        </div>
                      )}
                      {selectedOrder.product?.platform && (
                        <div>
                          <Typography variant="caption1" theme="muted">Plateforme</Typography>
                          <Typography variant="body-sm">{selectedOrder.product.platform}</Typography>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Client */}
              <div>
                <Typography variant="h4" weight="semibold" className="mb-4">
                  Informations client
                </Typography>
                <div className="flex items-center gap-4">
                  {selectedOrder.buyer?.profileImage && (
                    <Image
                      src={selectedOrder.buyer.profileImage}
                      alt="Client"
                      width={60}
                      height={60}
                      className="rounded-full"
                    />
                  )}
                  <div>
                    <Typography variant="body-lg" weight="semibold">
                      {selectedOrder.buyer?.fullName || selectedOrder.buyer?.username || "Client"}
                    </Typography>
                    <Typography variant="body-sm" theme="muted">
                      {selectedOrder.buyer?.email}
                    </Typography>
                    <Button variant="link" className="p-0 h-auto gap-2 mt-2">
                      <Mail className="h-4 w-4" />
                      Contacter le client
                    </Button>
                  </div>
                </div>
              </div>

              {/* Message */}
              {selectedOrder.message && (
                <>
                  <Separator />
                  <div>
                    <Typography variant="h4" weight="semibold" className="mb-2">
                      Message du client
                    </Typography>
                    <Card>
                      <CardContent className="p-4">
                        <Typography variant="body-sm">{selectedOrder.message}</Typography>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {/* Raison du refus */}
              {selectedOrder.rejectionReason && (
                <>
                  <Separator />
                  <div>
                    <Typography variant="h4" weight="semibold" className="mb-2">
                      Raison du refus
                    </Typography>
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="p-4">
                        <Typography variant="body-sm" className="text-red-800">
                          {selectedOrder.rejectionReason}
                        </Typography>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Fermer
            </Button>
            {selectedOrder?.status === "PENDING" && (
              <div className="flex gap-2">
                <Button 
                  variant="destructive"
                  onClick={() => {
                    setIsDetailsDialogOpen(false);
                    setIsRejectDialogOpen(true);
                  }}
                >
                  Refuser
                </Button>
                <Button 
                  onClick={() => {
                    setIsDetailsDialogOpen(false);
                    setIsAcceptDialogOpen(true);
                  }}
                >
                  Accepter
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog - Accepter la commande */}
      <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Accepter la commande
            </DialogTitle>
            <DialogDescription>
              Confirmez-vous l&apos;acceptation de cette commande ?
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <Typography variant="body-sm">
                La commande <strong>{selectedOrder.id}</strong> pour le produit{' '}
                <strong>{selectedOrder.product?.name}</strong> sera marquée comme acceptée.
              </Typography>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <Typography variant="body-sm" className="text-amber-800">
                    <strong>Important:</strong> Après acceptation, le produit sera marqué comme réservé et devra être examiné par nos administrateurs avant le versement des fonds.
                  </Typography>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAcceptDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAcceptOrder} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Confirmer l&apos;acceptation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog - Refuser la commande */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Refuser la commande
            </DialogTitle>
            <DialogDescription>
              Indiquez la raison du refus de cette commande
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Raison du refus *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Ex: Produit non disponible, informations incomplètes..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
              <Typography variant="caption2" theme="muted">
                Cette raison sera communiquée au client
              </Typography>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <Typography variant="body-sm" className="text-red-800">
                  <strong>Attention:</strong> Le client sera automatiquement remboursé après le refus de la commande.
                </Typography>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRejectOrder}
              disabled={!rejectionReason.trim()}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Refuser et rembourser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog - Compléter la commande */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Compléter la commande
            </DialogTitle>
            <DialogDescription>
              Fournissez les identifiants du compte et acceptez la commande
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Récapitulatif */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Typography variant="body-sm" theme="muted">Produit</Typography>
                      <Typography variant="body-sm" weight="medium">
                        {selectedOrder.product?.name}
                      </Typography>
                    </div>
                    <div className="flex items-center justify-between">
                      <Typography variant="body-sm" theme="muted">Client</Typography>
                      <Typography variant="body-sm" weight="medium">
                        {selectedOrder.buyer?.fullName || selectedOrder.buyer?.username}
                      </Typography>
                    </div>
                    <div className="flex items-center justify-between">
                      <Typography variant="body-sm" theme="muted">Montant</Typography>
                      <Typography variant="body-sm" weight="medium" className="text-primary">
                        {formatPrice(selectedOrder.price)}
                      </Typography>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Identifiants du compte */}
              <div className="space-y-4">
                <Typography variant="h4" weight="semibold">
                  Identifiants du compte
                </Typography>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="login">Login / Email du compte *</Label>
                    <Input
                      id="login"
                      placeholder="exemple@gmail.com"
                      value={productCredentials.login}
                      onChange={(e) => setProductCredentials(prev => ({ 
                        ...prev, 
                        login: e.target.value 
                      }))}
                    />
                    <Typography variant="caption2" theme="muted">
                      Le login/email du compte jeu
                    </Typography>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={productCredentials.password}
                      onChange={(e) => setProductCredentials(prev => ({ 
                        ...prev, 
                        password: e.target.value 
                      }))}
                    />
                    <Typography variant="caption2" theme="muted">
                      Le mot de passe du compte jeu
                    </Typography>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes supplémentaires (optionnel)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informations complémentaires, codes de récupération, questions de sécurité..."
                    value={productCredentials.notes}
                    onChange={(e) => setProductCredentials(prev => ({ 
                      ...prev, 
                      notes: e.target.value 
                    }))}
                    rows={2}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <Typography variant="body-sm" className="text-blue-800">
                      <strong>Processus de validation:</strong> 
                      <ol className="list-decimal ml-5 mt-2 space-y-1">
                        <li>Les identifiants seront chiffrés et stockés de manière sécurisée</li>
                        <li>La commande sera marquée comme acceptée</li>
                        <li>Le produit sera mis en statut &quot;réservé&quot;</li>
                        <li>Nos administrateurs examineront la transaction</li>
                        <li>Après validation, les fonds seront versés sur votre wallet</li>
                      </ol>
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleCompleteOrder}
              disabled={!productCredentials.login.trim() || !productCredentials.password.trim()}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Compléter et accepter la commande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}