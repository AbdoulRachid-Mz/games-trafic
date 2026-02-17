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
  MoreHorizontal
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

  const loadData = async () => {
    setIsLoading(true);
    try {
      const statsData = await getRequestStats();
      setStats(statsData);

      const baseFilters = {
        statuses: statusFilter === "all" ? [] : [statusFilter as any],
      } as any;

      const [dep, wit, items] = await Promise.all([
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
      ]);

      const q = searchQuery.toLowerCase();
      const filterSearch = (r: any) =>
        !q ||
        r.id.toLowerCase().includes(q) ||
        (r.paymentMethod?.toLowerCase().includes(q)) ||
        (r.paymentProvider?.toLowerCase().includes(q));

      setDeposits(dep.data.filter(filterSearch));
      setWithdrawals(wit.data.filter(filterSearch));
      setGameItems(items.data.filter(filterSearch));
      setClaims([]);
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
  };

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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Dépôts en Attente"
          value={stats?.pending || 0}
          icon={TrendingDown}
          description="À traiter"
        />
        <StatCard
          title="Retraits en Attente"
          value={stats?.pending || 0}
          icon={TrendingUp}
          description="À traiter"
        />
        <StatCard
          title="Demandes Items"
          value={gameItems.length}
          icon={Package}
          description="En attente"
        />
        <StatCard
          title="Réclamations"
          value={claims.length}
          icon={AlertCircle}
          description="À résoudre"
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="deposits">Dépôts</TabsTrigger>
          <TabsTrigger value="withdrawals">Retraits</TabsTrigger>
          <TabsTrigger value="gameItems">Items de Jeu</TabsTrigger>
          <TabsTrigger value="claims">Réclamations</TabsTrigger>
        </TabsList>

        {/* Tab: Dépôts */}
        <TabsContent value="deposits" className="space-y-6">
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle>Demandes de Dépôt ({deposits.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Méthode</TableHead>
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
                    ) : deposits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Aucune demande de dépôt en attente
                        </TableCell>
                      </TableRow>
                    ) : (
                      deposits.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-mono text-xs">
                            {request.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            {request.user?.username || "Inconnu"}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {request.amount} GTC
                          </TableCell>
                          <TableCell>{request.paymentMethod}</TableCell>
                          <TableCell>
                            {format(
                              new Date(request.createdAt),
                              "dd MMM yyyy",
                              {
                                locale: fr,
                              },
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={request.status} />
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openApproveDialog(request)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approuver
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openRejectDialog(request)}>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Rejeter
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openDetailsDialog(request)}>
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
        </TabsContent>

        {/* Other tabs would follow similar pattern */}
        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle>Retraits en attente</CardTitle>
            </CardHeader>
            <CardContent>
              <Typography variant="body-sm" theme="muted">
                Aucune demande de retrait en attente
              </Typography>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gameItems">
          <Card>
            <CardHeader>
              <CardTitle>Demandes d'items</CardTitle>
            </CardHeader>
            <CardContent>
              <Typography variant="body-sm" theme="muted">
                Aucune demande d'item en attente
              </Typography>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claims">
          <Card>
            <CardHeader>
              <CardTitle>Réclamations</CardTitle>
            </CardHeader>
            <CardContent>
              <Typography variant="body-sm" theme="muted">
                Aucune réclamation en attente
              </Typography>
            </CardContent>
          </Card>
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
                    <div className="font-mono text-xs">{selectedRequest.gameAccount || '-'}</div>
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
