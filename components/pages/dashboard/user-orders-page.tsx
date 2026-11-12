"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Package,
  ShoppingBag,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/admin/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { useAuthContext } from "@/contexts/auth-context";
import {
  getOrderCredentialsForBuyer,
  getOrdersByBuyerId,
  getUserOrderStats,
} from "@/actions/orders";
import { getProductById, updateProduct } from "@/actions/products";
import { getShopsByOwner } from "@/actions/shops";
import type { OrderStatus } from "@/types/api";

type UiOrder = {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  shopName?: string;
  amount: number;
  status: OrderStatus;
  createdAt: Date;
};

const PENDING_STATUSES: OrderStatus[] = [
  "PENDING",
  "ACCEPTED_BY_SHOP",
  "PROCESSING_BY_ADMIN",
];
const CANCELLED_STATUSES: OrderStatus[] = [
  "REJECTED_BY_SHOP",
  "REJECTED_BY_ADMIN",
  "CANCELLED",
];

const TAB_STATUSES: Record<string, OrderStatus[] | undefined> = {
  all: undefined,
  pending: PENDING_STATUSES,
  completed: ["COMPLETED"],
  cancelled: CANCELLED_STATUSES,
};

export function UserOrdersPage() {
  const router = useRouter();
  const { user: auth } = useAuthContext();
  const userId = auth?.id || "";

  const [tab, setTab] = useState("all");
  const [orders, setOrders] = useState<UiOrder[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    completed: number;
    cancelled: number;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<UiOrder | null>(null);
  const [credentials, setCredentials] = useState<{
    login: string | null;
    password: string | null;
  } | null>(null);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [orderProduct, setOrderProduct] = useState<any | null>(null);

  const [shops, setShops] = useState<any[]>([]);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const mapOrders = useCallback(
    (rows: any[]): UiOrder[] =>
      rows.map((o) => ({
        id: o.id,
        productId: o.productId,
        productName: o.product?.name || "Produit indisponible",
        productImage: o.product?.featuredImage || undefined,
        shopName: o.shop?.name || undefined,
        amount: Number(o.price || 0),
        status: o.status as OrderStatus,
        createdAt: new Date(o.createdAt as any),
      })),
    [],
  );

  const loadPage = useCallback(
    async (targetPage: number, append: boolean) => {
      if (!userId) return;
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);
      try {
        const result = await getOrdersByBuyerId(userId, {
          page: targetPage,
          limit: 20,
          status: TAB_STATUSES[tab],
        });
        const mapped = mapOrders(result.data as any[]);
        setOrders((prev) => {
          if (!append) return mapped;
          const seen = new Set(prev.map((o) => o.id));
          return [...prev, ...mapped.filter((o) => !seen.has(o.id))];
        });
        setHasNext(Boolean(result.pagination?.hasNext));
        setPage(targetPage);
      } catch {
        toast.error("Erreur lors du chargement de vos commandes");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [userId, tab, mapOrders],
  );

  useEffect(() => {
    loadPage(1, false);
  }, [loadPage]);

  useEffect(() => {
    if (!userId) return;
    getUserOrderStats(userId)
      .then((s) =>
        setStats({
          total: s.total,
          completed: s.completed,
          cancelled: s.cancelled + s.rejectedByShop + s.rejectedByAdmin,
        }),
      )
      .catch(() => setStats(null));
  }, [userId]);

  // Boutiques du vendeur (pour republier un produit livré sur le marché)
  useEffect(() => {
    if (!userId) return;
    getShopsByOwner(userId, { pagination: { page: 1, limit: 50 } })
      .then((res) => setShops(res.data || []))
      .catch(() => setShops([]));
  }, [userId]);

  // Détail : produit complet (statut de livraison) + identifiants
  useEffect(() => {
    if (!selectedOrder) {
      setOrderProduct(null);
      setCredentials(null);
      return;
    }
    let cancelled = false;

    getProductById(selectedOrder.productId)
      .then((p) => {
        if (!cancelled) setOrderProduct(p || null);
      })
      .catch(() => {
        if (!cancelled) setOrderProduct(null);
      });

    if (selectedOrder.status === "COMPLETED") {
      setIsLoadingCredentials(true);
      getOrderCredentialsForBuyer(selectedOrder.id)
        .then((creds) => {
          if (!cancelled) setCredentials(creds);
        })
        .catch(() => {
          if (!cancelled) setCredentials(null);
        })
        .finally(() => {
          if (!cancelled) setIsLoadingCredentials(false);
        });
    } else {
      setCredentials(null);
    }

    return () => {
      cancelled = true;
    };
  }, [selectedOrder]);

  const totalSpent = useMemo(
    () => orders.reduce((acc, o) => acc + o.amount, 0),
    [orders],
  );

  const canPublish = useMemo(
    () =>
      !!orderProduct &&
      orderProduct.deliveredToUserId === userId &&
      orderProduct.status === "VENDU",
    [orderProduct, userId],
  );

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
      setSelectedOrder(null);
      await loadPage(1, false);
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de la publication");
    } finally {
      setIsPublishing(false);
    }
  };

  const openOrder = (order: UiOrder) => {
    setSelectedOrder(order);
    setShowPassword(false);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-2">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <Typography variant="h2" weight="bold" className="tracking-tight">
              Mes commandes
            </Typography>
          </div>
          <Typography variant="body-base" theme="muted" className="max-w-md">
            Suivez vos achats, accédez à vos comptes livrés et republiez vos
            produits sur le marché.
          </Typography>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatChip label="Total" value={stats?.total ?? 0} />
          <StatChip
            label="Terminées"
            value={stats?.completed ?? 0}
            className="text-green-600"
          />
          <StatChip
            label="Annulées"
            value={stats?.cancelled ?? 0}
            className="text-destructive"
          />
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value);
          setOrders([]);
        }}
        className="space-y-4"
      >
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="all" className="px-4 py-2">
              Toutes
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2 px-4 py-2">
              <Clock className="h-3.5 w-3.5" />
              En cours
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2 px-4 py-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Terminées
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="gap-2 px-4 py-2">
              <XCircle className="h-3.5 w-3.5" />
              Annulées
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={tab} className="m-0">
          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-2 border-dashed py-16">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-muted-foreground">
                Aucune commande dans cette catégorie
              </p>
              <Button
                variant="outline"
                className="mt-2 rounded-full"
                onClick={() => router.push("/marketplace")}
              >
                Explorer le marché
              </Button>
            </Card>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onOpen={() => openOrder(order)}
                  />
                ))}
              </div>
              {hasNext && (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => loadPage(page + 1, true)}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? "Chargement..." : "Charger plus"}
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {selectedOrder && (
        <OrderDetailDialog
          open={!!selectedOrder}
          onOpenChange={(open) => {
            if (!open) setSelectedOrder(null);
          }}
          order={selectedOrder}
          credentials={credentials}
          isLoadingCredentials={isLoadingCredentials}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((prev) => !prev)}
          canPublish={canPublish}
          product={orderProduct}
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
        />
      )}

      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choisir une boutique</DialogTitle>
          </DialogHeader>
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

