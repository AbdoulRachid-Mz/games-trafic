"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterBar } from "@/components/admin/filter-bar";
import { StatusBadge } from "@/components/admin/status-badge";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getOrdersByShopId, approveOrderShop, rejectOrder } from "@/actions/orders";
import { getProductById } from "@/actions/products";
import { useAuthContext } from "@/contexts/auth-context";
import { useOrdersByShopId } from "@/hooks/use-orders";

type UiOrder = {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  buyerId: string;
  amount: number;
  status:
    | "PENDING"
    | "ACCEPTED_BY_SHOP"
    | "REJECTED_BY_SHOP"
    | "REJECTED_BY_ADMIN"
    | "COMPLETED"
    | "CANCELLED";
  createdAt: Date;
};

export default function ShopOrdersPage() {
  const params = useParams();
  const shopId = String(params.shopId);
  const { user: auth } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<UiOrder | null>(null);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const [orders, setOrders] = useState<UiOrder[]>([]);
  const { data: ordersData, isLoading, error } = useOrdersByShopId(shopId, {
    status: ["PENDING", "ACCEPTED_BY_SHOP", "COMPLETED", "CANCELLED", "REJECTED_BY_SHOP", "REJECTED_BY_ADMIN"],
    limit: 50,
    page: 1,
  });

  const loadData = async () => {
    try {
      const enriched: UiOrder[] = [];
      for (const o of ordersData?.data || []) {
        let name = o.product?.name || o.product?.id || "Unknown";
        let image: string | undefined;
        try {
          if (o.product?.id) {
            const p = await getProductById(o.product.id);
            if (p) {
              name = p.name;
              image = (p as any).featuredImage || undefined;
            }
          }
        } catch { }
        enriched.push({
          id: o.id,
          productId: o.product?.id || "",
          productName: name,
          productImage: image,
          buyerId: o.buyer?.id || "",
          amount: Number(o.price || 0),
          status: o.status as UiOrder["status"],
          createdAt: o.createdAt as Date,
        });
      }
      setOrders(enriched);
    } catch {
      toast.error("Erreur chargement des commandes");
    }
  };

  useEffect(() => {
    if (ordersData?.data) {
      loadData();
    }
  }, [ordersData]);

  const handleApprove = async () => {
    if (!selectedOrder) return;
    if (!login.trim() || !password.trim()) {
      toast.error("Login et mot de passe requis");
      return;
    }
    try {
      await approveOrderShop(selectedOrder.id, {
        login: login.trim(),
        pass: password.trim()
      });
      // Optionally notify using custom system if needed, but the action handles status update
      toast.success("Commande approuvée par la boutique");
      setSelectedOrder(null);
      setLogin("");
      setPassword("");
      await loadData();
    } catch {
      toast.error("Erreur lors de l’approbation");
    }
  };

  const handleReject = async () => {
    if (!selectedOrder) return;
    if (!rejectReason.trim()) {
      toast.error("Raison de rejet requise");
      return;
    }
    try {
      await rejectOrder(selectedOrder.id, rejectReason.trim());
      toast.success("Commande rejetée");
      setSelectedOrder(null);
      setRejectReason("");
      await loadData();
    } catch {
      toast.error("Erreur lors du rejet");
    }
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <Typography variant="h1" weight="bold" className="mb-2">
          Commandes de la boutique
        </Typography>
        <Typography variant="body-base" theme="muted">
          Filtrer, rechercher et approuver les commandes
        </Typography>
      </div>

      <Card className="bg-card/40 backdrop-blur-xl border-border/50">
        <CardContent className="p-6">
          <FilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder="Rechercher par ID ou produit..."
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
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="ACCEPTED_BY_SHOP">Accepté</SelectItem>
                <SelectItem value="REJECTED_BY_SHOP">Rejeté</SelectItem>
                <SelectItem value="CANCELLED">Annulé</SelectItem>
                <SelectItem value="COMPLETED">Complété</SelectItem>
                <SelectItem value="REJECTED_BY_ADMIN">Rejeté Admin</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>
        </CardContent>
      </Card>

      <Card className="bg-card/40 backdrop-blur-xl border-border/50">
        <CardHeader>
          <CardTitle>Commandes ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Acheteur</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {o.productImage && (
                          <img
                            src={o.productImage}
                            alt={o.productName}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        )}
                        <span className="font-medium">{o.productName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{o.buyerId}</TableCell>
                    <TableCell className="text-right font-semibold">{o.amount} GTC</TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedOrder(o)}>
                        Approuver/Rejeter
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Approuver la commande</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Typography variant="caption1" theme="muted">Login / Email</Typography>
                  <Input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="email@compte" />
                </div>
                <div>
                  <Typography variant="caption1" theme="muted">Mot de passe</Typography>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
              </div>
              <div>
                <Typography variant="caption1" theme="muted">Raison de rejet (optionnel)</Typography>
                <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Si rejet, indiquez la raison" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>Fermer</Button>
            <Button variant="destructive" onClick={handleReject}>Rejeter</Button>
            <Button onClick={handleApprove}>Approuver</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
