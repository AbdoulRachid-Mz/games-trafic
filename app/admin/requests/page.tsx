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
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ResultDialog } from "@/components/shared/result-dialog";
import {
  getUserRequests,
  getRequestStats,
  approveRequest,
  rejectRequest,
} from "@/actions/requests";
import { useAuth } from "@/hooks/use-auth";
import { Label } from "@/components/ui/label";

export default function AdminRequestsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("deposits");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionReason, setActionReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Data states
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [gameItems, setGameItems] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load stats
      const statsData = await getRequestStats();
      setStats(statsData);

      // Load requests by type (you'd need to implement getUserRequests with filters)
      // For now, we'll use a placeholder
      // In a real scenario, you'd call getUserRequests with different filters
      setDeposits([]);
      setWithdrawals([]);
      setGameItems([]);
      setClaims([]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest || !user?.id) return;

    setIsApproving(true);
    try {
      await approveRequest(selectedRequest.id, user.id, {
        createTransaction: true,
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
    if (!selectedRequest || !user?.id) return;
    if (!actionReason.trim()) {
      toast.error("Veuillez fournir une raison");
      return;
    }

    setIsRejecting(true);
    try {
      await rejectRequest(selectedRequest.id, user.id, actionReason);

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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openApproveDialog(request)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approuver
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openRejectDialog(request)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeter
                            </Button>
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
    </div>
  );
}