function StatChip({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="rounded-xl border bg-card/50 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={`text-xl font-black ${className || ""}`}>{value}</p>
    </div>
  );
}

function OrderCard({
  order,
  onOpen,
}: {
  order: UiOrder;
  onOpen: () => void;
}) {
  return (
    <Card className="flex items-center gap-3 p-3 transition-all hover:border-primary/40 hover:shadow-md">
      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {order.productImage ? (
          <Image
            src={order.productImage}
            fill
            alt={order.productName}
            className="object-cover"
          />
        ) : (
          <Package className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground/50" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-bold text-sm">{order.productName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {order.shopName ? `${order.shopName} · ` : ""}
              <span className="font-mono uppercase">
                {order.id.slice(0, 8)}
              </span>
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm font-black text-primary">
            {order.amount.toLocaleString()}{" "}
            <span className="text-[10px]">GTC</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {format(order.createdAt, "dd MMM yyyy", { locale: fr })}
            </span>
            <Button variant="ghost" size="sm" onClick={onOpen}>
              Détails
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function OrderDetailDialog({
  open,
  onOpenChange,
  order,
  credentials,
  isLoadingCredentials,
  showPassword,
  onTogglePassword,
  canPublish,
  product,
  onPublish,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: UiOrder;
  credentials: { login: string | null; password: string | null } | null;
  isLoadingCredentials: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
  canPublish: boolean;
  product: any | null;
  onPublish: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Commande #{order.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
              {order.productImage ? (
                <Image
                  src={order.productImage}
                  fill
                  alt={order.productName}
                  className="object-cover"
                />
              ) : (
                <Package className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground/50" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{order.productName}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {order.id}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <DetailRow label="Montant">
              <span className="font-bold text-primary">
                {order.amount.toLocaleString()} GTC
              </span>
            </DetailRow>
            <DetailRow label="Date">
              {format(order.createdAt, "dd MMM yyyy", { locale: fr })}
            </DetailRow>
            <DetailRow label="Statut">
              <StatusBadge status={order.status} />
            </DetailRow>
            {product && (
              <DetailRow label="Statut produit">
                <Badge variant="outline">{product.status}</Badge>
              </DetailRow>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Identifiants du compte
            </p>
            {order.status === "COMPLETED" ? (
              <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
                <DetailRow label="Login">
                  <span className="font-mono text-sm font-bold">
                    {isLoadingCredentials ? "Chargement..." : credentials?.login || "—"}
                  </span>
                </DetailRow>
                <DetailRow label="Mot de passe">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold">
                      {isLoadingCredentials
                        ? "Chargement..."
                        : showPassword
                          ? credentials?.password || "—"
                          : credentials?.password
                            ? "••••••••••"
                            : "—"}
                    </span>
                    {credentials?.password && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={onTogglePassword}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </DetailRow>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed bg-muted/20 p-3 text-xs text-muted-foreground">
                Les identifiants seront disponibles une fois la commande
                validée par l&apos;administrateur.
              </p>
            )}
          </div>
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
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/30 py-1 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{children}</span>
    </div>
  );
}
