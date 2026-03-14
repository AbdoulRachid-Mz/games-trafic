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
  EyeOff
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
  getRequests,
  getRequestStats,
  approveRequest,
  rejectRequest,
  getRequestCredentialsForAdmin,
} from "@/actions/requests";
import { createNotification } from "@/actions/notifications";
import { refundTransaction } from "@/actions/transactions";
import { useAuthContext } from "@/contexts/auth-context";
import { Label } from "@/components/ui/label";

export default function AdminRequestsPage() {
  const { user: auth } = useAuthContext();
  const [activeTab, setActiveTab] = useState("deposits");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionReason, setActionReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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

  // Data states
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [gameItems, setGameItems] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, [statusFilter, searchQuery]);

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

  const loadData = async () => {
    setIsLoading(true);
    try {
      const statsData = await getRequestStats();
      setStats(statsData);

      const baseFilters = {
        statuses: statusFilter === "all" ? [] : [statusFilter as any],
      } as any;

      const [dep, wit, items, ref] = await Promise.all([
        getRequests({
          pagination: { page: 1, limit: 50 },
          filters: { ...baseFilters, types: ["DEPOSIT"] },
          options: { sortBy: "createdAt", sortOrder: "desc" },
        }),
        getRequests({
          pagination: { page: 1, limit: 50 },
          filters: { ...baseFilters, types: ["WITHDRAWAL"] },
          options: { sortBy: "createdAt", sortOrder: "desc" },
        }),
        getRequests({
          pagination: { page: 1, limit: 50 },
          filters: { ...baseFilters, types: ["GAME_ITEMS"] },
          options: { sortBy: "createdAt", sortOrder: "desc" },
        }),
        getRequests({
          pagination: { page: 1, limit: 50 },
          filters: { ...baseFilters, types: ["REFUND", "CLAIM"] as any },
          options: { sortBy: "createdAt", sortOrder: "desc" },
        }),
      ]);

      const q = searchQuery.toLowerCase();
      const filterSearch = (r: any) =>
        !q ||
        r.id.toLowerCase().includes(q) ||
        (r.paymentMethod?.toLowerCase().includes(q)) ||
        (r.paymentProvider?.toLowerCase().includes(q)) ||
        (r.user?.username?.toLowerCase().includes(q));

      setDeposits(dep.data.filter(filterSearch));
      setWithdrawals(wit.data.filter(filterSearch));
      setGameItems(items.data.filter(filterSearch));
      setClaims(ref.data.filter(filterSearch));
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest || !auth?.id) return;

    setIsApproving(true);
    try {
      const shouldCreateTx =
        selectedRequest.type === "DEPOSIT" ||
        selectedRequest.type === "WITHDRAWAL";
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
        linkUrl: "/app/(protected)/wallet/transactions",
      });

      toast.success("Demande approuvée avec succès");
      setShowApproveDialog(false);
      setSelectedRequest(null);
      loadData();
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
        linkUrl: "/app/(protected)/wallet/transactions",
      });

      toast.success("Demande rejetée");
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setActionReason("");
      loadData();
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
                <TableHead>ID</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : requestsData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Aucune demande trouvée
                  </TableCell>
                </TableRow>
              ) : (
                requestsData.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-xs">
                      {request.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{request.user?.username || "Inconnu"}</span>
                        <span className="text-[10px] text-muted-foreground">{request.userId.substring(0, 8)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {request.amount} GTC
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        {request.type === "GAME_ITEMS" ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-primary">{request.gameItem?.name || "Item"}</span>
                            <span>Qté: {request.quantity}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span>{request.paymentMethod}</span>
                            <span className="text-[10px] text-muted-foreground">{request.paymentProvider}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {format(new Date(request.createdAt), "dd MMM HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {request.status === "PENDING" && (
                            <>
                              <DropdownMenuItem onClick={() => openApproveDialog(request)}>
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                Approuver
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openRejectDialog(request)}>
                                <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                Rejeter
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem onClick={() => openDetailsDialog(request)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Détails
                          </DropdownMenuItem>
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
      <div>
        <Typography variant="h1" weight="bold" className="mb-2">
          Demandes
        </Typography>
        <Typography variant="body-base" theme="muted">
          Gestion des dépôts, retraits, items de jeu et réclamations
        </Typography>
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
        <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar scroll-smooth snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
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
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Typography variant="caption1" theme="muted">Type</Typography>
                  <div className="font-medium">{selectedRequest.type}</div>
                </div>
                <div>
                  <Typography variant="caption1" theme="muted">Statut</Typography>
                  <StatusBadge status={selectedRequest.status} />
                </div>
                <div>
                  <Typography variant="caption1" theme="muted">Montant</Typography>
                  <div className="font-semibold">{selectedRequest.amount} {selectedRequest.currency || 'GTC'}</div>
                </div>
                <div>
                  <Typography variant="caption1" theme="muted">Méthode</Typography>
                  <div>{selectedRequest.paymentMethod || '-'}</div>
                </div>
                <div>
                  <Typography variant="caption1" theme="muted">Fournisseur</Typography>
                  <div>{selectedRequest.paymentProvider || '-'}</div>
                </div>
                <div>
                  <Typography variant="caption1" theme="muted">Référence</Typography>
                  <div className="font-mono text-xs">{selectedRequest.paymentReference || '-'}</div>
                </div>
                <div>
                  <Typography variant="caption1" theme="muted">Compte paiement</Typography>
                  <div className="font-mono text-xs">{selectedRequest.paymentAccountId || '-'}</div>
                </div>
                <div>
                  <Typography variant="caption1" theme="muted">Code confirmation</Typography>
                  <div className="font-mono text-xs">{selectedRequest.paymentConfirmationCode || '-'}</div>
                </div>
              </div>

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
