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
import { getOrdersByBuyerId } from "@/actions/orders";
import { getProductById } from "@/actions/products";

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

  const loadData = async () => {
    if (!userId) return;
    try {
      const result = await getOrdersByBuyerId(userId, {
        pagination: { page: 1, limit: 50 },
        options: { sortBy: "createdAt", sortOrder: "desc" },
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
          createdAt: o.createdAt as Date,
        });
      }
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
                      <Button variant="outline" size="sm">
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

