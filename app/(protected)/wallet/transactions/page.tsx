"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/auth-context";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter, 
  Search, 
  Download,
  Plus,
  RefreshCw,
  Wallet,
  ShoppingCart,
  Trophy,
  Palette,
  Star,
  GamepadIcon,
  CreditCard
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useUserProfile } from "@/hooks/use-profile";

export default function TransactionsPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { data: completeData } = useUserProfile(!!user?.id);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    income: 0,
    expense: 0,
    pending: 0
  });
  const [filters, setFilters] = useState<{
    search: string;
    type: string;
    status: string;
    dateRange: { from: Date | null; to: Date | null };
  }>({
    search: "",
    type: "all",
    status: "all",
    dateRange: {
      from: null,
      to: null
    }
  });

  const wallet = completeData?.wallet;

  useEffect(() => {
    if (wallet?.id) {
      loadTransactions();
      loadStats();
    }
  }, [wallet?.id, filters]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (!wallet?.id) {
        console.warn("Wallet is undefined; skipping walletId query param.");
        return;
      }
      queryParams.append("walletId", wallet.id);
      if (filters.search) queryParams.append("search", filters.search);
      if (filters.type !== "all") queryParams.append("type", filters.type);
      if (filters.status !== "all") queryParams.append("status", filters.status);
      if (filters.dateRange.from) queryParams.append("from", (filters.dateRange.from as Date).toISOString());
      if (filters.dateRange.to) queryParams.append("to", (filters.dateRange.to as Date).toISOString());

      const response = await fetch(`/api/transactions?${queryParams.toString()}`);
      const data = await response.json();
      setTransactions(data.data || []);
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast.error("Erreur lors du chargement des transactions");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      if (!wallet?.id) return;
      const response = await fetch(`/api/wallet/stats?walletId=${wallet.id}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "THEME_PURCHASE": return Palette;
      case "VIP_SUBSCRIPTION": return Star;
      case "PRODUCT_PURCHASE": return ShoppingCart;
      case "TOURNAMENT_PARTICIPATION": return Trophy;
      case "GAME_ITEM_PURCHASE": return GamepadIcon;
      case "DEPOSIT": return Wallet;
      case "WITHDRAWAL": return CreditCard;
      case "TRANSFER": return ArrowUpRight;
      default: return Wallet;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "DEPOSIT": return "text-green-600";
      case "TRANSFER": return "text-blue-600";
      case "WITHDRAWAL": return "text-amber-600";
      default: return "text-purple-600";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "THEME_PURCHASE": return "Achat thème";
      case "VIP_SUBSCRIPTION": return "Abonnement VIP";
      case "PRODUCT_PURCHASE": return "Achat produit";
      case "TOURNAMENT_PARTICIPATION": return "Participation";
      case "GAME_ITEM_PURCHASE": return "Item jeu";
      case "DEPOSIT": return "Dépôt";
      case "WITHDRAWAL": return "Retrait";
      case "TRANSFER": return "Transfert";
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="default" className="gap-1"><div className="h-1.5 w-1.5 rounded-full bg-current" /> Complétée</Badge>;
      case "PENDING":
        return <Badge variant="destructive" className="gap-1"><div className="h-1.5 w-1.5 rounded-full bg-current" /> En attente</Badge>;
      case "FAILED":
        return <Badge variant="destructive" className="gap-1"><div className="h-1.5 w-1.5 rounded-full bg-current" /> Échouée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleExport = () => {
    // Logique d'export CSV
    toast.info("Export en cours de développement");
  };

  if (!wallet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md p-3">
          <CardContent className="p-8 text-center">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <Typography variant="h4" className="mb-2">Wallet non trouvé</Typography>
            <Typography variant="body-sm" theme="muted" className="mb-6">
              Vous devez créer un wallet pour voir vos transactions
            </Typography>
            <Button onClick={() => router.push("/wallet/create")}>
              Créer un wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <Typography variant="h2" weight="bold">
            Mes Transactions
          </Typography>
          <Typography variant="body-base" theme="muted" className="mt-1">
            Gérez et suivez toutes vos transactions financières
          </Typography>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTransactions}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
          <Button
            onClick={() => router.push("/transactions/create")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouvelle transaction
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-3">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body-sm" theme="muted">Total</Typography>
                <Typography variant="h4" weight="bold">{stats.total}</Typography>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body-sm" theme="muted">Revenus</Typography>
                <Typography variant="h4" weight="bold" className="text-green-600">
                  {stats?.income?.toFixed(2)} GTC
                </Typography>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <ArrowDownLeft className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body-sm" theme="muted">Dépenses</Typography>
                <Typography variant="h4" weight="bold" className="text-red-600">
                  {stats?.expense?.toFixed(2)} GTC
                </Typography>
              </div>
              <div className="p-2 rounded-full bg-red-100">
                <ArrowUpRight className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-3">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body-sm" theme="muted">En attente</Typography>
                <Typography variant="h4" weight="bold">{stats.pending}</Typography>
              </div>
              <Badge variant="destructive" className="h-8">
                {stats.pending}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="p-3">
        <CardContent className="p-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Typography variant="body-sm" weight="medium" className="mb-2">
                Recherche
              </Typography>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Référence, description..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Typography variant="body-sm" weight="medium" className="mb-2">
                Type
              </Typography>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="DEPOSIT">Dépôts</SelectItem>
                  <SelectItem value="WITHDRAWAL">Retraits</SelectItem>
                  <SelectItem value="TRANSFER">Transferts</SelectItem>
                  <SelectItem value="PRODUCT_PURCHASE">Achats produits</SelectItem>
                  <SelectItem value="THEME_PURCHASE">Achats thèmes</SelectItem>
                  <SelectItem value="VIP_SUBSCRIPTION">Abonnements VIP</SelectItem>
                  <SelectItem value="TOURNAMENT_PARTICIPATION">Participations</SelectItem>
                  <SelectItem value="GAME_ITEM_PURCHASE">Items jeu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Typography variant="body-sm" weight="medium" className="mb-2">
                Statut
              </Typography>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="COMPLETED">Complétées</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="FAILED">Échouées</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Typography variant="body-sm" weight="medium" className="mb-2">
                Période
              </Typography>
              <DateRangePicker
                value={filters.dateRange}
                onChange={(range) => setFilters(prev => ({ ...prev, dateRange: range }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des transactions */}
      <Card className="p-4">
        <CardContent className="p-2">
          <Tabs defaultValue="all" className="space-y-3">
            <TabsList>
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="income">Revenus</TabsTrigger>
              <TabsTrigger value="expense">Dépenses</TabsTrigger>
              <TabsTrigger value="pending">En attente</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <Typography variant="body-lg" theme="muted">
                    Aucune transaction trouvée
                  </Typography>
                  <Typography variant="body-sm" theme="muted" className="mt-2">
                    Commencez par effectuer votre première transaction
                  </Typography>
                  <Button 
                    onClick={() => router.push("/transactions/create")}
                    className="mt-4"
                  >
                    Créer une transaction
                  </Button>
                </div>
              ) : (
                transactions.map((transaction: any, index) => {
                  const Icon = getTypeIcon(transaction.type);
                  const isIncome = transaction.type === "DEPOSIT" || 
                                  (transaction.type === "TRANSFER" && transaction.toUserId === user?.id);
                  
                  return (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="hover:shadow-md transition-shadow p-3">
                        <CardContent className="p-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${isIncome ? 'bg-green-100' : 'bg-red-100'}`}>
                                <Icon className={`h-5 w-5 ${isIncome ? 'text-green-600' : 'text-red-600'}`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <Typography variant="body-sm" weight="semibold">
                                    {getTypeLabel(transaction.type)}
                                  </Typography>
                                  {getStatusBadge(transaction.status)}
                                </div>
                                <Typography variant="caption2" theme="muted">
                                  {format(new Date(transaction.createdAt), "dd MMMM yyyy HH:mm", { locale: fr })}
                                </Typography>
                                {transaction.description && (
                                  <Typography variant="caption2" theme="muted" className="mt-1">
                                    {transaction.description}
                                  </Typography>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <Typography variant="body-lg" weight="bold" className={isIncome ? 'text-green-600' : 'text-red-600'}>
                                {isIncome ? '+' : '-'}{parseFloat(transaction.amount)?.toFixed(2)} GTC
                              </Typography>
                              {transaction.fees && parseFloat(transaction.fees) > 0 && (
                                <Typography variant="caption2" theme="muted">
                                  Frais: {parseFloat(transaction.fees)?.toFixed(2)} GTC
                                </Typography>
                              )}
                              <Typography variant="caption2" theme="muted" className="mt-1 font-mono">
                                {transaction.id.slice(-8)}
                              </Typography>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
