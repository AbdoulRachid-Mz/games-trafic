"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuthContext } from "@/contexts/auth-context";
import {
  getOrderCredentialsForBuyer,
  getOrdersByBuyerId,
} from "@/actions/orders";
import { getProductById, updateProduct } from "@/actions/products";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { getShopsByOwner } from "@/actions/shops";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart,
  CheckCircle2,
  Clock,
  XCircle,
  ShoppingBag,
  Package,
  Eye,
  EyeOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type UiOrder = {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  amount: number;
  status:
    | "PENDING"
    | "ACCEPTED_BY_SHOP"
    | "PROCESSING_BY_ADMIN"
    | "COMPLETED"
    | "REJECTED_BY_SHOP"
    | "REJECTED_BY_ADMIN"
    | "CANCELLED";
  createdAt: Date;
};

export default function MyPurchasesPage() {
  const router = useRouter();
  const { user: auth } = useAuthContext();
  const userId = auth?.id || "";
  const [orders, setOrders] = useState<UiOrder[]>([]);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<UiOrder | null>(null);
  const [credentials, setCredentials] = useState<{
    login: string | null;
    password: string | null;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [orderProduct, setOrderProduct] = useState<any | null>(null);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [shops, setShops] = useState<any[]>([]);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const result = await getOrdersByBuyerId(userId, {
        page: 1,
        limit: 100,
      });

      const enriched: UiOrder[] = [];

      for (const o of result.data) {
        let name = o.productId;
        let img: string | undefined;
        try {
          const p = await getProductById(o.productId);
          if (p) {
            name = p.name;
            img = (p as any).featuredImage || undefined;
          }
        } catch {}
        enriched.push({
          id: o.id,
          productId: o.productId,
          productName: name,
          productImage: img,
          amount: Number(o.price || 0),
          status: o.status as UiOrder["status"],
          createdAt: new Date(o.createdAt as any),
        });
      }

      enriched.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setOrders(enriched);
    } catch {
      toast.error("Erreur chargement de vos achats");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  useEffect(() => {
    const loadShops = async () => {
      if (!userId) return;
      try {
        const res = await getShopsByOwner(userId, {
          pagination: { page: 1, limit: 50 },
        });
        setShops(res.data || []);
      } catch {
        setShops([]);
      }
    };
    loadShops();
  }, [userId]);

  useEffect(() => {
    const loadCredentials = async () => {
      if (!selectedOrder?.id) return;
      setIsLoadingCredentials(true);
      try {
        const creds = await getOrderCredentialsForBuyer(selectedOrder.id);
        setCredentials(creds);
      } catch {
        setCredentials(null);
      } finally {
        setIsLoadingCredentials(false);
      }
    };
    loadCredentials();
  }, [selectedOrder?.id]);

  useEffect(() => {
    const loadProduct = async () => {
      if (!selectedOrder?.productId) return;
      try {
        const p = await getProductById(selectedOrder.productId);
        setOrderProduct(p || null);
      } catch {
        setOrderProduct(null);
      }
    };
    loadProduct();
  }, [selectedOrder?.productId]);

  const canPublish = useMemo(() => {
    return (
      !!orderProduct &&
      orderProduct.deliveredToUserId === userId &&
      orderProduct.status === "VENDU"
    );
  }, [orderProduct, userId]);

  const handlePublish = async (shopId: string) => {
    if (!orderProduct || !userId) return;
    setIsPublishing(true);
    try {
      await updateProduct(orderProduct.id, {
        shopId,
        userId,
        status: "NON_VENDU",
        isActive: true,
        isVisible: true,
        deliveredToUserId: null,
        deliveredAt: null,
      } as any);
      toast.success("Produit publié sur le marché");
      setPublishDialogOpen(false);
      setSelectedShopId("");
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de la publication");
    } finally {
      setIsPublishing(false);
    }
  };

  const categorizedOrders = useMemo(() => {
    return {
      pending: orders.filter((o) =>
        ["PENDING", "ACCEPTED_BY_SHOP", "PROCESSING_BY_ADMIN"].includes(
          o.status,
        ),
      ),
      completed: orders.filter((o) => o.status === "COMPLETED"),
      cancelled: orders.filter((o) =>
        ["REJECTED_BY_SHOP", "REJECTED_BY_ADMIN", "CANCELLED"].includes(
          o.status,
        ),
      ),
    };
  }, [orders]);

  const renderOrderTable = (orderList: UiOrder[]) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Produit</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="h-40 text-center">
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Clock className="h-8 w-8 opacity-20 animate-spin" />
                  <p>Chargement en cours...</p>
                </div>
              </TableCell>
            </TableRow>
          ) : orderList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-40 text-center">
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ShoppingBag className="h-8 w-8 opacity-20" />
                  <p>Aucune commande dans cette catégorie</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            orderList.map((o) => (
              <TableRow
                key={o.id}
                className="group hover:bg-primary/5 transition-colors border-border/50"
              >
                <TableCell className="font-mono text-[10px] text-muted-foreground uppercase">
                  {o.id.slice(0, 8)}…
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {o.productImage ? (
                        <Image
                          src={o.productImage}
                          fill
                          alt={o.productName}
                          className="object-cover"
                        />
                      ) : (
                        <Package className="h-5 w-5 absolute inset-0 m-auto text-muted-foreground/50" />
                      )}
                    </div>
                    <span className="font-bold text-sm line-clamp-1">
                      {o.productName}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="font-black text-primary">
                    {o.amount.toLocaleString()}{" "}
                    <span className="text-[10px]">GTC</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {format(o.createdAt, "dd MMM yyyy", { locale: fr })}
                </TableCell>
                <TableCell>
                  <StatusBadge status={o.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-primary hover:text-primary-foreground"
                    onClick={() => {
                      setSelectedOrder(o);
                      setShowDetail(true);
                      setShowPassword(false);
                    }}
                  >
                    Détails
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <Typography variant="h2" weight="bold" className="tracking-tight">
              Mes Achats
            </Typography>
          </div>
          <Typography variant="body-base" theme="muted" className="max-w-md">
            Retrouvez ici l&apos;ensemble de vos transactions, accédez à vos
            comptes et gérez vos produits.
          </Typography>
        </div>
        <div className="flex items-center gap-4 bg-card/40 backdrop-blur-md p-4 rounded-2xl border border-border/50">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Total Dépensé
            </span>
            <span className="text-2xl font-black text-primary">
              {orders.reduce((acc, o) => acc + o.amount, 0).toLocaleString()}{" "}
              <span className="text-sm">GTC</span>
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="bg-muted/50 p-1 h-auto gap-1">
            <TabsTrigger
              value="all"
              className="gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Tous{" "}
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-5 flex items-center justify-center p-0"
              >
                {orders.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Clock className="h-3.5 w-3.5" />
              En cours{" "}
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-5 flex items-center justify-center p-0"
              >
                {categorizedOrders.pending.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Terminés{" "}
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-5 flex items-center justify-center p-0"
              >
                {categorizedOrders.completed.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="cancelled"
              className="gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <XCircle className="h-3.5 w-3.5" />
              Annulés{" "}
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-5 flex items-center justify-center p-0"
              >
                {categorizedOrders.cancelled.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <Card className="bg-card/40 backdrop-blur-xl border-border/50 overflow-hidden">
          <TabsContent value="all" className="m-0 border-none p-0">
            {renderOrderTable(orders)}
          </TabsContent>
          <TabsContent value="pending" className="m-0 border-none p-0">
            {renderOrderTable(categorizedOrders.pending)}
          </TabsContent>
          <TabsContent value="completed" className="m-0 border-none p-0">
            {renderOrderTable(categorizedOrders.completed)}
          </TabsContent>
          <TabsContent value="cancelled" className="m-0 border-none p-0">
            {renderOrderTable(categorizedOrders.cancelled)}
          </TabsContent>
        </Card>
      </Tabs>

      {selectedOrder && (
        <DetailDialog
          open={showDetail}
          onOpenChange={(open) => {
            setShowDetail(open);
            if (!open) {
              setSelectedOrder(null);
              setCredentials(null);
              setOrderProduct(null);
            }
          }}
          order={selectedOrder}
          credentials={credentials}
          isLoadingCredentials={isLoadingCredentials}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((prev) => !prev)}
          onPublish={() => {
            if (shops.length === 0) {
              router.push("/shops/create");
              return;
            }
            if (shops.length === 1) {
              handlePublish(shops[0].id);
              return;
            }
            setPublishDialogOpen(true);
          }}
          canPublish={canPublish}
          product={orderProduct}
        />
      )}

      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choisir une boutique</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={selectedShopId} onValueChange={setSelectedShopId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une boutique" />
              </SelectTrigger>
              <SelectContent>
                {shops.map((shop) => (
                  <SelectItem key={shop.id} value={shop.id}>
                    {shop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {shops.length === 0 && (
              <Button
                variant="outline"
                onClick={() => router.push("/shops/create")}
              >
                Créer une boutique
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPublishDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={() => handlePublish(selectedShopId)}
              disabled={!selectedShopId || isPublishing}
            >
              {isPublishing ? "Publication..." : "Publier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Detail Dialog Component
const DetailDialog = ({
  open,
  onOpenChange,
  order,
  credentials,
  isLoadingCredentials,
  showPassword,
  onTogglePassword,
  onPublish,
  canPublish,
  product,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: UiOrder;
  credentials: { login: string | null; password: string | null } | null;
  isLoadingCredentials: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
  onPublish: () => void;
  canPublish: boolean;
  product: any | null;
}) => {
  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Commande #{order.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Product Info */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
            <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {order.productImage ? (
                <Image
                  src={order.productImage}
                  fill
                  alt={order.productName}
                  className="object-cover"
                />
              ) : (
                <Package className="h-6 w-6 absolute inset-0 m-auto text-muted-foreground/50" />
              )}
            </div>
            <div>
              <p className="font-bold text-sm">{order.productName}</p>
              <p className="text-xs text-muted-foreground">{order.id}</p>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-border/30">
              <span className="text-muted-foreground">Montant</span>
              <span className="font-bold text-primary">
                {order.amount.toLocaleString()} GTC
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/30">
              <span className="text-muted-foreground">Date</span>
              <span className="font-semibold">
                {format(order.createdAt, "dd MMM yyyy", { locale: fr })}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/30 items-center">
              <span className="text-muted-foreground">Statut</span>
              <StatusBadge status={order.status} />
            </div>
          </div>

          {/* Credentials */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Identifiants du compte
            </p>
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Login</span>
                <span className="font-mono text-sm font-bold">
                  {isLoadingCredentials
                    ? "Chargement..."
                    : credentials?.login || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Mot de passe
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold">
                    {isLoadingCredentials
                      ? "Chargement..."
                      : showPassword
                        ? credentials?.password || "—"
                        : credentials?.password
                          ? "••••••••••••"
                          : "—"}
                  </span>
                  {credentials?.password && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={onTogglePassword}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {product && (
            <div className="flex justify-between py-1 text-sm">
              <span className="text-muted-foreground">Statut produit</span>
              <span className="font-semibold">{product.status}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          {canPublish && (
            <Button onClick={onPublish} className="w-full">
              Publier sur le marché
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
