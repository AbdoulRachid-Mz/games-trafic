"use client";

import { useMemo, useState } from "react";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Bug, CheckCircle,
  Trash2, RefreshCw,
  MoreVertical, AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsiveFilters } from "@/components/shared/responsive-filters";
import { useSignals, useUpdateSignal, useDeleteSignal } from "@/hooks/use-signals";
import { SignalFilters, SignalStatus } from "@/types/api";

// Les actions signals persistent OPEN et IN_PROGRESS en plus des valeurs du
// type SignalStatus. Le cast local est volontaire : la colonne est de type
// `text`, donc toutes ces valeurs sont valides à l'exécution.
type SignalStatusValue = "OPEN" | "IN_PROGRESS" | "PROCESSED" | "RESOLVED";

export default function AdminSignalsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SignalStatusValue | "ALL">("ALL");

  const filters = useMemo<SignalFilters>(
    () => ({
      status:
        statusFilter === "ALL" ? undefined : (statusFilter as SignalStatus),
    }),
    [statusFilter],
  );

  const { data, isLoading, isError, refetch } = useSignals(filters);

  const updateMutation = useUpdateSignal();
  const deleteMutation = useDeleteSignal();

  const handleStatusUpdate = async (id: string, status: string) => {
    updateMutation.mutate(
      { id, input: { status: status as SignalStatus } },
      {
        onSuccess: () => {
          toast.success("Statut mis à jour");
        },
        onError: () => {
          toast.error("Erreur de mise à jour");
        },
      }
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce signalement ?")) return;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Signalement supprimé");
      },
      onError: () => {
        toast.error("Erreur de suppression");
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
      case "PENDING":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">En attente</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">En cours</Badge>;
      case "PROCESSED":
      case "RESOLVED":
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Traité</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "text-rose-600 dark:text-rose-400 bg-rose-500/10";
      case "HIGH": return "text-orange-600 dark:text-orange-400 bg-orange-500/10";
      case "MEDIUM": return "text-amber-600 dark:text-amber-400 bg-amber-500/10";
      case "LOW": return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  // La recherche n'a pas de équivalent serveur dans getSignals : filtrage réel
  // sur les données chargées (titre, description, type de cible).
  const signals = useMemo(() => {
    const all = data?.data ?? [];
    const term = search.trim().toLocaleLowerCase("fr-FR");
    if (!term) return all;
    return all.filter((signal) =>
      [signal.title, signal.description, signal.targetType]
        .filter(Boolean)
        .some((field) => field!.toLocaleLowerCase("fr-FR").includes(term)),
    );
  }, [data, search]);

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Typography variant="h1" className="text-2xl md:text-3xl font-black">
            Gestion des Signalements
          </Typography>
          <Typography variant="body-base" theme="muted">
            Modérez et résolvez les bugs signalés par les utilisateurs.
          </Typography>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading} className="gap-2 rounded-xl shrink-0">
          <RefreshCw className={isLoading ? "animate-spin w-4 h-4" : "w-4 h-4"} />
          Actualiser
        </Button>
      </div>

      <ResponsiveFilters
        searchTerm={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher un signalement..."
        showSearch
        activeFiltersCount={statusFilter === "ALL" ? 0 : 1}
        onReset={() => {
          setSearch("");
          setStatusFilter("ALL");
        }}
      >
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as SignalStatusValue | "ALL")}
        >
          <SelectTrigger className="h-10 w-[180px] rounded-xl" aria-label="Filtrer par statut">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            <SelectItem value="OPEN">En attente</SelectItem>
            <SelectItem value="IN_PROGRESS">En cours</SelectItem>
            <SelectItem value="PROCESSED">Traité</SelectItem>
            <SelectItem value="RESOLVED">Résolu</SelectItem>
          </SelectContent>
        </Select>
      </ResponsiveFilters>

      <Card className="rounded-2xl border-border/50 shadow-xl overflow-hidden">
        {isError ? (
          <div role="alert" className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
            <Typography variant="body-lg" weight="semibold">
              Impossible de charger les signalements
            </Typography>
            <Typography variant="body-sm" theme="muted">
              Vérifiez votre connexion puis réessayez.
            </Typography>
            <Button onClick={() => refetch()} className="gap-2 mt-2">
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Titre / Description</TableHead>
                  <TableHead>Sévérité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="h-16 animate-pulse bg-muted/10" />
                    </TableRow>
                  ))
                ) : signals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                      {search || statusFilter !== "ALL"
                        ? "Aucun signalement ne correspond à ces filtres."
                        : "Aucun signalement trouvé."}
                    </TableCell>
                  </TableRow>
                ) : (
                  signals.map((signal) => (
                    <TableRow key={signal.id} className="group hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Bug className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                          <span className="text-xs font-bold uppercase">{signal.targetType}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="space-y-1">
                          <p className="font-bold truncate">{signal.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{signal.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${getSeverityColor((signal.metadata as { severity?: string } | null)?.severity || "MEDIUM")}`}>
                          {(signal.metadata as { severity?: string } | null)?.severity || "MEDIUM"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(signal.status ?? "OPEN")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground capitalize">
                        {format(new Date(signal.createdAt!), 'dd MMMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl" aria-label={`Actions pour le signalement ${signal.title ?? signal.id}`}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/50">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(signal.id, "IN_PROGRESS")} className="gap-2">
                              <RefreshCw className="w-4 h-4" /> En cours
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(signal.id, "PROCESSED")} className="gap-2 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle className="w-4 h-4" /> Marquer traité
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(signal.id)} className="gap-2 text-rose-600 dark:text-rose-400">
                              <Trash2 className="w-4 h-4" /> Supprimer
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
        )}
      </Card>
    </div>
  );
}
