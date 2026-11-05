"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, RefreshCw, Search, ShieldCheck, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthContext } from "@/contexts/auth-context";
import { searchUsersAction } from "@/actions/users";
import { getUserWalletByUserId } from "@/actions/wallets";
import {
  adminApproveCreditRequest,
  adminCreateCreditRequest,
  adminIssueGtc,
  adminListAuditLogs,
  adminListCreditRequests,
  adminRejectCreditRequest,
} from "@/actions/admin-finance";

type AdminLevel = "A" | "B" | "C";

interface PickedUser {
  id: string;
  username: string;
  fullName?: string | null;
  walletId?: string | null;
}

interface CreditRequestRow {
  id: string;
  requesterId: string;
  requesterUsername: string | null;
  recipientUserId: string;
  recipientUsername: string | null;
  amount: string;
  currency: string | null;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  rejectionReason: string | null;
  createdAt: Date | string;
  metadata: Record<string, unknown> | null;
}

const STATUS_LABELS: Record<CreditRequestRow["status"], string> = {
  PENDING: "En attente",
  APPROVED: "Approuvée",
  REJECTED: "Rejetée",
  CANCELLED: "Annulée",
};

const STATUS_CLASSES: Record<CreditRequestRow["status"], string> = {
  PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  APPROVED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  REJECTED: "bg-red-500/10 text-red-600 border-red-500/30",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};

