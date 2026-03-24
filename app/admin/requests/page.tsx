"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterBar } from "@/components/admin/filter-bar";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatCard } from "@/components/admin/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Wallet,
  Package,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Eye,
  EyeOff,
  Gamepad2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ResultDialog } from "@/components/shared/result-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useRequests,
  useRequestStats,
} from "@/hooks/use-requests";
import {
  approveRequest,
  rejectRequest,
  getRequestCredentialsForAdmin,
} from "@/actions/requests";
import { createNotification } from "@/actions/notifications";
import { refundTransaction } from "@/actions/transactions";
import { useAuthContext } from "@/contexts/auth-context";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminRequestsPage() {
  const { user: auth } = useAuthContext();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("deposits");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionReason, setActionReason] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [requestCredentials, setRequestCredentials] = useState<{
    gameAccount: string | null;
    password: string | null;
  } | null>(null);
  const [isCredentialsLoading, setIsCredentialsLoading] = useState(false);
  const [showGamePassword, setShowGamePassword] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [searchQuery, setSearchQuery] = useState("");

  // Stats Hook
  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useRequestStats();

  // Requests Hooks
  const baseFilters = {
    statuses: statusFilter === "all" ? [] : [statusFilter as any],
  } as any;

  const { data: depositsData, isLoading: isDepositsLoading, refetch: refetchDeposits } = useRequests({
    filters: { ...baseFilters, types: ["DEPOSIT"] },
    options: { sortBy: "createdAt", sortOrder: "desc" },
  });

  const { data: withdrawalsData, isLoading: isWithdrawalsLoading, refetch: refetchWithdrawals } = useRequests({
    filters: { ...baseFilters, types: ["WITHDRAWAL"] },
    options: { sortBy: "createdAt", sortOrder: "desc" },
  });

  const { data: gameItemsData, isLoading: isGameItemsLoading, refetch: refetchGameItems } = useRequests({
    filters: { ...baseFilters, types: ["GAME_ITEMS"] },
    options: { sortBy: "createdAt", sortOrder: "desc" },
  });

  const { data: claimsData, isLoading: isClaimsLoading, refetch: refetchClaims } = useRequests({
    filters: { ...baseFilters, types: ["OTHER"] as any },
    options: { sortBy: "createdAt", sortOrder: "desc" },
  });

  const handleRefresh = async () => {
    await Promise.all([
      refetchStats(),
      refetchDeposits(),
      refetchWithdrawals(),
      refetchGameItems(),
      refetchClaims(),
    ]);
    toast.success("Données actualisées");
  };

  const isLoading = isStatsLoading || isDepositsLoading || isWithdrawalsLoading || isGameItemsLoading || isClaimsLoading;

  useEffect(() => {
    const loadCredentials = async () => {
      if (!selectedRequest?.id || selectedRequest?.type !== "GAME_ITEMS") {
        setRequestCredentials(null);
        return;
      }
      setIsCredentialsLoading(true);
      try {
        const creds = await getRequestCredentialsForAdmin(selectedRequest.id);
        setRequestCredentials(creds);
      } catch {
        setRequestCredentials(null);
      } finally {
        setIsCredentialsLoading(false);
      }
    };
    loadCredentials();
  }, [selectedRequest?.id, selectedRequest?.type]);

  const q = searchQuery.toLowerCase();
  const filterSearch = (r: any) =>
    !q ||
    r.id.toLowerCase().includes(q) ||
    (r.paymentMethod?.toLowerCase().includes(q)) ||
    (r.paymentProvider?.toLowerCase().includes(q)) ||
    (r.user?.username?.toLowerCase().includes(q)) ||
    (r.user?.fullName?.toLowerCase().includes(q));

  const deposits = (depositsData?.data || []).filter(filterSearch);
  const withdrawals = (withdrawalsData?.data || []).filter(filterSearch);
  const gameItems = (gameItemsData?.data || []).filter(filterSearch);
  const claims = (claimsData?.data || []).filter(filterSearch);

  const handleApprove = async () => {
    if (!selectedRequest || !auth?.id) return;

    setIsApproving(true);
    try {
      await approveRequest(selectedRequest.id, auth?.id);
      await createNotification({
        userId: selectedRequest.userId,
        title: "Demande approuvée",
        message:
          selectedRequest.type === "DEPOSIT"
            ? "Votre dépôt a été approuvé et crédité."
            : selectedRequest.type === "WITHDRAWAL"
              ? "Votre retrait a été approuvé."
              : "Votre demande d’items a été approuvée.",
        type: "REQUEST_APPROVED",
        linkUrl: "/wallet/transactions",
      });

      toast.success("Demande approuvée avec succès");
      setShowApproveDialog(false);
      setSelectedRequest(null);
      handleRefresh();
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Erreur lors de l'approbation");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !auth?.id) return;
    if (!actionReason.trim()) {
      toast.error("Veuillez fournir une raison");
      return;
    }

    setIsRejecting(true);
    try {
      await rejectRequest(selectedRequest.id, auth?.id, actionReason);

      if (selectedRequest.transactionId) {
        try {
          await refundTransaction(selectedRequest.transactionId, actionReason);
        } catch { }
      }

      await createNotification({
        userId: selectedRequest.userId,
        title: "Demande rejetée",
        message: "Votre demande a été rejetée. Détails dans l’historique.",
        type: "REQUEST_REJECTED",
        linkUrl: "/wallet/transactions",
      });

      toast.success("Demande rejetée");
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setActionReason("");
      handleRefresh();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Erreur lors du rejet");
    } finally {
      setIsRejecting(false);
    }
  };

  const openApproveDialog = (request: any) => {
    setSelectedRequest(request);
    setShowApproveDialog(true);
  };

  const openRejectDialog = (request: any) => {
    setSelectedRequest(request);
    setShowRejectDialog(true);
  };

  const openDetailsDialog = (request: any) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
    setShowGamePassword(false);
  };

  const renderRequestTable = (requestsData: any[], title: string) => (
    <Card className="bg-card/40 backdrop-blur-xl border-border/50">
      <CardHeader>
        <CardTitle>{title} ({requestsData.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : requestsData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Aucune demande trouvée
                  </TableCell>
                </TableRow>
              ) : (
                requestsData.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={request.user?.image || ""} />
                          <AvatarFallback>
                            {request.user?.username?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {request.user?.fullName || request.user?.username || "Inconnu"}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            ID: {request.userId.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {request.type === "GAME_ITEMS" && request.gameItem
                            ? request.gameItem.name
                            : request.paymentMethod || "N/A"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {request.type === "GAME_ITEMS"
                            ? `Qté: ${request.quantity || 1}`
                            : request.paymentProvider || "N/A"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-sm">
                      {request.amount} {request.currency || "GTC"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(request.createdAt), "dd/MM/yyyy HH:mm", {
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDetailsDialog(request)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Détails
                          </DropdownMenuItem>
                          {request.status === "PENDING" && (
                            <>
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => openApproveDialog(request)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approuver
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => openRejectDialog(request)}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Rejeter
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Typography variant="h1" weight="bold" className="mb-2">
            Demandes & Transactions
          </Typography>
          <Typography variant="body-base" theme="muted">
            Gérez les dépôts, retraits et achats d'items
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={isLoading ? "h-4 w-4 mr-2 animate-spin" : "h-4 w-4 mr-2"} />
            Actualiser
          </Button>
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
            <Button
              variant={statusFilter === "PENDING" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("PENDING")}
            >
              En attente
            </Button>
            <Button
              variant={statusFilter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              Tout
            </Button>
          </div>
        </div>
      </div>

      <Card className="bg-card/40 backdrop-blur-xl border-border/50">
        <CardContent className="p-4">
          <FilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder="Rechercher par ID, méthode ou fournisseur..."
            hasActiveFilters={statusFilter !== "PENDING"}
            onClearFilters={() => {
              setStatusFilter("PENDING");
              setSearchQuery("");
            }}
          >
            <div className="flex items-center gap-2">
              <Label>Statut</Label>
              <select
                className="border rounded-md px-2 py-1 text-sm bg-background"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="PENDING">En attente</option>
                <option value="APPROVED">Approuvées</option>
                <option value="REJECTED">Rejetées</option>
                <option value="COMPLETED">Terminées</option>
                <option value="all">Tous</option>
              </select>
            </div>
          </FilterBar>
        </CardContent>
      </Card>

      {/* Statistiques avec carousel mobile */}
      <div className="relative group">
        <div className="flex overflow-auto pb-4 gap-4 no-scrollbar scroll-smooth snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
          <StatCard
            title="Total Demandes"
            value={stats?.total || 0}
            icon={AlertCircle}
            color="blue"
            className="min-w-[200px] flex-shrink-0 snap-center lg:flex-1"
          />
          <StatCard
            title="En attente"
            value={stats?.pending || 0}
            icon={Clock}
            color="yellow"
            className="min-w-[200px] flex-shrink-0 snap-center lg:flex-1"
          />
          <StatCard
            title="Complétées"
            value={stats?.completed || 0}
            icon={CheckCircle}
            color="green"
            className="min-w-[200px] flex-shrink-0 snap-center lg:flex-1"
          />
          <StatCard
            title="Montant Total"
            value={`${Number(stats?.totalAmount || 0).toLocaleString()} GTC`}
            icon={Wallet}
            color="purple"
            className="min-w-[200px] flex-shrink-0 snap-center lg:flex-1"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="deposits">Dépôts</TabsTrigger>
          <TabsTrigger value="withdrawals">Retraits</TabsTrigger>
          <TabsTrigger value="items">Items de Jeu</TabsTrigger>
          <TabsTrigger value="refunds">Remboursements</TabsTrigger>
        </TabsList>

        <TabsContent value="deposits">
          {renderRequestTable(deposits, "Demandes de Dépôt")}
        </TabsContent>
        <TabsContent value="withdrawals">
          {renderRequestTable(withdrawals, "Demandes de Retrait")}
        </TabsContent>
        <TabsContent value="items">
          {renderRequestTable(gameItems, "Demandes d'Items de Jeu")}
        </TabsContent>
        <TabsContent value="refunds">
          {renderRequestTable(claims, "Demandes de Remboursement")}
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <ResultDialog
        open={showApproveDialog}
        onOpenChange={setShowApproveDialog}
        type="success"
        title="Approuver la demande"
        description={`Êtes-vous sûr de vouloir approuver cette demande de ${selectedRequest?.amount} GTC ?`}
        content={
          selectedRequest && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Utilisateur:</span>
                <span className="font-medium">
                  {selectedRequest.user?.username}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant:</span>
                <span className="font-medium">
                  {selectedRequest.amount} GTC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Méthode:</span>
                <span className="font-medium">
                  {selectedRequest.paymentMethod}
                </span>
              </div>
            </div>
          )
        }
        actions={[
          {
            label: "Annuler",
            onClick: () => setShowApproveDialog(false),
            variant: "outline",
          },
          {
            label: isApproving ? "Approbation..." : "Approuver",
            onClick: handleApprove,
            variant: "default",
            disabled: isApproving,
            loading: isApproving,
            primary: true,
          },
        ]}
        showCloseButton={false}
      />

      {/* Reject Dialog */}
      <ResultDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        type="warning"
        title="Rejeter la demande"
        description="Veuillez fournir une raison pour le rejet de cette demande."
        content={
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Raison du rejet *</Label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Expliquez la raison du rejet..."
                rows={4}
              />
            </div>
          </div>
        }
        actions={[
          {
            label: "Annuler",
            onClick: () => {
              setShowRejectDialog(false);
              setActionReason("");
            },
            variant: "outline",
          },
          {
            label: isRejecting ? "Rejet..." : "Rejeter",
            onClick: handleReject,
            variant: "destructive",
            disabled: isRejecting || !actionReason.trim(),
            loading: isRejecting,
            primary: true,
          },
        ]}
        showCloseButton={false}
      />

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la demande</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              {/* Informations Utilisateur */}
              <div className="space-y-4">
                <h4 className="font-semibold border-b pb-2">Utilisateur</h4>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedRequest.user?.image || ""} />
                    <AvatarFallback>
                      {selectedRequest.user?.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {selectedRequest.user?.fullName || selectedRequest.user?.username}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {selectedRequest.user?.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Détails de la demande */}
              <div className="space-y-4">
                <h4 className="font-semibold border-b pb-2">Détails</h4>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium capitalize">
                    {selectedRequest.type.toLowerCase()}
                  </span>
                  <span className="text-muted-foreground">Montant:</span>
                  <span className="font-bold text-primary">
                    {selectedRequest.amount} {selectedRequest.currency || 'GTC'}
                  </span>
                  {selectedRequest.totalGtc && (
                    <>
                      <span className="text-muted-foreground">Total GTC:</span>
                      <span className="font-bold text-purple-600">
                        {selectedRequest.totalGtc} GTC
                      </span>
                    </>
                  )}
                  <span className="text-muted-foreground">Méthode:</span>
                  <span className="font-medium">
                    {selectedRequest.paymentMethod || "N/A"}
                  </span>
                  <span className="text-muted-foreground">Fournisseur:</span>
                  <span className="font-medium">
                    {selectedRequest.paymentProvider || "N/A"}
                  </span>
                </div>
              </div>

              {/* Détails spécifiques (Game Items) */}
              {selectedRequest.type === "GAME_ITEMS" && selectedRequest.gameItem && (
                <div className="space-y-4">
                  <h4 className="font-semibold border-b pb-2">Élément demandé</h4>
                  <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg border">
                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                      {selectedRequest.gameItem.image ? (
                        <img
                          src={selectedRequest.gameItem.image}
                          alt={selectedRequest.gameItem.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Gamepad2 className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {selectedRequest.gameItem.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Quantité: {selectedRequest.quantity || 1}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedRequest.paymentImage && (
                <div>
                  <Typography variant="caption1" theme="muted">Preuve de paiement</Typography>
                  <img
                    src={selectedRequest.paymentImage}
                    alt="Preuve"
                    className="mt-2 w-full max-h-64 object-cover rounded-lg border"
                  />
                </div>
              )}

              {/* GAME ITEMS details */}
              {selectedRequest.type === 'GAME_ITEMS' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Typography variant="caption1" theme="muted">Item ID</Typography>
                    <div className="font-mono text-xs">{selectedRequest.gameItemId || '-'}</div>
                  </div>
                  <div>
                    <Typography variant="caption1" theme="muted">Quantité</Typography>
                    <div>{selectedRequest.quantity || '-'}</div>
                  </div>
                  <div>
                    <Typography variant="caption1" theme="muted">Total GTC</Typography>
                    <div>{selectedRequest.totalGtc || '-'}</div>
                  </div>
                  <div>
                    <Typography variant="caption1" theme="muted">Commission</Typography>
                    <div>{selectedRequest.commission || '0'}</div>
                  </div>
                  <div>
                    <Typography variant="caption1" theme="muted">Compte jeu</Typography>
                    <div className="font-mono text-xs">
                      {requestCredentials?.gameAccount || selectedRequest.gameAccount || '-'}
                    </div>
                  </div>
                  <div>
                    <Typography variant="caption1" theme="muted">Mot de passe</Typography>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">
                        {isCredentialsLoading
                          ? "Chargement..."
                          : showGamePassword
                            ? requestCredentials?.password || "—"
                            : requestCredentials?.password
                              ? "••••••••••••"
                              : "—"}
                      </span>
                      {requestCredentials?.password && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowGamePassword((prev) => !prev)}
                        >
                          {showGamePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata JSON */}
              <div>
                <Typography variant="caption1" theme="muted">Métadonnées</Typography>
                <pre className="mt-2 bg-muted p-3 rounded-lg text-xs overflow-auto max-h-48">
                  {JSON.stringify(selectedRequest.paymentMetadata || {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
