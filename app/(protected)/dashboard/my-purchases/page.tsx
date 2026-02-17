"use client";

import { useEffect, useState } from "react";
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
import { getOrdersByBuyerId, getOrdersByShopId } from "@/actions/orders";
import { getProductById } from "@/actions/products";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type UiOrder = {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  amount: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  createdAt: Date;
};

export default function MyPurchasesPage() {
  const { user: auth } = useAuthContext();
  const userId = auth?.id || "";
  const [orders, setOrders] = useState<UiOrder[]>([]);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<UiOrder | null>(null);

  const loadData = async () => {
    if (!userId) return;
    try {
      // Fetch orders where user is the buyer
      const result = await getOrdersByBuyerId(userId, {
        page: 1,
        limit: 50,
      });
      // Fetch orders where user is the shop owner
      const shopResult = await getOrdersByShopId(userId, {
        page: 1,
        limit: 50,
      });

      const enriched: UiOrder[] = [];

      // Process buyer orders
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

      // Process shop orders
      for (const o of shopResult.data) {
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

      // Sort combined orders by createdAt desc
      enriched.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setOrders(enriched);
    } catch {
      toast.error("Erreur chargement de vos achats");
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

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
                      <Button variant="outline" size="sm" onClick={() => setSelectedOrder(o)}>
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
    </div>
  );
}
//detail dialog
const DetailDialog = ({
  open,
  onOpenChange,
  order,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: UiOrder;
}) => {
  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Détails de la commande {order.id}</DialogTitle>
      </DialogHeader>
      <DialogContent>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};



