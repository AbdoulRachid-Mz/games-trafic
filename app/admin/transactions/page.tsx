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
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getWalletTransactions,
  getTransactionStats,
  updateTransactionStatus,
} from "@/actions/wallets";
import { type WalletTransaction } from "@/database/schema";
import {
  CreditCard,
  Download,
  Eye,
  RefreshCw,
  TrendingUp,
  Wallet,
  MoreVertical,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] =
    useState<WalletTransaction | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadData();
  }, [page, typeFilter, statusFilter]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Build filters
      const filters: any = {};
      if (typeFilter !== "all") filters.type = typeFilter;
      if (statusFilter !== "all") filters.status = statusFilter;

      // Load transactions
      const transactionsData = await getWalletTransactions({
        filters,
        pagination: { page, limit: 20 },
        options: { sortBy: "createdAt", sortOrder: "desc" },
      });

      setTransactions(transactionsData.data);
      setTotalPages(transactionsData.pagination.totalPages);

      // Load stats
      const statsData = await getTransactionStats(filters);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefund = async (transactionId: string) => {
    try {
      await updateTransactionStatus(transactionId, "REFUNDED");
      toast.success("Transaction remboursée");
      loadData();
    } catch (error) {
      toast.error("Erreur lors du remboursement");
    }
  };

  const filteredTransactions = transactions.filter(
    (t) =>
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTransactionIcon = (type: string) => {
    const isIncoming = ["DEPOSIT", "BONUS", "REFUND"].includes(type);
    return isIncoming ? (
      <ArrowDownLeft className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowUpRight className="h-4 w-4 text-red-600" />
    );
  };

  if (isLoading && !transactions.length) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h1" weight="bold" className="mb-2">
            Transactions
          </Typography>
          <Typography variant="body-base" theme="muted">
            Gestion de toutes les transactions financières
          </Typography>
        </div>
        <Button onClick={loadData} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Transactions"
          value={stats?.total || 0}
          icon={CreditCard}
          description="Toutes opérations"
        />
        <StatCard
          title="Complétées"
          value={stats?.completed || 0}
          icon={TrendingUp}
          description="Transactions réussies"
        />
        <StatCard
          title="En Attente"
          value={stats?.pending || 0}
          icon={Wallet}
          description="À traiter"
        />
        <StatCard
          title="Volume Total"
          value={`${parseFloat(stats?.totalAmount?.toString() || "0").toFixed(
            0
          )} GTC`}
          icon={Wallet}
          description={`${parseFloat(
            stats?.totalFees?.toString() || "0"
          ).toFixed(0)} GTC frais`}
        />
      </div>

      {/* Filters */}
      <Card className="bg-card/40 backdrop-blur-xl border-border/50">
        <CardContent className="p-6">
          <FilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder="Rechercher par ID ou description..."
            hasActiveFilters={typeFilter !== "all" || statusFilter !== "all"}
            onClearFilters={() => {
              setTypeFilter("all");
              setStatusFilter("all");
              setSearchQuery("");
            }}
          >
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] rounded-xl">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="DEPOSIT">Dépôt</SelectItem>
                <SelectItem value="WITHDRAWAL">Retrait</SelectItem>
                <SelectItem value="TRANSFER">Transfert</SelectItem>
                <SelectItem value="PURCHASE">Achat</SelectItem>
                <SelectItem value="BONUS">Bonus</SelectItem>
                <SelectItem value="REFUND">Remboursement</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] rounded-xl">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="PROCESSING">En cours</SelectItem>
                <SelectItem value="COMPLETED">Complété</SelectItem>
                <SelectItem value="FAILED">Échoué</SelectItem>
                <SelectItem value="REFUNDED">Remboursé</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="bg-card/40 backdrop-blur-xl border-border/50">
        <CardHeader>
          <CardTitle>
            Liste des Transactions ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Frais</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">
                      {transaction.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {transaction.createdAt
                        ? format(
                            new Date(transaction.createdAt),
                            "dd MMM yyyy HH:mm",
                            { locale: fr }
                          )
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.type)}
                        <span className="text-sm">{transaction.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {transaction.description || "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {parseFloat(transaction.amount).toFixed(2)} GTC
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {parseFloat(transaction.fees || "0").toFixed(2)} GTC
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {parseFloat(transaction.netAmount).toFixed(2)} GTC
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={transaction.status || "PENDING"} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTransaction(transaction)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <Typography variant="caption1" theme="muted">
              Page {page} sur {totalPages}
            </Typography>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Suivant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Detail Dialog */}
      <Dialog
        open={!!selectedTransaction}
        onOpenChange={() => setSelectedTransaction(null)}
      >
        <DialogContent className="max-w-7xl">
          <DialogHeader>
            <DialogTitle>Détails de la Transaction</DialogTitle>
            <DialogDescription>ID: {selectedTransaction?.id}</DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Typography variant="caption1" theme="muted">
                    Type
                  </Typography>
                  <Typography variant="body-base" weight="semibold">
                    {selectedTransaction.type}
                  </Typography>
                </div>
                <div>
                  <Typography variant="caption1" theme="muted">
                    Statut
                  </Typography>
                  <StatusBadge
                    status={selectedTransaction.status || "PENDING"}
                  />
                </div>
                <div>
                  <Typography variant="caption1" theme="muted">
                    Montant
                  </Typography>
                  <Typography variant="body-base" weight="semibold">
                    {parseFloat(selectedTransaction.amount).toFixed(2)} GTC
                  </Typography>
                </div>
                <div>
                  <Typography variant="caption1" theme="muted">
                    Frais
                  </Typography>
                  <Typography variant="body-base">
                    {parseFloat(selectedTransaction.fees || "0").toFixed(2)} GTC
                  </Typography>
                </div>
                <div>
                  <Typography variant="caption1" theme="muted">
                    Net
                  </Typography>
                  <Typography variant="body-base" weight="semibold">
                    {parseFloat(selectedTransaction.netAmount).toFixed(2)} GTC
                  </Typography>
                </div>
                <div>
                  <Typography variant="caption1" theme="muted">
                    Solde Après
                  </Typography>
                  <Typography variant="body-base">
                    {parseFloat(selectedTransaction.balanceAfter).toFixed(2)}{" "}
                    GTC
                  </Typography>
                </div>
              </div>

              {selectedTransaction.description && (
                <div>
                  <Typography variant="caption1" theme="muted">
                    Description
                  </Typography>
                  <Typography variant="body-base">
                    {selectedTransaction.description}
                  </Typography>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Télécharger Reçu
                </Button>
                {selectedTransaction.status === "COMPLETED" && (
                  <Button
                    variant="destructive"
                    onClick={() => handleRefund(selectedTransaction.id)}
                    className="gap-2"
                  >
                    Rembourser
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
