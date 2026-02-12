"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/admin/filter-bar";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatCard } from "@/components/admin/stat-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getOrders, getOrderStats, adminApproveOrder, adminRejectOrder } from "@/actions/orders";
import { getProductById } from "@/actions/products";
import { useAuthContext } from "@/contexts/auth-context";

type UiOrder = {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  game?: string | null;
  platform?: string | null;
  buyerId: string;
  buyerName?: string;
  buyerEmail?: string;
  shopId: string;
  shopName?: string;
  shopOwner?: string;
  amount: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  createdAt: Date;
  accountLogin?: string | null;
  accountPasswordMasked?: string | null;
  accountDetails?: {
    level?: string | null;
    rank?: string | null;
    twoFactorAuth?: string | null;
    recoveryEmail?: string | null;
  };
};

export default function AdminOrdersPage() {
  const { user: auth } = useAuthContext();
  const [orders, setOrders] = useState<UiOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationChecks, setVerificationChecks] = useState({
    accountAccessible: false,
    infoCorrect: false,
    levelMatch: false,
    itemsPresent: false,
    noBan: false,
  });
  const [verificationNotes, setVerificationNotes] = useState("");
  const [actionReason, setActionReason] = useState("");

  const loadData = async () => {
    try {
      const result = await getOrders({
        pagination: { page: 1, limit: 50 },
        filters: { statuses: ["PENDING", "ACCEPTED"] },
        options: { sortBy: "createdAt", sortOrder: "desc" },
      });

      const enriched: UiOrder[] = [];
      for (const o of result.data) {
        let productName = o.productId;
        let productImage: string | undefined;
        let game: string | null | undefined;
        let platform: string | null | undefined;
        let accountLogin: string | null | undefined;
        let accountDetails: UiOrder["accountDetails"] = {};

        try {
          const p = await getProductById(o.productId);
          if (p) {
            productName = p.name;
            productImage = (p as any).featuredImage || undefined;
            game = p.game;
            platform = p.platform;
            accountLogin = p.accountLogin || null;
            accountDetails = {
              level: p.accountLevel || null,
              rank: p.accountRank || null,
            };
          }
        } catch {}

        enriched.push({
          id: o.id,
          productId: o.productId,
          productName,
          productImage,
          game,
          platform,
          buyerId: o.buyerId,
          shopId: o.shopId,
          amount: Number(o.price || 0),
          status: o.status as UiOrder["status"],
          createdAt: o.createdAt as Date,
          accountLogin,
          accountPasswordMasked: accountLogin ? "••••••••••••" : null,
          accountDetails,
        });
      }

      setOrders(enriched);
    } catch (e) {
      toast.error("Erreur chargement des commandes");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (orderId: string) => {
    const allChecked = Object.values(verificationChecks).every((v) => v);
    if (!allChecked) {
      toast.error("Veuillez compléter toutes les vérifications");
      return;
    }

    try {
      await adminApproveOrder(orderId, auth?.id);
      toast.success("Commande approuvée - Transfert effectué");
      await loadData();
      setSelectedOrder(null);
      resetVerification();
    } catch (error) {
      toast.error("Erreur lors de l'approbation");
    }
  };

  const handleReject = async (orderId: string) => {
    if (!actionReason.trim()) {
      toast.error("Veuillez fournir une raison");
      return;
    }

    try {
      await adminRejectOrder(orderId, auth?.id || "", actionReason);
      toast.success("Commande rejetée - Remboursement effectué");
      await loadData();
      setSelectedOrder(null);
      resetVerification();
    } catch (error) {
      toast.error("Erreur lors du rejet");
    }
  };

  const resetVerification = () => {
    setVerificationChecks({
      accountAccessible: false,
      infoCorrect: false,
      levelMatch: false,
      itemsPresent: false,
      noBan: false,
    });
    setVerificationNotes("");
    setActionReason("");
    setShowPassword(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié`);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.buyerName && order.buyerName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    accepted: orders.filter((o) => o.status === "ACCEPTED").length,
    rejected: orders.filter((o) => o.status === "REJECTED").length,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <Typography variant="h1" weight="bold" className="mb-2">
          Commandes
        </Typography>
        <Typography variant="body-base" theme="muted">
          Gestion et vérification des commandes de produits
        </Typography>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Commandes"
          value={stats.total}
          icon={ShoppingBag}
          description="Toutes commandes"
        />
        <StatCard
          title="En Attente"
          value={stats.pending}
          icon={Clock}
          description="À traiter"
        />
        <StatCard
          title="Approuvées"
          value={stats.accepted}
          icon={CheckCircle}
          description="Finalisées"
        />
        <StatCard
          title="Rejetées"
          value={stats.rejected}
          icon={XCircle}
          description="Annulées"
        />
      </div>

      {/* Filters */}
      <Card className="bg-card/40 backdrop-blur-xl border-border/50">
        <CardContent className="p-6">
          <FilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder="Rechercher par ID, produit ou acheteur..."
            hasActiveFilters={statusFilter !== "all"}
            onClearFilters={() => {
              setStatusFilter("all");
              setSearchQuery("");
            }}
          >
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] rounded-xl">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="ACCEPTED">Approuvé</SelectItem>
                <SelectItem value="REJECTED">Rejeté</SelectItem>
                <SelectItem value="CANCELLED">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="bg-card/40 backdrop-blur-xl border-border/50">
        <CardHeader>
          <CardTitle>Liste des Commandes ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Jeu/Plateforme</TableHead>
                  <TableHead>Acheteur</TableHead>
                  <TableHead>Boutique</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      {order.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={order.productImage}
                          alt={order.productName}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <span className="font-medium">{order.productName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.game}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.platform}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.buyerName}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.buyerEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.shopName}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.shopOwner}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {order.amount} GTC
                    </TableCell>
                    <TableCell>
                      {format(order.createdAt, "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        Vérifier
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => {
          setSelectedOrder(null);
          resetVerification();
        }}
      >
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vérification de Commande</DialogTitle>
            <DialogDescription>ID: {selectedOrder?.id}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Section 1: Informations Générales */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Informations Générales
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Typography variant="caption1" theme="muted">
                      Commande
                    </Typography>
                    <Typography variant="body-base" weight="semibold">
                      {selectedOrder.id}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="caption1" theme="muted">
                      Date
                    </Typography>
                    <Typography variant="body-base">
                      {format(selectedOrder.createdAt, "dd MMM yyyy HH:mm", {
                        locale: fr,
                      })}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="caption1" theme="muted">
                      Montant
                    </Typography>
                    <Typography variant="body-base" weight="semibold">
                      {selectedOrder.amount} GTC
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="caption1" theme="muted">
                      Statut
                    </Typography>
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                </CardContent>
              </Card>

              {/* Section 2: Produit */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Produit (Compte Gaming)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <img
                      src={selectedOrder.productImage}
                      alt={selectedOrder.productName}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <Typography
                        variant="h4"
                        weight="semibold"
                        className="mb-1"
                      >
                        {selectedOrder.productName}
                      </Typography>
                      <div className="flex gap-2 mb-2">
                        <Badge>{selectedOrder.game}</Badge>
                        <Badge variant="outline">
                          {selectedOrder.platform}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Level: {selectedOrder.accountDetails.level}</div>
                        <div>Rank: {selectedOrder.accountDetails.rank}</div>
                      </div>
                    </div>
                  </div>

                  {/* Informations de Connexion - SENSIBLE */}
                  <div className="border-2 border-amber-500/50 rounded-lg p-4 bg-amber-50/10">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <Typography
                        variant="body-base"
                        weight="semibold"
                        className="text-amber-600"
                      >
                        Informations de Connexion (Confidentiel)
                      </Typography>
                    </div>
                    <div className="space-y-3">
                      {selectedOrder.accountLogin && (
                        <div>
                          <Typography variant="caption1" theme="muted">
                            Login / Email
                          </Typography>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 px-3 py-2 bg-background rounded-lg font-mono text-sm">
                              {selectedOrder.accountLogin}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  selectedOrder.accountLogin,
                                  "Login"
                                )
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <Typography variant="caption2" theme="muted">
                            2FA
                          </Typography>
                          <Typography variant="caption1">
                            {selectedOrder.accountDetails.twoFactorAuth}
                          </Typography>
                        </div>
                        <div>
                          <Typography variant="caption2" theme="muted">
                            Email de Récupération
                          </Typography>
                          <Typography variant="caption1" className="font-mono">
                            {selectedOrder.accountDetails.recoveryEmail}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 3: Vérification */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Checklist de Vérification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries({
                    accountAccessible:
                      "Compte accessible avec les identifiants",
                    infoCorrect: "Informations de connexion correctes",
                    levelMatch: "Niveau/Rank correspond à la description",
                    itemsPresent: "Items/Skins présents comme annoncé",
                    noBan: "Pas de ban ou restriction sur le compte",
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-3">
                      <Checkbox
                        checked={
                          verificationChecks[
                            key as keyof typeof verificationChecks
                          ]
                        }
                        onCheckedChange={(checked) =>
                          setVerificationChecks((prev) => ({
                            ...prev,
                            [key]: !!checked,
                          }))
                        }
                      />
                      <Typography variant="body-sm">{label}</Typography>
                    </div>
                  ))}

                  <div className="pt-3">
                    <Typography
                      variant="caption1"
                      theme="muted"
                      className="mb-2"
                    >
                      Notes de Vérification
                    </Typography>
                    <Textarea
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      placeholder="Ajoutez des notes sur la vérification..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Section 4: Raison (si rejet) */}
              <div>
                <Typography variant="caption1" theme="muted" className="mb-2">
                  Raison du Rejet (optionnel)
                </Typography>
                <Textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Expliquez pourquoi la commande est rejetée..."
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedOrder(null);
                resetVerification();
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleReject(selectedOrder?.id)}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Rejeter & Rembourser
            </Button>
            <Button
              onClick={() => handleApprove(selectedOrder?.id)}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Approuver & Finaliser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
