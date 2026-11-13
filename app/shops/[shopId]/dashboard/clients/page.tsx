"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  Calendar, 
  ShoppingBag, 
  DollarSign,
  ChevronRight,
  MoreVertical,
  MessageCircle,
  ExternalLink,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getShopClients } from "@/actions/shops";
import { Skeleton } from "@/components/ui/skeleton";
import { ShopExportButton } from "@/components/pages/shops/shop-export-button";
import { toast } from "sonner";

export default function ShopClientsPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId as string;
  
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"spent" | "orders" | "date">("date");

  useEffect(() => {
    loadClients();
  }, [shopId]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await getShopClients(shopId);
      setClients(data);
    } catch (error) {
      console.error("Error loading clients:", error);
      toast.error("Erreur lors du chargement des clients");
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients
    .filter(client => 
      client.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "spent") return b.totalSpent - a.totalSpent;
      if (sortBy === "orders") return b.orderCount - a.orderCount;
      return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
    });

  if (loading) {
    return <ClientsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Typography variant="h2" weight="bold" className="mb-1">
            Mes Clients
          </Typography>
          <Typography variant="body-base" theme="muted">
            Gérez votre base de clients et fidélisez vos acheteurs
          </Typography>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
            {clients.length} Clients au total
          </Badge>
          <ShopExportButton shopId={shopId} kind="clients" />
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <Card className="bg-card/40 backdrop-blur-xl border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un client (nom, username, email)..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    Trier par: {sortBy === "spent" ? "Dépenses" : sortBy === "orders" ? "Commandes" : "Dernier achat"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy("date")}>Dernier achat</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("spent")}>Plus grosses dépenses</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("orders")}>Nombre de commandes</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des clients */}
      <Card className="bg-card/40 backdrop-blur-xl border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Commandes</TableHead>
              <TableHead>Total dépensé</TableHead>
              <TableHead>Dernier achat</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={client.image} alt={client.username} />
                        <AvatarFallback>{client.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <Typography variant="body-sm" weight="semibold">
                          {client.fullName || client.username}
                        </Typography>
                        <Typography variant="caption2" theme="muted">
                          {client.email}
                        </Typography>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{client.orderCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-semibold text-primary">
                      {client.totalSpent} GTC
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-xs">
                        {format(new Date(client.lastOrderDate), "dd MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/chats?entityType=user&entityId=${client.id}`)}>
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/profile/${client.id}`)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Voir profil
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info("Bientôt disponible: Historique des commandes")}>
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            Historique
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Users className="h-8 w-8 opacity-20" />
                    <Typography variant="body-sm">Aucun client trouvé</Typography>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function ClientsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
      <Card>
        <CardContent className="p-0">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