function UserPicker({
  selected,
  onSelect,
}: {
  selected: PickedUser | null;
  onSelect: (user: PickedUser | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickedUser[]>([]);
  const [searching, setSearching] = useState(false);

  const search = async () => {
    if (query.trim().length < 2) {
      toast.error("Saisissez au moins 2 caractères.");
      return;
    }
    setSearching(true);
    try {
      const rows = await searchUsersAction(query.trim());
      setResults(
        rows.map((row) => ({
          id: row.id,
          username: row.username ?? "",
          fullName: row.fullName,
          walletId: null,
        }))
      );
    } catch (error: any) {
      toast.error(error?.message || "Recherche impossible");
    } finally {
      setSearching(false);
    }
  };

  const pick = async (candidate: PickedUser) => {
    try {
      const wallet = await getUserWalletByUserId(candidate.id);
      if (!wallet) {
        toast.error("Ce membre n'a pas encore de wallet.");
        return;
      }
      const withWallet = { ...candidate, walletId: wallet.id };
      setResults([]);
      setQuery("");
      onSelect(withWallet);
    } catch (error: any) {
      toast.error(error?.message || "Wallet introuvable");
    }
  };

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <div>
            <Typography variant="body-sm" weight="medium">
              {selected.fullName || selected.username}
            </Typography>
            <Typography variant="caption2" theme="muted">
              @{selected.username} · wallet {selected.walletId?.slice(0, 8)}…
            </Typography>
          </div>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => onSelect(null)}>
          Changer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Rechercher par nom, email ou @username"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void search();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={() => void search()} disabled={searching}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>
      {results.length > 0 && (
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-1">
          {results.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-muted"
              onClick={() => void pick(candidate)}
            >
              <span>
                {candidate.fullName || candidate.username}
                <span className="ml-2 text-xs text-muted-foreground">
                  @{candidate.username}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminFinancePage() {
  const { user } = useAuthContext();
  const level = ((user?.level as AdminLevel) || "C") as AdminLevel;
  const canIssue = level === "A" || level === "B";

  const [issuanceRecipient, setIssuanceRecipient] = useState<PickedUser | null>(null);
  const [issuanceAmount, setIssuanceAmount] = useState("");
  const [issuanceReason, setIssuanceReason] = useState("");
  const [issuing, setIssuing] = useState(false);

  const [requestRecipient, setRequestRecipient] = useState<PickedUser | null>(null);
  const [requestAmount, setRequestAmount] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [creatingRequest, setCreatingRequest] = useState(false);

  const [requests, setRequests] = useState<CreditRequestRow[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  interface AuditRow {
    id: string;
    actorId: string | null;
    actorUsername: string | null;
    actorLevel: string | null;
    action: string;
    amount: string | null;
    currency: string | null;
    reason: string | null;
    createdAt: Date | string;
  }
  const [auditLogs, setAuditLogs] = useState<AuditRow[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(true);

  const loadAudit = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const rows = await adminListAuditLogs({ limit: 50 });
      setAuditLogs(rows as AuditRow[]);
    } catch (error: any) {
      toast.error(error?.message || "Impossible de charger l'audit");
    } finally {
      setLoadingAudit(false);
    }
  }, []);
  const [statusFilter, setStatusFilter] = useState<"ALL" | CreditRequestRow["status"]>("ALL");
  const [rejecting, setRejecting] = useState<CreditRequestRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [workingId, setWorkingId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const rows = await adminListCreditRequests(
        statusFilter === "ALL" ? {} : { status: statusFilter }
      );
      setRequests(rows as CreditRequestRow[]);
    } catch (error: any) {
      toast.error(error?.message || "Impossible de charger les demandes");
    } finally {
      setLoadingRequests(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  const handleIssue = async () => {
    if (!issuanceRecipient?.walletId) {
      toast.error("Sélectionnez un bénéficiaire.");
      return;
    }
    const amount = Number(issuanceAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Montant invalide.");
      return;
    }
    if (!issuanceReason.trim()) {
      toast.error("Le motif est obligatoire.");
      return;
    }

    setIssuing(true);
    try {
      const result = await adminIssueGtc({
        recipientWalletId: issuanceRecipient.walletId,
        amount,
        reason: issuanceReason.trim(),
      });
      toast.success(`Émission de ${result.amount} GTC effectuée.`);
      setIssuanceAmount("");
      setIssuanceReason("");
    } catch (error: any) {
      toast.error(error?.message || "Émission impossible");
    } finally {
      setIssuing(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!requestRecipient?.walletId) {
      toast.error("Sélectionnez un bénéficiaire.");
      return;
    }
    const amount = Number(requestAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Montant invalide.");
      return;
    }
    if (!requestReason.trim()) {
      toast.error("Le motif est obligatoire.");
      return;
    }

    setCreatingRequest(true);
    try {
      await adminCreateCreditRequest({
        recipientUserId: requestRecipient.id,
        recipientWalletId: requestRecipient.walletId,
        amount,
        reason: requestReason.trim(),
      });
      toast.success("Demande de crédit créée.");
      setRequestAmount("");
      setRequestReason("");
      await loadRequests();
    } catch (error: any) {
      toast.error(error?.message || "Création impossible");
    } finally {
      setCreatingRequest(false);
    }
  };

  const handleApprove = async (row: CreditRequestRow) => {
    setWorkingId(row.id);
    try {
      const result = await adminApproveCreditRequest(row.id);
      if (result.requiresSecondApproval) {
        toast.info("Premier accord enregistré : une seconde approbation est requise.");
      } else {
        toast.success("Demande approuvée et GTC émis.");
      }
      await loadRequests();
    } catch (error: any) {
      toast.error(error?.message || "Approbation impossible");
    } finally {
      setWorkingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejecting) return;
    if (!rejectReason.trim()) {
      toast.error("Le motif de rejet est obligatoire.");
      return;
    }
    setWorkingId(rejecting.id);
    try {
      await adminRejectCreditRequest(rejecting.id, rejectReason.trim());
      toast.success("Demande rejetée.");
      setRejecting(null);
      setRejectReason("");
      await loadRequests();
    } catch (error: any) {
      toast.error(error?.message || "Rejet impossible");
    } finally {
      setWorkingId(null);
    }
  };

  const awaitingSecond = useMemo(
    () =>
      requests.filter(
        (row) =>
          row.status === "PENDING" &&
          (row.metadata as Record<string, unknown> | null)?.awaitingSecondApproval === true
      ).length,
    [requests]
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <Typography variant="h3">Finance</Typography>
        <Typography variant="body-sm" theme="muted">
          Émission GTC et demandes de crédit à double validation. Votre niveau : {level}.
        </Typography>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">
            Demandes de crédit
            {awaitingSecond > 0 && (
              <Badge variant="secondary" className="ml-2">
                {awaitingSecond}
              </Badge>
            )}
          </TabsTrigger>
          {canIssue && <TabsTrigger value="issuance">Émission directe</TabsTrigger>}
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4" />
                Nouvelle demande de crédit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Bénéficiaire</Label>
                <UserPicker selected={requestRecipient} onSelect={setRequestRecipient} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="request-amount">Montant (GTC)</Label>
                  <Input
                    id="request-amount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={requestAmount}
                    onChange={(event) => setRequestAmount(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="request-reason">Motif</Label>
                <Textarea
                  id="request-reason"
                  value={requestReason}
                  onChange={(event) => setRequestReason(event.target.value)}
                  placeholder="Justification de la demande"
                />
              </div>
              <Button onClick={() => void handleCreateRequest()} disabled={creatingRequest}>
                {creatingRequest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer la demande
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Demandes</CardTitle>
              <div className="flex items-center gap-2">
                <select
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as typeof statusFilter)
                  }
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="PENDING">En attente</option>
                  <option value="APPROVED">Approuvées</option>
                  <option value="REJECTED">Rejetées</option>
                  <option value="CANCELLED">Annulées</option>
                </select>
                <Button variant="outline" size="icon" onClick={() => void loadRequests()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingRequests ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((index) => (
                    <Skeleton key={index} className="h-12 w-full" />
                  ))}
                </div>
              ) : requests.length === 0 ? (
                <Typography variant="body-sm" theme="muted">
                  Aucune demande pour ce filtre.
                </Typography>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Demandeur</TableHead>
                        <TableHead>Bénéficiaire</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Motif</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((row) => {
                        const awaiting = row.metadata?.awaitingSecondApproval === true;
                        const busy = workingId === row.id;
                        return (
                          <TableRow key={row.id}>
                            <TableCell className="whitespace-nowrap text-xs">
                              {format(new Date(row.createdAt), "dd MMM yyyy HH:mm", {
                                locale: fr,
                              })}
                            </TableCell>
                            <TableCell>{row.requesterUsername || row.requesterId.slice(0, 8)}</TableCell>
                            <TableCell>{row.recipientUsername || row.recipientUserId.slice(0, 8)}</TableCell>
                            <TableCell className="font-medium">
                              {Number(row.amount).toFixed(2)} {row.currency || "GTC"}
                            </TableCell>
                            <TableCell className="max-w-[240px] truncate" title={row.reason}>
                              {row.reason}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={STATUS_CLASSES[row.status]}>
                                {STATUS_LABELS[row.status]}
                                {awaiting ? " · 1/2" : ""}
                              </Badge>
                              {row.rejectionReason && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {row.rejectionReason}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {row.status === "PENDING" && level !== "C" && (
                                <div className="flex justify-end gap-1">
                                  <Button
                                    size="sm"
                                    disabled={busy}
                                    onClick={() => void handleApprove(row)}
                                  >
                                    {busy && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                                    Approuver
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={busy}
                                    onClick={() => setRejecting(row)}
                                  >
                                    Rejeter
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {canIssue && (
          <TabsContent value="issuance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Émission GTC directe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                  Source réelle : compte système <strong>SYSTEM_GTC_ISSUANCE</strong>. Votre
                  wallet personnel n'est jamais débité.
                </div>
                <div className="space-y-2">
                  <Label>Bénéficiaire</Label>
                  <UserPicker selected={issuanceRecipient} onSelect={setIssuanceRecipient} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issuance-amount">Montant (GTC)</Label>
                  <Input
                    id="issuance-amount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={issuanceAmount}
                    onChange={(event) => setIssuanceAmount(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issuance-reason">Motif</Label>
                  <Textarea
                    id="issuance-reason"
                    value={issuanceReason}
                    onChange={(event) => setIssuanceReason(event.target.value)}
                    placeholder="Justification de l'émission"
                  />
                </div>
                <Button onClick={() => void handleIssue()} disabled={issuing}>
                  {issuing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Émettre
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Journal d'audit financier</CardTitle>
              <Button variant="outline" size="icon" onClick={() => void loadAudit()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {loadingAudit ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((index) => (
                    <Skeleton key={index} className="h-12 w-full" />
                  ))}
                </div>
              ) : auditLogs.length === 0 ? (
                <Typography variant="body-sm" theme="muted">
                  Aucune entrée d'audit.
                </Typography>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Acteur</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Motif</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="whitespace-nowrap text-xs">
                            {format(new Date(row.createdAt), "dd MMM yyyy HH:mm", {
                              locale: fr,
                            })}
                          </TableCell>
                          <TableCell>
                            {row.actorUsername || row.actorId?.slice(0, 8) || "—"}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {row.action}
                          </TableCell>
                          <TableCell>
                            {row.amount
                              ? `${Number(row.amount).toFixed(2)} ${row.currency || "GTC"}`
                              : "—"}
                          </TableCell>
                          <TableCell
                            className="max-w-[240px] truncate"
                            title={row.reason ?? ""}
                          >
                            {row.reason || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la demande</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Motif du rejet (obligatoire)"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejecting(null)}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() => void handleReject()}
                disabled={!!workingId}
              >
                {workingId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Rejeter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
