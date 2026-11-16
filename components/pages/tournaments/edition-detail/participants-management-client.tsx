"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  User as UserIcon,
  Phone,
  Mail,
  Plus,
  Trash2,
  Search,
  FileText,
  FileSpreadsheet,
  Settings2,
  Users,
  UserCheck,
  UserX,
  Loader2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticipantRowActions } from "@/components/pages/tournaments/edition-detail/participant-row-actions";
import { AddParticipantForm } from "@/components/pages/tournaments/edition-detail/add-participant-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  deleteEditionRegistrationAction,
  addEditionParticipantAction,
  type UnifiedEditionParticipant,
  type UnifiedParticipantsResponse,
} from "@/actions/editions";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { getEditionParticipantsDocument } from "@/actions/documents";
import { downloadDocument } from "@/lib/documents/engine";
import type { DocumentFormat } from "@/lib/documents/types";
import { DynamicActionMenu, MenuItemAction } from "@/components/shared/dynamic-action-menu";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

type StatusFilter = "all" | "registered" | "unregistered";

interface ParticipantsManagementClientProps {
  editionId: string;
  tournamentId: string;
  initialUnified: UnifiedParticipantsResponse;
  participants?: any[];
  unregisteredMembers?: any[];
}

export function ParticipantsManagementClient({
  editionId,
  tournamentId,
  initialUnified,
}: ParticipantsManagementClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const allItems = initialUnified.data || [];
  const counts = initialUnified.counts || {
    total: allItems.length,
    registered: allItems.filter((i) => i.type === "registered").length,
    unregistered: allItems.filter((i) => i.type === "unregistered").length,
    checkedIn: allItems.filter((i) => i.checkedIn).length,
    paid: allItems.filter((i) => i.feePaid).length,
  };

  // Filtrage combiné : recherche globale + statut actif
  const filteredItems = useMemo(() => {
    let result = allItems;

    // 1. Filtre de statut
    if (statusFilter === "registered") {
      result = result.filter((i) => i.type === "registered");
    } else if (statusFilter === "unregistered") {
      result = result.filter((i) => i.type === "unregistered");
    }

    // 2. Recherche textuelle insensible à la casse sur tous les champs
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((item) => {
        const name = (item.displayName || "").toLowerCase();
        const user = (item.username || "").toLowerCase();
        const team = (item.teamName || "").toLowerCase();
        const phone = (item.contactPhone || "").toLowerCase();
        const email = (item.contactEmail || "").toLowerCase();
        return (
          name.includes(q) ||
          user.includes(q) ||
          team.includes(q) ||
          phone.includes(q) ||
          email.includes(q)
        );
      });
    }

    return result;
  }, [allItems, statusFilter, search]);

  // Distinction des sélectionnés selon le type pour les bulk actions
  const selectedRegistered = useMemo(() => {
    return filteredItems.filter(
      (item) => selectedIds.includes(item.id) && item.type === "registered"
    );
  }, [filteredItems, selectedIds]);

  const selectedUnregistered = useMemo(() => {
    return filteredItems.filter(
      (item) => selectedIds.includes(item.id) && item.type === "unregistered"
    );
  }, [filteredItems, selectedIds]);

  // Tout sélectionner / tout désélectionner
  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredItems.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const isAllSelected =
    filteredItems.length > 0 && selectedIds.length === filteredItems.length;

  // Actions individuelles d'inscription
  const handleSingleRegister = async (item: UnifiedEditionParticipant) => {
    try {
      await addEditionParticipantAction({
        editionId,
        tournamentId,
        userId: item.userId || undefined,
        displayName: item.displayName,
      });
      toast.success(`${item.displayName} a été inscrit à l'édition.`);
      startTransition(() => {
        router.refresh();
      });
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'ajout.");
    }
  };

  // Actions groupées : inscription en masse
  const handleBulkAdd = async () => {
    if (selectedUnregistered.length === 0) return;
    setIsAdding(true);
    try {
      for (const item of selectedUnregistered) {
        await addEditionParticipantAction({
          editionId,
          tournamentId,
          userId: item.userId || undefined,
          displayName: item.displayName,
        });
      }
      toast.success(
        `${selectedUnregistered.length} membre(s) ajouté(s) à l'édition.`
      );
      setSelectedIds([]);
      startTransition(() => {
        router.refresh();
      });
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'ajout groupé.");
    } finally {
      setIsAdding(false);
    }
  };

  // Actions groupées : retrait en masse
  const handleBulkRemove = async () => {
    if (selectedRegistered.length === 0) return;
    if (
      !confirm(
        `Voulez-vous retirer les ${selectedRegistered.length} participant(s) sélectionné(s) de cette édition ?`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      for (const item of selectedRegistered) {
        if (item.registrationId) {
          await deleteEditionRegistrationAction(item.registrationId);
        }
      }
      toast.success(
        `${selectedRegistered.length} participant(s) retiré(s) de l'édition.`
      );
      setSelectedIds([]);
      startTransition(() => {
        router.refresh();
      });
    } catch (e: any) {
      toast.error(
        e.message ||
          "Erreur lors du retrait. Vérifiez si certains participants sont déjà engagés dans des matchs."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Export serveur (PDF / CSV)
  const handleExport = async (format: DocumentFormat) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const result = await getEditionParticipantsDocument(editionId);
      if (!result.success || !result.document) {
        toast.error(result.error || "Erreur lors de l'export.");
        return;
      }
      await downloadDocument(result.document, format);
      const count = result.document.meta.totalRecords ?? 0;
      toast.success(`Export ${format.toUpperCase()} réussi`, {
        description: `${count} participant(s) exporté(s)`,
      });
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de l'export.");
    } finally {
      setIsExporting(false);
    }
  };

  // Actions du menu flottant dynamique
  const menuActions: MenuItemAction[] = [
    {
      id: "add-participant",
      paramKey: "action",
      paramValue: "add",
      label: "Ajouter un participant",
      icon: Plus,
      variant: "default",
      overlayType: "dialog",
      renderContent: (
        <AddParticipantForm
          editionId={editionId}
          tournamentId={tournamentId}
          onSuccess={() => {
            router.refresh();
          }}
        />
      ),
    },
    {
      id: "organize-bulk",
      paramKey: "action",
      paramValue: "organize",
      label: "Organiser en masse",
      icon: Settings2,
      variant: "outline",
      href: `/tournaments/${tournamentId}/editions/${editionId}/dashboard/participants/organize`,
    },
    {
      id: "export-pdf",
      paramKey: "action",
      paramValue: "export_pdf",
      label: "Exporter en PDF",
      icon: FileText,
      variant: "outline",
      onClick: () => void handleExport("pdf"),
    },
    {
      id: "export-csv",
      paramKey: "action",
      paramValue: "export_csv",
      label: "Exporter en CSV",
      icon: FileSpreadsheet,
      variant: "outline",
      onClick: () => void handleExport("csv"),
    },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-in fade-in duration-300">
        <DynamicActionMenu
          actions={menuActions}
          floatingPosition="bottom-6 right-6"
        />

        {/* ── CARTE PRINCIPALE : RECHERCHE GLOBALE ET FILTRES ── */}
        <Card className="border border-border/60 shadow-lg bg-card/95 backdrop-blur-sm">
          <CardHeader className="p-4 sm:p-6 pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-black italic tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Gestion Unifiée des Participants
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Consultez, recherchez et gérez l&apos;ensemble des participants
                  inscrits et des membres du tournoi.
                </CardDescription>
              </div>

              {/* Actions groupées contextualisées */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedUnregistered.length > 0 && (
                  <Button
                    onClick={handleBulkAdd}
                    size="sm"
                    disabled={isAdding}
                    className="bg-primary hover:bg-primary/90 text-xs font-bold gap-1.5"
                  >
                    {isAdding ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Inscrire ({selectedUnregistered.length})
                  </Button>
                )}

                {selectedRegistered.length > 0 && (
                  <Button
                    onClick={handleBulkRemove}
                    size="sm"
                    variant="destructive"
                    disabled={isDeleting}
                    className="text-xs font-bold gap-1.5"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Retirer ({selectedRegistered.length})
                  </Button>
                )}

                {/* Boutons d'export rapides (Icon-only sur mobile) */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport("pdf")}
                      disabled={isExporting}
                      className="h-9 px-3 gap-1.5 text-xs font-bold"
                      aria-label="Exporter la liste en PDF"
                    >
                      <FileText className="h-4 w-4 text-red-500" />
                      <span className="hidden sm:inline">PDF</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Exporter en PDF</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport("csv")}
                      disabled={isExporting}
                      className="h-9 px-3 gap-1.5 text-xs font-bold"
                      aria-label="Exporter la liste en CSV"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                      <span className="hidden sm:inline">CSV</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Exporter en CSV</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* ── BARRE DE CONTRÔLE : RECHERCHE + FILTRES SEGMENTÉS ── */}
            <div className="pt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-t border-border/40 mt-4">
              {/* Barre de recherche globale (tous les champs) */}
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, pseudo, équipe, téléphone, email..."
                  className="pl-9 h-10 bg-background/60 border-border/50 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Filtres de statut : Tous, Inscrits, Non inscrits */}
              <div className="flex items-center gap-1.5 p-1 bg-muted/60 dark:bg-muted/30 rounded-xl border border-border/40 shrink-0 self-start md:self-auto overflow-x-auto max-w-full">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
                    statusFilter === "all"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Tous</span>
                  <Badge
                    variant="secondary"
                    className="ml-1 text-[10px] px-1 py-0 h-4 min-w-4 bg-background/50"
                  >
                    {counts.total}
                  </Badge>
                </button>

                <button
                  onClick={() => setStatusFilter("registered")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
                    statusFilter === "registered"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Inscrits</span>
                  <Badge
                    variant="secondary"
                    className="ml-1 text-[10px] px-1 py-0 h-4 min-w-4 bg-background/50"
                  >
                    {counts.registered}
                  </Badge>
                </button>

                <button
                  onClick={() => setStatusFilter("unregistered")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
                    statusFilter === "unregistered"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Non inscrits</span>
                  <Badge
                    variant="secondary"
                    className="ml-1 text-[10px] px-1 py-0 h-4 min-w-4 bg-background/50"
                  >
                    {counts.unregistered}
                  </Badge>
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            {/* ── VUE TABLEAU DESKTOP ── */}
            <Table className="hidden md:table min-w-[760px]">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[50px] px-6">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleToggleSelectAll}
                      aria-label="Tout sélectionner"
                    />
                  </TableHead>
                  <TableHead>Membre / Joueur</TableHead>
                  <TableHead>Équipe</TableHead>
                  <TableHead>Contact (Tél / Email)</TableHead>
                  <TableHead>Statut Édition</TableHead>
                  <TableHead>Frais</TableHead>
                  <TableHead className="text-right px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-14 text-muted-foreground text-sm space-y-1"
                    >
                      <Filter className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="font-bold">Aucun participant trouvé</p>
                      <p className="text-xs">
                        {search
                          ? `Aucun résultat pour « ${search} » avec le filtre « ${statusFilter} »`
                          : statusFilter === "unregistered"
                          ? "Tous les membres du tournoi sont déjà inscrits à cette édition."
                          : "Aucun membre ne correspond à cette sélection."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const isSelected = selectedIds.includes(item.id);
                    const isRegistered = item.type === "registered";

                    return (
                      <TableRow
                        key={item.id}
                        className={cn(
                          "hover:bg-muted/30 transition-colors",
                          isSelected && "bg-primary/5"
                        )}
                      >
                        <TableCell className="px-6">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(c) => {
                              if (c) setSelectedIds((prev) => [...prev, item.id]);
                              else
                                setSelectedIds((prev) =>
                                  prev.filter((id) => id !== item.id)
                                );
                            }}
                            aria-label={`Sélectionner ${item.displayName}`}
                          />
                        </TableCell>

                        {/* Joueur / Avatar */}
                        <TableCell className="py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-border/60 shadow-sm shrink-0">
                              <AvatarImage src={item.avatarUrl || ""} />
                              <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">
                                {item.displayName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-sm text-foreground truncate max-w-[180px]">
                                {item.displayName}
                              </span>
                              {item.username && (
                                <span className="text-xs text-muted-foreground font-mono truncate">
                                  @{item.username}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Équipe */}
                        <TableCell>
                          <span className="text-sm font-medium truncate max-w-[140px] inline-block text-muted-foreground">
                            {item.teamName || "Solo"}
                          </span>
                        </TableCell>

                        {/* Contact */}
                        <TableCell>
                          <div className="flex flex-col text-xs text-muted-foreground font-mono space-y-0.5">
                            {item.contactPhone && (
                              <span className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3 text-muted-foreground/70" />
                                {item.contactPhone}
                              </span>
                            )}
                            {item.contactEmail && (
                              <span className="flex items-center gap-1.5 truncate max-w-[180px]">
                                <Mail className="h-3 w-3 text-muted-foreground/70" />
                                {item.contactEmail}
                              </span>
                            )}
                            {!item.contactPhone && !item.contactEmail && (
                              <span className="text-muted-foreground/50">
                                Non renseigné
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Statut Édition */}
                        <TableCell>
                          {isRegistered ? (
                            <Badge
                              variant={
                                item.status === "REGISTERED"
                                  ? "secondary"
                                  : "default"
                              }
                              className="text-[11px] font-bold uppercase tracking-wider"
                            >
                              {item.status}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold text-muted-foreground border-border/70"
                            >
                              Non inscrit
                            </Badge>
                          )}
                        </TableCell>

                        {/* Frais */}
                        <TableCell>
                          {isRegistered ? (
                            <Badge
                              variant={item.feePaid ? "outline" : "destructive"}
                              className={cn(
                                "text-[10px] font-bold",
                                item.feePaid
                                  ? "border-green-600 text-green-600 dark:text-green-400"
                                  : ""
                              )}
                            >
                              {item.feePaid ? "Payé" : "Impayé"}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">
                              —
                            </span>
                          )}
                        </TableCell>

                        {/* Actions contextuelles */}
                        <TableCell className="text-right px-6">
                          {isRegistered && item.registrationId ? (
                            <ParticipantRowActions
                              registrationId={item.registrationId}
                              checkedIn={item.checkedIn}
                              feePaid={item.feePaid}
                              status={item.status}
                            />
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSingleRegister(item)}
                              className="h-8 text-primary hover:text-primary hover:bg-primary/10 border-primary/30 text-xs font-bold gap-1"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Inscrire</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* ── VUE CARTES MOBILE (< 768px) ── */}
            <div className="md:hidden space-y-3 p-3">
              {filteredItems.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-xs space-y-1">
                  <Filter className="w-6 h-6 mx-auto text-muted-foreground/40 mb-1" />
                  <p className="font-bold">Aucun participant trouvé</p>
                  <p className="text-[11px]">
                    Modifiez vos filtres ou termes de recherche.
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isRegistered = item.type === "registered";

                  return (
                    <Card
                      key={item.id}
                      className={cn(
                        "p-3.5 space-y-3 border-border/50 transition-all",
                        isSelected && "border-primary/50 bg-primary/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border/60 shadow-sm shrink-0">
                          <AvatarImage src={item.avatarUrl || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">
                            {item.displayName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm truncate text-foreground">
                            {item.displayName}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {item.teamName || "Solo"}
                            {item.username && ` • @${item.username}`}
                          </div>
                        </div>

                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(c) => {
                            if (c) setSelectedIds((prev) => [...prev, item.id]);
                            else
                              setSelectedIds((prev) =>
                                prev.filter((id) => id !== item.id)
                              );
                          }}
                          aria-label={`Sélectionner ${item.displayName}`}
                        />
                      </div>

                      {/* Statuts & contacts */}
                      <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-border/30">
                        {isRegistered ? (
                          <>
                            <Badge
                              variant={
                                item.status === "REGISTERED"
                                  ? "secondary"
                                  : "default"
                              }
                              className="text-[10px] font-bold uppercase"
                            >
                              {item.status}
                            </Badge>
                            <Badge
                              variant={
                                item.feePaid ? "outline" : "destructive"
                              }
                              className={cn(
                                "text-[10px] font-bold",
                                item.feePaid
                                  ? "border-green-600 text-green-600 dark:text-green-400"
                                  : ""
                              )}
                            >
                              {item.feePaid ? "Payé" : "Impayé"}
                            </Badge>
                          </>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold text-muted-foreground"
                          >
                            Non inscrit
                          </Badge>
                        )}

                        {(item.contactPhone || item.contactEmail) && (
                          <span className="text-[11px] font-mono text-muted-foreground truncate ml-auto">
                            {item.contactPhone || item.contactEmail}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end pt-1">
                        {isRegistered && item.registrationId ? (
                          <ParticipantRowActions
                            registrationId={item.registrationId}
                            checkedIn={item.checkedIn}
                            feePaid={item.feePaid}
                            status={item.status}
                          />
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSingleRegister(item)}
                            className="w-full text-primary hover:text-primary hover:bg-primary/10 border-primary/30 text-xs font-bold gap-1.5"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Inscrire à l&apos;édition</span>
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
