"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/admin/filter-bar";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatCard } from "@/components/admin/stat-card";
import { StatsCarousel } from "@/components/shared/stats-carousel";
import { ResponsiveFilters } from "@/components/shared/responsive-filters";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionRecipientSelector } from "@/components/pages/transactions/create/recipient-selector";
import { TransactionDepositForm } from "@/components/pages/transactions/create/deposit-form";
import { TransactionWithdrawalForm } from "@/components/pages/transactions/create/withdrawal-form";
import { TransactionAmountInput } from "@/components/pages/transactions/create/amount-input";
import { useTransactionFees } from "@/hooks/use-transaction-fees";
import { TransactionType } from "@/types/transaction-types";
import { useAuthContext } from "@/contexts/auth-context";
import { useUserProfile } from "@/hooks/use-profile";
import { createTransaction } from "@/actions/transactions";
import { createRequest } from "@/actions/requests";
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
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminTransactionsPage() {
  const { user } = useAuthContext();
  const { data: completeData, refresh: refreshProfile } = useUserProfile(!!user?.id);
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
  const [actionType, setActionType] = useState<TransactionType | null>(null);
  const [actionStep, setActionStep] = useState<"DETAILS" | "AMOUNT" | "CONFIRM">("DETAILS");
  const [actionData, setActionData] = useState<{
    amount: number;
    metadata: Record<string, any>;
    recipientWalletId?: string;
    recipientUser?: { id: string; name: string; walletNumber: string };
  }>({ amount: 0, metadata: {} });

  const {
    fees: actionFees,
    total: actionTotal,
  } = useTransactionFees(actionType as TransactionType, actionData.amount, {
    enabled: !!actionType && actionData.amount > 0,
  });

  const actionFeesObj = useMemo(() => {
    const baseAmount = actionData.amount || 0;
    const feeAmount = typeof actionFees === "number" ? actionFees : 0;
    const totalAmount = typeof actionTotal === "number" ? actionTotal : baseAmount;
    const percentage = baseAmount > 0 ? feeAmount / baseAmount : 0;
    return {
      percentage,
      amount: feeAmount,
      totalAmount,
    };
  }, [actionFees, actionTotal, actionData.amount]);

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

  const openActionDialog = (type: TransactionType) => {
    setActionType(type);
    setActionStep("DETAILS");
    setActionData({ amount: 0, metadata: {} });
  };

  const closeActionDialog = () => {
    setActionType(null);
    setActionStep("DETAILS");
    setActionData({ amount: 0, metadata: {} });
  };

  const handleActionConfirm = async () => {
    if (!actionType || !completeData?.wallet?.id || !user?.id) return;
    try {
      if (actionType === "TRANSFER") {
        if (!actionData.recipientWalletId) {
          toast.error("Destinataire requis");
          return;
        }
        await createTransaction(
          {
            walletId: completeData.wallet.id,
            type: "TRANSFER",
            amount: actionData.amount.toFixed(2),
            description: `Transfert à ${actionData.recipientUser?.name || "utilisateur"}`,
            metadata: {
              recipientWalletId: actionData.recipientWalletId,
              recipientName: actionData.recipientUser?.name,
            },
          },
          { allowDuplicate: false }
        );
      } else if (actionType === "DEPOSIT" || actionType === "WITHDRAWAL") {
        await createRequest(
          {
            userId: user.id,
            type: actionType,
            amount: actionData.amount.toString(),
            paymentMethod: actionData.metadata.paymentMethod || "WALLET",
            paymentProvider: actionData.metadata.paymentProvider,
            paymentAccountId: actionData.metadata.paymentAccountId,
            paymentReference: actionData.metadata.paymentReference,
            paymentConfirmationCode: actionData.metadata.paymentConfirmationCode,
            paymentImage: actionData.metadata.paymentImage,
          },
          { allowDuplicate: false }
        );
      }
      toast.success("Action effectuée");
      await refreshProfile();
      await loadData();
      closeActionDialog();
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de l'action");
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
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openActionDialog("TRANSFER")}
            className="gap-2 items-center flex justify-center"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span className="hidden md:inline-block">Transférer</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openActionDialog("WITHDRAWAL")}
            className="gap-2 items-center flex justify-center"
          >
            <CreditCard className="h-4 w-4" />
            <span className="hidden md:inline-block">Retrait</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openActionDialog("DEPOSIT")}
            className="gap-2 items-center flex justify-center"
          >
            <ArrowDownLeft className="h-4 w-4" />
            <span className="hidden md:inline-block">Dépôt</span>
          </Button>
          <Button onClick={loadData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <StatsCarousel mode="auto">
        <StatCard
          title="Total Transactions"
          value={stats?.total || 0}
          icon={CreditCard}
          iconClassName="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          title="Complétées"
          value={stats?.completed || 0}
          icon={TrendingUp}
          iconClassName="bg-green-500/10 text-green-500"
        />
        <StatCard
          title="En Attente"
          value={stats?.pending || 0}
          icon={Clock}
          iconClassName="bg-amber-500/10 text-amber-500"
        />
        <StatCard
          title="Volume Total"
          value={`${parseFloat(stats?.totalAmount?.toString() || "0").toFixed(0)} GTC`}
          icon={Wallet}
          iconClassName="bg-purple-500/10 text-purple-500"
        />
      </StatsCarousel>

      {/* Filters */}
      <ResponsiveFilters
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Rechercher par ID ou description..."
        activeFiltersCount={(typeFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0)}
        onReset={() => {
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
      </ResponsiveFilters>

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

      <Dialog open={!!actionType} onOpenChange={(open) => !open && closeActionDialog()}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {actionType === "TRANSFER"
                ? "Transférer des fonds"
                : actionType === "WITHDRAWAL"
                  ? "Demande de retrait"
                  : "Dépôt de fonds"}
            </DialogTitle>
          </DialogHeader>

          {actionType === "TRANSFER" && actionStep === "DETAILS" && (
            <TransactionRecipientSelector
              onSelect={(recipient) => {
                setActionData({
                  amount: 0,
                  metadata: {},
                  recipientWalletId: recipient.walletId,
                  recipientUser: {
                    id: recipient.user.id,
                    name: recipient.user.name,
                    walletNumber: recipient.user.walletNumber,
                  },
                });
                setActionStep("AMOUNT");
              }}
              onBack={closeActionDialog}
            />
          )}

          {actionType === "DEPOSIT" && actionStep === "DETAILS" && (
            <TransactionDepositForm
              onSubmit={(details) => {
                setActionData((prev) => ({
                  ...prev,
                  metadata: { ...prev.metadata, ...details },
                }));
                setActionStep("AMOUNT");
              }}
              onBack={closeActionDialog}
            />
          )}

          {actionType === "WITHDRAWAL" && actionStep === "DETAILS" && (
            <TransactionWithdrawalForm
              onSubmit={(details) => {
                setActionData((prev) => ({
                  ...prev,
                  metadata: { ...prev.metadata, ...details },
                }));
                setActionStep("AMOUNT");
              }}
              onBack={closeActionDialog}
            />
          )}

          {actionType && actionStep === "AMOUNT" && (
            <TransactionAmountInput
              amount={actionData.amount}
              onChange={(amount) =>
                setActionData((prev) => ({ ...prev, amount }))
              }
              walletBalance={parseFloat(completeData?.ledgerBalance || "0")}
              fees={actionFeesObj}
              transactionType={actionType}
              metadata={actionData.metadata}
              onMetadataChange={(data) =>
                setActionData((prev) => ({
                  ...prev,
                  metadata: { ...prev.metadata, ...data },
                }))
              }
              onContinue={() => setActionStep("CONFIRM")}
              onBack={() => setActionStep("DETAILS")}
            />
          )}

          {actionType && actionStep === "CONFIRM" && (
            <div className="space-y-6">
              {actionType === "TRANSFER" && actionData.recipientUser && (
                <div className="space-y-2">
                  <Typography variant="caption1" theme="muted">
                    Destinataire
                  </Typography>
                  <div className="flex items-center justify-between bg-muted/20 rounded-xl p-4 border border-border/50">
                    <div>
                      <Typography variant="body-sm" weight="bold">
                        {actionData.recipientUser.name}
                      </Typography>
                      <Typography variant="caption1" theme="muted" className="font-mono">
                        {actionData.recipientUser.walletNumber}
                      </Typography>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 bg-card/30 rounded-xl p-4 border border-border/50">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Montant brut</span>
                  <span className="font-bold">{actionData.amount.toFixed(2)} GTC</span>
                </div>
                {actionFeesObj.percentage > 0 && (
                  <div className="flex justify-between items-center text-sm text-orange-500">
                    <span>Frais</span>
                    <span className="font-bold">{actionFeesObj.amount.toFixed(2)} GTC</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-border/50">
                  <span className="font-bold text-sm">Montant débité</span>
                  <span className="font-black text-lg text-primary">
                    {actionFeesObj.totalAmount.toFixed(2)} GTC
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Montant reçu</span>
                  <span className="font-bold">
                    {Math.max(0, actionData.amount - actionFeesObj.amount).toFixed(2)} GTC
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setActionStep("AMOUNT")}>
                  Retour
                </Button>
                <Button onClick={handleActionConfirm}>
                  Confirmer
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
