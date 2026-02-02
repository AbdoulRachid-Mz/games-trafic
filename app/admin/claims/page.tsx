"use client";

import { useState } from "react";
import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import { getClaims, updateClaimStatus, deleteClaim } from "@/actions/claims";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ResultDialog } from "@/components/shared/result-dialog";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Claim } from "@/database/schema";

export default function ClaimsPage() {
  const router = useRouter();
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [resolution, setResolution] = useState("");

  const {
    data,
    loading,
    page,
    limit,
    searchTerm,
    filters,
    viewMode,
    total,
    setPage,
    setLimit,
    setSearchTerm,
    setFilters,
    setViewMode,
    onRefresh,
    isPlaceholderData,
  } = useEntityList<Claim>({
    entityType: "claims",
    defaultFilters: {
      limit: 20,
    },
    fetchMethod: "server-action",
    fetchFunction: async (params) => {
      const result = await getClaims({
        pagination: { page: params.page, limit: params.limit },
        filters: {
          search: params.search,
          status: params.status,
          type: params.type,
        },
        options: {
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        },
      });
      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { variant: any; icon: any; label: string }
    > = {
      PENDING: {
        variant: "default",
        icon: Clock,
        label: "En attente",
      },
      IN_PROGRESS: {
        variant: "secondary",
        icon: AlertCircle,
        label: "En cours",
      },
      RESOLVED: {
        variant: "default",
        icon: CheckCircle,
        label: "Résolu",
      },
      REJECTED: {
        variant: "destructive",
        icon: XCircle,
        label: "Rejeté",
      },
      CLOSED: {
        variant: "outline",
        icon: FileText,
        label: "Fermé",
      },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      PAYMENT: "Paiement",
      DELIVERY: "Livraison",
      PRODUCT: "Produit",
      SERVICE: "Service",
      ACCOUNT: "Compte",
      OTHER: "Autre",
    };
    return types[type] || type;
  };

  const handleProcess = async () => {
    if (!selectedClaim || !newStatus) return;
    if (!resolution.trim() && newStatus !== "IN_PROGRESS") {
      toast.error("Veuillez fournir une résolution");
      return;
    }

    setProcessing(true);
    try {
      await updateClaimStatus(
        selectedClaim.id,
        newStatus,
        resolution || undefined,
      );

      toast.success("Réclamation mise à jour avec succès");
      setIsProcessDialogOpen(false);
      setSelectedClaim(null);
      setNewStatus("");
      setResolution("");
      onRefresh();
    } catch (error) {
      console.error("Error processing claim:", error);
      toast.error("Erreur lors du traitement");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClaim) return;

    setDeleting(true);
    try {
      await deleteClaim(selectedClaim.id);
      toast.success("Réclamation supprimée avec succès");
      setIsDeleteDialogOpen(false);
      setSelectedClaim(null);
      onRefresh();
    } catch (error) {
      console.error("Error deleting claim:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const openProcessDialog = (claim: any) => {
    setSelectedClaim(claim);
    setNewStatus(claim.status === "PENDING" ? "IN_PROGRESS" : claim.status);
    setResolution(claim.resolution || "");
    setIsProcessDialogOpen(true);
  };

  return (
    <>
      <EntityList
        title="Réclamations"
        description="Gérez les réclamations des utilisateurs"
        entityType="claims"
        data={data}
        loading={loading}
        isPlaceholderData={isPlaceholderData}
        page={page}
        limit={limit}
        total={total}
        searchTerm={searchTerm}
        filters={filters}
        viewMode={viewMode}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSearchChange={setSearchTerm}
        onFilterChange={setFilters}
        onViewModeChange={setViewMode}
        onRefresh={onRefresh}
        onAdd={() => router.push("/admin/claims/create")}
        onDelete={(item) => {
          setSelectedClaim(item);
          setIsDeleteDialogOpen(true);
        }}
        availableFilters={[
          {
            key: "status",
            label: "Statut",
            type: "select",
            options: [
              { label: "En attente", value: "PENDING" },
              { label: "En cours", value: "IN_PROGRESS" },
              { label: "Résolu", value: "RESOLVED" },
              { label: "Rejeté", value: "REJECTED" },
              { label: "Fermé", value: "CLOSED" },
            ],
          },
          {
            key: "type",
            label: "Type",
            type: "select",
            options: [
              { label: "Paiement", value: "PAYMENT" },
              { label: "Livraison", value: "DELIVERY" },
              { label: "Produit", value: "PRODUCT" },
              { label: "Service", value: "SERVICE" },
              { label: "Compte", value: "ACCOUNT" },
              { label: "Autre", value: "OTHER" },
            ],
          },
        ]}
        sortOptions={[
          { key: "createdAt-desc", label: "Date (Récent)", direction: "desc" },
          { key: "createdAt-asc", label: "Date (Ancien)", direction: "asc" },
        ]}
        renderTableHeader={() => (
          <tr className="border-b">
            <th className="text-left p-4">Utilisateur</th>
            <th className="text-left p-4">Titre</th>
            <th className="text-left p-4">Type</th>
            <th className="text-left p-4">Statut</th>
            <th className="text-left p-4">Date</th>
            <th className="text-left p-4">Actions</th>
          </tr>
        )}
        renderTableRow={(item: any) => (
          <tr key={item.id} className="border-b hover:bg-muted/50">
            <td className="p-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={item.user?.image} />
                  <AvatarFallback>
                    <User className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {item.user?.username || "Inconnu"}
                </span>
              </div>
            </td>
            <td className="p-4">
              <div className="flex flex-col">
                <span className="font-medium">{item.title}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                  {item.description}
                </span>
              </div>
            </td>
            <td className="p-4">
              <Badge variant="outline">{getTypeLabel(item.type)}</Badge>
            </td>
            <td className="p-4">{getStatusBadge(item.status)}</td>
            <td className="p-4">{formatDate(item.createdAt)}</td>
            <td className="p-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openProcessDialog(item)}
              >
                Traiter
              </Button>
            </td>
          </tr>
        )}
        renderCard={(item: any) => (
          <div key={item.id} className="p-4 border rounded shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div className="font-bold">{item.title}</div>
              {getStatusBadge(item.status)}
            </div>
            <div className="text-sm text-muted-foreground line-clamp-2">
              {item.description}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={item.user?.image} />
                  <AvatarFallback>
                    <User className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">{item.user?.username}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(item.createdAt)}
              </span>
            </div>
          </div>
        )}
      />

      {/* Process Dialog */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Traiter la réclamation</DialogTitle>
            <DialogDescription>
              Mettez à jour le statut et ajoutez une résolution
            </DialogDescription>
          </DialogHeader>

          {selectedClaim && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Titre:</span>
                  <span className="text-sm">{selectedClaim.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Type:</span>
                  <span className="text-sm">
                    {getTypeLabel(selectedClaim.type)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Utilisateur:</span>
                  <span className="text-sm">
                    {selectedClaim.user?.username}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nouveau statut</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                    <SelectItem value="RESOLVED">Résolu</SelectItem>
                    <SelectItem value="REJECTED">Rejeté</SelectItem>
                    <SelectItem value="CLOSED">Fermé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Résolution {newStatus !== "IN_PROGRESS" && "*"}</Label>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Décrivez la résolution ou la raison du rejet..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsProcessDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleProcess} disabled={processing}>
              {processing ? "Traitement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <ResultDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        type="warning"
        title="Supprimer la réclamation"
        description="Êtes-vous sûr de vouloir supprimer cette réclamation ? Cette action est irréversible."
        actions={[
          {
            label: "Annuler",
            onClick: () => setIsDeleteDialogOpen(false),
            variant: "outline",
          },
          {
            label: deleting ? "Suppression..." : "Supprimer",
            onClick: handleDelete,
            variant: "destructive",
            disabled: deleting,
            loading: deleting,
          },
        ]}
        showCloseButton={false}
      />
    </>
  );
}
