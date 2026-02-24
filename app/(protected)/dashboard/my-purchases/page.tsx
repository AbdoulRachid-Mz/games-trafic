"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getOrderCredentialsForBuyer, getOrdersByBuyerId } from "@/actions/orders";
import { getProductById, updateProduct } from "@/actions/products";
import Image from "next/image";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getShopsByOwner } from "@/actions/shops";

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
  const [credentials, setCredentials] = useState<{ login: string | null; password: string | null } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [orderProduct, setOrderProduct] = useState<any | null>(null);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [shops, setShops] = useState<any[]>([]);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState(false);

  const loadData = async () => {
    if (!userId) return;
    try {
      const result = await getOrdersByBuyerId(userId, {
        page: 1,
        limit: 50,
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
        } catch { }
        enriched.push({
          id: o.id,
          productId: o.productId,
          productName: name,
          productImage: img,
          amount: Number(o.price || 0),
          status: o.status as UiOrder["status"],
          createdAt: o.createdAt as Date,
        });
      }

      enriched.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setOrders(enriched);
    } catch {
      toast.error("Erreur chargement de vos achats");
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

  return (
    <div className="space-y-6 p-6">
      <div>
        <Typography variant="h1" weight="bold" className="mb-2">
          Mes achats
        </Typography>
        <Typography variant="body-base" theme="muted">
          Historique des produits et comptes achetés
        </Typography>
      </div>
      <Card className="bg-card/40 backdrop-blur-xl border-border/50">
        <CardHeader>
          <CardTitle>Commandes ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center relative gap-3">
                        {o.productImage && (
                          <Image
                            src={o.productImage}
                            width={12}
                            height={12}
                            alt={o.productName}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        )}
                        <span className="font-medium">{o.productName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {o.amount} GTC
                    </TableCell>
                    <TableCell>
                      {format(o.createdAt, "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
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
              <Button variant="outline" onClick={() => router.push("/shops/create")}>
                Créer une boutique
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>
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
//detail dialog
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Détails de la commande {order.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Image
              src={order.productImage || ""}
              width={12}
              height={12}
              alt={order.productName}
              className="w-10 h-10 rounded-lg object-cover"
            />
            <span className="font-medium">{order.productName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Montant:</span>
            <span className="font-semibold">{order.amount} GTC</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Date:</span>
            <span className="font-semibold">
              {format(order.createdAt, "dd MMM yyyy", { locale: fr })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Statut:</span>
            <span className="font-semibold">
              <StatusBadge status={order.status} />
            </span>
          </div>
          <div className="space-y-2">
            <Typography variant="caption1" theme="muted">Identifiants</Typography>
            <div className="flex items-center justify-between">
              <span className="font-medium">Login</span>
              <span className="font-mono text-sm">
                {isLoadingCredentials ? "Chargement..." : credentials?.login || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Mot de passe</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">
                  {isLoadingCredentials
                    ? "Chargement..."
                    : showPassword
                      ? credentials?.password || "—"
                      : credentials?.password
                        ? "••••••••••••"
                        : "—"}
                </span>
                {credentials?.password && (
                  <Button variant="outline" size="sm" onClick={onTogglePassword}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          </div>
          {product && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Produit livré</span>
              <span className="font-semibold">{product.status}</span>
            </div>
          )}
          <div className="flex justify-end gap-2">
            {canPublish && (
              <Button onClick={onPublish}>
                Publier sur le marché
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

